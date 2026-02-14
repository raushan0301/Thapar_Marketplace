import { Router } from 'express';
import {
    createLostFoundItem,
    getLostFoundItems,
    getLostFoundItemById,
    updateLostFoundItem,
    markLostFoundResolved,
    getLostFoundCategories,
    reactivateLostFoundItem,
} from '../controllers/lostfound.controller';
import { authenticate } from '../middleware/auth';
import { uploadMultiple } from '../middleware/upload';

const router = Router();

// All Lost & Found routes require authentication
router.use(authenticate);

// Get all lost/found items with filters
router.get('/', getLostFoundItems);

// Get lost/found categories
router.get('/categories', getLostFoundCategories);

// Get specific lost/found item by ID
router.get('/:itemId', getLostFoundItemById);

// Create new lost/found item
router.post('/', uploadMultiple, createLostFoundItem);

// Update lost/found item
router.put('/:itemId', uploadMultiple, updateLostFoundItem);

// Mark item as resolved (found/claimed)
router.patch('/:itemId/resolve', markLostFoundResolved);

// Reactivate item (move from history to active)
router.patch('/:itemId/reactivate', reactivateLostFoundItem);

export default router;
