import express from 'express';
import {
    register,
    verifyEmail,
    resendVerificationOTP,
    login,
    getCurrentUser,
    updateProfile,
    requestPasswordReset,
    resetPassword,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate, registerSchema, loginSchema } from '../middleware/validation';
import { upload } from '../middleware/upload';

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendVerificationOTP);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.put('/profile', authenticate, upload.single('profile_picture'), updateProfile);

export default router;
