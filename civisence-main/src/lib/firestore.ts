import { db } from "./firebase";
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, serverTimestamp, increment, onSnapshot, limit, arrayUnion
} from "firebase/firestore";
import { CivicIssue, UserProfile, Authority, AppNotification, IssueComment } from "./types";

// User Profiles
export const createUserProfile = async (uid: string, profileData: Omit<UserProfile, "uid" | "createdAt">) => {
    const profile: UserProfile = {
        ...profileData,
        // Normalise ward so it always matches issue.ward comparisons
        ward: (profileData.ward ?? "").trim(),
        uid,
        createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", uid), profile);
    return profile;
};

export const updateUserProfile = async (uid: string, updates: Partial<Omit<UserProfile, "uid" | "createdAt" | "role">>) => {
    await updateDoc(doc(db, "users", uid), updates);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
    }
    return null;
};

// Haversine distance in metres between two lat/lng points
const haversineMetres = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6_371_000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Returns an existing open/in-progress issue of the same department within
 * `radiusMetres` (default 100 m) in the same ward, or null if none found.
 * Duplicate is keyed on department + location, not category.
 */
export const findNearbyDuplicate = async (
    lat: number,
    lng: number,
    department: string,
    ward: string,
    radiusMetres = 100
): Promise<CivicIssue | null> => {
    const q = query(
        collection(db, "issues"),
        where("ward", "==", ward),
        where("department", "==", department),
        where("status", "in", ["open", "in_progress"])
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
        const issue = { id: d.id, ...d.data() } as CivicIssue;
        // Skip shadow/duplicate records — only match original issues
        if (issue.isDuplicate) continue;
        if (
            typeof issue.lat === "number" &&
            typeof issue.lng === "number" &&
            haversineMetres(lat, lng, issue.lat, issue.lng) <= radiusMetres
        ) {
            return issue;
        }
    }
    return null;
};

/**
 * Vote on an existing issue (duplicate report):
 * - increments reportCount
 * - upgrades severity to "severe" when reportCount reaches 5
 */
export const voteOnIssue = async (issueId: string, currentCount: number): Promise<void> => {
    const newCount = currentCount + 1;
    const updates: Record<string, unknown> = { reportCount: increment(1) };
    if (newCount >= 5) updates.severity = "severe";
    await updateDoc(doc(db, "issues", issueId), updates);
};

// Civic Issues
export const createIssue = async (issueData: Omit<CivicIssue, "id" | "reportedAt">) => {
    // Pre-generate ID so we only need one write (no addDoc + updateDoc round-trip)
    const docRef = doc(collection(db, "issues"));
    const newIssue = {
        ...issueData,
        // Normalise ward to avoid case/whitespace mismatches against the authority's ward
        ward: (issueData.ward ?? "").trim(),
        id: docRef.id,
        reportedAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
    };
    await setDoc(docRef, newIssue);
    return newIssue as CivicIssue;
};

export const getAllIssues = async (): Promise<CivicIssue[]> => {
    const q = query(collection(db, "issues"), orderBy("reportedAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CivicIssue));
};

export const getIssuesByWard = async (ward: string): Promise<CivicIssue[]> => {
    try {
        const q = query(collection(db, "issues"), where("ward", "==", ward));
        const querySnapshot = await getDocs(q);
        const issues = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CivicIssue));
        return issues.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
    } catch (error) {
        console.error("Firestore getIssuesByWard error:", error);
        throw error;
    }
};

export const getIssuesByUser = async (userId: string): Promise<CivicIssue[]> => {
    const q = query(collection(db, "issues"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CivicIssue))
        .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
};

const statusTimelineLabel: Partial<Record<CivicIssue["status"], string>> = {
    in_progress: "Work started by authority",
    resolved: "Issue resolved",
    rejected: "Issue marked as invalid",
};

export const updateIssueStatus = async (issueId: string, status: CivicIssue["status"]) => {
    const issueRef = doc(db, "issues", issueId);
    const label = statusTimelineLabel[status];
    const updates: Record<string, unknown> = { status };
    if (label) {
        // Atomically append a new timeline entry without overwriting existing ones
        updates.timeline = arrayUnion({ label, date: new Date().toISOString(), done: true });
    }
    await updateDoc(issueRef, updates);
};

export const updateIssueFields = async (issueId: string, fields: Partial<CivicIssue>) => {
    await updateDoc(doc(db, "issues", issueId), fields as Record<string, unknown>);
};

export const updateIssueTimeline = async (issueId: string, timeline: CivicIssue["timeline"]) => {
    const issueRef = doc(db, "issues", issueId);
    await updateDoc(issueRef, { timeline });
};

export const deleteIssue = async (issueId: string) => {
    await deleteDoc(doc(db, "issues", issueId));
};

// Issue Confirmation
// Bug fix: removed 'resolved' from the uniqueness query — a user should only
// be able to confirm any given issue once, regardless of the resolved flag.
export const confirmIssue = async (issueId: string, userId: string, resolved: boolean) => {
    const confirmQuery = query(
        collection(db, "confirmations"),
        where("issueId", "==", issueId),
        where("userId", "==", userId)
    );
    const existing = await getDocs(confirmQuery);
    if (!existing.empty) {
        throw new Error("already_confirmed");
    }
    // Pre-generate ID for a single write
    const confirmRef = doc(collection(db, "confirmations"));
    await setDoc(confirmRef, {
        id: confirmRef.id,
        issueId,
        userId,
        resolved,
        createdAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, "issues", issueId), {
        reportCount: increment(1),
    });
};

// Authorities
export const getAuthorities = async (): Promise<Authority[]> => {
    const querySnapshot = await getDocs(collection(db, "authorities"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Authority));
};

