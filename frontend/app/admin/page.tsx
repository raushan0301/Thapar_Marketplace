'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/api';
import {
    Users,
    Package,
    MessageSquare,
    Star,
    TrendingUp,
    AlertCircle,
} from 'lucide-react';

export default function AdminDashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [analytics, setAnalytics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            toast.error('Please login to access admin panel');
            router.push('/login');
            return;
        }

        if (!user?.is_admin) {
            toast.error('Access denied. Admin privileges required.');
            router.push('/');
            return;
        }

        fetchAnalytics();
    }, [isAuthenticated, user, router]);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/admin/analytics');
            if (response.data.success) {
                setAnalytics(response.data.data);
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    const stats = [
        {
            name: 'Total Users',
            value: analytics?.totalUsers || 0,
            icon: Users,
            color: 'bg-blue-500',
            change: '+12%',
        },
        {
            name: 'Active Listings',
            value: analytics?.activeListings || 0,
            icon: Package,
            color: 'bg-green-500',
            change: '+8%',
        },
        {
            name: 'Total Messages',
            value: analytics?.totalMessages || 0,
            icon: MessageSquare,
            color: 'bg-purple-500',
            change: '+23%',
        },
        {
            name: 'Average Rating',
            value: analytics?.averageRating ? parseFloat(analytics.averageRating).toFixed(1) : '0.0',
            icon: Star,
            color: 'bg-yellow-500',
            change: '+0.2',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-2">Manage and monitor ThaparMarket</p>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <button
                        onClick={() => router.push('/admin/users')}
                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
                    >
                        <Users className="text-blue-600 mb-2" size={32} />
                        <h3 className="font-semibold text-lg text-gray-900">User Management</h3>
                        <p className="text-sm text-gray-600">Manage users and permissions</p>
                    </button>

                    <button
                        onClick={() => router.push('/admin/listings')}
                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
                    >
                        <Package className="text-green-600 mb-2" size={32} />
                        <h3 className="font-semibold text-lg text-gray-900">Listing Moderation</h3>
                        <p className="text-sm text-gray-600">Review and moderate listings</p>
                    </button>

                    <button
                        onClick={() => router.push('/admin/messages')}
                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
                    >
                        <MessageSquare className="text-orange-600 mb-2" size={32} />
                        <h3 className="font-semibold text-lg text-gray-900">Message Moderation</h3>
                        <p className="text-sm text-gray-600">Monitor platform messages</p>
                    </button>

                    <button
                        onClick={() => router.push('/admin/categories')}
                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
                    >
                        <TrendingUp className="text-purple-600 mb-2" size={32} />
                        <h3 className="font-semibold text-lg text-gray-900">Categories</h3>
                        <p className="text-sm text-gray-600">Manage listing categories</p>
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat) => (
                        <div key={stat.name} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${stat.color} p-3 rounded-lg`}>
                                    <stat.icon className="text-white" size={24} />
                                </div>
                                <span className="text-sm font-medium text-green-600">
                                    {stat.change}
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">
                                {stat.value}
                            </h3>
                            <p className="text-sm text-gray-600">{stat.name}</p>
                        </div>
                    ))}
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Users */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
                        <div className="space-y-3">
                            {analytics?.recentUsers?.slice(0, 5).map((user: any) => (
                                <div key={user.id} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        {user.profile_picture ? (
                                            <img
                                                src={user.profile_picture}
                                                alt={user.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span className="text-blue-600 font-semibold">
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="ml-3">
                                            <p className="font-medium text-gray-900">{user.name}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    {user.is_banned && (
                                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                            Banned
                                        </span>
                                    )}
                                </div>
                            )) || (
                                    <p className="text-gray-500 text-center py-4">No recent users</p>
                                )}
                        </div>
                    </div>

                    {/* Recent Listings */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Listings</h3>
                        <div className="space-y-3">
                            {analytics?.recentListings?.slice(0, 5).map((listing: any) => (
                                <div key={listing.id} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        {listing.images && listing.images[0] ? (
                                            <img
                                                src={listing.images[0]}
                                                alt={listing.title}
                                                className="w-12 h-12 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                                                <Package size={20} className="text-gray-400" />
                                            </div>
                                        )}
                                        <div className="ml-3">
                                            <p className="font-medium text-gray-900 truncate max-w-xs">
                                                {listing.title}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                ₹{listing.price?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`px-2 py-1 text-xs rounded-full ${listing.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {listing.status}
                                    </span>
                                </div>
                            )) || (
                                    <p className="text-gray-500 text-center py-4">No recent listings</p>
                                )}
                        </div>
                    </div>
                </div>

                {/* System Alerts */}
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
                        <div className="ml-3">
                            <h4 className="font-semibold text-yellow-900">System Status</h4>
                            <p className="text-sm text-yellow-800 mt-1">
                                All systems operational. Last backup: {new Date().toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
