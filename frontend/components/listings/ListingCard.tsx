import React from 'react';
import Link from 'next/link';
import { MapPin, Clock, Eye } from 'lucide-react';

interface ListingCardProps {
    listing: {
        id: string;
        title: string;
        description: string;
        price?: number;
        images: string[];
        condition?: string;
        listing_type: 'sell' | 'rent' | 'lost' | 'found';
        location?: string;
        views: number;
        created_at: string;
        user: {
            name: string;
            profile_picture?: string;
        };
    };
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
    const getListingTypeColor = (type: string) => {
        switch (type) {
            case 'sell':
                return 'bg-green-100 text-green-800';
            case 'rent':
                return 'bg-blue-100 text-blue-800';
            case 'lost':
                return 'bg-red-100 text-red-800';
            case 'found':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getConditionColor = (condition?: string) => {
        switch (condition) {
            case 'new':
                return 'bg-green-100 text-green-800';
            case 'excellent':
                return 'bg-blue-100 text-blue-800';
            case 'good':
                return 'bg-yellow-100 text-yellow-800';
            case 'fair':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <Link href={`/listings/${listing.id}`}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full flex flex-col">
                {/* Image */}
                <div className="relative h-48 bg-gray-200">
                    {listing.images && listing.images.length > 0 ? (
                        <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Image
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-2">
                        <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${getListingTypeColor(
                                listing.listing_type
                            )}`}
                        >
                            {listing.listing_type.toUpperCase()}
                        </span>
                        {listing.condition && (
                            <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${getConditionColor(
                                    listing.condition
                                )}`}
                            >
                                {listing.condition}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-grow flex flex-col">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                        {listing.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {listing.description}
                    </p>

                    {/* Price */}
                    {listing.price && (
                        <p className="text-xl font-bold text-blue-600 mb-3">
                            ₹{listing.price.toLocaleString()}
                            {listing.listing_type === 'rent' && (
                                <span className="text-sm text-gray-500">/month</span>
                            )}
                        </p>
                    )}

                    {/* Footer */}
                    <div className="mt-auto pt-3 border-t border-gray-100">
                        {/* Location & Time */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            {listing.location && (
                                <div className="flex items-center">
                                    <MapPin size={12} className="mr-1" />
                                    {listing.location}
                                </div>
                            )}
                            <div className="flex items-center">
                                <Clock size={12} className="mr-1" />
                                {formatTimeAgo(listing.created_at)}
                            </div>
                        </div>

                        {/* Seller & Views */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                {listing.user.profile_picture ? (
                                    <img
                                        src={listing.user.profile_picture}
                                        alt={listing.user.name}
                                        className="w-6 h-6 rounded-full object-cover mr-2"
                                    />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                        <span className="text-xs text-blue-600 font-semibold">
                                            {listing.user.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <span className="text-xs text-gray-700 font-medium">
                                    {listing.user.name}
                                </span>
                            </div>

                            <div className="flex items-center text-xs text-gray-500">
                                <Eye size={12} className="mr-1" />
                                {listing.views}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};
