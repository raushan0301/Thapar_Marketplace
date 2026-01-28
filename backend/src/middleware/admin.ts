import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

export const isAdmin = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const isAdmin = req.user?.isAdmin;

        if (!isAdmin) {
            res.status(403).json({
                success: false,
                error: 'Access denied. Admin privileges required.',
            });
            return;
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify admin status',
        });
    }
};
