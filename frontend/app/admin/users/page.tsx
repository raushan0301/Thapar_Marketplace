'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/api';
import { Search, Ban, CheckCircle, ChevronLeft } from 'lucide-react';

export default function AdminUsersPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showBanModal, setShowBanModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !user?.is_admin) {
            toast.error('Access denied');
            router.push('/');
            return;
        }
        fetchUsers();
    }, [isAuthenticated, user, router]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (searchQuery) params.search = searchQuery;

            const response = await api.get('/admin/users', { params });
            if (response.data.success) {
                setUsers(response.data.data.users);
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBanToggle = async () => {
        if (!selectedUser) return;

        setIsProcessing(true);
        try {
            const response = await api.patch(`/admin/users/${selectedUser.id}/ban`);
            if (response.data.success) {
                toast.success(
                    selectedUser.is_banned
                        ? 'User unbanned successfully'
                        : 'User banned successfully'
                );
                fetchUsers();
                setShowBanModal(false);
                setSelectedUser(null);
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers();
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/admin')}
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ChevronLeft size={20} className="mr-1" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600 mt-2">Manage and moderate users</p>
                </div>

                {/* Search */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-grow relative">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                            />
                        </div>
                        <Button type="submit">Search</Button>
                    </form>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-600">Loading users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No users found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Department
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Joined
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {u.profile_picture ? (
                                                        <img
                                                            src={u.profile_picture}
                                                            alt={u.name}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <span className="text-blue-600 font-semibold">
                                                                {u.name?.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="ml-3">
                                                        <p className="font-medium text-gray-900">
                                                            {u.name}
                                                        </p>
                                                        {u.is_admin && (
                                                            <span className="text-xs text-blue-600">
                                                                Admin
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {u.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {u.department || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {u.is_banned ? (
                                                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                                        Banned
                                                    </span>
                                                ) : u.is_verified ? (
                                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                                        Unverified
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {!u.is_admin && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(u);
                                                            setShowBanModal(true);
                                                        }}
                                                        className={`flex items-center ${u.is_banned
                                                            ? 'text-green-600 hover:text-green-700'
                                                            : 'text-red-600 hover:text-red-700'
                                                            }`}
                                                    >
                                                        {u.is_banned ? (
                                                            <>
                                                                <CheckCircle size={16} className="mr-1" />
                                                                Unban
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Ban size={16} className="mr-1" />
                                                                Ban
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Ban/Unban Modal */}
            <Modal
                isOpen={showBanModal}
                onClose={() => {
                    setShowBanModal(false);
                    setSelectedUser(null);
                }}
                title={selectedUser?.is_banned ? 'Unban User' : 'Ban User'}
            >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Are you sure you want to {selectedUser?.is_banned ? 'unban' : 'ban'}{' '}
                        <strong>{selectedUser?.name}</strong>?
                    </p>
                    {!selectedUser?.is_banned && (
                        <p className="text-sm text-gray-600">
                            Banned users will not be able to login or access the platform.
                        </p>
                    )}
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowBanModal(false);
                                setSelectedUser(null);
                            }}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={selectedUser?.is_banned ? 'primary' : 'danger'}
                            onClick={handleBanToggle}
                            isLoading={isProcessing}
                            className="flex-1"
                        >
                            {selectedUser?.is_banned ? 'Unban' : 'Ban'} User
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
