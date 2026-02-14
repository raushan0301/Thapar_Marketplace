'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { listingService } from '@/services/listingService';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/api';
import {
    MapPin,
    Clock,
    Eye,
    Star,
    MessageSquare,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

export default function ListingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [listing, setListing] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const hasFetchedRef = React.useRef(false);

    useEffect(() => {
        if (params.id && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            fetchListing(params.id as string);
        }
    }, [params.id]);

    const fetchListing = async (id: string) => {
        // Don't set loading true here to avoid flashing if we want to support strict mode better, 
        // but for now keeping it simple.
        setIsLoading(true);
        setError(null);
        try {
            const result = await listingService.getListingById(id);
            if (result.success) {
                setListing(result.data.listing);
            } else {
                setError('Listing not found');
            }
        } catch (error: any) {
            // Check if it's a 404 error
            if (error.response?.status === 404) {
                setError('This listing does not exist or has been removed.');
            } else {
                const errorMessage = handleApiError(error);
                setError(errorMessage || 'Failed to load listing');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        setIsUpdatingStatus(true);
        try {
            const result = await listingService.markListingStatus(listing.id, newStatus);
            if (result.success) {
                toast.success(`Listing marked as ${newStatus}`);
                setListing({ ...listing, status: newStatus });
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await listingService.deleteListing(listing.id);
            if (result.success) {
                toast.success('Listing deleted successfully');
                router.push('/my-listings');
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleContactSeller = () => {
        if (!isAuthenticated) {
            toast.error('Please login to contact the seller');
            router.push('/login');
            return;
        }
        router.push(`/messages?user=${listing.user_id}&listing=${listing.id}`);
    };

    const formatTimeAgo = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minutes ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hours ago`;

        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} days ago`;

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const nextImage = () => {
        if (listing?.images) {
            setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
        }
    };

    const prevImage = () => {
        if (listing?.images) {
            setCurrentImageIndex(
                (prev) => (prev - 1 + listing.images.length) % listing.images.length
            );
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading listing...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="mb-6">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                                className="w-12 h-12 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Listing Not Found</h1>
                        <p className="text-lg text-gray-600 mb-6">{error}</p>
                        <p className="text-sm text-gray-500 mb-8">
                            The listing you're looking for might have been removed, sold, or the link might be incorrect.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                            onClick={() => router.push('/')}
                            className="flex items-center justify-center"
                        >
                            <ChevronLeft size={18} className="mr-2" />
                            Back to Home
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => router.back()}
                            className="flex items-center justify-center"
                        >
                            Go Back
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600">Listing not found</p>
                    <Link href="/" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
                        Go back to home
                    </Link>
                </div>
            </div>
        );
    }

    const isOwner = user?.id === listing.user_id;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ChevronLeft size={20} className="mr-1" />
                    Back
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Images */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            {/* Main Image */}
                            <div className="relative h-96 bg-gray-200">
                                {listing.images && listing.images.length > 0 ? (
                                    <>
                                        <img
                                            src={listing.images[currentImageIndex]}
                                            alt={listing.title}
                                            className="w-full h-full object-contain"
                                        />

                                        {/* Image Navigation */}
                                        {listing.images.length > 1 && (
                                            <>
                                                <button
                                                    onClick={prevImage}
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg"
                                                >
                                                    <ChevronLeft size={24} />
                                                </button>
                                                <button
                                                    onClick={nextImage}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg"
                                                >
                                                    <ChevronRight size={24} />
                                                </button>

                                                {/* Image Counter */}
                                                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                                                    {currentImageIndex + 1} / {listing.images.length}
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        No Image Available
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail Gallery */}
                            {listing.images && listing.images.length > 1 && (
                                <div className="p-4 flex gap-2 overflow-x-auto">
                                    {listing.images.map((image: string, index: number) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${index === currentImageIndex
                                                ? 'border-blue-600'
                                                : 'border-gray-200'
                                                }`}
                                        >
                                            <img
                                                src={image}
                                                alt={`Thumbnail ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                            <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
                        </div>

                        {/* Details */}
                        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Details</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {listing.condition && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Condition</p>
                                        <p className="font-medium text-gray-900 capitalize">{listing.condition}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Type</p>
                                    <p className="font-medium text-gray-900 capitalize">{listing.listing_type}</p>
                                </div>
                                {listing.location && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Location</p>
                                        <p className="font-medium text-gray-900">{listing.location}</p>
                                    </div>
                                )}
                                {listing.rental_duration && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Rental Duration</p>
                                        <p className="font-medium text-gray-900">{listing.rental_duration}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Posted</p>
                                    <p className="font-medium text-gray-900">{formatTimeAgo(listing.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Views</p>
                                    <p className="font-medium text-gray-900 flex items-center">
                                        <Eye size={16} className="mr-1" />
                                        {listing.views}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Seller Info & Actions */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
                            {/* Title & Price */}
                            <h1 className="text-2xl font-bold text-gray-900 mb-4 flex flex-wrap items-center gap-3">
                                {listing.title}
                                {listing.status !== 'active' && (
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${listing.status === 'sold' ? 'bg-red-500' :
                                            listing.status === 'rented' ? 'bg-orange-500' : 'bg-gray-600'
                                        }`}>
                                        {listing.status.toUpperCase()}
                                    </span>
                                )}
                            </h1>

                            {listing.price && (
                                <p className="text-3xl font-bold text-blue-600 mb-6">
                                    ₹{listing.price.toLocaleString()}
                                    {listing.listing_type === 'rent' && (
                                        <span className="text-lg text-gray-500">/month</span>
                                    )}
                                </p>
                            )}

                            {/* Seller Info */}
                            <div className="border-t border-b border-gray-200 py-4 mb-6">
                                <p className="text-sm text-gray-500 mb-2">Seller</p>
                                <div className="flex items-center">
                                    {listing.seller_profile_picture ? (
                                        <img
                                            src={listing.seller_profile_picture}
                                            alt={listing.seller_name}
                                            className="w-12 h-12 rounded-full object-cover mr-3"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                            <span className="text-lg text-blue-600 font-semibold">
                                                {listing.seller_name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {listing.seller_name}
                                        </p>
                                        {listing.seller_email && (
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {listing.seller_email}
                                            </p>
                                        )}

                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {isOwner ? (
                                <div className="flex flex-col gap-4">
                                    {listing.status === 'active' ? (
                                        <Button
                                            variant="secondary"
                                            className="w-full flex items-center justify-center"
                                            onClick={() => handleStatusUpdate('sold')}
                                            isLoading={isUpdatingStatus}
                                        >
                                            Mark as Sold
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            className="w-full flex items-center justify-center"
                                            onClick={() => handleStatusUpdate('active')}
                                            isLoading={isUpdatingStatus}
                                        >
                                            Mark as Active
                                        </Button>
                                    )}
                                    <Link href={`/listings/edit/${listing.id}`}>
                                        <Button className="w-full flex items-center justify-center">
                                            <Edit size={18} className="mr-2" />
                                            Edit Listing
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="danger"
                                        onClick={() => setShowDeleteModal(true)}
                                        className="w-full flex items-center justify-center"
                                    >
                                        <Trash2 size={18} className="mr-2" />
                                        Delete Listing
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    onClick={handleContactSeller}
                                    className="w-full flex items-center justify-center"
                                >
                                    <MessageSquare size={18} className="mr-2" />
                                    Contact Seller
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Listing"
            >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Are you sure you want to delete this listing? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setShowDeleteModal(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            isLoading={isDeleting}
                            className="flex-1"
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
