import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../types';
import { uploadMultipleImages, deleteMultipleImages } from '../services/cloudinary.service';

// Helper function to parse images field
function parseImages(images: any): string[] {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    if (typeof images === 'string') {
        try {
            return JSON.parse(images);
        } catch (e) {
            return [images];
        }
    }
    return [];
}

// Create Lost or Found item
export const createLostFoundItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const {
            title,
            description,
            category_id,
            listing_type,
            location,
            reward,
            incident_date,
        } = req.body;

        // Validate required fields
        if (!title || !description || !category_id || !listing_type) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields',
            });
            return;
        }

        // Validate listing_type is lost or found
        if (!['lost', 'found'].includes(listing_type)) {
            res.status(400).json({
                success: false,
                error: 'Invalid listing type. Must be "lost" or "found"',
            });
            return;
        }

        // Upload images if provided
        let imageUrls: string[] = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            try {
                console.log(`📸 Uploading ${req.files.length} images...`);
                imageUrls = await uploadMultipleImages(req.files, 'thaparmarket/lostfound');
                console.log(`✅ Images uploaded successfully: ${imageUrls.length} images`);
            } catch (uploadError) {
                console.error('Image upload error:', uploadError);
                res.status(500).json({
                    success: false,
                    error: 'Failed to upload images',
                });
                return;
            }
        }

        console.log('💾 Inserting lost/found item into database...');

        // Insert listing
        const { data: listing, error } = await supabase
            .from('listings')
            .insert({
                user_id: userId,
                title,
                description,
                category_id,
                listing_type,
                location: location || null,
                reward: reward || null,
                incident_date: incident_date || null,
                images: imageUrls.length > 0 ? imageUrls : null,
                status: 'active',
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create lost/found item',
            });
            return;
        }

        console.log('✅ Lost/Found item created successfully!');

        res.status(201).json({
            success: true,
            message: `${listing_type === 'lost' ? 'Lost' : 'Found'} item posted successfully`,
            data: { listing },
        });
    } catch (error) {
        console.error('Create lost/found item error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create lost/found item',
        });
    }
};

// Get all Lost & Found items with filters
export const getLostFoundItems = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            category_id,
            listing_type, // 'lost' or 'found'
            location,
            search,
            sort_by = 'incident_date',
            sort_order = 'desc',
            page = '1',
            limit = '20',
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        // Build query - only get lost and found items
        let query = supabase
            .from('listings')
            .select(`
                *,
                users:user_id (
                    id,
                    name,
                    profile_picture,
                    trust_score,
                    phone
                ),
                categories:category_id (
                    id,
                    name,
                    icon
                )
            `, { count: 'exact' })
            .in('listing_type', ['lost', 'found'])
            .eq('status', 'active');

        // Apply filters
        if (category_id) {
            query = query.eq('category_id', category_id);
        }

        if (listing_type && ['lost', 'found'].includes(listing_type as string)) {
            query = query.eq('listing_type', listing_type);
        }

        if (location) {
            query = query.ilike('location', `%${location}%`);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Apply sorting
        const ascending = sort_order === 'asc';

        if (sort_by === 'incident_date') {
            query = query
                .order('incident_date', { ascending, nullsFirst: false })
                .order('created_at', { ascending: false });
        } else {
            query = query.order(sort_by as string, { ascending });
        }

        // Apply pagination
        query = query.range(offset, offset + limitNum - 1);

        const { data: listings, error, count } = await query;

        if (error) {
            console.error('Get lost/found items error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch lost/found items',
            });
            return;
        }

        // Parse images and flatten user info for each listing
        const parsedListings = listings?.map(listing => ({
            ...listing,
            images: parseImages(listing.images),
            poster_name: listing.users?.name,
            poster_profile_picture: listing.users?.profile_picture,
            poster_trust_score: listing.users?.trust_score,
            poster_phone: listing.users?.phone,
            category_name: listing.categories?.name,
            category_icon: listing.categories?.icon,
        })) || [];

        res.status(200).json({
            success: true,
            data: {
                items: parsedListings,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limitNum),
                },
            },
        });
    } catch (error) {
        console.error('Get lost/found items error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch lost/found items',
        });
    }
};

