import { Router } from 'express';
import {
    createListing,
    getAllListings,
    getListingById,
    getMyListings,
    updateListing,
    deleteListing,
    markListingStatus,
    getCategories,
} from '../controllers/listing.controller';
import { authenticate } from '../middleware/auth';
import { uploadMultiple } from '../middleware/upload';

const router = Router();

// Public routes
router.get('/', getAllListings);
router.get('/categories', getCategories);
router.get('/:listingId', getListingById);

// Protected routes (require authentication)
router.post('/', authenticate, uploadMultiple, createListing);
router.get('/user/my-listings', authenticate, getMyListings);
router.put('/:listingId', authenticate, uploadMultiple, updateListing);
router.delete('/:listingId', authenticate, deleteListing);
router.patch('/:listingId/status', authenticate, markListingStatus);

export default router;
