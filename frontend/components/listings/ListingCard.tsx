import React from 'react';
import Link from 'next/link';
import { Clock, User } from 'lucide-react';

interface ListingCardProps {
    listing: {
        id: string;
        title: string;
        description: string;
        price?: number;
        rental_rate?: number;
        images: string[];
        condition?: string;
        listing_type: 'sell' | 'rent' | 'lost' | 'found';
        location?: string;
        views: number;
        created_at: string;
        seller_name?: string;
        seller_profile_picture?: string;
    };
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
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

    const displayPrice = listing.price || listing.rental_rate || 0;

    return (
        <Link href={`/listings/${listing.id}`}>
            <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200">
                {/* Image */}
                <div className="relative h-56 bg-gray-100">
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
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Title */}
                    <h3 className="text-base font-medium text-gray-900 line-clamp-2 mb-2">
                        {listing.title}
                    </h3>

                    {/* Price */}
                    <p className="text-lg font-semibold text-gray-900 mb-3">
                        ₹{displayPrice.toLocaleString()}
                    </p>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{formatTimeAgo(listing.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <User size={14} />
                            <span>{listing.seller_name || 'Unknown'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};
