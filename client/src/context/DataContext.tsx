import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getUserSummary, type UserSummary } from "../api/user";
import { useAuth } from "./AuthContext";

interface DataContextType {
    summary: UserSummary | null;
    loading: boolean;
    error: string | null;
    refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [summary, setSummary] = useState<UserSummary | null>(null);
    const [loading, setLoading] = useState<boolean>(false); // Start false, load on user change
    const [error, setError] = useState<string | null>(null);

    const refreshData = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);
            const data = await getUserSummary();
            setSummary(data);
        } catch (err) {
            console.error("Failed to fetch user summary", err);
            setError("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    // Automatically fetch data when user logs in
    useEffect(() => {
        if (user) {
            refreshData();
        } else {
            setSummary(null);
        }
    }, [user]);

    return (
        <DataContext.Provider value={{ summary, loading, error, refreshData }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error("useData must be used within a DataProvider");
    }
    return context;
};
