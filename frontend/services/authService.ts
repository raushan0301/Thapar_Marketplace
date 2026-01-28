import api from '../lib/api';

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    phone?: string;
    department?: string;
    year?: number;
    hostel?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export const authService = {
    // Register
    register: async (data: RegisterData) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    // Verify email
    verifyEmail: async (email: string, otp: string) => {
        const response = await api.post('/auth/verify-email', { email, otp });
        return response.data;
    },

    // Resend OTP
    resendOTP: async (email: string) => {
        const response = await api.post('/auth/resend-otp', { email });
        return response.data;
    },

    // Login
    login: async (data: LoginData) => {
        const response = await api.post('/auth/login', data);
        return response.data;
    },

    // Get current user
    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    // Request password reset
    requestPasswordReset: async (email: string) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    // Reset password
    resetPassword: async (email: string, token: string, newPassword: string) => {
        const response = await api.post('/auth/reset-password', {
            email,
            token,
            newPassword,
        });
        return response.data;
    },
};
