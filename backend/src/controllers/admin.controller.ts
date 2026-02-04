import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../types';

// Helper function to parse images field
function parseImages(images: any): string[] {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    if (typeof images === 'string') {
        try {
            return JSON.parse(images);
        } catch (e) {
            // If it's a plain string (URL), wrap it in an array
            return [images];
        }
    }
    return [];
}


// Get all users (admin only)
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            search,
            is_verified,
            is_banned,
            sort_by = 'created_at',
            sort_order = 'desc',
            page = '1',
            limit = '20',
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        // Build query
        let query = supabase
            .from('users')
            .select('id, email, name, phone, department, year, hostel, profile_picture, trust_score, is_admin, is_verified, is_banned, created_at, last_login', { count: 'exact' });

        // Apply filters
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        if (is_verified !== undefined) {
            query = query.eq('is_verified', is_verified === 'true');
        }

        if (is_banned !== undefined) {
            query = query.eq('is_banned', is_banned === 'true');
        }

        // Apply sorting
        const ascending = sort_order === 'asc';
        query = query.order(sort_by as string, { ascending });

        // Apply pagination
        query = query.range(offset, offset + limitNum - 1);

        const { data: users, error, count } = await query;

        if (error) {
            console.error('Get all users error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch users',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                users: users || [],
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limitNum),
                },
            },
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users',
        });
    }
};

// Ban/Unban user
export const toggleUserBan = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        // Check if user exists
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        if (user.is_admin) {
            res.status(403).json({
                success: false,
                error: 'Cannot ban an admin user',
            });
            return;
        }

        // Toggle ban status
        const newBanStatus = !user.is_banned;

        // Update user
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
                is_banned: newBanStatus,
            })
            .eq('id', userId)
            .select()
            .single();

        if (updateError) {
            console.error('Toggle ban error:', updateError);
            res.status(500).json({
                success: false,
                error: 'Failed to update user status',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: `User ${newBanStatus ? 'banned' : 'unbanned'} successfully`,
            data: { user: updatedUser },
        });
    } catch (error) {
        console.error('Toggle user ban error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user status',
        });
    }
};

// Get all listings (admin - including inactive)
export const getAllListingsAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            search,
            status,
            page = '1',
            limit = '20',
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        // Build query
        let query = supabase
            .from('listings')
            .select(`
                *,
                users:user_id (
                    id,
                    name,
                    email,
                    profile_picture
                ),
                categories:category_id (
                    id,
                    name,
                    icon
                )
            `, { count: 'exact' });

        // Apply search filter
        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }

        // Apply sorting and pagination
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limitNum - 1);

        const { data: listings, error, count } = await query;

        if (error) {
            console.error('Get all listings admin error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch listings',
            });
            return;
        }

        // Flatten user/category data for each listing
        const parsedListings = listings?.map(listing => ({
            ...listing,
            images: parseImages(listing.images),
            user_name: listing.users?.name || 'Unknown',
            user_email: listing.users?.email || '',
            category_name: listing.categories?.name || 'Unknown',
        })) || [];

        res.status(200).json({
            success: true,
            data: {
                listings: parsedListings,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limitNum),
                },
            },
        });
    } catch (error) {
        console.error('Get all listings admin error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch listings',
        });
    }
};

// Delete listing (admin)
export const deleteListingAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { listingId } = req.params;

        // Check if listing exists
        const { data: listing, error: fetchError } = await supabase
            .from('listings')
            .select('*')
            .eq('id', listingId)
            .single();

        if (fetchError || !listing) {
            res.status(404).json({
                success: false,
                error: 'Listing not found',
            });
            return;
        }

        // Delete listing
        const { error: deleteError } = await supabase
            .from('listings')
            .delete()
            .eq('id', listingId);

        if (deleteError) {
            console.error('Delete listing admin error:', deleteError);
            res.status(500).json({
                success: false,
                error: 'Failed to delete listing',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Listing deleted successfully',
        });
    } catch (error) {
        console.error('Delete listing admin error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete listing',
        });
    }
};

// Get analytics
export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Get total users
        const { count: totalUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        // Get verified users
        const { count: verifiedUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('is_verified', true);

        // Get banned users
        const { count: bannedUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('is_banned', true);

        // Get total listings
        const { count: totalListings } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true });

        // Get active listings
        const { count: activeListings } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        // Get sold listings
        const { count: soldListings } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'sold');

        // Get rented listings
        const { count: rentedListings } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'rented');

        // Get total messages
        const { count: totalMessages } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true });

        // Get total ratings
        const { count: totalRatings } = await supabase
            .from('ratings')
            .select('*', { count: 'exact', head: true });

        // Get average rating
        const { data: ratingsData } = await supabase
            .from('ratings')
            .select('rating');

        const averageRating = ratingsData && ratingsData.length > 0
            ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
            : 0;

        // Get recent users (last 10)
        const { data: recentUsers } = await supabase
            .from('users')
            .select('id, name, email, profile_picture, is_banned, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        // Get recent listings (last 10)
        const { data: recentListings } = await supabase
            .from('listings')
            .select(`
                id,
                title,
                price,
                rental_rate,
                rental_period,
                images,
                status,
                created_at,
                categories:category_id (
                    name
                )
            `)
            .order('created_at', { ascending: false })
            .limit(10);

        // Format recent listings
        const parsedRecentListings = recentListings?.map(listing => ({
            ...listing,
            images: parseImages(listing.images),
        })) || [];

        res.status(200).json({
            success: true,
            data: {
                totalUsers: totalUsers || 0,
                verifiedUsers: verifiedUsers || 0,
                bannedUsers: bannedUsers || 0,
                totalListings: totalListings || 0,
                activeListings: activeListings || 0,
                soldListings: soldListings || 0,
                rentedListings: rentedListings || 0,
                totalMessages: totalMessages || 0,
                totalRatings: totalRatings || 0,
                averageRating: averageRating.toFixed(2),
                recentUsers: recentUsers || [],
                recentListings: parsedRecentListings,
            },
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics',
        });
    }
};

