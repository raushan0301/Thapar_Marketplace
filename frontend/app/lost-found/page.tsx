'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { lostFoundService, LostFoundItem } from '@/services/lostFoundService';
import { useAuthStore } from '@/store/authStore';
import { Search, MapPin, Calendar, Gift, AlertCircle, CheckCircle2, RefreshCw, Edit, Trash, CheckCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export const dynamic = 'force-dynamic';

function LostFoundContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated } = useAuthStore();
    const [items, setItems] = useState<LostFoundItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found' | 'mine' | 'history'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState('');

    // Sync URL search params to state
    useEffect(() => {
        const query = searchParams.get('search') || '';
        setSearchQuery(query);
    }, [searchParams]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        const timeoutId = setTimeout(() => {
            fetchItems();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [isAuthenticated, activeTab, searchQuery, locationFilter]);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const filters: any = {
                sort_by: 'incident_date',
                sort_order: 'desc',
            };

            if (activeTab === 'history') {
                filters.status = 'sold';
            } else if (activeTab === 'mine') {
                // Show user's own items (both active and resolved)
                filters.status = 'active';
            } else {
                filters.status = 'active';
                if (activeTab !== 'all') {
                    filters.listing_type = activeTab;
                }
            }

            if (searchQuery) {
                filters.search = searchQuery;
            }

            if (locationFilter) {
                filters.location = locationFilter;
            }

            const response = await lostFoundService.getItems(filters);
            if (response.success) {
                let fetchedItems = response.data.items || [];

                // If "My Items" tab, filter to show only user's items
                if (activeTab === 'mine') {
                    fetchedItems = fetchedItems.filter((item: LostFoundItem) => item.user_id === user?.id);
                }

                setItems(fetchedItems);
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchItems();
    };

    const handleItemClick = (itemId: string) => {
        router.push(`/lost-found/${itemId}`);
    };

    const handleReactivateItem = async (e: React.MouseEvent, itemId: string) => {
        e.stopPropagation();

        try {
            const response = await lostFoundService.reactivateItem(itemId);
            if (response.success) {
                toast.success('Item reactivated successfully!');
                fetchItems();
            }
        } catch (error) {
            console.error('Reactivation failed:', error);
            toast.error('Failed to reactivate item');
        }
    };

    const handleEditItem = (e: React.MouseEvent, itemId: string) => {
        e.stopPropagation();
        router.push(`/lost-found/${itemId}/edit`);
    };

    const handleDeleteItem = async (e: React.MouseEvent, itemId: string) => {
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this item? You can view it later in the History tab.')) {
            return;
        }

        try {
            const response = await lostFoundService.deleteItem(itemId);
            if (response.success) {
                toast.success('Item deleted successfully!');
                setItems(prev => prev.filter(item => item.id !== itemId));
            }
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete item');
        }
    };

    const handleMarkAsClaimed = async (e: React.MouseEvent, itemId: string) => {
        e.stopPropagation();

        if (!confirm('Mark this item as claimed/found? This will move it to history.')) {
            return;
        }

        try {
            const response = await lostFoundService.markResolved(itemId);
            if (response.success) {
                toast.success('Item marked as resolved!');
                fetchItems();
            }
        } catch (error) {
            console.error('Mark as claimed failed:', error);
            toast.error('Failed to mark item as claimed');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Lost & Found</h1>
                    <p className="text-gray-600 mb-6">
                        Help reunite lost items with their owners
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => router.push('/lost-found/create?type=lost')}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                            <AlertCircle size={20} />
                            Report Lost Item
                        </button>
                        <button
                            onClick={() => router.push('/lost-found/create?type=found')}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                            <CheckCircle2 size={20} />
                            Report Found Item
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 sm:px-6 lg:px-8 py-6">
                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search for items..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Location..."
                                    value={locationFilter}
                                    onChange={(e) => setLocationFilter(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                                />
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleSearch}
                        className="mt-3 w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        Search
                    </button>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            All Items
                        </button>
                        <button
                            onClick={() => setActiveTab('lost')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'lost'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            🔴 Lost
                        </button>
                        <button
                            onClick={() => setActiveTab('found')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'found'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            🟢 Found
                        </button>
                        <button
                            onClick={() => setActiveTab('mine')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'mine'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            👤 My Items
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'history'
                                ? 'bg-gray-800 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            📜 History
                        </button>
                    </div>
                </div>

                {/* Items Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 animate-pulse"
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
                ) : items.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                        <p className="text-gray-500 text-lg">No items found</p>
                        <p className="text-gray-400 mt-2">Try adjusting your filters or be the first to post!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handleItemClick(item.id)}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                            >
                                {/* Image */}
                                <div className="relative h-48 bg-gray-100">
                                    {item.images && item.images.length > 0 ? (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={item.images[0]}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <span className="text-6xl">
                                                {item.listing_type === 'lost' ? '🔍' : '✅'}
                                            </span>
                                        </div>
                                    )}
                                    {/* View Count Badge */}
                                    <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm z-10">
                                        <Eye size={12} />
                                        <span>{item.views || 0}</span>
                                    </div>

                                    {/* Badge */}
                                    <div
                                        className={`absolute top-3 right-3 px-3 py-1 rounded-full text-white font-semibold text-xs ${activeTab === 'history' ? 'bg-gray-600' :
                                            item.listing_type === 'lost' ? 'bg-red-600' : 'bg-green-600'
                                            }`}
                                    >
                                        {activeTab === 'history' ? 'RESOLVED' : item.listing_type === 'lost' ? 'LOST' : 'FOUND'}
                                    </div>

                                    {/* Reactivate Button */}
                                    {activeTab === 'history' && user?.id === item.user_id && (
                                        <button
                                            onClick={(e) => handleReactivateItem(e, item.id)}
                                            className="absolute bottom-3 right-3 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-10"
                                            title="Reactivate Item"
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                        {item.description}
                                    </p>

                                    {/* Details */}
                                    <div className="space-y-2 text-sm">
                                        {item.location && (
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                                                <span className="truncate">{item.location}</span>
                                            </div>
                                        )}
                                        {item.incident_date && (
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                                                <span>{formatDate(item.incident_date)}</span>
                                            </div>
                                        )}
                                        {item.reward && item.listing_type === 'lost' && (
                                            <div className="flex items-center gap-2 text-green-700 font-medium">
                                                <Gift size={14} className="text-green-600 flex-shrink-0" />
                                                <span>Reward: {item.reward}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Posted by */}
                                    <div className="mt-4 pt-3 border-t border-gray-200 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                            {item.poster_profile_picture ? (
                                                <img
                                                    src={item.poster_profile_picture}
                                                    alt={item.poster_name}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-gray-500 text-sm font-medium">
                                                    {item.poster_name?.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm min-w-0">
                                            <p className="text-gray-900 font-medium truncate">{item.poster_name}</p>
                                            <p className="text-gray-500 text-xs">
                                                {formatDate(item.created_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons for My Items Tab */}
                                    {activeTab === 'mine' && user?.id === item.user_id && (
                                        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                                            <button
                                                onClick={(e) => handleEditItem(e, item.id)}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                                                title="Edit Item"
                                            >
                                                <Edit size={16} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={(e) => handleMarkAsClaimed(e, item.id)}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                                                title="Mark as Claimed/Found"
                                            >
                                                <CheckCircle size={16} />
                                                Claimed
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteItem(e, item.id)}
                                                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                                                title="Delete Item"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
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


export default function LostFoundPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
            <LostFoundContent />
        </Suspense>
    );
}
