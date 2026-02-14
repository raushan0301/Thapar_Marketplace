'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/api';
import { Lock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        const emailFromUrl = searchParams.get('email');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        }
        if (emailFromUrl) {
            setEmail(emailFromUrl);
        }

        if (!tokenFromUrl) {
            toast.error('Invalid reset link');
            router.push('/forgot-password');
        }
    }, [searchParams, router]);

    const validatePassword = () => {
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return false;
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            toast.error('Password must contain uppercase, lowercase, and number');
            return false;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validatePassword()) return;
        if (!email) {
            toast.error('Email is missing from the reset link');
            return;
        }

        setIsLoading(true);

        try {
            const result = await authService.resetPassword(email, token, password);

            if (result.success) {
                setResetSuccess(true);
                toast.success('Password reset successful!');
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (resetSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Password Reset Successful!
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Your password has been updated. You can now login with your new password.
                    </p>
                    <Link href="/login">
                        <Button className="w-full">
                            Go to Login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-blue-600" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Reset Password
                    </h1>
                    <p className="text-gray-600">
                        Enter your new password below
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="New Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        disabled={isLoading}
                        helperText="Must be at least 8 characters with uppercase, lowercase, and number"
                    />

                    <Input
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        disabled={isLoading}
                    />

                    {/* Password Requirements */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                            Password Requirements:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li className={password.length >= 8 ? 'text-green-600' : ''}>
                                • At least 8 characters
                            </li>
                            <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                                • One uppercase letter
                            </li>
                            <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                                • One lowercase letter
                            </li>
                            <li className={/\d/.test(password) ? 'text-green-600' : ''}>
                                • One number
                            </li>
                            <li className={password && password === confirmPassword ? 'text-green-600' : ''}>
                                • Passwords match
                            </li>
                        </ul>
                    </div>

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        className="w-full"
                    >
                        Reset Password
                    </Button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <Link
                        href="/login"
                        className="text-sm text-blue-600 hover:text-blue-700"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
