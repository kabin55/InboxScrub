import apiClient from "./apiClient";

export interface CampaignData {
    source: 'batch' | 'file';
    batchId?: string;
    fileName?: string;
    emails?: string[];
    totalEmails: number;
    channels?: ('email' | 'whatsapp' | 'message')[];
    content: {
        subject: string;
        body: string;
        sender: string;
    }
}

export interface UserCampaignListResponse {
    campaigns: {
        jobId: string;
        fileName: string;
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

export const createCampaign = async (data: CampaignData) => {
    try {
        const response = await apiClient.post("/api/campaign/create", data);
        return { success: true, data: response.data };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "Failed to create campaign",
        };
    }
};

export interface UserCampaignDetailResponse {
    jobId: string;
    fileName: string;
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
        name?: string;
        phone?: string;
        status: string;
        whatsappStatus?: string;
        reason: string | null;
        updatedAt: string;
        opened?: boolean;
    }[];
}

export const fetchMyCampaigns = async (page: number = 1): Promise<UserCampaignListResponse> => {
    const res = await apiClient.get<UserCampaignListResponse>("/api/campaign/history", {
        params: { page }
    });
    return res.data;
};

export const fetchUserCampaignDetails = async (jobId: string): Promise<UserCampaignDetailResponse> => {
    const res = await apiClient.get<UserCampaignDetailResponse>(`/api/campaign/${jobId}`);
    return res.data;
};

export const triggerWhatsappFollowup = async (jobId: string) => {
    try {
        const response = await apiClient.post(`/api/campaign/${jobId}/whatsapp-followup`);
        return { success: true, message: response.data.message };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "Failed to trigger WhatsApp follow-ups"
        };
    }
};

export const extractUnopenedNumbers = async (jobId: string, file: File) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post(`/api/campaign/${jobId}/extract-numbers`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return { success: true, data: response.data.extractedContacts };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to extract numbers',
        };
    }
};
