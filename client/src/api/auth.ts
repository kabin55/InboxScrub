import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/auth`

export type Permission = 'Email Sanitization' | 'Bulk Mailing' | 'Upload Template';

export interface User {
    name: string;
    email: string;
    avatar: string;
    role: "Superadmin" | "Admin" | "User";
    oauth_provider?: "google" | "facebook" | "none";
    permissions?: Permission[];
    plan?: "Basic" | "Standard" | "Premium";
}

export interface SessionResponse {
    user: User | null;
}

export interface AuthResponse {
    user: User;
}

// Check active session
export const fetchSession = async (): Promise<SessionResponse> => {
    const res = await axios.get<SessionResponse>(`${API_BASE}/session`, {
        withCredentials: true,
    });
    return res.data;
};

// Google login
export const googleLogin = async (
    credential: string
): Promise<AuthResponse> => {
    const res = await axios.post<AuthResponse>(
        `${API_BASE}/google`,
        { token: credential },
        { withCredentials: true }
    );
    return res.data;
};

// Logout
export const logout = async (): Promise<void> => {
    await axios.post(
        `${API_BASE}/logout`,
        {},
        { withCredentials: true }
    );
};