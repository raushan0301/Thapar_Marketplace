import { Router } from 'express';
import {
    createRating,
    getUserRatings,
    getRatingsGivenByUser,
    updateRating,
    deleteRating,
} from '../controllers/rating.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/user/:userId', getUserRatings);

// Protected routes (require authentication)
router.post('/', authenticate, createRating);
router.get('/my-ratings', authenticate, getRatingsGivenByUser);
router.put('/:ratingId', authenticate, updateRating);
router.delete('/:ratingId', authenticate, deleteRating);

export default router;