// Get admin logs
export const getAdminLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { page = '1', limit = '50' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        const { data: logs, error, count } = await supabase
            .from('admin_logs')
            .select(`
                *,
                admin:users!admin_id (
                    id,
                    name,
                    email
                )
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limitNum - 1);

        if (error) {
            console.error('Get admin logs error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch admin logs',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                logs: logs || [],
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limitNum),
                },
            },
        });
    } catch (error) {
        console.error('Get admin logs error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch admin logs',
        });
    }
};

// Create category
export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, type, icon, description } = req.body;

        if (!name || !type) {
            res.status(400).json({
                success: false,
                error: 'Category name and type are required',
            });
            return;
        }

        // Insert category
        const { data: category, error } = await supabase
            .from('categories')
            .insert({
                name,
                type,
                icon: icon || null,
                description: description || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Create category error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create category',
            });
            return;
        }

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: { category },
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create category',
        });
    }
};

// Update category
export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { categoryId } = req.params;
        const { name, type, icon, description } = req.body;

        // Check if category exists
        const { data: category, error: fetchError } = await supabase
            .from('categories')
            .select('*')
            .eq('id', categoryId)
            .single();

        if (fetchError || !category) {
            res.status(404).json({
                success: false,
                error: 'Category not found',
            });
            return;
        }

        // Update category
        const { data: updatedCategory, error: updateError } = await supabase
            .from('categories')
            .update({
                name: name || category.name,
                type: type || category.type,
                icon: icon !== undefined ? icon : category.icon,
                description: description !== undefined ? description : category.description,
            })
            .eq('id', categoryId)
            .select()
            .single();

        if (updateError) {
            console.error('Update category error:', updateError);
            res.status(500).json({
                success: false,
                error: 'Failed to update category',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: { category: updatedCategory },
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update category',
        });
    }
};

// Delete category
export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { categoryId } = req.params;

        // Check if category has listings
        const { count } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', categoryId);

        if (count && count > 0) {
            res.status(400).json({
                success: false,
                error: 'Cannot delete category with existing listings',
            });
            return;
        }

        // Delete category
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', categoryId);

        if (error) {
            console.error('Delete category error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete category',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully',
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete category',
        });
    }
};

// Get all messages (admin)
export const getAllMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            search,
            type,
            page = '1',
            limit = '50',
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        // Build query
        let query = supabase
            .from('messages')
            .select(`
                *,
                sender:users!sender_id (
                    id,
                    name,
                    email,
                    profile_picture
                ),
                receiver:users!receiver_id (
                    id,
                    name,
                    email,
                    profile_picture
                ),
                listing:listings!listing_id (
                    id,
                    title
                )
            `, { count: 'exact' });

        // Apply search filter
        if (search) {
            query = query.or(`message.ilike.%${search}%`);
        }

        // Apply type filter
        if (type === 'with_image') {
            query = query.not('image_url', 'is', null);
        } else if (type === 'unread') {
            query = query.eq('is_read', false);
        }

        // Apply sorting and pagination
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limitNum - 1);

        const { data: messages, error, count } = await query;

        if (error) {
            console.error('Get all messages admin error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch messages',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                messages: messages || [],
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limitNum),
                },
            },
        });
    } catch (error) {
        console.error('Get all messages admin error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch messages',
        });
    }
};

// Delete message (admin)
export const deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { messageId } = req.params;

        // Check if message exists
        const { data: message, error: fetchError } = await supabase
            .from('messages')
            .select('*')
            .eq('id', messageId)
            .single();

        if (fetchError || !message) {
            res.status(404).json({
                success: false,
                error: 'Message not found',
            });
            return;
        }

        // Delete message
        const { error: deleteError } = await supabase
            .from('messages')
            .delete()
            .eq('id', messageId);

        if (deleteError) {
            console.error('Delete message admin error:', deleteError);
            res.status(500).json({
                success: false,
                error: 'Failed to delete message',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Message deleted successfully',
        });
    } catch (error) {
        console.error('Delete message admin error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete message',
        });
    }
};

// Bulk delete messages (admin)
export const bulkDeleteMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId, type } = req.body;

        if (!userId || !type) {
            res.status(400).json({
                success: false,
                error: 'User ID and type are required',
            });
            return;
        }

        if (!['sender', 'receiver'].includes(type)) {
            res.status(400).json({
                success: false,
                error: 'Invalid type. Must be "sender" or "receiver"',
            });
            return;
        }

        // Delete messages
        const column = type === 'sender' ? 'sender_id' : 'receiver_id';
        const { error, count } = await supabase
            .from('messages')
            .delete({ count: 'exact' })
            .eq(column, userId);

        if (error) {
            console.error('Bulk delete messages error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete messages',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: `Successfully deleted ${count || 0} messages`,
            data: { deletedCount: count || 0 },
        });
    } catch (error) {
        console.error('Bulk delete messages error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete messages',
        });
    }
};
