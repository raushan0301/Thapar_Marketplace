import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit'; // Security: Limit request rate
import hpp from 'hpp'; // Security: Prevent HTTP Parameter Pollution
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import compression from 'compression'; // Perf: Compress responses

// Import routes
import authRoutes from './routes/auth.routes';
import listingRoutes from './routes/listing.routes';
import messageRoutes from './routes/message.routes';
import ratingRoutes from './routes/rating.routes';
import adminRoutes from './routes/admin.routes';
import lostFoundRoutes from './routes/lostfound.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);


const getOrigin = () => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (frontendUrl === '*') return true;

    const origins = frontendUrl.split(',').map(url => url.trim());
    return (origin: string | undefined, callback: (err: Error | null, origin?: boolean | string | RegExp | (string | RegExp)[]) => void) => {
        if (!origin || origins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`Blocked CORS request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    };
};

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            if (frontendUrl === '*') return callback(null, true);

            const origins = frontendUrl.split(',').map(url => url.trim());
            if (!origin || origins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'), false);
            }
        },
        credentials: true,
    },
});
// Security Middleware
app.use(helmet());
app.use(hpp());
app.use(compression()); // Perf: Compress all responses (Gzip)

// CORS Middleware
// Middleware
app.use(cors({
    origin: getOrigin(),
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
// Smart Rate Limiter (User-Based)
// - Authenticated Users: Keyed by User ID (Each student gets own limit)
// - Guests: Keyed by IP (All guests on campus WiFi share this limit)
const userLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: 5000, // 5000 requests per 15 min (Per user or Per IP)
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // 1. Try to identify user from token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                // Decode without verifying (verification happens in auth middleware)
                const decoded = jwt.decode(token) as any;
                if (decoded && decoded.userId) {
                    return decoded.userId; // Key by User ID
                }
            } catch (error) {
                // Invalid token, fall back to IP
            }
        }
        // 2. Fall back to IP for guests
        return req.ip || 'unknown-ip';
    }
});
app.use('/api/', userLimiter);

// Strict Auth Limiter (Brute Force Protection)
// Higher threshold (100) to allow for shared IP, but prevents massive brute force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check route
app.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'ThaparMarket API is running',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lost-found', lostFoundRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join user's personal room (for receiving messages even when not in specific chat)
    const userId = (socket.handshake.auth as any)?.token
        ? (() => {
            try {
                const decoded = jwt.decode((socket.handshake.auth as any).token) as any;
                return decoded?.userId;
            } catch {
                return null;
            }
        })()
        : null;

    if (userId) {
        socket.join(`user_${userId}`);
        console.log(`👤 User ${userId} joined personal room`);
    }

    // Join a chat room
    socket.on('join_chat', (chatId: string) => {
        socket.join(chatId);
        console.log(`💬 Socket ${socket.id} joined chat: ${chatId}`);
    });

    // Send message
    socket.on('send_message', (data) => {
        console.log(`📨 Message sent to chat: ${data.chatId}`);
        // Emit to the specific chat room
        io.to(data.chatId).emit('new_message', data);
    });

    // Typing indicator
    socket.on('typing', (data) => {
        socket.to(data.chatId).emit('user_typing', data);
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
});

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`📡 Socket.IO enabled`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    httpServer.close(() => process.exit(1));
});

export { io };
