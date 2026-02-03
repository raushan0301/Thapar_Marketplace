import React from 'react';
import Link from 'next/link';
import { Clock, User, MapPin, Eye } from 'lucide-react';

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

        // If more than 24 hours, show date like "Oct 12, 2025"
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const displayPrice = listing.price || listing.rental_rate || 0;

    return (
        <Link href={`/listings/${listing.id}`}>
            <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 flex flex-col h-full">
                {/* Image */}
                <div className="relative h-48 bg-gray-100 flex-shrink-0">
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

                    {/* View Count Overlay */}
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm">
                        <Eye size={10} />
                        <span>{listing.views}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-3 flex flex-col flex-grow">
                    {/* Title */}
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1.5 h-10">
                        {listing.title}
                    </h3>

                    {/* Price */}
                    <p className="text-base font-bold text-gray-900 mb-2">
                        ₹{displayPrice.toLocaleString()}
                    </p>

                    <div className="mt-auto space-y-2">
                        {/* Location */}
                        <div className="flex items-center text-xs text-gray-500 gap-1 truncate">
                            <MapPin size={12} className="flex-shrink-0" />
                            <span className="truncate">{listing.location || 'Thapar University'}</span>
                        </div>

                        {/* Footer Info: Time & Seller */}
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>{formatTimeAgo(listing.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1 max-w-[50%]">
                                <User size={12} className="flex-shrink-0" />
                                <span className="truncate">{listing.seller_name || 'Student'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};
