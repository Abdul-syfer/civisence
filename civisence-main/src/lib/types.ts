export type Severity = "severe" | "medium" | "minor";
export type IssueStatus = "open" | "in_progress" | "resolved" | "rejected";
export type UserRole = "citizen" | "authority" | "admin";

export interface CivicIssue {
    id: string;
    title: string;
    category: string;
    description: string;
    location: string;
    ward: string;
    city?: string;
    lat: number;
    lng: number;
    severity: Severity;
    status: IssueStatus;
    reportCount: number;
    commentCount?: number;
    department: string;
    additionalDepartments?: string[]; // extra depts that can also see this issue (e.g. Ambulance for Accident)
    reportedAt: string;
    imageUrl: string;
    resolvedImageUrl?: string;   // photo uploaded by authority when marking resolved
    resolvedLat?: number;        // authority's GPS lat when they marked it resolved
    resolvedLng?: number;        // authority's GPS lng when they marked it resolved
    assignedOfficer?: string;
    timeline: { label: string; date: string; done: boolean }[];
    userId?: string;
    escalated?: boolean;
    confirmCount?: number;
    isDuplicate?: boolean;
    originalIssueId?: string;
    visibleAfter?: string; // ISO timestamp — citizens can't see this issue until this time passes
}

export interface IssueComment {
    id: string;
    issueId: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: string;
}

// Categories that are always treated as severe (life/emergency risk)
export const emergencyCategories = ["Ambulance Blockage", "Electric Cable Issue", "Accident"];

// Default severity per category
export const categorySeverityMap: Record<string, Severity> = {
    "Accident": "severe",
    "Ambulance Blockage": "severe",
    "Electric Cable Issue": "severe",
    "Garbage Overflow": "medium",
    "Drainage Overflow": "medium",
    "Water Leakage": "medium",
    "Pothole": "minor",
    "Streetlight Damage": "minor",
};

export interface AppNotification {
    id: string;
    userId: string;
    type: "new_issue" | "issue_update" | "resolution" | "escalation" | "reminder";
    title: string;
    message: string;
    read: boolean;
    cleared?: boolean; // soft-cleared from bell; still visible in history
    createdAt: string;
    issueId?: string;
}

export interface Authority {
    id: string;
    uid?: string;       // Firebase Auth UID — set when created via admin panel
    name: string;
    email?: string;
    department: string;
    ward: string;
    officerId: string;
    phone: string;
    active: boolean;
    resolvedCount: number;
    city?: string;
    areas?: string;
}

export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    city?: string;
    areas?: string;
    ward?: string;
    department?: string;
    officerId?: string;
    createdAt: string;
}

export const issueCategories = [
    "Pothole", "Accident", "Garbage Overflow", "Drainage Overflow",
    "Water Leakage", "Electric Cable Issue", "Streetlight Damage", "Ambulance Blockage"
];

export const departments = [
    "Road Maintenance Department",
    "Water Supply Department",
    "Drainage and Sewer Department",
    "Electricity Department",
    "Sanitation Department",
    "Emergency Services",
    "Street Lighting Department",
    "Police Department",
    "Ambulance Services",
];
