import apiClient from "./apiClient";

export interface Template {
    _id: string;
    name: string;
    s3Key: string;
    createdBy: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const fetchTemplates = async (): Promise<Template[]> => {
    const res = await apiClient.get<{ success: boolean; templates: Template[] }>("/api/templates/list");
    return res.data.templates;
};

export const getTemplateDetails = async (id: string): Promise<{ template: Template; previewUrl: string; url?: string }> => {
    const res = await apiClient.get<{ success: boolean; template: Template; previewUrl: string; url?: string }>(`/api/templates/${id}`);
    return res.data;
};

export const deleteTemplate = async (id: string): Promise<void> => {
    await apiClient.delete(`/api/templates/${id}`);
};

export const uploadTemplateApi = async (data: FormData): Promise<Template & { fileName?: string }> => {
    try {
        const res = await apiClient.post<{ success: boolean; template: Template; fileName?: string; error?: string; message?: string }>("/api/templates/upload", data, {
            headers: {
                // Must override the base 'application/json' or multer will receive nothing
                "Content-Type": "multipart/form-data"
            }
        });
        console.log("Upload API response:", res.data);
        if (res.data.template) {
            return { ...res.data.template, fileName: res.data.fileName };
        }
        return res.data as any; // fallback if needed
    } catch (err: any) {
        console.error("Upload API error:", err.response?.data || err.message);
        throw new Error(err.response?.data?.error || err.response?.data?.message || "Failed to upload template");
    }
};
