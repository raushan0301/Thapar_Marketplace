import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// User registration validation
export const registerSchema = Joi.object({
    email: Joi.string()
        .email()
        .pattern(new RegExp(`${process.env.CAMPUS_EMAIL_DOMAIN}$`))
        .required()
        .messages({
            'string.pattern.base': `Email must be a valid ${process.env.CAMPUS_EMAIL_DOMAIN} address`,
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
        }),
    password: Joi.string()
        .min(8)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
            'any.required': 'Password is required',
        }),
    name: Joi.string().min(2).max(255).required().messages({
        'string.min': 'Name must be at least 2 characters long',
        'any.required': 'Name is required',
    }),
    phone: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
        'string.pattern.base': 'Phone number must be 10 digits',
    }),
    department: Joi.string().max(100).optional(),
    year: Joi.number().integer().min(1).max(5).optional(),
    hostel: Joi.string().max(100).optional(),
});

// Login validation
export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

// Create listing validation
export const createListingSchema = Joi.object({
    category_id: Joi.number().integer().required(),
    title: Joi.string().min(5).max(255).required(),
    description: Joi.string().min(20).max(5000).required(),
    price: Joi.number().min(0).optional(),
    rental_rate: Joi.number().min(0).optional(),
    rental_period: Joi.string().valid('hourly', 'daily', 'weekly', 'monthly').optional(),
    condition: Joi.string().valid('new', 'like_new', 'good', 'fair', 'poor').optional(),
    location: Joi.string().max(255).optional(),
    listing_type: Joi.string().valid('sell', 'rent', 'lost', 'found').required(),
});

// Update listing validation
export const updateListingSchema = Joi.object({
    title: Joi.string().min(5).max(255).optional(),
    description: Joi.string().min(20).max(5000).optional(),
    price: Joi.number().min(0).optional(),
    rental_rate: Joi.number().min(0).optional(),
    rental_period: Joi.string().valid('hourly', 'daily', 'weekly', 'monthly').optional(),
    condition: Joi.string().valid('new', 'like_new', 'good', 'fair', 'poor').optional(),
    location: Joi.string().max(255).optional(),
    status: Joi.string().valid('active', 'sold', 'rented', 'expired', 'deleted').optional(),
});

// Rating validation
export const ratingSchema = Joi.object({
    rated_user_id: Joi.string().uuid().required(),
    listing_id: Joi.string().uuid().optional(),
    rating: Joi.number().integer().min(1).max(5).required(),
    review: Joi.string().max(1000).optional(),
});

// Validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const errors = error.details.map((detail) => detail.message);
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: errors,
            });
            return;
        }

        next();
    };
};
