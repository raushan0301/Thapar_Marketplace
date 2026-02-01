import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../types';

// Create rating
export const createRating = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const raterId = req.user?.userId;
        const { rated_user_id, listing_id, rating, review } = req.body;

        if (!rated_user_id || !rating) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields',
            });
            return;
        }

        if (rating < 1 || rating > 5) {
            res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5',
            });
            return;
        }

        if (raterId === rated_user_id) {
            res.status(400).json({
                success: false,
                error: 'You cannot rate yourself',
            });
            return;
        }

        // Check if user has already rated this user for this listing
        const { data: existingRating } = await supabase
            .from('ratings')
            .select('*')
            .eq('rater_id', raterId)
            .eq('rated_user_id', rated_user_id)
            .eq('listing_id', listing_id || null)
            .single();

        if (existingRating) {
            res.status(409).json({
                success: false,
                error: 'You have already rated this user for this listing',
            });
            return;
        }

        // Insert rating
        const { data: newRating, error } = await supabase
            .from('ratings')
            .insert({
                rater_id: raterId,
                rated_user_id,
                listing_id: listing_id || null,
                rating,
                review: review || null,
            })
            .select(`
                *,
                rater:users!rater_id (
                    id,
                    name,
                    profile_picture
                ),
                rated_user:users!rated_user_id (
                    id,
                    name,
                    profile_picture
                ),
                listing:listings!listing_id (
                    id,
                    title
                )
            `)
            .single();

        if (error) {
            console.error('Create rating error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create rating',
            });
            return;
        }

        // Update user's trust score
        await updateUserTrustScore(rated_user_id);

        res.status(201).json({
            success: true,
            message: 'Rating created successfully',
            data: { rating: newRating },
        });
    } catch (error) {
        console.error('Create rating error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create rating',
        });
    }
};

// Get ratings for a user
export const getUserRatings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { user_id } = req.params;
        const { page = '1', limit = '20' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        // Get ratings
        const { data: ratings, error, count } = await supabase
            .from('ratings')
            .select(`
                *,
                rater:users!rater_id (
                    id,
                    name,
                    profile_picture
                ),
                listing:listings!listing_id (
                    id,
                    title
                )
            `, { count: 'exact' })
            .eq('rated_user_id', user_id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limitNum - 1);

        if (error) {
            console.error('Get user ratings error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch ratings',
            });
            return;
        }

        // Calculate average rating
        const { data: avgData } = await supabase
            .from('ratings')
            .select('rating')
            .eq('rated_user_id', user_id);

        const average_rating = avgData && avgData.length > 0
            ? avgData.reduce((sum, r) => sum + r.rating, 0) / avgData.length
            : 0;

        res.status(200).json({
            success: true,
            data: {
                ratings: ratings || [],
                average_rating: parseFloat(average_rating.toFixed(2)),
                total_ratings: count || 0,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limitNum),
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

        const { data: ratings, error } = await supabase
            .from('ratings')
            .select(`
                *,
                rated_user:users!rated_user_id (
                    id,
                    name,
                    profile_picture
                ),
                listing:listings!listing_id (
                    id,
                    title
                )
            `)
            .eq('rater_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get ratings given error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch ratings',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { ratings: ratings || [] },
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
        const { rating_id } = req.params;
        const { rating, review } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5',
            });
            return;
        }

        // Check if rating belongs to user
        const { data: existingRating, error: fetchError } = await supabase
            .from('ratings')
            .select('*')
            .eq('id', rating_id)
            .eq('rater_id', userId)
            .single();

        if (fetchError || !existingRating) {
            res.status(404).json({
                success: false,
                error: 'Rating not found or you do not have permission to update it',
            });
            return;
        }

        // Update rating
        const { data: updatedRating, error: updateError } = await supabase
            .from('ratings')
            .update({
                rating,
                review: review || existingRating.review,
                updated_at: new Date().toISOString(),
            })
            .eq('id', rating_id)
            .select(`
                *,
                rater:users!rater_id (
                    id,
                    name,
                    profile_picture
                ),
                rated_user:users!rated_user_id (
                    id,
                    name,
                    profile_picture
                ),
                listing:listings!listing_id (
                    id,
                    title
                )
            `)
            .single();

        if (updateError) {
            console.error('Update rating error:', updateError);
            res.status(500).json({
                success: false,
                error: 'Failed to update rating',
            });
            return;
        }

        // Update user's trust score
        await updateUserTrustScore(existingRating.rated_user_id);

        res.status(200).json({
            success: true,
            message: 'Rating updated successfully',
            data: { rating: updatedRating },
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
        const { rating_id } = req.params;

        // Check if rating belongs to user
        const { data: rating, error: fetchError } = await supabase
            .from('ratings')
            .select('*')
            .eq('id', rating_id)
            .eq('rater_id', userId)
            .single();

        if (fetchError || !rating) {
            res.status(404).json({
                success: false,
                error: 'Rating not found or you do not have permission to delete it',
            });
            return;
        }

        const rated_user_id = rating.rated_user_id;

        // Delete rating
        const { error: deleteError } = await supabase
            .from('ratings')
            .delete()
            .eq('id', rating_id);

        if (deleteError) {
            console.error('Delete rating error:', deleteError);
            res.status(500).json({
                success: false,
                error: 'Failed to delete rating',
            });
            return;
        }

        // Update user's trust score
        await updateUserTrustScore(rated_user_id);

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
async function updateUserTrustScore(userId: string): Promise<void> {
    try {
        // Get all ratings for the user
        const { data: ratings } = await supabase
            .from('ratings')
            .select('rating')
            .eq('rated_user_id', userId);

        if (!ratings || ratings.length === 0) {
            // No ratings, set trust score to default (50)
            await supabase
                .from('users')
                .update({ trust_score: 50 })
                .eq('id', userId);
            return;
        }

        // Calculate average rating
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

        // Convert to trust score (1-5 rating to 0-100 score)
        const trustScore = Math.round((avgRating / 5) * 100);

        // Update user's trust score
        await supabase
            .from('users')
            .update({ trust_score: trustScore })
            .eq('id', userId);
    } catch (error) {
        console.error('Update trust score error:', error);
    }
}
