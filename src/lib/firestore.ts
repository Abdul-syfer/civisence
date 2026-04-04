import { db } from "./firebase";
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, serverTimestamp, increment, onSnapshot, limit, arrayUnion
} from "firebase/firestore";
import { CivicIssue, UserProfile, Authority, AppNotification } from "./types";

// User Profiles
export const createUserProfile = async (uid: string, profileData: Omit<UserProfile, "uid" | "createdAt">) => {
    const profile: UserProfile = {
        ...profileData,
        uid,
        createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", uid), profile);
    return profile;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
    }
    return null;
};

// Civic Issues
export const createIssue = async (issueData: Omit<CivicIssue, "id" | "reportedAt">) => {
    // Pre-generate ID so we only need one write (no addDoc + updateDoc round-trip)
    const docRef = doc(collection(db, "issues"));
    const newIssue = {
        ...issueData,
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

export const deleteAuthority = async (id: string) => {
    await deleteDoc(doc(db, "authorities", id));
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
        const notifications = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
        callback(notifications);
    });
};

export const markNotificationRead = async (notifId: string) => {
    await updateDoc(doc(db, "notifications", notifId), { read: true });
};
