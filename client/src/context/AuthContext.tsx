import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type User, fetchSession, logout as apiLogout } from "../api/auth";
import { googleLogout } from "@react-oauth/google";
import { getUserCredits } from "../api/profile";

interface AuthContextType {
    user: User | null;
    credits: number | null;
    loading: boolean;
    logout: () => Promise<void>;
    setUser: (user: User | null) => void;
    refreshCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [credits, setCredits] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshCredits = async () => {
        try {
            const data = await getUserCredits();
            setCredits(data.credits);
        } catch (error) {
            console.error("Failed to refresh credits", error);
        }
    };

    useEffect(() => {
        const initSession = async () => {
            try {
                const data = await fetchSession();
                setUser(data.user);
                if (data.user) {
                    await refreshCredits();
                }
            } catch (error) {
                console.error("Failed to fetch session", error);
            } finally {
                setLoading(false);
            }
        };
        initSession();
    }, []);

    const logout = async () => {
        try {
            googleLogout();
            localStorage.clear();
            await apiLogout();
            setUser(null);
        } catch (error) {
            console.error("Logout failed:", error);
            // Still clear local state even if API fails
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, credits, loading, logout, setUser, refreshCredits }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
