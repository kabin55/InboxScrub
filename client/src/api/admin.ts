import apiClient from "./apiClient";

export interface DashboardStats {
    performance: {
        growth: number;
        totalUsers: number;
    };
    tierDistribution: { name: string; value: number }[];
    validationActivity: { name: string; single: number; bulk: number }[];
    campaignFlow: {
        name: string;
        sent: number;
        failed: number;
        queued: number;
        processing: number;
    }[];
    summary?: {
        totalCampaigns: number;
        totalEmails: number;
        failedEmailsCount: number;
        queueCount: number;
        failureRate: number; // Keep for trend if needed, but UI will use count/total
        failedList: { email: string; reason: string; timestamp: string }[];
    };
}

export interface CampaignFlowEntry {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    fileName: string;
    totalEmails: number;
    status: "processing" | "completed" | "failed" | "queued";
    stats: {
        sent: number;
        failed: number;
        queued: number;
    };
    startedAt: string;
    createdAt: string;
    updatedAt: string;
    scheduledAt?: string;
    attachments?: string[];
    notes?: string;
    tags?: string[];
}

export interface EmailStatusDetail {
    _id: string;
    email: string;
    status: "queued" | "sent" | "delivered" | "bounced" | "failed";
    attempts: number;
    opened: boolean;
    error?: string;
    subject: string;
    body: string;
    updatedAt: string;
    createdAt: string;
}

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    credits: number;
    massMalingCredits?: number;
    plan: "Basic" | "Standard" | "Premium";
    isBlocked: boolean;
    avatar?: string;
}

export interface ActivityLogEntry {
    id: string;
    user: {
        name: string;
        email: string;
        avatar?: string;
    };
    action: "Bulk Sanitization" | "Single Verify" | "Mass Campaign";
    volume: number;
    source: string;
    status: "Success" | "Failed";
    timestamp: string;
}

// Get Dashboard Stats
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
    const res = await apiClient.get<DashboardStats>("/api/admin/dashboard");
    return res.data;
};

// Get Users
export const fetchUsers = async (search?: string): Promise<AdminUser[]> => {
    const res = await apiClient.get<AdminUser[]>("/api/admin/users", {
        params: { search }
    });
    return res.data;
};

// Update User
export const updateUser = async (id: string, updates: Partial<AdminUser>): Promise<void> => {
    await apiClient.put(`/api/admin/users/${id}`, updates);
};

// Get Activity Logs
export const fetchActivityLogs = async (search?: string, status?: string): Promise<ActivityLogEntry[]> => {
    const res = await apiClient.get<ActivityLogEntry[]>("/api/admin/history", {
        params: { search, status }
    });
    return res.data;
};

// Campaign Flow
export const fetchCampaignFlow = async (search?: string, status?: string): Promise<CampaignFlowEntry[]> => {
    const res = await apiClient.get<CampaignFlowEntry[]>("/api/admin/campaign-flow", {
        params: { search, status }
    });
    return res.data;
};

export const fetchCampaignEmails = async (jobId: string, search?: string, status?: string): Promise<EmailStatusDetail[]> => {
    const res = await apiClient.get<EmailStatusDetail[]>(`/api/admin/campaign-flow/${jobId}/emails`, {
        params: { search, status }
    });
    return res.data;
};

export const retryCampaign = async (jobId: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post<{ success: boolean; message: string }>(`/api/admin/campaign-flow/${jobId}/retry`);
    return res.data;
};

export interface CampaignListResponse {
    campaigns: {
        jobId: string;
        fileName: string;
        issuedBy: string;
        issuer: {
            name: string;
            email: string;
        };
        totalEmails: number;
        jobStatus: string;
        createdAt: string;
        stats: {
            sent: number;
            failed: number;
            opened: number;
            not_opened: number;
        };
    }[];
    totalPages: number;
    currentPage: number;
}

export interface CampaignDetailResponse {
    jobId: string;
    fileName: string;
    issuedBy: string;
    totalEmails: number;
    status: string;
    createdAt: string;
    summary: {
        sent: number;
        failed: number;
        queued: number;
    };
    emails: {
        email: string;
        status: string;
        opened: boolean;
        reason: string | null;
        updatedAt: string;
    }[];
}

// Get All Campaigns
export const fetchCampaigns = async (page: number = 1, limit: number = 10): Promise<CampaignListResponse> => {
    const res = await apiClient.get<CampaignListResponse>("/api/admin/campaigns", {
        params: { page, limit }
    });
    return res.data;
};

// Get Campaign Details
export const fetchCampaignDetails = async (jobId: string): Promise<CampaignDetailResponse> => {
    const res = await apiClient.get<CampaignDetailResponse>(`/api/admin/campaigns/${jobId}`);
    return res.data;
};
