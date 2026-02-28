'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { lostFoundService, LostFoundItem } from '@/services/lostFoundService';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, MapPin, Calendar, Gift, Eye, MessageCircle, CheckCircle, Mail, User as UserIcon, RefreshCw, Edit, Trash } from 'lucide-react';
import toast from 'react-hot-toast';


export default function LostFoundDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user, isAuthenticated } = useAuthStore();
    const [item, setItem] = useState<LostFoundItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [resolving, setResolving] = useState(false);

    const fetchRef = React.useRef<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Prevent double fetching in Strict Mode
        if (fetchRef.current === params.itemId) return;
        fetchRef.current = params.itemId as string;

        fetchItem();
    }, [isAuthenticated, params.itemId]);

    const fetchItem = async () => {
        try {
            setLoading(true);

            // Check if viewed recently (within 5 seconds) to prevent double counting
            const viewKey = `last-view-time-${params.itemId}`;
            const lastViewTime = parseInt(sessionStorage.getItem(viewKey) || '0');
            const now = Date.now();
            const shouldIncrement = (now - lastViewTime) > 5000;

            if (shouldIncrement) {
                sessionStorage.setItem(viewKey, now.toString());
            }

            const response = await lostFoundService.getItemById(params.itemId as string, shouldIncrement);

            if (response.success) {
                setItem(response.data.item);
            } else {
                toast.error('Item not found');
                router.push('/lost-found');
            }
        } catch (error) {

            toast.error('Failed to load item details');
            router.push('/lost-found');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkResolved = async () => {
        if (!item) return;

        try {
            setResolving(true);
            const response = await lostFoundService.markResolved(item.id);
            if (response.success) {
                // alert(`Item marked as ${item.listing_type === 'lost' ? 'found' : 'claimed'}!`);
                router.push('/lost-found');
            }
        } catch (error) {

            // alert('Failed to update item status');
        } finally {
            setResolving(false);
        }
    };

    const handleReactivate = async () => {
        if (!item) return;

        try {
            setResolving(true);
            const response = await lostFoundService.reactivateItem(item.id);
            if (response.success) {
                // alert('Item reactivated successfully!');
                setItem({ ...item, status: 'active' });
            }
        } catch (error) {

            // alert('Failed to reactivate item');
        } finally {
            setResolving(false);
        }
    };

    const handleContactPoster = () => {
        if (!item) return;
        // Navigate to messages/chat with this user about this item
        router.push(`/messages?user=${item.user_id}&listing=${item.id}`);
    };

    const handleEdit = () => {
        if (!item) return;
        router.push(`/lost-found/${item.id}/edit`);
    };

    const handleDelete = async () => {
        if (!item) return;

        if (!confirm('Are you sure you want to delete this item? You can view it later in the History tab.')) {
            return;
        }

        try {
            const response = await lostFoundService.deleteItem(item.id);
            if (response.success) {
                toast.success('Item deleted successfully!');
                router.push('/lost-found');
            }
        } catch (error) {

            toast.error('Failed to delete item');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    if (!isAuthenticated || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!item) {
        return null;
    }

    const isOwner = user?.id === item.user_id;
    const isLost = item.listing_type === 'lost';

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Lost & Found
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Images and Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Badge */}
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold text-sm ${item.status === 'sold' ? 'bg-gray-600' :
                            isLost ? 'bg-red-600' : 'bg-green-600'
                            }`}>
                            {item.status === 'sold' ? 'RESOLVED' : isLost ? '🔴 LOST ITEM' : '🟢 FOUND ITEM'}
                        </div>

                        {/* Images */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {item.images && item.images.length > 0 ? (
                                <>
                                    {/* Main Image */}
                                    <div className="relative h-96 bg-gray-100">
                                        <Image
                                            src={item.images[selectedImage]}
                                            alt={item.title}
                                            fill
                                            className="object-contain"
                                            sizes="(max-width: 768px) 100vw, 800px"
                                        />
                                    </div>

                                    {/* Thumbnail Gallery */}
                                    {item.images.length > 1 && (
                                        <div className="p-4 flex gap-2 overflow-x-auto">
                                            {item.images.map((img, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setSelectedImage(index)}
                                                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                                                        ? 'border-blue-600 ring-2 ring-blue-200'
                                                        : 'border-gray-200 hover:border-blue-300'
                                                        }`}
                                                >
                                                    <Image
                                                        src={img}
                                                        alt={`${item.title} ${index + 1}`}
                                                        fill
                                                        className="object-cover"
                                                        sizes="80px"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="h-96 flex items-center justify-center bg-gray-100">
                                    <span className="text-8xl">
                                        {isLost ? '🔍' : '✅'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Item Details */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{item.title}</h1>

                            {/* Meta Info */}
                            <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <Eye size={16} />
                                    <span>{item.views} views</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar size={16} />
                                    <span>Posted {formatDate(item.created_at)}</span>
                                </div>
                            </div>

                            {/* Key Information */}
                            <div className="space-y-3 mb-6">
                                {item.location && (
                                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <MapPin className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">
                                                {isLost ? 'Last Seen At' : 'Found At'}
                                            </p>
                                            <p className="text-gray-700">{item.location}</p>
                                        </div>
                                    </div>
                                )}

                                {item.incident_date && (
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <Calendar className="text-gray-600 flex-shrink-0 mt-0.5" size={20} />
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">
                                                {isLost ? 'Lost On' : 'Found On'}
                                            </p>
                                            <p className="text-gray-700">{formatDate(item.incident_date)}</p>
                                        </div>
                                    </div>
                                )}

                                {item.reward && isLost && (
                                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                                        <Gift className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">Reward Offered</p>
                                            <p className="text-green-700 font-semibold text-lg">{item.reward}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 mb-3">Description</h2>
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Poster Info and Actions */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-4">
                            {/* Poster Information */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                                <h3 className="text-base font-bold text-gray-900 mb-4">
                                    {isLost ? 'Posted By (Owner)' : 'Posted By (Finder)'}
                                </h3>

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {item.poster_profile_picture ? (
                                            <img
                                                src={item.poster_profile_picture}
                                                alt={item.poster_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <UserIcon className="text-gray-400" size={28} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{item.poster_name}</p>
                                        {item.poster_trust_score !== undefined && (
                                            <p className="text-sm text-gray-600">
                                                ⭐ {item.poster_trust_score.toFixed(1)}/5.0
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Information */}
                                {!isOwner && item.poster_email && (
                                    <div className="pt-4 border-t border-gray-200">
                                        <div className="flex items-center gap-2 text-gray-700 text-sm">
                                            <Mail size={16} className="text-gray-400" />
                                            <span>{item.poster_email}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-3">
                                {isOwner ? (
                                    item.status === 'sold' ? (
                                        <>
                                            <button
                                                onClick={handleReactivate}
                                                disabled={resolving}
                                                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all bg-blue-600 hover:bg-blue-700"
                                            >
                                                <RefreshCw size={20} />
                                                {resolving ? 'Reactivating...' : 'Reactivate Item'}
                                            </button>
                                            <p className="text-xs text-gray-500 text-center">
                                                Move back to active listings
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={handleMarkResolved}
                                                disabled={resolving}
                                                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all ${isLost
                                                    ? 'bg-green-600 hover:bg-green-700'
                                                    : 'bg-blue-600 hover:bg-blue-700'
                                                    } ${resolving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <CheckCircle size={20} />
                                                {resolving
                                                    ? 'Updating...'
                                                    : isLost
                                                        ? 'Mark as Found'
                                                        : 'Mark as Claimed'}
                                            </button>
                                            <p className="text-xs text-gray-500 text-center">
                                                This will remove the item from active listings
                                            </p>

                                            {/* Edit and Delete Buttons */}
                                            <div className="mt-4 flex gap-2">
                                                <button
                                                    onClick={handleEdit}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                                                >
                                                    <Edit size={18} />
                                                    Edit Item
                                                </button>
                                                <button
                                                    onClick={handleDelete}
                                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200"
                                                >
                                                    <Trash size={18} />
                                                    Delete
                                                </button>
                                            </div>
                                        </>
                                    )
                                ) : (
                                    <>
                                        <button
                                            onClick={handleContactPoster}
                                            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all ${isLost
                                                ? 'bg-red-600 hover:bg-red-700'
                                                : 'bg-green-600 hover:bg-green-700'
                                                }`}
                                        >
                                            <MessageCircle size={20} />
                                            {isLost ? 'I Found This!' : 'This is Mine!'}
                                        </button>
                                        <p className="text-xs text-gray-500 text-center">
                                            Contact the {isLost ? 'owner' : 'finder'} via chat
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Safety Tips */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h4 className="font-semibold text-yellow-900 mb-2 text-sm">⚠️ Safety Tips</h4>
                                <ul className="text-xs text-yellow-800 space-y-1">
                                    <li>• Meet in public places on campus</li>
                                    <li>• Verify item details before claiming</li>
                                    <li>• Report suspicious activity</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
