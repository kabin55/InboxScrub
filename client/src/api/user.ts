import apiClient from "./apiClient";

export interface EmailHistoryItem {
    _id: string;
    email: string;
    result: "Deliverable" | "risky" | "undeliverable";
    confidence: "High" | "Medium" | "Low";
    reason?: string | null;
    validated_at: string;
}

export interface BulkHistoryItem {
    bulk_id: string;
    total: number;
    deliverable: number;
    risky: number;
    undeliverable: number;
    created_at: string;
}

export interface ActivityDataItem {
    date: string;
    single: number;
    bulk: number;
    campaigns: number;
}

export interface UserSummary {
    success: boolean;
    total_credits: number;
    massMalingCredits: number;
    totalEmail: number;
    email_result_summary: {
        deliverable: number;
        risky: number;
        undeliverable: number;
    };
    singleEmail: EmailHistoryItem[];
    bulkEmailHistory: BulkHistoryItem[];
    activity_data?: ActivityDataItem[];
    validation_counts?: {
        single: number;
        ten: number;
        bulk: number;
        campaigns: number;
        totalCampaignEmails?: number;
    };
}

export const getUserSummary = async (): Promise<UserSummary> => {
    const response = await apiClient.get<UserSummary>("/api/email/summary");
    return response.data;
};