import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../types';
import { io } from '../server';

// Send message
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const senderId = req.user?.userId;
        const { receiver_id, listing_id, content } = req.body;

        if (!receiver_id || !content) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields',
            });
            return;
        }

        // Insert message (database column is 'message', not 'content')
        const { data: message, error } = await supabase
            .from('messages')
            .insert({
                sender_id: senderId,
                receiver_id,
                listing_id: listing_id || null,
                message: content,  // ← Database column is 'message'
                is_read: false,
            })
            .select(`
                *,
                sender:users!sender_id (
                    id,
                    name,
                    profile_picture
                ),
                receiver:users!receiver_id (
                    id,
                    name,
                    profile_picture
                ),
                listing:listings!listing_id (
                    id,
                    title,
                    images
                )
            `)
            .single();

        if (error) {
            console.error('Send message error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to send message',
            });
            return;
        }

        // Emit socket event to receiver
        io.to(`user_${receiver_id}`).emit('new_message', message);

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: { message },
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

        console.log('📬 Fetching conversations for user:', userId);

        // Get all unique conversations
        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:users!sender_id (
                    id,
                    name,
                    profile_picture
                ),
                receiver:users!receiver_id (
                    id,
                    name,
                    profile_picture
                ),
                listing:listings!listing_id (
                    id,
                    title,
                    images
                )
            `)
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Get conversations error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch conversations',
                details: error.message,
            });
            return;
        }

        console.log(`✅ Found ${messages?.length || 0} messages`);

        // Handle empty messages array
        if (!messages || messages.length === 0) {
            res.status(200).json({
                success: true,
                data: { conversations: [] },
            });
            return;
        }

        // Group by conversation partner
        const conversationsMap = new Map();

        messages.forEach((msg: any) => {
            const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
            const partner = msg.sender_id === userId ? msg.receiver : msg.sender;

            if (!conversationsMap.has(partnerId)) {
                conversationsMap.set(partnerId, {
                    other_user_id: partnerId,
                    other_user_name: partner?.name || 'Unknown',
                    other_user_picture: partner?.profile_picture || null,
                    last_message: msg.message || '',
                    last_message_time: msg.created_at,
                    unread_count: 0,
                });
            }

            // Count unread messages
            if (msg.receiver_id === userId && !msg.is_read) {
                const conv = conversationsMap.get(partnerId);
                conv.unread_count++;
            }
        });

        const conversations = Array.from(conversationsMap.values());

        console.log(`✅ Returning ${conversations.length} conversations`);

        res.status(200).json({
            success: true,
            data: { conversations },
        });
    } catch (error) {
        console.error('❌ Get conversations error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch conversations',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

// Get messages between two users
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { otherUserId } = req.params;
        const { page = '1', limit = '50' } = req.query;

        console.log(`📨 Getting messages between ${userId} and ${otherUserId}`);

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        // Get messages between the two users
        const { data: messages, error, count } = await supabase
            .from('messages')
            .select(`
                *,
                sender:users!sender_id (
                    id,
                    name,
                    profile_picture
                ),
                receiver:users!receiver_id (
                    id,
                    name,
                    profile_picture
                ),
                listing:listings!listing_id (
                    id,
                    title,
                    images
                )
            `, { count: 'exact' })
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
            .order('created_at', { ascending: false })
            .range(offset, offset + limitNum - 1);

        if (error) {
            console.error('❌ Get messages error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch messages',
                details: error.message,
            });
            return;
        }

        console.log(`✅ Found ${messages?.length || 0} messages`);

        res.status(200).json({
            success: true,
            data: {
                messages: messages || [],
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limitNum),
                },
            },
        });
    } catch (error) {
        console.error('❌ Get messages error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch messages',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

// Get messages for a specific listing
export const getListingMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { listing_id } = req.params;

        // Get messages for the listing
        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:users!sender_id (
                    id,
                    name,
                    profile_picture
                ),
                receiver:users!receiver_id (
                    id,
                    name,
                    profile_picture
                ),
                listing:listings!listing_id (
                    id,
                    title,
                    images,
                    user_id
                )
            `)
            .eq('listing_id', listing_id)
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get listing messages error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch messages',
            });
            return;
        }

        // Group by conversation partner
        const conversationsMap = new Map();

        messages?.forEach((msg: any) => {
            const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
            const partner = msg.sender_id === userId ? msg.receiver : msg.sender;

            if (!conversationsMap.has(partnerId)) {
                conversationsMap.set(partnerId, {
                    user: partner,
                    messages: [],
                    unread_count: 0,
                });
            }

            const conv = conversationsMap.get(partnerId);
            conv.messages.push(msg);

            if (msg.receiver_id === userId && !msg.is_read) {
                conv.unread_count++;
            }
        });

        const conversations = Array.from(conversationsMap.values());

        res.status(200).json({
            success: true,
            data: { conversations },
        });
    } catch (error) {
        console.error('Get listing messages error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch messages',
        });
    }
};

// Mark message as read
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { message_id } = req.params;

        // Update message
        const { data: message, error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', message_id)
            .eq('receiver_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Mark as read error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to mark message as read',
            });
            return;
        }

        if (!message) {
            res.status(404).json({
                success: false,
                error: 'Message not found or you do not have permission',
            });
            return;
        }

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

// Mark all messages from a conversation as read
export const markConversationAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { otherUserId } = req.params;

        console.log(`📖 Marking all messages from ${otherUserId} to ${userId} as read`);

        // Update all unread messages from the other user
        const { data: messages, error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', otherUserId)
            .eq('receiver_id', userId)
            .eq('is_read', false)
            .select();

        if (error) {
            console.error('❌ Mark conversation as read error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to mark messages as read',
            });
            return;
        }

        console.log(`✅ Marked ${messages?.length || 0} messages as read`);

        res.status(200).json({
            success: true,
            message: `Marked ${messages?.length || 0} messages as read`,
            data: { count: messages?.length || 0 },
        });
    } catch (error) {
        console.error('❌ Mark conversation as read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark messages as read',
        });
    }
};


// Delete message
export const deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { message_id } = req.params;

        // Check if message belongs to user (sender only can delete)
        const { data: message, error: fetchError } = await supabase
            .from('messages')
            .select('*')
            .eq('id', message_id)
            .eq('sender_id', userId)
            .single();

        if (fetchError || !message) {
            res.status(404).json({
                success: false,
                error: 'Message not found or you do not have permission to delete it',
            });
            return;
        }

        // Delete message
        const { error: deleteError } = await supabase
            .from('messages')
            .delete()
            .eq('id', message_id);

        if (deleteError) {
            console.error('Delete message error:', deleteError);
            res.status(500).json({
                success: false,
                error: 'Failed to delete message',
            });
            return;
        }

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

        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('Get unread count error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch unread count',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { unread_count: count || 0 },
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch unread count',
        });
    }
};
