import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';
import { io } from '../server';

// Send message
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const senderId = req.user?.userId;
        const { listing_id, receiver_id, message, image_url } = req.body;

        // Validate required fields
        if (!receiver_id || (!message && !image_url)) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields',
            });
            return;
        }

        // Check if receiver exists
        const receiverExists = await pool.query('SELECT id FROM users WHERE id = $1', [
            receiver_id,
        ]);

        if (receiverExists.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Receiver not found',
            });
            return;
        }

        // Insert message
        const result = await pool.query(
            `INSERT INTO messages (listing_id, sender_id, receiver_id, message, image_url)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [listing_id || null, senderId, receiver_id, message || null, image_url || null]
        );

        const newMessage = result.rows[0];

        // Get sender info for real-time notification
        const senderInfo = await pool.query(
            'SELECT id, name, profile_picture FROM users WHERE id = $1',
            [senderId]
        );

        // Emit real-time message via Socket.IO
        const chatId = [senderId, receiver_id].sort().join('_');
        io.to(chatId).emit('new_message', {
            ...newMessage,
            sender: senderInfo.rows[0],
        });

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: { message: newMessage },
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send message',
        });
    }
};

// Get conversations (list of users you've chatted with)
export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        const result = await pool.query(
            `SELECT DISTINCT ON (other_user_id)
                other_user_id,
                other_user_name,
                other_user_picture,
                last_message,
                last_message_time,
                unread_count
             FROM (
                 SELECT 
                     CASE 
                         WHEN sender_id = $1 THEN receiver_id 
                         ELSE sender_id 
                     END as other_user_id,
                     CASE 
                         WHEN sender_id = $1 THEN u2.name 
                         ELSE u1.name 
                     END as other_user_name,
                     CASE 
                         WHEN sender_id = $1 THEN u2.profile_picture 
                         ELSE u1.profile_picture 
                     END as other_user_picture,
                     m.message as last_message,
                     m.created_at as last_message_time,
                     (
                         SELECT COUNT(*) 
                         FROM messages 
                         WHERE sender_id = CASE 
                             WHEN m.sender_id = $1 THEN m.receiver_id 
                             ELSE m.sender_id 
                         END
                         AND receiver_id = $1 
                         AND is_read = false
                     ) as unread_count
                 FROM messages m
                 LEFT JOIN users u1 ON m.sender_id = u1.id
                 LEFT JOIN users u2 ON m.receiver_id = u2.id
                 WHERE sender_id = $1 OR receiver_id = $1
                 ORDER BY m.created_at DESC
             ) conversations
             ORDER BY other_user_id, last_message_time DESC`,
            [userId]
        );

        res.status(200).json({
            success: true,
            data: { conversations: result.rows },
        });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch conversations',
        });
    }
};

// Get messages between two users
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { otherUserId } = req.params;
        const { page = '1', limit = '50' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        const result = await pool.query(
            `SELECT m.*, 
                    u1.name as sender_name, u1.profile_picture as sender_picture,
                    u2.name as receiver_name, u2.profile_picture as receiver_picture
             FROM messages m
             LEFT JOIN users u1 ON m.sender_id = u1.id
             LEFT JOIN users u2 ON m.receiver_id = u2.id
             WHERE (sender_id = $1 AND receiver_id = $2) 
                OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY created_at DESC
             LIMIT $3 OFFSET $4`,
            [userId, otherUserId, limitNum, offset]
        );

        // Mark messages as read
        await pool.query(
            `UPDATE messages 
             SET is_read = true 
             WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
            [otherUserId, userId]
        );

        // Get total count
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM messages 
             WHERE (sender_id = $1 AND receiver_id = $2) 
                OR (sender_id = $2 AND receiver_id = $1)`,
            [userId, otherUserId]
        );

        const totalMessages = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalMessages / limitNum);

        res.status(200).json({
            success: true,
            data: {
                messages: result.rows.reverse(), // Reverse to show oldest first
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalMessages,
                    limit: limitNum,
                },
            },
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch messages',
        });
    }
};

// Get messages for a specific listing
export const getListingMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { listingId } = req.params;

        // Check if user is the listing owner
        const listing = await pool.query('SELECT user_id FROM listings WHERE id = $1', [
            listingId,
        ]);

        if (listing.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Listing not found',
            });
            return;
        }

        const isOwner = listing.rows[0].user_id === userId;

        let query;
        let params;

        if (isOwner) {
            // Owner sees all messages for this listing
            query = `
                SELECT m.*, 
                       u1.name as sender_name, u1.profile_picture as sender_picture,
                       u2.name as receiver_name, u2.profile_picture as receiver_picture
                FROM messages m
                LEFT JOIN users u1 ON m.sender_id = u1.id
                LEFT JOIN users u2 ON m.receiver_id = u2.id
                WHERE m.listing_id = $1
                ORDER BY m.created_at DESC
            `;
            params = [listingId];
        } else {
            // Non-owner sees only their conversation about this listing
            query = `
                SELECT m.*, 
                       u1.name as sender_name, u1.profile_picture as sender_picture,
                       u2.name as receiver_name, u2.profile_picture as receiver_picture
                FROM messages m
                LEFT JOIN users u1 ON m.sender_id = u1.id
                LEFT JOIN users u2 ON m.receiver_id = u2.id
                WHERE m.listing_id = $1 
                  AND (m.sender_id = $2 OR m.receiver_id = $2)
                ORDER BY m.created_at DESC
            `;
            params = [listingId, userId];
        }

        const result = await pool.query(query, params);

        res.status(200).json({
            success: true,
            data: { messages: result.rows },
        });
    } catch (error) {
        console.error('Get listing messages error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch listing messages',
        });
    }
};

// Mark message as read
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { messageId } = req.params;

        // Check if message exists and user is the receiver
        const message = await pool.query(
            'SELECT * FROM messages WHERE id = $1 AND receiver_id = $2',
            [messageId, userId]
        );

        if (message.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Message not found or you are not the receiver',
            });
            return;
        }

        // Mark as read
        await pool.query('UPDATE messages SET is_read = true WHERE id = $1', [messageId]);

        res.status(200).json({
            success: true,
            message: 'Message marked as read',
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark message as read',
        });
    }
};

// Delete message
export const deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { messageId } = req.params;

        // Check if message exists and user is the sender
        const message = await pool.query(
            'SELECT * FROM messages WHERE id = $1 AND sender_id = $2',
            [messageId, userId]
        );

        if (message.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Message not found or you are not the sender',
            });
            return;
        }

        // Delete message
        await pool.query('DELETE FROM messages WHERE id = $1', [messageId]);

        res.status(200).json({
            success: true,
            message: 'Message deleted successfully',
        });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete message',
        });
    }
};

// Get unread message count
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        const result = await pool.query(
            'SELECT COUNT(*) as unread_count FROM messages WHERE receiver_id = $1 AND is_read = false',
            [userId]
        );

        res.status(200).json({
            success: true,
            data: { unread_count: parseInt(result.rows[0].unread_count) },
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch unread count',
        });
    }
};
