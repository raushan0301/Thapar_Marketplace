import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');

        if (error.response?.status === 401 && !isAuthEndpoint) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('auth-storage'); // Add this to clear zustand persistent storage

            // Only redirect if not already on the login page to avoid excessive reloads
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

// Helper function to handle API errors
export const handleApiError = (error: unknown): string => {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
        return error.response.data.error;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred';
};
