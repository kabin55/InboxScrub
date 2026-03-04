import axios, { type AxiosInstance } from "axios";

const apiClient: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000", // Fallback for dev
    withCredentials: true, // required for JWT cookie
    headers: {
        "Content-Type": "application/json",
    },
});

export default apiClient;