'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Camera, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/authService';
import { handleApiError } from '@/lib/api';

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, logout, setAuth } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
    });

    useEffect(() => {
        if (!isAuthenticated) {
            toast.error('Please login to view your profile');
            router.push('/login');
            return;
        }

        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
            });
            setProfilePicturePreview(user.profile_picture || '');
        }
    }, [isAuthenticated, user, router]);

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePicture(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicturePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);

            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('phone', formData.phone);

            if (profilePicture) {
                formDataToSend.append('profile_picture', profilePicture);
            }

            const result = await authService.updateProfile(formDataToSend);

            if (result.success) {
                // Update auth store with new user data
                const token = localStorage.getItem('token');
                if (token) {
                    setAuth(result.data.user, token);
                }

                toast.success('Profile updated successfully!');
                setIsEditing(false);
                setProfilePicture(null);
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        router.push('/');
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                    <p className="mt-2 text-gray-600">
                        Manage your account information
                    </p>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Cover & Avatar */}
                    <div className="relative h-32 bg-gradient-to-r from-blue-500 to-blue-600">
                        <div className="absolute -bottom-16 left-8">
                            <div className="relative">
                                {profilePicturePreview ? (
                                    <img
                                        src={profilePicturePreview}
                                        alt={user.name}
                                        className="w-32 h-32 rounded-full border-4 border-white object-cover"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center">
                                        <span className="text-4xl text-blue-600 font-bold">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="profile-picture-upload"
                                    accept="image/*"
                                    onChange={handleProfilePictureChange}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('profile-picture-upload')?.click()}
                                    className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Camera size={20} className="text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Profile Info */}
                    <div className="pt-20 px-8 pb-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>

                            </div>
                            <div className="flex gap-3">
                                {isEditing || profilePicture ? (
                                    <>
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setProfilePicture(null);
                                                setProfilePicturePreview(user?.profile_picture || '');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving}>
                                            Save Changes
                                        </Button>
                                    </>
                                ) : (
                                    <Button onClick={() => setIsEditing(true)}>
                                        Edit Profile
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Form */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Full Name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={!isEditing}
                                />
                                <Input
                                    label="Email Address"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={true}
                                    helperText="Email cannot be changed"
                                />
                            </div>

                            <Input
                                label="Phone Number"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                disabled={!isEditing}
                            />

                            {/* Account Info */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Member Since</p>
                                        <p className="font-medium text-gray-900">
                                            {user.created_at ? (
                                                (() => {
                                                    try {
                                                        const date = new Date(user.created_at);
                                                        return isNaN(date.getTime())
                                                            ? 'N/A'
                                                            : date.toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            });
                                                    } catch {
                                                        return 'N/A';
                                                    }
                                                })()
                                            ) : 'N/A'}
                                        </p>
                                    </div>
                                    <div>

                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h3>
                                <Button
                                    variant="danger"
                                    onClick={handleLogout}
                                    className="w-full md:w-auto"
                                >
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
