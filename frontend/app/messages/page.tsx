'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { messageService } from '@/services/messageService';
import { useAuthStore } from '@/store/authStore';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { Button } from '@/components/ui/Button';
import socketService from '@/lib/socket';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/api';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';

function MessagesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated, token } = useAuthStore();
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            toast.error('Please login to view messages');
            router.push('/login');
            return;
        }

        // Connect to Socket.IO
        if (token) {
            socketService.connect(token);
        }

        fetchConversations();

        // Listen for new messages
        socketService.onNewMessage((data) => {
            if (
                selectedConversation &&
                (data.sender_id === selectedConversation.other_user_id ||
                    data.receiver_id === selectedConversation.other_user_id)
            ) {
                setMessages((prev) => [...prev, data]);
                scrollToBottom();
            }
            // Refresh conversations to update last message
            fetchConversations();
        });

        return () => {
            socketService.removeAllListeners();
        };
    }, [isAuthenticated, token, router]);

    useEffect(() => {
        // Check if there's a user parameter in the URL
        const userId = searchParams.get('user');
        const listingId = searchParams.get('listing');

        if (userId && conversations.length > 0) {
            const conv = conversations.find((c) => c.other_user_id === userId);
            // Only select if it's not already selected to prevent infinite loop
            if (conv && selectedConversation?.other_user_id !== userId) {
                handleSelectConversation(conv);
            } else if (!conv) {
                // Create a new conversation placeholder
                createNewConversation(userId, listingId);
            }
        } else if (userId && conversations.length === 0 && !isLoading) {
            // No conversations exist yet, create new one
            createNewConversation(userId, listingId);
        }
    }, [searchParams, conversations, isLoading]);

    const fetchConversations = async () => {
        try {
            setError(null);
            console.log('📬 Fetching conversations...');
            const result = await messageService.getConversations();
            console.log('✅ Conversations result:', result);
            if (result.success) {
                setConversations(result.data.conversations);
                console.log(`✅ Loaded ${result.data.conversations.length} conversations`);
            } else {
                setError(result.error || 'Failed to load conversations');
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            console.error('❌ Failed to fetch conversations:', errorMessage, error);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectConversation = async (conversation: any) => {
        console.log('🔍 Selected conversation:', conversation);
        console.log('🔍 other_user_id:', conversation.other_user_id);

        if (!conversation.other_user_id) {
            console.error('❌ No other_user_id in conversation:', conversation);
            setError('Invalid conversation - missing user ID');
            return;
        }

        setSelectedConversation(conversation);
        setIsLoading(true);

        try {
            const result = await messageService.getMessages(conversation.other_user_id);
            if (result.success) {
                // Reverse messages so newest appear at bottom (like WhatsApp)
                const reversedMessages = result.data.messages.reverse();
                setMessages(reversedMessages);

                // Mark all unread messages as read
                const unreadMessages = reversedMessages.filter(
                    (msg: any) => msg.receiver_id === user?.id && !msg.is_read
                );

                // Mark all messages in conversation as read with single API call
                if (unreadMessages.length > 0) {
                    try {
                        await messageService.markConversationAsRead(conversation.other_user_id);
                        // Update local message state to show green tick immediately
                        unreadMessages.forEach((msg: any) => {
                            msg.is_read = true;
                        });
                        // Update messages state with read status
                        setMessages([...reversedMessages]);
                    } catch (err) {
                        console.error('Failed to mark conversation as read:', err);
                    }
                }

                // Update the conversation's unread count to 0
                setConversations(prevConvs =>
                    prevConvs.map(conv =>
                        conv.other_user_id === conversation.other_user_id
                            ? { ...conv, unread_count: 0 }
                            : conv
                    )
                );

                scrollToBottom();

                // Join chat room via Socket.IO
                socketService.joinChat(`chat_${user?.id}_${conversation.other_user_id}`);
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const createNewConversation = async (otherUserId: string, listingId: string | null) => {
        // Create a temporary conversation object
        const tempConversation = {
            other_user_id: otherUserId,
            other_user_name: 'Loading...',
            other_user_picture: null,
            last_message: '',
            last_message_time: new Date().toISOString(),
            unread_count: 0,
        };

        setSelectedConversation(tempConversation);
        setMessages([]);

        // Join chat room
        socketService.joinChat(`chat_${user?.id}_${otherUserId}`);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || !selectedConversation) return;

        setIsSending(true);

        try {
            const result = await messageService.sendMessage({
                receiver_id: selectedConversation.other_user_id,
                message: newMessage,
                listing_id: searchParams.get('listing') || undefined,
            });

            if (result.success) {
                setMessages([...messages, result.data.message]);
                setNewMessage('');
                scrollToBottom();

                // Send via Socket.IO for real-time delivery
                socketService.sendMessage({
                    chatId: `chat_${user?.id}_${selectedConversation.other_user_id}`,
                    message: newMessage,
                    senderId: user?.id || '',
                });
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsSending(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            });
        }
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="h-[calc(100vh-4rem)] bg-gray-50">
            <div className="max-w-7xl mx-auto h-full">
                <div className="flex h-full">
                    {/* Conversations List */}
                    <div
                        className={`${selectedConversation ? 'hidden md:block' : 'block'
                            } w-full md:w-80 bg-white border-r border-gray-200 flex flex-col`}
                    >
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
                        </div>

                        <div className="flex-grow overflow-y-auto">
                            {isLoading && conversations.length === 0 ? (
                                <div className="p-4 space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="animate-pulse flex items-center">
                                            <div className="w-12 h-12 bg-gray-200 rounded-full" />
                                            <div className="ml-3 flex-grow">
                                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                                <div className="h-3 bg-gray-200 rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="text-center py-12 px-4">
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                        <MessageSquare size={48} className="mx-auto text-red-300 mb-4" />
                                        <p className="text-red-600 font-medium mb-2">Failed to Load Conversations</p>
                                        <p className="text-sm text-red-500 mb-4">{error}</p>
                                        <Button
                                            onClick={() => {
                                                setError(null);
                                                setIsLoading(true);
                                                fetchConversations();
                                            }}
                                            variant="secondary"
                                        >
                                            Try Again
                                        </Button>
                                    </div>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500">No conversations yet</p>
                                    <p className="text-sm text-gray-400 mt-2">
                                        Start chatting by contacting a seller
                                    </p>
                                </div>
                            ) : (
                                conversations.map((conv) => (
                                    <button
                                        key={conv.other_user_id}
                                        onClick={() => handleSelectConversation(conv)}
                                        className={`w-full p-4 flex items-center hover:bg-gray-50 transition-colors ${selectedConversation?.other_user_id === conv.other_user_id
                                            ? 'bg-blue-50'
                                            : ''
                                            }`}
                                    >
                                        {conv.other_user_picture ? (
                                            <img
                                                src={conv.other_user_picture}
                                                alt={conv.other_user_name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span className="text-lg text-blue-600 font-semibold">
                                                    {conv.other_user_name?.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="ml-3 flex-grow text-left">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-gray-900">
                                                    {conv.other_user_name}
                                                </p>
                                                <span className="text-xs text-gray-500">
                                                    {formatTime(conv.last_message_time)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 truncate">
                                                {conv.last_message}
                                            </p>
                                        </div>
                                        {conv.unread_count > 0 && (
                                            <div className="ml-2 min-w-[1.5rem] h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-semibold px-2">
                                                {conv.unread_count}
                                            </div>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Window */}
                    <div className={`${selectedConversation ? 'block' : 'hidden md:block'} flex-grow flex flex-col bg-white`}>
                        {selectedConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-gray-200 flex items-center">
                                    <button
                                        onClick={() => setSelectedConversation(null)}
                                        className="md:hidden mr-3"
                                    >
                                        <ArrowLeft size={24} />
                                    </button>
                                    {selectedConversation.other_user_picture ? (
                                        <img
                                            src={selectedConversation.other_user_picture}
                                            alt={selectedConversation.other_user_name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span className="text-blue-600 font-semibold">
                                                {selectedConversation.other_user_name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="ml-3">
                                        <p className="font-semibold text-gray-900">
                                            {selectedConversation.other_user_name}
                                        </p>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
                                    {messages.map((message) => (
                                        <MessageBubble
                                            key={message.id}
                                            message={message}
                                            isOwnMessage={message.sender_id === user?.id}
                                            senderName={
                                                message.sender_id !== user?.id
                                                    ? selectedConversation.other_user_name
                                                    : undefined
                                            }
                                        />
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                        />
                                        <Button type="submit" isLoading={isSending} disabled={!newMessage.trim()}>
                                            <Send size={20} />
                                        </Button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="flex-grow flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <MessageSquare size={64} className="mx-auto mb-4" />
                                    <p className="text-lg">Select a conversation to start chatting</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
            <MessagesContent />
        </Suspense>
    );
}
