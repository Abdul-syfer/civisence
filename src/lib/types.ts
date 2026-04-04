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
    lat: number;
    lng: number;
    severity: Severity;
    status: IssueStatus;
    reportCount: number;
    department: string;
    reportedAt: string;
    imageUrl: string;
    assignedOfficer?: string;
    timeline: { label: string; date: string; done: boolean }[];
    userId?: string;
    escalated?: boolean;
    confirmCount?: number;
}

export interface AppNotification {
    id: string;
    userId: string;
    type: "new_issue" | "issue_update" | "resolution" | "escalation" | "reminder";
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    issueId?: string;
}

export interface Authority {
    id: string;
    name: string;
    department: string;
    ward: string;
    officerId: string;
    phone: string;
    active: boolean;
    resolvedCount: number;
}

export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    city?: string;
    ward?: string;
    department?: string;
    officerId?: string;
    createdAt: string;
}

export const issueCategories = [
    "Pothole", "Road Blockage", "Garbage Overflow", "Drainage Overflow",
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
];
