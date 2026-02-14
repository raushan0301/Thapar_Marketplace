import axios from 'axios';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api`;

export interface LostFoundItem {
    id: string;
    user_id: string;
    category_id: number;
    title: string;
    description: string;
    location?: string;
    images: string[];
    listing_type: 'lost' | 'found';
    status: string;
    views: number;
    reward?: string;
    incident_date?: string;
    created_at: string;
    updated_at: string;
    poster_name?: string;
    poster_profile_picture?: string;
    poster_trust_score?: number;
    poster_email?: string;
    category_name?: string;
    category_icon?: string;
}

export interface LostFoundFilters {
    category_id?: number;
    listing_type?: 'lost' | 'found';
    location?: string;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    status?: string;
}

export const lostFoundService = {
    // Get all lost/found items
    async getItems(filters?: LostFoundFilters) {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }

        const response = await axios.get(`${API_URL}/lost-found?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data;
    },

    // Get single lost/found item by ID
    async getItemById(itemId: string) {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/lost-found/${itemId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data;
    },

    // Create lost/found item
    async createItem(formData: FormData) {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/lost-found`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },

    // Update lost/found item
    async updateItem(itemId: string, formData: FormData) {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${API_URL}/lost-found/${itemId}`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },

    // Mark item as resolved (found/claimed)
    async markResolved(itemId: string) {
        const token = localStorage.getItem('token');
        const response = await axios.patch(
            `${API_URL}/lost-found/${itemId}/resolve`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    },

    // Reactivate lost/found item
    async reactivateItem(itemId: string) {
        const token = localStorage.getItem('token');
        const response = await axios.patch(
            `${API_URL}/lost-found/${itemId}/reactivate`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    },

    // Get lost/found categories
    async getCategories() {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/lost-found/categories`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data;
    },
};
