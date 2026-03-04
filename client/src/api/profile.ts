import apiClient from "./apiClient";

// ===== Profile =====
export interface UserProfile {
    success: boolean;
    user: {
        id: string;
        email: string;
        name: string;
        oauth_provider: string;
        created_at: string;
    };
    credits: {
        balance: number;
        total_purchased: number;
        massMalingCredits: number;
    };
}

export const getUserProfile = async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>("/api/user/profile");
    return response.data;
};

export const updateUserProfile = async (data: { name: string }): Promise<UserProfile> => {
    const response = await apiClient.put<UserProfile>("/api/user/profile", data);
    return response.data;
};

// ===== Credits =====
export interface CreditsResponse {
    success: boolean;
    credits: number;
    total_credits: number;
    last_updated: string | null;
}

export const getUserCredits = async (): Promise<CreditsResponse> => {
    const response = await apiClient.get<CreditsResponse>("/api/user/credits");
    return response.data;
};

// ===== Payments =====
export interface PaymentItem {
    id: string;
    transaction_id: string;
    credits_added: number;
    amount_paid: number;
    payment_method: string;
    payment_date: string;
}

export interface PaymentsResponse {
    success: boolean;
    payments: PaymentItem[];
    total: number;
}

export const getPaymentHistory = async (): Promise<PaymentsResponse> => {
    const response = await apiClient.get<PaymentsResponse>("/api/user/payments");
    return response.data;
};
