import { Router } from 'express';
import {
    getAllUsers,
    toggleUserBan,
    getAllListingsAdmin,
    deleteListingAdmin,
    getAnalytics,
    getAdminLogs,
    createCategory,
    updateCategory,
    deleteCategory,
    getAllMessages,
    deleteMessage,
    bulkDeleteMessages,
} from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { isAdmin } from '../middleware/admin';

const router = Router();

// All admin routes require authentication and admin privileges
router.use(authenticate, isAdmin);

// User management
router.get('/users', getAllUsers);
router.patch('/users/:userId/ban', toggleUserBan);

// Listing management
router.get('/listings', getAllListingsAdmin);
router.delete('/listings/:listingId', deleteListingAdmin);

// Category management
router.post('/categories', createCategory);
router.put('/categories/:categoryId', updateCategory);
router.delete('/categories/:categoryId', deleteCategory);

// Message moderation
router.get('/messages', getAllMessages);
router.delete('/messages/:messageId', deleteMessage);
router.delete('/messages/bulk', bulkDeleteMessages);

// Analytics
router.get('/analytics', getAnalytics);

// Admin logs
router.get('/logs', getAdminLogs);

export default router;
