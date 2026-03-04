import apiClient from "./apiClient";

/* -------------------- Types -------------------- */
export type EmailCheckDetail = {
    value: boolean;
    reason: string | null;
};

export type RawBulkResult = {
    email: string;
    results: {
        syntax: EmailCheckDetail;
        domain: EmailCheckDetail;
        mx: EmailCheckDetail;
        disposable: EmailCheckDetail;
        roleBased: EmailCheckDetail;
        catchAll: EmailCheckDetail;
        smtp: EmailCheckDetail;
    };
    confidence: "High" | "Medium" | "Low";
};

export type BulkValidationResponse = {
    success: boolean;
    total_emails: number;
    credits_used: number;
    summary: {
        high: number;
        medium: number;
        low: number;
    };
    results: {
        highConfidenceEmails: RawBulkResult[];
        mediumConfidenceEmails: RawBulkResult[];
        lowConfidenceEmails: RawBulkResult[];
    };
};

/* -------------------- API Call -------------------- */
export const uploadBulkEmails = async (
    file: File
): Promise<BulkValidationResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await apiClient.post<BulkValidationResponse>(
            "/api/email/upload",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        console.log(response.data)
        return response.data;
    } catch (error: any) {
        if (error.response) {
            throw new Error(error.response.data?.message || "Bulk upload failed");
        }
        if (error.request) {
            throw new Error("Server unreachable");
        }
        throw new Error("Unexpected error occurred during bulk upload");
    }
};
