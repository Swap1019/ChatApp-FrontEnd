import axios from "axios";
import { ACCESS_TOKEN } from "./constants";
import.meta.env.VITE_API_URL

const api = axios.create({
    baseURL: `http://${VITE_API_URL}`, // change if needed
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
