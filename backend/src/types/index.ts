import { Request } from 'express';

// User types
export interface User {
    id: string;
    email: string;
    password_hash: string;
    name: string;
    phone?: string;
    department?: string;
    year?: number;
    hostel?: string;
    profile_picture?: string;
    is_verified: boolean;
    verification_token?: string;
    verification_token_expiry?: Date;
    reset_token?: string;
    reset_token_expiry?: Date;
    trust_score: number;
    is_admin: boolean;
    is_banned: boolean;
    last_login?: Date;
    created_at: Date;
    updated_at: Date;
}

export interface UserRegistration {
    email: string;
    password: string;
    name: string;
    phone?: string;
    department?: string;
    year?: number;
    hostel?: string;
}

export interface UserLogin {
    email: string;
    password: string;
}

// Listing types
export interface Listing {
    id: string;
    user_id: string;
    category_id: number;
    title: string;
    description: string;
    price?: number;
    rental_rate?: number;
    rental_period?: 'hourly' | 'daily' | 'weekly' | 'monthly';
    condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
    location?: string;
    images: string[];
    listing_type: 'sell' | 'rent' | 'lost' | 'found';
    status: 'active' | 'sold' | 'rented' | 'expired' | 'deleted' | 'pending';
    views: number;
    is_featured: boolean;
    expires_at?: Date;
    created_at: Date;
    updated_at: Date;
}

export interface CreateListing {
    category_id: number;
    title: string;
    description: string;
    price?: number;
    rental_rate?: number;
    rental_period?: string;
    condition?: string;
    location?: string;
    listing_type: 'sell' | 'rent' | 'lost' | 'found';
}

// Category types
export interface Category {
    id: number;
    name: string;
    type: 'buy_sell' | 'rental' | 'lost_found';
    icon?: string;
    description?: string;
    is_active: boolean;
    created_at: Date;
}

// Message types
export interface Message {
    id: string;
    listing_id: string;
    sender_id: string;
    receiver_id: string;
    message: string;
    image_url?: string;
    is_read: boolean;
    created_at: Date;
}

// Rating types
export interface Rating {
    id: string;
    rated_user_id: string;
    rater_id: string;
    listing_id?: string;
    rating: number;
    review?: string;
    created_at: Date;
}

// Report types
export interface Report {
    id: string;
    reporter_id: string;
    reported_user_id?: string;
    reported_listing_id?: string;
    reason: string;
    description?: string;
    status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
    admin_notes?: string;
    resolved_by?: string;
    created_at: Date;
    resolved_at?: Date;
}

// Notification types
export interface Notification {
    id: string;
    user_id: string;
    type: 'message' | 'listing' | 'rating' | 'admin' | 'system';
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: Date;
}

// JWT Payload
export interface JWTPayload {
    userId: string;
    email: string;
    isAdmin: boolean;
}

// Extended Request with user
export interface AuthRequest extends Request {
    user?: JWTPayload;
}

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

// Pagination
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Search and Filter
export interface ListingFilters {
    category_id?: number;
    listing_type?: string;
    min_price?: number;
    max_price?: number;
    condition?: string;
    location?: string;
    search?: string;
}