// Get Lost & Found item by ID
export const getLostFoundItemById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { itemId } = req.params;

        const { data: listing, error } = await supabase
            .from('listings')
            .select(`
                *,
                users:user_id (
                    id,
                    name,
                    email,
                    phone,
                    profile_picture,
                    trust_score,
                    created_at
                ),
                categories:category_id (
                    id,
                    name,
                    icon
                )
            `)
            .eq('id', itemId)
            .in('listing_type', ['lost', 'found'])
            .single();

        // Increment views
        if (listing) {
            const newViews = (listing.views || 0) + 1;
            supabase.from('listings')
                .update({ views: newViews })
                .eq('id', itemId)
                .then(({ error }) => {
                    if (error) console.error('Failed to increment views:', error);
                });
        }

        if (error || !listing) {
            console.error('Supabase error:', error);
            res.status(404).json({
                success: false,
                error: 'Lost/Found item not found',
            });
            return;
        }

        // Parse images and flatten user info
        const parsedListing = {
            ...listing,
            images: parseImages(listing.images),
            poster_name: listing.users?.name,
            poster_email: listing.users?.email,
            poster_phone: listing.users?.phone,
            poster_profile_picture: listing.users?.profile_picture,
            poster_trust_score: listing.users?.trust_score,
            category_name: listing.categories?.name,
            category_icon: listing.categories?.icon,
        };

        res.status(200).json({
            success: true,
            data: { item: parsedListing },
        });
    } catch (error) {
        console.error('Get lost/found item error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch lost/found item',
        });
    }
};

// Update Lost/Found item
export const updateLostFoundItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { itemId } = req.params;
        const {
            title,
            description,
            category_id,
            location,
            reward,
            incident_date,
            existing_images,
        } = req.body;

        // Check if item exists and belongs to user
        const { data: existingListing, error: fetchError } = await supabase
            .from('listings')
            .select('*')
            .eq('id', itemId)
            .eq('user_id', userId)
            .in('listing_type', ['lost', 'found'])
            .single();

        if (fetchError || !existingListing) {
            res.status(404).json({
                success: false,
                error: 'Lost/Found item not found or you do not have permission to edit it',
            });
            return;
        }

        // Handle images
        let imageUrls: string[] = [];

        if (existing_images) {
            imageUrls = Array.isArray(existing_images) ? existing_images : JSON.parse(existing_images);
        }

        // Upload new images if provided
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            try {
                const newImageUrls = await uploadMultipleImages(req.files, 'thaparmarket/lostfound');
                imageUrls = [...imageUrls, ...newImageUrls];
            } catch (uploadError) {
                console.error('Image upload error:', uploadError);
                res.status(500).json({
                    success: false,
                    error: 'Failed to upload images',
                });
                return;
            }
        }

        // Delete removed images from Cloudinary
        const oldImages = existingListing.images ? parseImages(existingListing.images) : [];
        const removedImages = oldImages.filter((img: string) => !imageUrls.includes(img));
        if (removedImages.length > 0) {
            try {
                await deleteMultipleImages(removedImages);
            } catch (deleteError) {
                console.error('Image deletion error:', deleteError);
            }
        }

        // Update item
        const { data: updatedListing, error: updateError } = await supabase
            .from('listings')
            .update({
                title: title || existingListing.title,
                description: description || existingListing.description,
                category_id: category_id || existingListing.category_id,
                location: location !== undefined ? location : existingListing.location,
                reward: reward !== undefined ? reward : existingListing.reward,
                incident_date: incident_date !== undefined ? incident_date : existingListing.incident_date,
                images: imageUrls.length > 0 ? imageUrls : null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', itemId)
            .select()
            .single();

        if (updateError) {
            console.error('Update error:', updateError);
            res.status(500).json({
                success: false,
                error: 'Failed to update lost/found item',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Lost/Found item updated successfully',
            data: { item: updatedListing },
        });
    } catch (error) {
        console.error('Update lost/found item error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update lost/found item',
        });
    }
};

// Mark Lost/Found item as resolved (found/claimed)
export const markLostFoundResolved = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { itemId } = req.params;

        // Check if item belongs to user
        const { data: listing, error: fetchError } = await supabase
            .from('listings')
            .select('*')
            .eq('id', itemId)
            .eq('user_id', userId)
            .in('listing_type', ['lost', 'found'])
            .single();

        if (fetchError || !listing) {
            res.status(404).json({
                success: false,
                error: 'Lost/Found item not found or you do not have permission to update it',
            });
            return;
        }

        // Update status to resolved (using 'sold' status to indicate resolved)
        const { data: updatedListing, error: updateError } = await supabase
            .from('listings')
            .update({ status: 'sold' }) // 'sold' means resolved/claimed
            .eq('id', itemId)
            .select()
            .single();

        if (updateError) {
            console.error('Update error:', updateError);
            res.status(500).json({
                success: false,
                error: 'Failed to mark item as resolved',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: `Item marked as ${listing.listing_type === 'lost' ? 'found' : 'claimed'}`,
            data: { item: updatedListing },
        });
    } catch (error) {
        console.error('Mark resolved error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark item as resolved',
        });
    }
};

// Get Lost & Found categories
export const getLostFoundCategories = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
            .eq('type', 'lost_found')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) {
            console.error('Get categories error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch categories',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { categories: categories || [] },
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories',
        });
    }
};
