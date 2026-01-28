import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JWTPayload } from '../types';

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'No token provided. Please login to continue.',
            });
            return;
        }

        const token = authHeader.substring(7);

        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'your-secret-key'
            ) as JWTPayload;

            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({
                success: false,
                error: 'Invalid or expired token. Please login again.',
            });
            return;
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Authentication error',
        });
    }
};

export const isAdmin = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    if (!req.user?.isAdmin) {
        res.status(403).json({
            success: false,
            error: 'Access denied. Admin privileges required.',
        });
        return;
    }
    next();
};
