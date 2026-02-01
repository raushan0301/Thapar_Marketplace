import api from '../lib/api';

export const messageService = {
    // Send message
    sendMessage: async (data: {
        receiver_id: string;
        listing_id?: string;
        message: string;
        image_url?: string;
    }) => {
        // Transform 'message' to 'content' for backend
        const { message, ...rest } = data;
        const response = await api.post('/messages', {
            ...rest,
            content: message,
        });
        return response.data;
    },

    // Get conversations
    getConversations: async () => {
        const response = await api.get('/messages/conversations');
        return response.data;
    },

    // Get messages with a user
    getMessages: async (otherUserId: string, params?: { page?: number; limit?: number }) => {
        const response = await api.get(`/messages/user/${otherUserId}`, { params });
        return response.data;
    },

    // Get unread count
    getUnreadCount: async () => {
        const response = await api.get('/messages/unread-count');
        return response.data;
    },

    // Mark message as read
    markAsRead: async (messageId: string) => {
        const response = await api.patch(`/messages/${messageId}/read`);
        return response.data;
    },

    // Mark all messages in a conversation as read
    markConversationAsRead: async (otherUserId: string) => {
        const response = await api.patch(`/messages/conversation/${otherUserId}/read`);
        return response.data;
    },

    // Delete message
    deleteMessage: async (messageId: string) => {
        const response = await api.delete(`/messages/${messageId}`);
        return response.data;
    },
};
