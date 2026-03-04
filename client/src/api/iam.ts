import apiClient from "./apiClient";
import type { AuthResponse, Permission } from "./auth";

export interface IamToken {
    _id: string; // Internal MongoDB ID
    tokenValue?: string; // Only returned on creation
    permissions: Permission[];
    expiresAt?: string | null;
    status: 'Active' | 'Revoked' | 'Expired';
    createdAt: string;
    note?: string;
}

export interface TokenListResponse {
    success: boolean;
    tokens: IamToken[];
}

export interface TokenCreateResponse {
    success: boolean;
    token: IamToken;
}

export interface TokenUpdateResponse {
    success: boolean;
    token: IamToken;
}

export interface TokenRevokeResponse {
    success: boolean;
    message: string;
}

const API_BASE = "/api/admin/tokens";

export const createToken = async (
    permissions: Permission[],
    note?: string,
    expiresAt?: string
): Promise<TokenCreateResponse> => {
    const res = await apiClient.post<TokenCreateResponse>(
        API_BASE,
        { permissions, note, expiresAt }
    );
    console.log(`createtokenfunction`, res.data);
    return res.data;
};

export const fetchTokens = async (): Promise<TokenListResponse> => {
    const res = await apiClient.get<TokenListResponse>(
        API_BASE
    );
    return res.data;
};

export const updateTokenPermissions = async (
    tokenId: string,
    permissions: Permission[]
): Promise<TokenUpdateResponse> => {
    const res = await apiClient.patch<TokenUpdateResponse>(
        `${API_BASE}/${tokenId}`,
        { permissions }
    );
    return res.data;
};

export const revokeToken = async (tokenId: string): Promise<TokenRevokeResponse> => {
    const res = await apiClient.delete<TokenRevokeResponse>(
        `${API_BASE}/${tokenId}`
    );
    return res.data;
};

export const tokenLogin = async (
    email: string,
    token: string
): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>(
        "/api/auth/token-login",
        { email, token }
    );
    return res.data;
};
