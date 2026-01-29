import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';
import { uploadMultipleImages, deleteMultipleImages } from '../services/cloudinary.service';

// Create new listing
export const createListing = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const {
            title,
            description,
            price,
            category_id,
            condition,
            listing_type,
            location,
            rental_duration,
        } = req.body;

        // Validate required fields
        if (!title || !description || !category_id || !listing_type) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields',
            });
            return;
        }

        // Upload images if provided
        let imageUrls: string[] = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            try {
                imageUrls = await uploadMultipleImages(req.files, 'thaparmarket/listings');
            } catch (uploadError) {
                console.error('Image upload error:', uploadError);
                res.status(500).json({
                    success: false,
                    error: 'Failed to upload images',
                });
                return;
            }
        }

        // Insert listing
        const result = await pool.query(
            `INSERT INTO listings 
            (user_id, title, description, price, category_id, condition, listing_type, location, rental_duration, images, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [
                userId,
                title,
                description,
                price || null,
                category_id,
                condition || null,
                listing_type,
                location || null,
                rental_duration || null,
                imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
                'active',
            ]
        );

        const listing = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Listing created successfully',
            data: { listing },
        });
    } catch (error) {
        console.error('Create listing error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create listing',
        });
    }
};

// Get all listings with filters
export const getAllListings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            category_id,
            listing_type,
            min_price,
            max_price,
            condition,
            search,
            sort = 'created_at',
            order = 'desc',
            page = '1',
            limit = '20',
        } = req.query;

        let query = `
            SELECT l.*, u.name as seller_name, u.profile_picture as seller_picture, 
                   u.trust_score as seller_trust_score, c.name as category_name
            FROM listings l
            JOIN users u ON l.user_id = u.id
            JOIN categories c ON l.category_id = c.id
            WHERE l.status = 'active'
        `;

        const params: any[] = [];
        let paramCount = 0;

        // Apply filters
        if (category_id) {
            paramCount++;
            query += ` AND l.category_id = $${paramCount}`;
            params.push(category_id);
        }

        if (listing_type) {
            paramCount++;
            query += ` AND l.listing_type = $${paramCount}`;
            params.push(listing_type);
        }

        if (min_price) {
            paramCount++;
            query += ` AND l.price >= $${paramCount}`;
            params.push(min_price);
        }

        if (max_price) {
            paramCount++;
            query += ` AND l.price <= $${paramCount}`;
            params.push(max_price);
        }

        if (condition) {
            paramCount++;
            query += ` AND l.condition = $${paramCount}`;
            params.push(condition);
        }

        if (search) {
            paramCount++;
            query += ` AND (l.title ILIKE $${paramCount} OR l.description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        // Sorting
        const validSortFields = ['created_at', 'price', 'views'];
        const sortField = validSortFields.includes(sort as string) ? sort : 'created_at';
        const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
        query += ` ORDER BY l.${sortField} ${sortOrder}`;

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
        let countQuery = `SELECT COUNT(*) FROM listings l WHERE l.status = 'active'`;
        const countParams: any[] = [];
        let countParamCount = 0;

        if (category_id) {
            countParamCount++;
            countQuery += ` AND l.category_id = $${countParamCount}`;
            countParams.push(category_id);
        }

        if (listing_type) {
            countParamCount++;
            countQuery += ` AND l.listing_type = $${countParamCount}`;
            countParams.push(listing_type);
        }

        if (min_price) {
            countParamCount++;
            countQuery += ` AND l.price >= $${countParamCount}`;
            countParams.push(min_price);
        }

        if (max_price) {
            countParamCount++;
            countQuery += ` AND l.price <= $${countParamCount}`;
            countParams.push(max_price);
        }

        if (condition) {
            countParamCount++;
            countQuery += ` AND l.condition = $${countParamCount}`;
            countParams.push(condition);
        }

        if (search) {
            countParamCount++;
            countQuery += ` AND (l.title ILIKE $${countParamCount} OR l.description ILIKE $${countParamCount})`;
            countParams.push(`%${search}%`);
        }

        const countResult = await pool.query(countQuery, countParams);
        const totalListings = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalListings / limitNum);

        // Transform the flat SQL result into nested structure
        const formattedListings = result.rows.map((row: any) => ({
            id: row.id,
            user_id: row.user_id,
            category_id: row.category_id,
            title: row.title,
            description: row.description,
            price: row.price ? parseFloat(row.price) : null,
            rental_rate: row.rental_rate ? parseFloat(row.rental_rate) : null,
            rental_period: row.rental_period,
            condition: row.condition,
            location: row.location,
            images: row.images || [],
            listing_type: row.listing_type,
            status: row.status,
            views: row.views || 0,
            is_featured: row.is_featured,
            expires_at: row.expires_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
            category_name: row.category_name,
            user: {
                name: row.seller_name,
                profile_picture: row.seller_picture,
                trust_score: row.seller_trust_score
            }
        }));

        res.status(200).json({
            success: true,
            data: {
                listings: formattedListings,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalListings,
                    limit: limitNum,
                },
            },
        });
    } catch (error) {
        console.error('Get listings error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch listings',
        });
    }
};

