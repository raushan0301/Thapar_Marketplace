import express from 'express';
import {
    register,
    verifyEmail,
    resendVerificationOTP,
    login,
    getCurrentUser,
    requestPasswordReset,
    resetPassword,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate, registerSchema, loginSchema } from '../middleware/validation';

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

export default router;
