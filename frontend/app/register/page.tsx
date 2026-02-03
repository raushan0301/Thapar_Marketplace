'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/api';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        department: '',
        year: '',
        hostel: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Full name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!formData.email.endsWith('@thapar.edu')) {
            newErrors.email = 'Please use your Thapar University email (@thapar.edu)';
        } else if (!/^[^\s@]+@thapar\.edu$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain uppercase, lowercase, and number';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);

        // Show specific error toast for better UX
        if (Object.keys(newErrors).length > 0) {
            const firstError = Object.values(newErrors)[0];
            toast.error(firstError);
        }

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);

        try {
            const result = await authService.register({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                phone: formData.phone || undefined,
                department: formData.department || undefined,
                year: formData.year ? parseInt(formData.year) : undefined,
                hostel: formData.hostel || undefined,
            });

            if (result.success) {
                toast.success('Registration successful! Please check your email for verification code.');
                router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
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
                    <h1 className="text-2xl font-semibold text-gray-900">Create Account</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Join ThaparMarket
                    </p>
                </div>

                {/* Form - Clean & Minimal */}
                <form className="bg-white p-6 rounded-xl shadow-sm border border-gray-200" onSubmit={handleSubmit}>
                    <div className="space-y-3.5">
                        <Input
                            label="Full Name"
                            type="text"
                            placeholder=""
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            error={errors.name}
                            required
                        />

                        <Input
                            label="Email"
                            type="email"
                            placeholder="your.email@thapar.edu"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            error={errors.email}
                            helperText="Use your Thapar University email"
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="At least 8 characters"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            error={errors.password}
                            required
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            placeholder="Re-enter your password"
                            value={formData.confirmPassword}
                            onChange={(e) =>
                                setFormData({ ...formData, confirmPassword: e.target.value })
                            }
                            error={errors.confirmPassword}
                            required
                        />

                        {/* Password Requirements - Compact */}
                        {formData.password && (
                            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                                <p className="text-xs font-medium text-gray-600 mb-1.5">
                                    Password Requirements:
                                </p>
                                <div className="space-y-0.5">
                                    <div className={`text-xs flex items-center ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'
                                        }`}>
                                        <span className="mr-1.5 text-sm">{formData.password.length >= 8 ? '✓' : '○'}</span>
                                        8+ characters
                                    </div>
                                    <div className={`text-xs flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'
                                        }`}>
                                        <span className="mr-1.5 text-sm">{/[A-Z]/.test(formData.password) ? '✓' : '○'}</span>
                                        Uppercase letter
                                    </div>
                                    <div className={`text-xs flex items-center ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'
                                        }`}>
                                        <span className="mr-1.5 text-sm">{/[a-z]/.test(formData.password) ? '✓' : '○'}</span>
                                        Lowercase letter
                                    </div>
                                    <div className={`text-xs flex items-center ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-400'
                                        }`}>
                                        <span className="mr-1.5 text-sm">{/\d/.test(formData.password) ? '✓' : '○'}</span>
                                        Number
                                    </div>
                                    {formData.confirmPassword && (
                                        <div className={`text-xs flex items-center ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-500'
                                            }`}>
                                            <span className="mr-1.5 text-sm">{formData.password === formData.confirmPassword ? '✓' : '✗'}</span>
                                            Passwords match
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Department"
                                type="text"
                                placeholder="COE"
                                value={formData.department}
                                onChange={(e) =>
                                    setFormData({ ...formData, department: e.target.value })
                                }
                            />

                            <Input
                                label="Year"
                                type="number"
                                placeholder="3"
                                min="1"
                                max="4"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Phone"
                                type="tel"
                                placeholder="+91 9999999999"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />

                            <Input
                                label="Hostel"
                                type="text"
                                placeholder="Hostel O"
                                value={formData.hostel}
                                onChange={(e) => setFormData({ ...formData, hostel: e.target.value })}
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full mt-5" isLoading={isLoading}>
                        Create Account
                    </Button>

                    <div className="text-center text-sm mt-4">
                        <span className="text-gray-500">Already have an account? </span>
                        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                            Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
