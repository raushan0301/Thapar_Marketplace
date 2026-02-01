import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../types';

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
        const { user_id } = req.params;
        const { is_banned, ban_reason } = req.body;

        // Check if user exists
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user_id)
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

        // Update user
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
                is_banned,
                ban_reason: is_banned ? ban_reason : null,
            })
            .eq('id', user_id)
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
            message: `User ${is_banned ? 'banned' : 'unbanned'} successfully`,
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
                users!user_id (
                    id,
                    name,
                    email,
                    profile_picture
                ),
                categories!category_id (
                    id,
                    name,
                    icon
                )
            `, { count: 'exact' });

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

        // Parse images JSON for each listing
        const parsedListings = listings?.map(listing => ({
            ...listing,
            images: listing.images ? JSON.parse(listing.images) : [],
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
        const { listing_id } = req.params;

        // Check if listing exists
        const { data: listing, error: fetchError } = await supabase
            .from('listings')
            .select('*')
            .eq('id', listing_id)
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
            .eq('id', listing_id);

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

        // Get listings by category
        const { data: listingsByCategory } = await supabase
            .from('listings')
            .select(`
                category_id,
                categories!category_id (
                    name
                )
            `);

        const categoryStats = listingsByCategory?.reduce((acc: any, listing: any) => {
            const categoryName = listing.categories?.name || 'Unknown';
            acc[categoryName] = (acc[categoryName] || 0) + 1;
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            data: {
                users: {
                    total: totalUsers || 0,
                    verified: verifiedUsers || 0,
                    banned: bannedUsers || 0,
                },
                listings: {
                    total: totalListings || 0,
                    active: activeListings || 0,
                    sold: soldListings || 0,
                    rented: rentedListings || 0,
                    by_category: categoryStats || {},
                },
                messages: {
                    total: totalMessages || 0,
                },
                ratings: {
                    total: totalRatings || 0,
                },
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
        const { name, icon } = req.body;

        if (!name) {
            res.status(400).json({
                success: false,
                error: 'Category name is required',
            });
            return;
        }

        // Insert category
        const { data: category, error } = await supabase
            .from('categories')
            .insert({
                name,
                icon: icon || null,
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
        const { category_id } = req.params;
        const { name, icon } = req.body;

        // Check if category exists
        const { data: category, error: fetchError } = await supabase
            .from('categories')
            .select('*')
            .eq('id', category_id)
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
                icon: icon !== undefined ? icon : category.icon,
            })
            .eq('id', category_id)
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
        const { category_id } = req.params;

        // Check if category has listings
        const { count } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category_id);

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
            .eq('id', category_id);

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
