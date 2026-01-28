import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('Error:', err);

    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
            success: false,
            error: 'File size too large. Maximum size is 5MB per file.',
        });
        return;
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
        res.status(400).json({
            success: false,
            error: 'Too many files. Maximum 6 files allowed.',
        });
        return;
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        res.status(400).json({
            success: false,
            error: 'Unexpected file field.',
        });
        return;
    }

    // Database errors
    if (err.code === '23505') {
        // Unique violation
        res.status(409).json({
            success: false,
            error: 'Resource already exists.',
        });
        return;
    }

    if (err.code === '23503') {
        // Foreign key violation
        res.status(400).json({
            success: false,
            error: 'Referenced resource does not exist.',
        });
        return;
    }

    // Default error
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
};