export const createAuthority = async (authorityData: Omit<Authority, "id">) => {
    // Single write with pre-generated ID
    const docRef = doc(collection(db, "authorities"));
    const authority = { ...authorityData, id: docRef.id };
    await setDoc(docRef, authority);
    return authority as Authority;
};

export const updateAuthority = async (id: string, data: Partial<Authority>) => {
    await updateDoc(doc(db, "authorities", id), data as Record<string, unknown>);
};

export const deleteAuthority = async (id: string, uid?: string) => {
    await deleteDoc(doc(db, "authorities", id));
    if (uid) await deleteDoc(doc(db, "users", uid));
};

// Notifications
export const createNotification = async (data: Omit<AppNotification, "id">) => {
    // Single write with pre-generated ID
    const notifRef = doc(collection(db, "notifications"));
    const notification = { ...data, id: notifRef.id };
    await setDoc(notifRef, notification);
    return notification as AppNotification;
};

export const subscribeToNotifications = (
    userId: string,
    callback: (notifications: AppNotification[]) => void
) => {
    const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(20)
    );
    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() } as AppNotification))
            .filter(n => !n.cleared);
        callback(notifications);
    });
};

export const markNotificationRead = async (notifId: string) => {
    await updateDoc(doc(db, "notifications", notifId), { read: true });
};

// Soft-clears notifications from the bell view; history still shows them all
export const clearNotifications = async (userId: string) => {
    if (!userId) throw new Error("userId is required to clear notifications");
    const q = query(collection(db, "notifications"), where("userId", "==", userId));
    const snap = await getDocs(q);
    // Filter client-side: only update docs not already cleared (handles missing field too)
    const toUpdate = snap.docs.filter(d => !d.data().cleared);
    for (const d of toUpdate) {
        await updateDoc(d.ref, { cleared: true });
    }
};

export const getAllNotifications = async (userId: string): Promise<AppNotification[]> => {
    const q = query(collection(db, "notifications"), where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
};

// Real-time issue subscriptions
export const subscribeToAllIssues = (callback: (issues: CivicIssue[]) => void) => {
    const q = query(collection(db, "issues"), orderBy("reportedAt", "desc"));
    return onSnapshot(q, snapshot => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CivicIssue)));
    });
};

export const subscribeToIssuesByWard = (
    ward: string,
    callback: (issues: CivicIssue[]) => void,
    onError?: (err: Error) => void
) => {
    // No orderBy here — avoids requiring a composite (ward + reportedAt) index.
    // Sort is done client-side after the snapshot arrives.
    const wardNorm = ward.trim();
    const q = query(collection(db, "issues"), where("ward", "==", wardNorm));
    return onSnapshot(
        q,
        (snapshot) => {
            const issues = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() } as CivicIssue))
                .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
            callback(issues);
        },
        (err) => {
            console.error("subscribeToIssuesByWard error:", err);
            onError?.(err);
        }
    );
};

export const subscribeToIssuesByUser = (userId: string, callback: (issues: CivicIssue[]) => void) => {
    const q = query(collection(db, "issues"), where("userId", "==", userId), orderBy("reportedAt", "desc"));
    return onSnapshot(q, snapshot => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CivicIssue)));
    });
};

// Find all users in a ward with a given role (used to notify authorities of new issues)
/** Returns the authority officer responsible for a given ward + department, or null. */
export const getAuthorityByWardAndDept = async (
    ward: string,
    department: string
): Promise<Authority | null> => {
    const q = query(
        collection(db, "authorities"),
        where("ward", "==", ward),
        where("department", "==", department),
        where("active", "==", true)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Authority;
};

export const getUsersByWardAndRole = async (ward: string, role: string): Promise<UserProfile[]> => {
    const q = query(collection(db, "users"), where("ward", "==", ward), where("role", "==", role));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as UserProfile);
};

// Increment the resolvedCount for the authority who holds a given officerId
export const incrementAuthorityResolvedCount = async (officerId: string) => {
    const q = query(collection(db, "authorities"), where("officerId", "==", officerId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        await updateDoc(snapshot.docs[0].ref, { resolvedCount: increment(1) });
    }
};

/** Get all active authorities for a specific department across all wards */
export const getAuthoritiesByDepartment = async (department: string): Promise<UserProfile[]> => {
    const q = query(
        collection(db, "users"),
        where("role", "==", "authority"),
        where("department", "==", department)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as UserProfile);
};

// App-wide settings (stored in Firestore so all clients share them)
export const saveSlaSettings = async (sla: Record<string, number>): Promise<void> => {
    await setDoc(doc(db, "settings", "sla"), sla);
};

export const getSlaSettings = async (): Promise<Record<string, number>> => {
    const snap = await getDoc(doc(db, "settings", "sla"));
    return snap.exists() ? (snap.data() as Record<string, number>) : {};
};

// Comments
export const addComment = async (
    issueId: string,
    userId: string,
    userName: string,
    text: string
): Promise<IssueComment> => {
    const ref = doc(collection(db, "comments"));
    const comment: IssueComment = {
        id: ref.id,
        issueId,
        userId,
        userName,
        text: text.trim(),
        createdAt: new Date().toISOString(),
    };
    await setDoc(ref, comment);
    await updateDoc(doc(db, "issues", issueId), { commentCount: increment(1) });
    return comment;
};

export const subscribeToComments = (
    issueId: string,
    callback: (comments: IssueComment[]) => void
) => {
    const q = query(
        collection(db, "comments"),
        where("issueId", "==", issueId),
        orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => d.data() as IssueComment));
    });
};
