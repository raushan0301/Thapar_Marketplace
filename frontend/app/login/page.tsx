'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const { setAuth, isAuthenticated } = useAuthStore();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, router]);

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!formData.email.endsWith('@thapar.edu')) {
            newErrors.email = 'Please use your Thapar email';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);

        try {
            const result = await authService.login(formData);

            if (result.success) {
                setAuth(result.data.user, result.data.token);
                toast.success('Login successful!');
                router.push('/');
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="w-full max-w-md">
                {/* Header - Minimal */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Welcome Back</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Sign in to ThaparMarket
                    </p>
                </div>

                {/* Form - Clean & Minimal */}
                <form className="bg-white p-6 rounded-xl shadow-sm border border-gray-200" onSubmit={handleSubmit}>
                    <div className="space-y-3.5">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="your.email@thapar.edu"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            error={errors.email}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            error={errors.password}
                            required
                        />

                        <div className="flex items-center justify-end">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <Button type="submit" className="w-full mt-5" isLoading={isLoading}>
                        Sign In
                    </Button>

                    <div className="text-center text-sm mt-4">
                        <span className="text-gray-500">Don't have an account? </span>
                        <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                            Sign up
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
