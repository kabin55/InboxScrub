import apiClient from "./apiClient";

/* -------------------- Types -------------------- */
export type EmailVerificationResult = {
    email: string;
    syntax: boolean;
    domain: boolean;
    mx: boolean;
    disposable: boolean;
    roleBased: boolean;
    catchAll: boolean;
    smtp: boolean;
    confidence: "High" | "Low";
    reason?: string;
    validated_at?: string;
};

/* -------------------- API Call -------------------- */
export const verifySingleEmail = async (
    email: string
): Promise<EmailVerificationResult> => {
    try {
        const response = await apiClient.post<{
            success: boolean;
            result: any;
        }>(
            "/api/email/validate",
            { email }
        );
// console.log("API Response:", response.data);
        const data = response.data.result;

        const resultsArray = Object.values(data.results) as Array<{ value: boolean; reason: string | null }>;
        const firstFailure = resultsArray.find(r => r.reason);

        return {
            email: data.email,
            syntax: data.results.syntax.value,
            domain: data.results.domain.value,
            mx: data.results.mx.value,
            disposable: data.results.disposable.value,
            roleBased: data.results.roleBased.value,
            catchAll: data.results.catchAll.value,
            smtp: data.results.smtp.value,
            confidence: data.confidence === "High" ? "High" : "Low",
            reason: firstFailure?.reason || undefined
        };
    } catch (error: any) {
        // Normalize backend errors
        if (error.response) {
            throw new Error(error.response.data?.message || "Request failed");
        }

        if (error.request) {
            throw new Error("Server unreachable");
        }

        throw new Error("Unexpected error occurred");
    }
};

export const clearEmailHistory = async (): Promise<void> => {
    try {
        await apiClient.delete("/api/email/clear-history");
    } catch (error: any) {
        if (error.response) {
            throw new Error(error.response.data?.message || "Clear history failed");
        }
        throw new Error("Unexpected error occurred");
    }
};

export const getEmailHistory = async (): Promise<any> => {
    try {
        const response = await apiClient.get("/api/email/summary");
        return response.data;
    } catch (error: any) {
        if (error.response) {
            throw new Error(error.response.data?.message || "Fetch history failed");
        }
        throw new Error("Unexpected error occurred");
    }
};