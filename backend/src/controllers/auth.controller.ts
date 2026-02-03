import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase';
import { generateToken, generateVerificationToken } from '../services/jwt.service';
import {
    sendVerificationEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
} from '../services/email.service';
import { AuthRequest, UserRegistration, UserLogin } from '../types';
import { uploadImage } from '../services/cloudinary.service';

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name, phone, department, year, hostel }: UserRegistration =
            req.body;

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (existingUser) {
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
        const { data: user, error } = await supabase
            .from('users')
            .insert({
                email,
                password_hash,
                name,
                phone: phone || null,
                department: department || null,
                year: year || null,
                hostel: hostel || null,
                verification_token,
                verification_token_expiry: verification_token_expiry.toISOString(),
            })
            .select('id, email, name, is_verified, created_at')
            .single();

        if (error) {
            console.error('Database error:', error);
            res.status(500).json({
                success: false,
                error: 'Registration failed. Please try again.',
            });
            return;
        }

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

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('verification_token', otp)
            .gt('verification_token_expiry', new Date().toISOString())
            .single();

        if (error || !user) {
            res.status(400).json({
                success: false,
                error: 'Invalid or expired verification code',
            });
            return;
        }

        // Update user as verified
        const { error: updateError } = await supabase
            .from('users')
            .update({
                is_verified: true,
                verification_token: null,
                verification_token_expiry: null,
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Update error:', updateError);
            res.status(500).json({
                success: false,
                error: 'Verification failed. Please try again.',
            });
            return;
        }

        // Send welcome email
        try {
            await sendWelcomeEmail(user.email, user.name);
        } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
        }

        // Generate JWT token
        const token = generateToken({ userId: user.id, email: user.email, isAdmin: user.is_admin || false });

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

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        if (user.is_verified) {
            res.status(400).json({
                success: false,
                error: 'Email is already verified',
            });
            return;
        }

        // Generate new verification token
        const verification_token = generateVerificationToken();
        const verification_token_expiry = new Date(Date.now() + 15 * 60 * 1000);

        // Update user with new token
        const { error: updateError } = await supabase
            .from('users')
            .update({
                verification_token,
                verification_token_expiry: verification_token_expiry.toISOString(),
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Update error:', updateError);
            res.status(500).json({
                success: false,
                error: 'Failed to resend verification code',
            });
            return;
        }

        // Send verification email
        await sendVerificationEmail(user.email, user.name, verification_token);

        res.status(200).json({
            success: true,
            message: 'Verification code sent successfully!',
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

        // Get user
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
            return;
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
            return;
        }

        // Check if email is verified
        if (!user.is_verified) {
            res.status(403).json({
                success: false,
                error: 'Please verify your email before logging in',
                data: {
                    email: user.email,
                    requiresVerification: true,
                },
            });
            return;
        }

        // Update last login
        await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);

        // Generate JWT token
        const token = generateToken({ userId: user.id, email: user.email, isAdmin: user.is_admin || false });

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    department: user.department,
                    year: user.year,
                    hostel: user.hostel,
                    profile_picture: user.profile_picture,
                    trust_score: user.trust_score,
                    is_admin: user.is_admin,
                    created_at: user.created_at,
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

        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, phone, department, year, hostel, profile_picture, trust_score, is_admin, is_verified, created_at')
            .eq('id', userId)
            .single();

        if (error || !user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { user },
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user data',
        });
    }
};

// Get public user profile
export const getUserPublicProfile = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, profile_picture, trust_score, created_at')
            .eq('id', id)
            .single();

        if (error || !user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { user },
        });
    } catch (error) {
        console.error('Get public profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user profile',
        });
    }
};

// Update profile
export const updateProfile = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { name, phone } = req.body;
        const profilePicture = req.file;

        let updateData: any = {};

        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;

        // Upload profile picture if provided
        if (profilePicture) {
            try {
                const imageUrl = await uploadImage(profilePicture.buffer, 'thaparmarket/profiles');
                updateData.profile_picture = imageUrl;
            } catch (uploadError) {
                console.error('Profile picture upload error:', uploadError);
                res.status(500).json({
                    success: false,
                    error: 'Failed to upload profile picture',
                });
                return;
            }
        }

        // Update user in database
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select('id, email, name, phone, profile_picture, trust_score, is_admin, created_at')
            .single();

        if (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update profile',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully!',
            data: { user: updatedUser },
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile',
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

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            // Don't reveal if user exists
            res.status(200).json({
                success: true,
                message: 'If an account exists with this email, you will receive a password reset link.',
            });
            return;
        }

        // Generate reset token
        const reset_token = generateVerificationToken();
        const reset_token_expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Update user with reset token
        const { error: updateError } = await supabase
            .from('users')
            .update({
                reset_token,
                reset_token_expiry: reset_token_expiry.toISOString(),
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Update error:', updateError);
        }

        // Send password reset email
        try {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const resetLink = `${frontendUrl}/reset-password?token=${reset_token}&email=${encodeURIComponent(user.email)}`;
            await sendPasswordResetEmail(user.email, user.name, resetLink);
        } catch (emailError) {
            console.error('Error sending password reset email:', emailError);
        }

        res.status(200).json({
            success: true,
            message: 'If an account exists with this email, you will receive a password reset link.',
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

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('reset_token', token)
            .gt('reset_token_expiry', new Date().toISOString())
            .single();

        if (error || !user) {
            res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token',
            });
            return;
        }

        // Hash new password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(newPassword, saltRounds);

        // Update password and clear reset token
        const { error: updateError } = await supabase
            .from('users')
            .update({
                password_hash,
                reset_token: null,
                reset_token_expiry: null,
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Update error:', updateError);
            res.status(500).json({
                success: false,
                error: 'Failed to reset password',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Password reset successfully!',
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset password',
        });
    }
};
