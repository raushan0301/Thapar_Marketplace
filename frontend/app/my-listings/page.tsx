'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { listingService } from '@/services/listingService';
import { useAuthStore } from '@/store/authStore';
import { ListingCard } from '@/components/listings/ListingCard';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/api';
import { Plus, Package } from 'lucide-react';
import Link from 'next/link';

export default function MyListingsPage() {
    const router = useRouter();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const [listings, setListings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            toast.error('Please login to view your listings');
            router.push('/login');
            return;
        }
        fetchMyListings();
    }, [isAuthenticated, router]);

    const fetchMyListings = async () => {
        setIsLoading(true);
        try {
            const result = await listingService.getMyListings({ limit: 100 });

            if (result.success) {
                setListings(result.data.listings);
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (listingId: string, newStatus: string) => {
        setActionLoading(listingId);
        try {
            const result = await listingService.markListingStatus(listingId, newStatus);
            if (result.success) {
                toast.success(`Listing marked as ${newStatus}`);
                setListings(prev =>
                    prev.map(l => l.id === listingId ? { ...l, status: newStatus } : l)
                );
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setActionLoading(null);
        }
    };

    const tabs = [
        { id: 'all', label: 'All', count: listings.length },
        {
            id: 'active',
            label: 'Active',
            count: listings.filter((l) => l.status === 'active').length,
        },
        {
            id: 'sold',
            label: 'Sold',
            count: listings.filter((l) => l.status === 'sold').length,
        },
        {
            id: 'expired',
            label: 'Expired',
            count: listings.filter((l) => l.status === 'expired').length,
        },
    ];

    const filteredListings = activeTab === 'all'
        ? listings
        : listings.filter(l => l.status === activeTab);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
                        <p className="text-gray-600 mt-2">Manage your posted items</p>
                    </div>
                    <Link href="/listings/create">
                        <Button className="flex items-center">
                            <Plus size={20} className="mr-2" />
                            Create Listing
                        </Button>
                    </Link>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md mb-6">
                    <div className="flex border-b overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {tab.label}
                                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100">
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-lg shadow-md h-96 animate-pulse"
                            >
                                <div className="h-48 bg-gray-200" />
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : listings.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg shadow-md">
                        <Package size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No listings yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Start selling by creating your first listing
                        </p>
                        <Link href="/listings/create">
                            <Button>
                                <Plus size={20} className="mr-2" />
                                Create Your First Listing
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredListings.map((listing) => (
                            <div key={listing.id} className="flex flex-col">
                                <div className="relative">
                                    <ListingCard listing={listing} />

                                </div>
                                <div className="mt-3">
                                    {listing.status === 'active' ? (
                                        <Button
                                            variant="secondary"
                                            className="w-full"
                                            onClick={() => handleStatusUpdate(listing.id, 'sold')}
                                            isLoading={actionLoading === listing.id}
                                        >
                                            Mark as Sold
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            className="w-full"
                                            onClick={() => handleStatusUpdate(listing.id, 'active')}
                                            isLoading={actionLoading === listing.id}
                                        >
                                            Mark as Active
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
