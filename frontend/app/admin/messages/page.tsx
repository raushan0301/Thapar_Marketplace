'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/api';
import { Search, Trash2, Eye, ChevronLeft, User, Ban } from 'lucide-react';

interface Message {
    id: string;
    message: string;
    image_url?: string;
    is_read: boolean;
    created_at: string;
    sender: {
        id: string;
        name: string;
        email: string;
        profile_picture?: string;
    };
    receiver: {
        id: string;
        name: string;
        email: string;
        profile_picture?: string;
    };
    listing?: {
        id: string;
        title: string;
    } | null;
}

export default function AdminMessagesPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');

    const fetchMessages = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, string> = {};
            if (searchQuery) params.search = searchQuery;
            if (filterType !== 'all') params.type = filterType;

            const response = await api.get('/admin/messages', { params });
            if (response.data.success) {
                setMessages(response.data.data.messages);
            }
        } catch (error: unknown) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, filterType]);

    const handleBanUser = async (userId: string, currentStatus: boolean) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) return;

        setIsProcessing(true);
        try {
            const response = await api.patch(`/admin/users/${userId}/ban`, {
                is_banned: !currentStatus
            });
            if (response.data.success) {
                toast.success(`User ${currentStatus ? 'unbanned' : 'banned'} successfully`);
                setShowViewModal(false);
                fetchMessages();
            }
        } catch (error: unknown) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated || !user?.is_admin) {
            toast.error('Access denied');
            router.push('/');
            return;
        }
        fetchMessages();
    }, [isAuthenticated, user, router, fetchMessages]);

    const handleDelete = async () => {
        if (!selectedMessage) return;

        setIsProcessing(true);
        try {
            const response = await api.delete(`/admin/messages/${selectedMessage.id}`);
            if (response.data.success) {
                toast.success('Message deleted successfully');
                fetchMessages();
                setShowDeleteModal(false);
                setSelectedMessage(null);
            }
        } catch (error: unknown) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkDelete = async (userId: string, type: 'sender' | 'receiver') => {
        if (!confirm(`Delete all messages ${type === 'sender' ? 'from' : 'to'} this user?`)) return;

        setIsProcessing(true);
        try {
            const response = await api.delete(`/admin/messages/bulk`, {
                data: { userId, type }
            });
            if (response.data.success) {
                toast.success(`Deleted ${response.data.data.deletedCount} messages`);
                fetchMessages();
            }
        } catch (error: unknown) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchMessages();
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
                    <h1 className="text-3xl font-bold text-gray-900">Message Moderation</h1>
                    <p className="text-gray-600 mt-2">Monitor and manage all platform messages</p>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-grow relative">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                            <input
                                type="text"
                                placeholder="Search by message content, sender, or receiver..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                            />
                        </div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        >
                            <option value="all">All Messages</option>
                            <option value="with_image">With Images</option>
                            <option value="unread">Unread</option>
                        </select>
                        <Button type="submit">Search</Button>
                    </form>
                </div>

                {/* Messages Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-600">Loading messages...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No messages found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            From → To
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Message
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Listing
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {messages.map((msg) => (
                                        <tr key={msg.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center">
                                                        {msg.sender.profile_picture ? (
                                                            <img
                                                                src={msg.sender.profile_picture}
                                                                alt={msg.sender.name}
                                                                className="w-8 h-8 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                                <User size={16} className="text-blue-600" />
                                                            </div>
                                                        )}
                                                        <div className="ml-2">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {msg.sender.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{msg.sender.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        {msg.receiver.profile_picture ? (
                                                            <img
                                                                src={msg.receiver.profile_picture}
                                                                alt={msg.receiver.name}
                                                                className="w-8 h-8 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                                <User size={16} className="text-green-600" />
                                                            </div>
                                                        )}
                                                        <div className="ml-2">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {msg.receiver.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{msg.receiver.email}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-900 line-clamp-2 max-w-md">
                                                    {msg.message}
                                                </p>
                                                {msg.image_url && (
                                                    <span className="inline-flex items-center px-2 py-1 mt-1 text-xs bg-purple-100 text-purple-800 rounded">
                                                        📷 Has Image
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-900 truncate max-w-xs">
                                                    {msg.listing?.title || 'Unknown/Deleted Listing'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(msg.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMessage(msg);
                                                            setShowViewModal(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-700 flex items-center"
                                                    >
                                                        <Eye size={16} className="mr-1" />
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMessage(msg);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="text-red-600 hover:text-red-700 flex items-center"
                                                    >
                                                        <Trash2 size={16} className="mr-1" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* View Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setSelectedMessage(null);
                }}
                title="Message Details"
            >
                {selectedMessage && (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">From:</h4>
                            <p className="text-gray-700">{selectedMessage.sender.name} ({selectedMessage.sender.email})</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">To:</h4>
                            <p className="text-gray-700">{selectedMessage.receiver.name} ({selectedMessage.receiver.email})</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Listing:</h4>
                            <p className="text-gray-700">{selectedMessage.listing?.title || 'Unknown/Deleted Listing'}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Message:</h4>
                            <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                        </div>
                        {selectedMessage.image_url && (
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Image:</h4>
                                <img
                                    src={selectedMessage.image_url}
                                    alt="Message attachment"
                                    className="max-w-full h-auto rounded-lg"
                                />
                            </div>
                        )}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Date:</h4>
                            <p className="text-gray-700">{new Date(selectedMessage.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2 pt-4">
                            <Button
                                variant="danger"
                                onClick={() => handleBanUser(selectedMessage.sender.id, false)}
                                className="flex-1 bg-red-800 hover:bg-red-900"
                            >
                                <div className="flex items-center justify-center">
                                    <Ban size={16} className="mr-2" />
                                    Ban Sender
                                </div>
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => handleBulkDelete(selectedMessage.sender.id, 'sender')}
                                className="flex-1"
                            >
                                Delete All from Sender
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setShowViewModal(false)}
                                className="flex-1"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSelectedMessage(null);
                }}
                title="Delete Message"
            >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Are you sure you want to delete this message?
                    </p>
                    <p className="text-sm text-gray-600">
                        This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowDeleteModal(false);
                                setSelectedMessage(null);
                            }}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            isLoading={isProcessing}
                            className="flex-1"
                        >
                            Delete Message
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
