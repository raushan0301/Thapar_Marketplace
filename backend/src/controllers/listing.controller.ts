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
            // If it's a plain string (URL), wrap it in an array
            return [images];
        }
    }
    return [];
}

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
                console.log(`📸 Uploading ${req.files.length} images...`);
                imageUrls = await uploadMultipleImages(req.files, 'thaparmarket/listings');
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

        console.log('💾 Inserting listing into database...');

        // Insert listing
        const { data: listing, error } = await supabase
            .from('listings')
            .insert({
                user_id: userId,
                title,
                description,
                price: price || null,
                category_id,
                condition: condition || null,
                listing_type,
                location: location || null,
                images: imageUrls.length > 0 ? imageUrls : null,
                status: 'active',
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create listing',
            });
            return;
        }

        console.log('✅ Listing created successfully!');

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
            condition,
            min_price,
            max_price,
            search,
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
            .from('listings')
            .select(`
                *,
                users:user_id (
                    id,
                    name,
                    profile_picture,
                    trust_score
                ),
                categories:category_id (
                    id,
                    name,
                    icon
                )
            `, { count: 'exact' })
            .eq('status', 'active');

        // Apply filters
        if (category_id) {
            query = query.eq('category_id', category_id);
        }

        if (listing_type) {
            query = query.eq('listing_type', listing_type);
        }

        if (condition) {
            query = query.eq('condition', condition);
        }

        if (min_price) {
            query = query.gte('price', parseFloat(min_price as string));
        }

        if (max_price) {
            query = query.lte('price', parseFloat(max_price as string));
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Apply sorting
        const ascending = sort_order === 'asc';

        // If sorting by price, filter out items without price (lost/found items)
        if (sort_by === 'price') {
            query = query.not('price', 'is', null);
        }

        query = query.order(sort_by as string, { ascending });

        // Apply pagination
        query = query.range(offset, offset + limitNum - 1);

        const { data: listings, error, count } = await query;

        if (error) {
            console.error('Get listings error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch listings',
            });
            return;
        }

        // Parse images and flatten seller info for each listing
        const parsedListings = listings?.map(listing => ({
            ...listing,
            images: parseImages(listing.images),
            seller_name: listing.users?.name,
            seller_profile_picture: listing.users?.profile_picture,
            seller_trust_score: listing.users?.trust_score,
            category_name: listing.categories?.name,
            category_icon: listing.categories?.icon,
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
            .eq('id', listingId)
            .single();


        if (error || !listing) {
            console.error('Supabase error:', error);
            console.error('Listing data:', listing);
            res.status(404).json({
                success: false,
                error: 'Listing not found',
            });
            return;
        }

        // Parse images and flatten seller info
        const parsedListing = {
            ...listing,
            images: parseImages(listing.images),
            seller_name: listing.users?.name,
            seller_email: listing.users?.email,
            seller_phone: listing.users?.phone,
            seller_profile_picture: listing.users?.profile_picture,
            seller_trust_score: listing.users?.trust_score,
            category_name: listing.categories?.name,
            category_icon: listing.categories?.icon,
        };

        res.status(200).json({
            success: true,
            data: { listing: parsedListing },
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
        const {
            status,
            page = '1',
            limit = '20',
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        let query = supabase
            .from('listings')
            .select(`
                *,
                categories!category_id (
                    id,
                    name,
                    icon
                )
            `, { count: 'exact' })
            .eq('user_id', userId);

        if (status) {
            query = query.eq('status', status);
        }

        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limitNum - 1);

        const { data: listings, error, count } = await query;

        if (error) {
            console.error('Get my listings error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch listings',
            });
            return;
        }

        // Parse images and flatten category info for each listing
        const parsedListings = listings?.map(listing => ({
            ...listing,
            images: parseImages(listing.images),
            category_name: listing.categories?.name,
            category_icon: listing.categories?.icon,
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
        console.error('Get my listings error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch listings',
        });
    }
};

// Update listing
export const updateListing = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { listingId } = req.params;
        const {
            title,
            description,
            price,
            category_id,
            condition,
            listing_type,
            location,
            existing_images,
        } = req.body;

        // Check if listing exists and belongs to user
        const { data: existingListing, error: fetchError } = await supabase
            .from('listings')
            .select('*')
            .eq('id', listingId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !existingListing) {
            res.status(404).json({
                success: false,
                error: 'Listing not found or you do not have permission to edit it',
            });
            return;
        }

        // Handle images
        let imageUrls: string[] = [];

        // Keep existing images that weren't removed
        if (existing_images) {
            imageUrls = Array.isArray(existing_images) ? existing_images : JSON.parse(existing_images);
        }

        // Upload new images if provided
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            try {
                const newImageUrls = await uploadMultipleImages(req.files, 'thaparmarket/listings');
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
        const oldImages = existingListing.images ? JSON.parse(existingListing.images) : [];
        const removedImages = oldImages.filter((img: string) => !imageUrls.includes(img));
        if (removedImages.length > 0) {
            try {
                await deleteMultipleImages(removedImages);
            } catch (deleteError) {
                console.error('Image deletion error:', deleteError);
            }
        }

        // Update listing
        const { data: updatedListing, error: updateError } = await supabase
            .from('listings')
            .update({
                title: title || existingListing.title,
                description: description || existingListing.description,
                price: price !== undefined ? price : existingListing.price,
                category_id: category_id || existingListing.category_id,
                condition: condition || existingListing.condition,
                listing_type: listing_type || existingListing.listing_type,
                location: location || existingListing.location,
                images: imageUrls.length > 0 ? imageUrls : null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', listingId)
            .select()
            .single();

        if (updateError) {
            console.error('Update error:', updateError);
            res.status(500).json({
                success: false,
                error: 'Failed to update listing',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Listing updated successfully',
            data: { listing: updatedListing },
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
        const { data: listing, error: fetchError } = await supabase
            .from('listings')
            .select('*')
            .eq('id', listingId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !listing) {
            res.status(404).json({
                success: false,
                error: 'Listing not found or you do not have permission to delete it',
            });
            return;
        }

        // Delete images from Cloudinary
        if (listing.images) {
            try {
                const imageUrls = parseImages(listing.images);
                await deleteMultipleImages(imageUrls);
            } catch (deleteError) {
                console.error('Image deletion error:', deleteError);
            }
        }

        // Delete listing
        const { error: deleteError } = await supabase
            .from('listings')
            .delete()
            .eq('id', listingId);

        if (deleteError) {
            console.error('Delete error:', deleteError);
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

        if (!['active', 'sold', 'rented', 'inactive'].includes(status)) {
            res.status(400).json({
                success: false,
                error: 'Invalid status',
            });
            return;
        }

        // Check if listing belongs to user
        const { data: listing, error: fetchError } = await supabase
            .from('listings')
            .select('*')
            .eq('id', listingId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !listing) {
            res.status(404).json({
                success: false,
                error: 'Listing not found or you do not have permission to update it',
            });
            return;
        }

        // Update status
        const { data: updatedListing, error: updateError } = await supabase
            .from('listings')
            .update({ status })
            .eq('id', listingId)
            .select()
            .single();

        if (updateError) {
            console.error('Update error:', updateError);
            res.status(500).json({
                success: false,
                error: 'Failed to update listing status',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Listing status updated successfully',
            data: { listing: updatedListing },
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
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
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
