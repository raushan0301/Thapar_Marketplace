import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/database';
import { generateToken, generateVerificationToken } from '../services/jwt.service';
import {
    sendVerificationEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
} from '../services/email.service';
import { AuthRequest, UserRegistration, UserLogin } from '../types';

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name, phone, department, year, hostel }: UserRegistration =
            req.body;

        // Check if user already exists
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (existingUser.rows.length > 0) {
            res.status(409).json({
                success: false,
                error: 'User with this email already exists',
            });
            return;
        }

        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Generate verification token (6-digit OTP)
        const verification_token = generateVerificationToken();
        const verification_token_expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Insert user
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, name, phone, department, year, hostel, verification_token, verification_token_expiry)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, email, name, is_verified, created_at`,
            [
                email,
                password_hash,
                name,
                phone || null,
                department || null,
                year || null,
                hostel || null,
                verification_token,
                verification_token_expiry,
            ]
        );

        const user = result.rows[0];

        // Send verification email
        try {
            await sendVerificationEmail(email, name, verification_token);
        } catch (emailError) {
            console.error('Error sending verification email:', emailError);
            // Don't fail registration if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email for verification code.',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    is_verified: user.is_verified,
                },
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed. Please try again.',
        });
    }
};

// Verify email with OTP
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;

        const result = await pool.query(
            `SELECT * FROM users WHERE email = $1 AND verification_token = $2 AND verification_token_expiry > NOW()`,
            [email, otp]
        );

        if (result.rows.length === 0) {
            res.status(400).json({
                success: false,
                error: 'Invalid or expired verification code',
            });
            return;
        }

        const user = result.rows[0];

        // Update user as verified
        await pool.query(
            `UPDATE users SET is_verified = true, verification_token = NULL, verification_token_expiry = NULL WHERE id = $1`,
            [user.id]
        );

        // Send welcome email
        try {
            await sendWelcomeEmail(user.email, user.name);
        } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
        }

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            isAdmin: user.is_admin,
        });

        res.status(200).json({
            success: true,
            message: 'Email verified successfully!',
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    is_verified: true,
                },
            },
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Verification failed. Please try again.',
        });
    }
};

// Resend verification OTP
export const resendVerificationOTP = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { email } = req.body;

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        const user = result.rows[0];

        if (user.is_verified) {
            res.status(400).json({
                success: false,
                error: 'Email is already verified',
            });
            return;
        }

        // Generate new OTP
        const verification_token = generateVerificationToken();
        const verification_token_expiry = new Date(Date.now() + 15 * 60 * 1000);

        await pool.query(
            `UPDATE users SET verification_token = $1, verification_token_expiry = $2 WHERE id = $3`,
            [verification_token, verification_token_expiry, user.id]
        );

        // Send verification email
        await sendVerificationEmail(user.email, user.name, verification_token);

        res.status(200).json({
            success: true,
            message: 'Verification code sent to your email',
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to resend verification code',
        });
    }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password }: UserLogin = req.body;

        // Find user
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
            return;
        }

        const user = result.rows[0];

        // Check if user is banned
        if (user.is_banned) {
            res.status(403).json({
                success: false,
                error: 'Your account has been suspended. Please contact support.',
            });
            return;
        }

        // Check if email is verified
        if (!user.is_verified) {
            res.status(403).json({
                success: false,
                error: 'Please verify your email before logging in',
            });
            return;
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
            return;
        }

        // Update last login
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            isAdmin: user.is_admin,
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    profile_picture: user.profile_picture,
                    is_admin: user.is_admin,
                    trust_score: user.trust_score,
                },
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed. Please try again.',
        });
    }
};

// Get current user
export const getCurrentUser = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?.userId;

        const result = await pool.query(
            `SELECT id, email, name, phone, department, year, hostel, profile_picture, 
              trust_score, is_admin, created_at 
       FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { user: result.rows[0] },
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user data',
        });
    }
};

// Request password reset
export const requestPasswordReset = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { email } = req.body;

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            // Don't reveal if user exists
            res.status(200).json({
                success: true,
                message: 'If an account exists, a password reset link has been sent',
            });
            return;
        }

        const user = result.rows[0];

        // Generate reset token
        const reset_token = generateVerificationToken(); // 6-digit code
        const reset_token_expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await pool.query(
            `UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3`,
            [reset_token, reset_token_expiry, user.id]
        );

        // Send reset email
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${reset_token}&email=${email}`;
        await sendPasswordResetEmail(user.email, user.name, resetLink);

        res.status(200).json({
            success: true,
            message: 'Password reset link sent to your email',
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process password reset request',
        });
    }
};

// Reset password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, token, newPassword } = req.body;

        const result = await pool.query(
            `SELECT * FROM users WHERE email = $1 AND reset_token = $2 AND reset_token_expiry > NOW()`,
            [email, token]
        );

        if (result.rows.length === 0) {
            res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token',
            });
            return;
        }

        const user = result.rows[0];

        // Hash new password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(newPassword, saltRounds);

        // Update password and clear reset token
        await pool.query(
            `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2`,
            [password_hash, user.id]
        );

        res.status(200).json({
            success: true,
            message: 'Password reset successful. You can now login with your new password.',
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset password',
        });
    }
};
