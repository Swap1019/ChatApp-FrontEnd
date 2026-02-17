import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    window.location.protocol + "//" + window.location.hostname + ":8000";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 error
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.clear();
            window.location.href = "/login";  // force redirect
        }
        return Promise.reject(error);
    }
);

export default api;
