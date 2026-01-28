import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';

// Get all users (admin only)
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { search, is_banned, page = '1', limit = '20' } = req.query;

        let query = `
            SELECT id, email, name, phone, department, year, hostel, 
                   profile_picture, trust_score, is_admin, is_banned, 
                   created_at, last_login
            FROM users
            WHERE 1=1
        `;

        const params: any[] = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        if (is_banned !== undefined) {
            paramCount++;
            query += ` AND is_banned = $${paramCount}`;
            params.push(is_banned === 'true');
        }

        query += ` ORDER BY created_at DESC`;

        // Pagination
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limitNum);

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
        const countParams: any[] = [];
        let countParamCount = 0;

        if (search) {
            countParamCount++;
            countQuery += ` AND (name ILIKE $${countParamCount} OR email ILIKE $${countParamCount})`;
            countParams.push(`%${search}%`);
        }

        if (is_banned !== undefined) {
            countParamCount++;
            countQuery += ` AND is_banned = $${countParamCount}`;
            countParams.push(is_banned === 'true');
        }

        const countResult = await pool.query(countQuery, countParams);
        const totalUsers = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalUsers / limitNum);

        res.status(200).json({
            success: true,
            data: {
                users: result.rows,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalUsers,
                    limit: limitNum,
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
        const { is_banned, reason } = req.body;

        // Check if user exists
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

        if (user.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        // Prevent banning admins
        if (user.rows[0].is_admin) {
            res.status(403).json({
                success: false,
                error: 'Cannot ban admin users',
            });
            return;
        }

        // Update ban status
        await pool.query('UPDATE users SET is_banned = $1 WHERE id = $2', [is_banned, userId]);

        // Log the action
        await pool.query(
            `INSERT INTO admin_logs (admin_id, action, target_user_id, reason)
             VALUES ($1, $2, $3, $4)`,
            [
                req.user?.userId,
                is_banned ? 'ban_user' : 'unban_user',
                userId,
                reason || null,
            ]
        );

        res.status(200).json({
            success: true,
            message: is_banned ? 'User banned successfully' : 'User unbanned successfully',
        });
    } catch (error) {
        console.error('Toggle user ban error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user ban status',
        });
    }
};

// Get all listings (admin - including inactive)
export const getAllListingsAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, page = '1', limit = '20' } = req.query;

        let query = `
            SELECT l.*, u.name as seller_name, u.email as seller_email,
                   c.name as category_name
            FROM listings l
            JOIN users u ON l.user_id = u.id
            JOIN categories c ON l.category_id = c.id
            WHERE 1=1
        `;

        const params: any[] = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            query += ` AND l.status = $${paramCount}`;
            params.push(status);
        }

        query += ` ORDER BY l.created_at DESC`;

        // Pagination
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limitNum);

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM listings WHERE 1=1';
        const countParams: any[] = [];

        if (status) {
            countQuery += ` AND status = $1`;
            countParams.push(status);
        }

        const countResult = await pool.query(countQuery, countParams);
        const totalListings = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalListings / limitNum);

        res.status(200).json({
            success: true,
            data: {
                listings: result.rows,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalListings,
                    limit: limitNum,
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
        const { reason } = req.body;

        // Check if listing exists
        const listing = await pool.query('SELECT * FROM listings WHERE id = $1', [listingId]);

        if (listing.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Listing not found',
            });
            return;
        }

        // Delete listing
        await pool.query('DELETE FROM listings WHERE id = $1', [listingId]);

        // Log the action
        await pool.query(
            `INSERT INTO admin_logs (admin_id, action, target_listing_id, reason)
             VALUES ($1, $2, $3, $4)`,
            [req.user?.userId, 'delete_listing', listingId, reason || null]
        );

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
        // Total users
        const usersResult = await pool.query('SELECT COUNT(*) as total FROM users');
        const totalUsers = parseInt(usersResult.rows[0].total);

        // Active users (logged in within last 30 days)
        const activeUsersResult = await pool.query(
            "SELECT COUNT(*) as total FROM users WHERE last_login > NOW() - INTERVAL '30 days'"
        );
        const activeUsers = parseInt(activeUsersResult.rows[0].total);

        // Total listings
        const listingsResult = await pool.query('SELECT COUNT(*) as total FROM listings');
        const totalListings = parseInt(listingsResult.rows[0].total);

        // Active listings
        const activeListingsResult = await pool.query(
            "SELECT COUNT(*) as total FROM listings WHERE status = 'active'"
        );
        const activeListings = parseInt(activeListingsResult.rows[0].total);

        // Sold/Rented listings
        const soldListingsResult = await pool.query(
            "SELECT COUNT(*) as total FROM listings WHERE status IN ('sold', 'rented')"
        );
        const soldListings = parseInt(soldListingsResult.rows[0].total);

        // Total messages
        const messagesResult = await pool.query('SELECT COUNT(*) as total FROM messages');
        const totalMessages = parseInt(messagesResult.rows[0].total);

        // Total ratings
        const ratingsResult = await pool.query('SELECT COUNT(*) as total FROM ratings');
        const totalRatings = parseInt(ratingsResult.rows[0].total);

        // Average rating
        const avgRatingResult = await pool.query('SELECT AVG(rating) as avg FROM ratings');
        const avgRating = parseFloat(avgRatingResult.rows[0].avg || 0);

        // Listings by category
        const categoryStatsResult = await pool.query(`
            SELECT c.name, COUNT(l.id) as count
            FROM categories c
            LEFT JOIN listings l ON c.id = l.category_id
            GROUP BY c.id, c.name
            ORDER BY count DESC
        `);

        // Recent signups (last 7 days)
        const recentSignupsResult = await pool.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM users
            WHERE created_at > NOW() - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        // Recent listings (last 7 days)
        const recentListingsResult = await pool.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM listings
            WHERE created_at > NOW() - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    activeUsers,
                    totalListings,
                    activeListings,
                    soldListings,
                    totalMessages,
                    totalRatings,
                    avgRating: avgRating.toFixed(2),
                },
                categoryStats: categoryStatsResult.rows,
                recentSignups: recentSignupsResult.rows,
                recentListings: recentListingsResult.rows,
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

        const result = await pool.query(
            `SELECT al.*, u.name as admin_name, u.email as admin_email
             FROM admin_logs al
             JOIN users u ON al.admin_id = u.id
             ORDER BY al.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limitNum, offset]
        );

        const countResult = await pool.query('SELECT COUNT(*) FROM admin_logs');
        const totalLogs = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalLogs / limitNum);

        res.status(200).json({
            success: true,
            data: {
                logs: result.rows,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalLogs,
                    limit: limitNum,
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
        const { name, icon, listing_type } = req.body;

        if (!name || !listing_type) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields',
            });
            return;
        }

        const result = await pool.query(
            `INSERT INTO categories (name, icon, listing_type)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name, icon || null, listing_type]
        );

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: { category: result.rows[0] },
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
        const { name, icon } = req.body;

        const updates: string[] = [];
        const params: any[] = [];
        let paramCount = 0;

        if (name) {
            paramCount++;
            updates.push(`name = $${paramCount}`);
            params.push(name);
        }

        if (icon !== undefined) {
            paramCount++;
            updates.push(`icon = $${paramCount}`);
            params.push(icon);
        }

        if (updates.length === 0) {
            res.status(400).json({
                success: false,
                error: 'No fields to update',
            });
            return;
        }

        paramCount++;
        params.push(categoryId);

        const query = `
            UPDATE categories 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Category not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: { category: result.rows[0] },
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
        const listingsCount = await pool.query(
            'SELECT COUNT(*) FROM listings WHERE category_id = $1',
            [categoryId]
        );

        if (parseInt(listingsCount.rows[0].count) > 0) {
            res.status(400).json({
                success: false,
                error: 'Cannot delete category with existing listings',
            });
            return;
        }

        await pool.query('DELETE FROM categories WHERE id = $1', [categoryId]);

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
