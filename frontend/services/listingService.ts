import api from '../lib/api';

export interface CreateListingData {
    title: string;
    description: string;
    price?: number;
    category_id: number;
    condition?: string;
    listing_type: 'sell' | 'rent' | 'lost' | 'found';
    location?: string;
    rental_duration?: string;
    images?: File[];
    existing_images?: string[];
}

export const listingService = {
    // Get all listings
    getListings: async (params?: {
        category_id?: number;
        listing_type?: string;
        min_price?: number;
        max_price?: number;
        condition?: string;
        search?: string;
        sort?: string;
        order?: string;
        page?: number;
        limit?: number;
    }) => {
        const response = await api.get('/listings', { params });
        return response.data;
    },

    // Get listing by ID
    getListingById: async (id: string) => {
        const response = await api.get(`/listings/${id}`);
        return response.data;
    },

    // Create listing
    createListing: async (data: CreateListingData) => {
        const formData = new FormData();

        formData.append('title', data.title);
        formData.append('description', data.description);
        if (data.price) formData.append('price', data.price.toString());
        formData.append('category_id', data.category_id.toString());
        if (data.condition) formData.append('condition', data.condition);
        formData.append('listing_type', data.listing_type);
        if (data.location) formData.append('location', data.location);
        if (data.rental_duration) formData.append('rental_duration', data.rental_duration);

        // Append images
        if (data.images && data.images.length > 0) {
            data.images.forEach((image) => {
                formData.append('images', image);
            });
        }

        const response = await api.post('/listings', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Update listing
    updateListing: async (id: string, data: Partial<CreateListingData>) => {
        const formData = new FormData();

        if (data.title) formData.append('title', data.title);
        if (data.description) formData.append('description', data.description);
        if (data.price) formData.append('price', data.price.toString());
        if (data.category_id) formData.append('category_id', data.category_id.toString());
        if (data.condition) formData.append('condition', data.condition);
        if (data.listing_type) formData.append('listing_type', data.listing_type);
        if (data.location) formData.append('location', data.location);
        if (data.rental_duration) formData.append('rental_duration', data.rental_duration);

        // Handle existing images
        if (data.existing_images) {
            formData.append('existing_images', JSON.stringify(data.existing_images));
        }

        // Handle new images
        if (data.images && data.images.length > 0) {
            data.images.forEach((image) => {
                formData.append('images', image);
            });
        }

        const response = await api.put(`/listings/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Delete listing
    deleteListing: async (id: string) => {
        const response = await api.delete(`/listings/${id}`);
        return response.data;
    },

    // Mark listing status
    markListingStatus: async (id: string, status: string) => {
        const response = await api.patch(`/listings/${id}/status`, { status });
        return response.data;
    },

    // Get user's own listings
    getMyListings: async (params?: { status?: string; page?: number; limit?: number }) => {
        const response = await api.get('/listings/user/my-listings', { params });
        return response.data;
    },

    // Get categories
    getCategories: async () => {
        const response = await api.get('/listings/categories');
        return response.data;
    },
};
