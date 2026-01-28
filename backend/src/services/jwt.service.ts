import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { JWTPayload } from '../types';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
};

export const verifyToken = (token: string): JWTPayload => {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

export const generateVerificationToken = (): string => {
    // Generate 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateResetToken = (): string => {
    // Generate random token for password reset
    return jwt.sign({ random: Math.random() }, JWT_SECRET, { expiresIn: '1h' } as SignOptions);
};
