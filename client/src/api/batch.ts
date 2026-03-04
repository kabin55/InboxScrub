import apiClient from "./apiClient";

export interface Batch {
    _id: string;
    batchName: string;
    emails: string[];
    createdAt: string;
}

export interface BatchListResponse {
    success: boolean;
    batches?: Batch[];
}

export const getBatchList = async (): Promise<BatchListResponse> => {
    const response = await apiClient.get<BatchListResponse>("/api/email/batch/list");
    return response.data;
};

export interface UpdateBatchResponse {
    success: boolean;
    message: string;
    batch?: Batch;
}

export const updateBatchName = async (batchId: string, newBatchName: string): Promise<UpdateBatchResponse> => {
    const response = await apiClient.put<UpdateBatchResponse>("/api/email/batch/update", { batchId, newBatchName });
    return response.data;
};

export interface BulkDetailsResponse {
    success: boolean;
    results: {
        _id: string;
        email: string;
        status: "deliverable" | "risky" | "undeliverable";
        score: number;
        reason: string;
        confidence: string;
    }[];
}

export const getBulkDetails = async (bulkId: string): Promise<BulkDetailsResponse> => {
    const response = await apiClient.get<BulkDetailsResponse>(`/api/email/batch/${bulkId}`);
    return response.data;
};