// Get listing by ID
export const getListingById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { listingId } = req.params;

        const result = await pool.query(
            `SELECT l.*, u.name as seller_name, u.email as seller_email, 
                    u.phone as seller_phone, u.profile_picture as seller_picture,
                    u.trust_score as seller_trust_score, c.name as category_name
             FROM listings l
             JOIN users u ON l.user_id = u.id
             JOIN categories c ON l.category_id = c.id
             WHERE l.id = $1`,
            [listingId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Listing not found',
            });
            return;
        }

        // Increment view count
        await pool.query('UPDATE listings SET views = views + 1 WHERE id = $1', [listingId]);

        const listing = result.rows[0];

        res.status(200).json({
            success: true,
            data: { listing },
        });
    } catch (error) {
        console.error('Get listing error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch listing',
        });
    }
};

// Get user's own listings
export const getMyListings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { status, page = '1', limit = '20' } = req.query;

        let query = `
            SELECT l.*, c.name as category_name
            FROM listings l
            JOIN categories c ON l.category_id = c.id
            WHERE l.user_id = $1
        `;

        const params: any[] = [userId];
        let paramCount = 1;

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
        let countQuery = `SELECT COUNT(*) FROM listings WHERE user_id = $1`;
        const countParams: any[] = [userId];

        if (status) {
            countQuery += ` AND status = $2`;
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
        console.error('Get my listings error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch your listings',
        });
    }
};

// Update listing
export const updateListing = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { listingId } = req.params;
        const { title, description, price, condition, location, rental_duration, status } =
            req.body;

        // Check if listing exists and belongs to user
        const existingListing = await pool.query(
            'SELECT * FROM listings WHERE id = $1 AND user_id = $2',
            [listingId, userId]
        );

        if (existingListing.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Listing not found or you do not have permission to edit it',
            });
            return;
        }

        // Build update query dynamically
        const updates: string[] = [];
        const params: any[] = [];
        let paramCount = 0;

        if (title) {
            paramCount++;
            updates.push(`title = $${paramCount}`);
            params.push(title);
        }

        if (description) {
            paramCount++;
            updates.push(`description = $${paramCount}`);
            params.push(description);
        }

        if (price !== undefined) {
            paramCount++;
            updates.push(`price = $${paramCount}`);
            params.push(price);
        }

        if (condition) {
            paramCount++;
            updates.push(`condition = $${paramCount}`);
            params.push(condition);
        }

        if (location) {
            paramCount++;
            updates.push(`location = $${paramCount}`);
            params.push(location);
        }

        if (rental_duration) {
            paramCount++;
            updates.push(`rental_duration = $${paramCount}`);
            params.push(rental_duration);
        }

        if (status) {
            paramCount++;
            updates.push(`status = $${paramCount}`);
            params.push(status);
        }

        // Handle new images if provided
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            try {
                const newImageUrls = await uploadMultipleImages(
                    req.files,
                    'thaparmarket/listings'
                );

                // Get existing images
                const existingImages = existingListing.rows[0].images
                    ? JSON.parse(existingListing.rows[0].images)
                    : [];

                // Combine existing and new images
                const allImages = [...existingImages, ...newImageUrls];

                paramCount++;
                updates.push(`images = $${paramCount}`);
                params.push(JSON.stringify(allImages));
            } catch (uploadError) {
                console.error('Image upload error:', uploadError);
                res.status(500).json({
                    success: false,
                    error: 'Failed to upload images',
                });
                return;
            }
        }

        if (updates.length === 0) {
            res.status(400).json({
                success: false,
                error: 'No fields to update',
            });
            return;
        }

        paramCount++;
        updates.push(`updated_at = NOW()`);

        paramCount++;
        params.push(listingId);

        paramCount++;
        params.push(userId);

        const query = `
            UPDATE listings 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, params);

        res.status(200).json({
            success: true,
            message: 'Listing updated successfully',
            data: { listing: result.rows[0] },
        });
    } catch (error) {
        console.error('Update listing error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update listing',
        });
    }
};

// Delete listing
export const deleteListing = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { listingId } = req.params;

        // Check if listing exists and belongs to user
        const existingListing = await pool.query(
            'SELECT * FROM listings WHERE id = $1 AND user_id = $2',
            [listingId, userId]
        );

        if (existingListing.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Listing not found or you do not have permission to delete it',
            });
            return;
        }

        // Delete images from Cloudinary
        const images = existingListing.rows[0].images
            ? JSON.parse(existingListing.rows[0].images)
            : [];

        if (images.length > 0) {
            try {
                await deleteMultipleImages(images);
            } catch (deleteError) {
                console.error('Error deleting images:', deleteError);
                // Continue with listing deletion even if image deletion fails
            }
        }

        // Delete listing
        await pool.query('DELETE FROM listings WHERE id = $1', [listingId]);

        res.status(200).json({
            success: true,
            message: 'Listing deleted successfully',
        });
    } catch (error) {
        console.error('Delete listing error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete listing',
        });
    }
};

// Mark listing as sold/rented
export const markListingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { listingId } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['active', 'sold', 'rented', 'expired'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({
                success: false,
                error: 'Invalid status',
            });
            return;
        }

        // Check if listing exists and belongs to user
        const existingListing = await pool.query(
            'SELECT * FROM listings WHERE id = $1 AND user_id = $2',
            [listingId, userId]
        );

        if (existingListing.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Listing not found or you do not have permission to update it',
            });
            return;
        }

        // Update status
        const result = await pool.query(
            'UPDATE listings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, listingId]
        );

        res.status(200).json({
            success: true,
            message: `Listing marked as ${status}`,
            data: { listing: result.rows[0] },
        });
    } catch (error) {
        console.error('Mark listing status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update listing status',
        });
    }
};

// Get categories
export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');

        res.status(200).json({
            success: true,
            data: { categories: result.rows },
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories',
        });
    }
};
