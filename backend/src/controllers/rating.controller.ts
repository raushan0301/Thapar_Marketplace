import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';

// Create rating
export const createRating = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const raterId = req.user?.userId;
        const { rated_user_id, listing_id, rating, review } = req.body;

        // Validate required fields
        if (!rated_user_id || !rating) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields',
            });
            return;
        }

        // Validate rating value
        if (rating < 1 || rating > 5) {
            res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5',
            });
            return;
        }

        // Check if user is trying to rate themselves
        if (raterId === rated_user_id) {
            res.status(400).json({
                success: false,
                error: 'You cannot rate yourself',
            });
            return;
        }

        // Check if rated user exists
        const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [
            rated_user_id,
        ]);

        if (userExists.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        // Check if user has already rated this user for this listing
        if (listing_id) {
            const existingRating = await pool.query(
                'SELECT id FROM ratings WHERE rater_id = $1 AND rated_user_id = $2 AND listing_id = $3',
                [raterId, rated_user_id, listing_id]
            );

            if (existingRating.rows.length > 0) {
                res.status(409).json({
                    success: false,
                    error: 'You have already rated this user for this listing',
                });
                return;
            }
        }

        // Insert rating
        const result = await pool.query(
            `INSERT INTO ratings (rater_id, rated_user_id, listing_id, rating, review)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [raterId, rated_user_id, listing_id || null, rating, review || null]
        );

        const newRating = result.rows[0];

        // Update user's trust score
        await updateUserTrustScore(rated_user_id);

        res.status(201).json({
            success: true,
            message: 'Rating submitted successfully',
            data: { rating: newRating },
        });
    } catch (error) {
        console.error('Create rating error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit rating',
        });
    }
};

// Get ratings for a user
export const getUserRatings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const { page = '1', limit = '20' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        // Get ratings
        const result = await pool.query(
            `SELECT r.*, 
                    u.name as rater_name, u.profile_picture as rater_picture,
                    l.title as listing_title
             FROM ratings r
             LEFT JOIN users u ON r.rater_id = u.id
             LEFT JOIN listings l ON r.listing_id = l.id
             WHERE r.rated_user_id = $1
             ORDER BY r.created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limitNum, offset]
        );

        // Get rating statistics
        const statsResult = await pool.query(
            `SELECT 
                COUNT(*) as total_ratings,
                AVG(rating) as average_rating,
                COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
             FROM ratings
             WHERE rated_user_id = $1`,
            [userId]
        );

        const stats = statsResult.rows[0];

        // Get total count for pagination
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM ratings WHERE rated_user_id = $1',
            [userId]
        );

        const totalRatings = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalRatings / limitNum);

        res.status(200).json({
            success: true,
            data: {
                ratings: result.rows,
                statistics: {
                    total_ratings: parseInt(stats.total_ratings),
                    average_rating: parseFloat(stats.average_rating || 0).toFixed(2),
                    five_star: parseInt(stats.five_star),
                    four_star: parseInt(stats.four_star),
                    three_star: parseInt(stats.three_star),
                    two_star: parseInt(stats.two_star),
                    one_star: parseInt(stats.one_star),
                },
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalRatings,
                    limit: limitNum,
                },
            },
        });
    } catch (error) {
        console.error('Get user ratings error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch ratings',
        });
    }
};

// Get ratings given by a user
export const getRatingsGivenByUser = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { page = '1', limit = '20' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        const result = await pool.query(
            `SELECT r.*, 
                    u.name as rated_user_name, u.profile_picture as rated_user_picture,
                    l.title as listing_title
             FROM ratings r
             LEFT JOIN users u ON r.rated_user_id = u.id
             LEFT JOIN listings l ON r.listing_id = l.id
             WHERE r.rater_id = $1
             ORDER BY r.created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limitNum, offset]
        );

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM ratings WHERE rater_id = $1',
            [userId]
        );

        const totalRatings = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalRatings / limitNum);

        res.status(200).json({
            success: true,
            data: {
                ratings: result.rows,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalRatings,
                    limit: limitNum,
                },
            },
        });
    } catch (error) {
        console.error('Get ratings given error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch ratings',
        });
    }
};

// Update rating
export const updateRating = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { ratingId } = req.params;
        const { rating, review } = req.body;

        // Validate rating value
        if (rating && (rating < 1 || rating > 5)) {
            res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5',
            });
            return;
        }

        // Check if rating exists and user is the rater
        const existingRating = await pool.query(
            'SELECT * FROM ratings WHERE id = $1 AND rater_id = $2',
            [ratingId, userId]
        );

        if (existingRating.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Rating not found or you do not have permission to edit it',
            });
            return;
        }

        // Build update query
        const updates: string[] = [];
        const params: any[] = [];
        let paramCount = 0;

        if (rating) {
            paramCount++;
            updates.push(`rating = $${paramCount}`);
            params.push(rating);
        }

        if (review !== undefined) {
            paramCount++;
            updates.push(`review = $${paramCount}`);
            params.push(review);
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
        params.push(ratingId);

        const query = `
            UPDATE ratings 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, params);

        // Update user's trust score
        await updateUserTrustScore(existingRating.rows[0].rated_user_id);

        res.status(200).json({
            success: true,
            message: 'Rating updated successfully',
            data: { rating: result.rows[0] },
        });
    } catch (error) {
        console.error('Update rating error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update rating',
        });
    }
};

// Delete rating
export const deleteRating = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { ratingId } = req.params;

        // Check if rating exists and user is the rater
        const existingRating = await pool.query(
            'SELECT * FROM ratings WHERE id = $1 AND rater_id = $2',
            [ratingId, userId]
        );

        if (existingRating.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Rating not found or you do not have permission to delete it',
            });
            return;
        }

        const ratedUserId = existingRating.rows[0].rated_user_id;

        // Delete rating
        await pool.query('DELETE FROM ratings WHERE id = $1', [ratingId]);

        // Update user's trust score
        await updateUserTrustScore(ratedUserId);

        res.status(200).json({
            success: true,
            message: 'Rating deleted successfully',
        });
    } catch (error) {
        console.error('Delete rating error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete rating',
        });
    }
};

// Helper function to update user's trust score
const updateUserTrustScore = async (userId: string): Promise<void> => {
    try {
        const result = await pool.query(
            'SELECT AVG(rating) as avg_rating FROM ratings WHERE rated_user_id = $1',
            [userId]
        );

        const avgRating = result.rows[0].avg_rating || 0;

        await pool.query('UPDATE users SET trust_score = $1 WHERE id = $2', [avgRating, userId]);

        console.log(`✅ Updated trust score for user ${userId}: ${avgRating}`);
    } catch (error) {
        console.error('Error updating trust score:', error);
    }
};
