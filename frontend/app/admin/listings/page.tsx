'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/api';
import { Search, Trash2, Eye, ChevronLeft, Package } from 'lucide-react';

export default function AdminListingsPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [listings, setListings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedListing, setSelectedListing] = useState<any>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        if (!isAuthenticated || !user?.is_admin) {
            toast.error('Access denied');
            router.push('/');
            return;
        }
        fetchListings();
    }, [isAuthenticated, user, router, filterStatus]);

    const fetchListings = async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (searchQuery) params.search = searchQuery;
            if (filterStatus !== 'all') params.status = filterStatus;

            const response = await api.get('/admin/listings', { params });
            if (response.data.success) {
                setListings(response.data.data.listings);
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedListing) return;

        setIsProcessing(true);
        try {
            const response = await api.delete(`/admin/listings/${selectedListing.id}`);
            if (response.data.success) {
                toast.success('Listing deleted successfully');
                fetchListings();
                setShowDeleteModal(false);
                setSelectedListing(null);
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
        fetchListings();
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
                    <h1 className="text-3xl font-bold text-gray-900">Listing Moderation</h1>
                    <p className="text-gray-600 mt-2">Review and manage all listings</p>
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
                                placeholder="Search by title or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="sold">Sold</option>
                            <option value="rented">Rented</option>
                            <option value="expired">Expired</option>
                        </select>
                        <Button type="submit">Search</Button>
                    </form>
                </div>

                {/* Listings Grid */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-600">Loading listings...</p>
                        </div>
                    ) : listings.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No listings found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Listing
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Seller
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {listings.map((listing) => (
                                        <tr key={listing.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    {listing.images && listing.images[0] ? (
                                                        <img
                                                            src={listing.images[0]}
                                                            alt={listing.title}
                                                            className="w-16 h-16 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 rounded bg-gray-200 flex items-center justify-center">
                                                            <Package size={24} className="text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="ml-4">
                                                        <p className="font-medium text-gray-900">
                                                            {listing.title}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {listing.category_name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {listing.user_name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {listing.user_email}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {listing.price ? `₹${listing.price.toLocaleString()}` :
                                                    listing.rental_rate ? `₹${listing.rental_rate}/${listing.rental_period}` :
                                                        'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs rounded-full ${listing.status === 'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : listing.status === 'sold'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : listing.status === 'rented'
                                                                    ? 'bg-purple-100 text-purple-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    {listing.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(listing.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => router.push(`/listings/${listing.id}`)}
                                                        className="text-blue-600 hover:text-blue-700 flex items-center"
                                                    >
                                                        <Eye size={16} className="mr-1" />
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedListing(listing);
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

            {/* Delete Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSelectedListing(null);
                }}
                title="Delete Listing"
            >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Are you sure you want to delete{' '}
                        <strong>{selectedListing?.title}</strong>?
                    </p>
                    <p className="text-sm text-gray-600">
                        This action cannot be undone. The listing will be permanently removed.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowDeleteModal(false);
                                setSelectedListing(null);
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
                            Delete Listing
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
