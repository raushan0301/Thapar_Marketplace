import { Router } from 'express';
import {
    sendMessage,
    getConversations,
    getMessages,
    getListingMessages,
    markAsRead,
    markConversationAsRead,
    deleteMessage,
    getUnreadCount,
} from '../controllers/message.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All message routes require authentication
router.post('/', authenticate, sendMessage);
router.get('/conversations', authenticate, getConversations);
router.get('/unread-count', authenticate, getUnreadCount);
router.get('/user/:otherUserId', authenticate, getMessages);
router.get('/listing/:listingId', authenticate, getListingMessages);
router.patch('/:messageId/read', authenticate, markAsRead);
router.patch('/conversation/:otherUserId/read', authenticate, markConversationAsRead);
router.delete('/:messageId', authenticate, deleteMessage);

export default router;
