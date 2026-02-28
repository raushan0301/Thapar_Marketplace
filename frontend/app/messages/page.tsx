'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { messageService } from '@/services/messageService';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { Button } from '@/components/ui/Button';
import socketService from '@/lib/socket';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/api';
import { Send, MessageSquare, ArrowLeft, X, Mail, Phone, Building, Home } from 'lucide-react';
import { eventBus } from '@/lib/eventBus';

export const dynamic = 'force-dynamic';

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
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileDetails, setProfileDetails] = useState<any>(null);
    const [loadingProfile, setLoadingProfile] = useState(false);

    const handleViewProfile = async () => {
        if (!selectedConversation) return;
        setShowProfileModal(true);
        setLoadingProfile(true);
        try {
            const result = await authService.getUserPublicDetails(selectedConversation.other_user_id);
            if (result.success) {
                setProfileDetails(result.data.user);
            }
        } catch (error) {
        } finally {
            setLoadingProfile(false);
        }
    };

    // Use refs to avoid stale closures in Socket.IO listeners
    const selectedConversationRef = useRef(selectedConversation);
    const userRef = useRef(user);

    useEffect(() => {
        selectedConversationRef.current = selectedConversation;
        userRef.current = user;
    }, [selectedConversation, user]);

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

        // Track processed message IDs to prevent duplicates from multiple Socket.IO channels
        const processedMessageIds = new Set<string>();

        // Listen for new messages - use refs to avoid stale closure
        socketService.onNewMessage((data) => {
            const currentConversation = selectedConversationRef.current;
            const currentUser = userRef.current;

            // Prevent duplicate processing (backend emits to 4 channels)
            if (processedMessageIds.has(data.id)) {
                return;
            }
            processedMessageIds.add(data.id);

            // Update messages if this message belongs to the currently selected conversation
            if (
                currentConversation &&
                currentUser &&
                (data.sender_id === currentConversation.other_user_id ||
                    data.receiver_id === currentConversation.other_user_id)
            ) {
                setMessages((prev) => {
                    // Avoid duplicates
                    if (prev.some(msg => msg.id === data.id)) {
                        return prev;
                    }
                    return [...prev, data];
                });
                scrollToBottom();

                // If we received a message in the active chat, mark it as read immediately
                if (data.receiver_id === currentUser?.id) {
                    messageService.markConversationAsRead(currentConversation.other_user_id);
                }
            }

            // Update conversations list to show new message
            setConversations((prevConvs) => {
                const otherUserId = data.sender_id === currentUser?.id ? data.receiver_id : data.sender_id;

                // Check if conversation already exists
                const existingConvIndex = prevConvs.findIndex(
                    (conv) => conv.other_user_id === otherUserId
                );

                if (existingConvIndex !== -1) {
                    // Update existing conversation
                    const updatedConvs = [...prevConvs];
                    updatedConvs[existingConvIndex] = {
                        ...updatedConvs[existingConvIndex],
                        last_message: data.message,
                        last_message_time: data.created_at,
                        unread_count:
                            data.sender_id !== currentUser?.id &&
                                currentConversation?.other_user_id !== otherUserId
                                ? (updatedConvs[existingConvIndex].unread_count || 0) + 1
                                : updatedConvs[existingConvIndex].unread_count,
                    };
                    // Move to top
                    const [updated] = updatedConvs.splice(existingConvIndex, 1);
                    return [updated, ...updatedConvs];
                } else {
                    // New conversation - fetch conversations to get full details
                    fetchConversations();
                    return prevConvs;
                }
            });

            // Emit event to update navbar unread count if message is for current user
            // BUT only if it's NOT the currently active conversation
            if (data.receiver_id === currentUser?.id &&
                currentConversation?.other_user_id !== data.sender_id) {
                eventBus.emit('unreadCountUpdated');
            }
        });

        // Listen for message read status updates
        socketService.onMessageRead((data: { messageIds: string[], conversationUserId: string }) => {
            const currentConversation = selectedConversationRef.current;

            // Update messages if this is the current conversation
            if (currentConversation?.other_user_id === data.conversationUserId) {
                setMessages((prev) =>
                    prev.map(msg =>
                        data.messageIds.includes(msg.id)
                            ? { ...msg, is_read: true }
                            : msg
                    )
                );
            }
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

            const result = await messageService.getConversations();

            if (result.success) {
                setConversations(result.data.conversations);

            } else {
                setError(result.error || 'Failed to load conversations');
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectConversation = async (conversation: any) => {



        if (!conversation.other_user_id) {
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

                        // Emit event to update navbar unread count
                        eventBus.emit('unreadCountUpdated');
                    } catch (err) {
                        // silently ignore - non-critical
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

        // Fetch user details to show real name immediately
        try {
            const result = await authService.getUserPublicDetails(otherUserId);
            if (result.success) {
                setSelectedConversation((prev: any) => prev ? ({
                    ...prev,
                    other_user_name: result.data.user.name,
                    other_user_picture: result.data.user.profile_picture,
                }) : null);
            }
        } catch (error) {
            setSelectedConversation((prev: any) => prev ? ({
                ...prev,
                other_user_name: 'User',
            }) : null);
        }

        // Join chat room
        socketService.joinChat(`chat_${user?.id}_${otherUserId}`);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || !selectedConversation) return;

        // Optimistic update: Show message immediately
        const tempId = `temp-${Date.now()}`;
        const tempMessage = {
            id: tempId,
            sender_id: user?.id,
            receiver_id: selectedConversation.other_user_id,
            message: newMessage,
            created_at: new Date().toISOString(),
            is_read: false,
            listing_id: searchParams.get('listing') || undefined,
        };

        setMessages((prev) => [...prev, tempMessage]);
        setNewMessage('');
        scrollToBottom();

        try {
            const result = await messageService.sendMessage({
                receiver_id: selectedConversation.other_user_id,
                message: tempMessage.message,
                listing_id: tempMessage.listing_id,
            });

            if (result.success) {
                const realMessage = result.data.message;

                // Replace temp message with real message
                setMessages((prev) => {
                    // Check if real message already arrived via socket (prevent duplicates)
                    if (prev.some(m => m.id === realMessage.id)) {
                        return prev.filter(m => m.id !== tempId);
                    }
                    // Otherwise replace temp with real
                    return prev.map(m => m.id === tempId ? realMessage : m);
                });

                // Socket emission is handled by backend now, but we can emit for other client logic if needed
                // Backend emits to user rooms, so we don't strictly need to emit from client unless using client-side relay
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
            // Remove temp message on error
            setMessages((prev) => prev.filter(m => m.id !== tempId));
            setNewMessage(tempMessage.message); // Restore input
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const formatTime = (dateString: string) => {
        // Ensure date is treated as UTC if no timezone offset is present
        const safeDateString = dateString && !dateString.includes('Z') && !dateString.includes('+')
            ? `${dateString}Z`
            : dateString;

        const date = new Date(safeDateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata',
            });
        }
        return date.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            timeZone: 'Asia/Kolkata',
        });
    };

    const isSameDay = (d1: string, d2: string) => {
        const safeD1 = d1 && !d1.includes('Z') && !d1.includes('+') ? `${d1}Z` : d1;
        const safeD2 = d2 && !d2.includes('Z') && !d2.includes('+') ? `${d2}Z` : d2;

        const date1 = new Date(safeD1).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
        const date2 = new Date(safeD2).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
        return date1 === date2;
    };

    const formatDateSeparator = (dateString: string) => {
        const safeDateString = dateString && !dateString.includes('Z') && !dateString.includes('+')
            ? `${dateString}Z`
            : dateString;

        return new Date(safeDateString).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            timeZone: 'Asia/Kolkata',
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
                        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                            <button
                                onClick={() => router.back()}
                                className="text-gray-500 hover:text-gray-900 transition-colors p-1 -ml-1 rounded-full hover:bg-gray-100"
                                title="Go Back"
                            >
                                <ArrowLeft size={20} />
                            </button>
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
                                        onClick={() => router.push(`/messages?user=${conv.other_user_id}`)}
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
                    <div className={`${selectedConversation ? 'block' : 'hidden md:block'} flex-grow flex flex-col bg-white h-full`}>
                        {selectedConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-gray-200 flex items-center">
                                    <button
                                        onClick={() => {
                                            setSelectedConversation(null);
                                            router.push('/messages');
                                        }}
                                        className="md:hidden mr-3"
                                    >
                                        <ArrowLeft size={24} />
                                    </button>

                                    <div
                                        className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={handleViewProfile}
                                    >
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
                                            <p className="font-semibold text-gray-900 hover:underline">
                                                {selectedConversation.other_user_name}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
                                    {messages.map((message, index) => {
                                        const showDate = index === 0 || !isSameDay(message.created_at, messages[index - 1].created_at);
                                        return (
                                            <React.Fragment key={message.id}>
                                                {showDate && (
                                                    <div className="flex justify-center my-4 sticky top-0 z-10">
                                                        <span className="bg-gray-200/90 backdrop-blur-sm text-gray-600 text-xs px-3 py-1 rounded-lg font-medium shadow-sm">
                                                            {formatDateSeparator(message.created_at)}
                                                        </span>
                                                    </div>
                                                )}
                                                <MessageBubble
                                                    message={message}
                                                    isOwnMessage={message.sender_id === user?.id}
                                                    senderName={
                                                        message.sender_id !== user?.id
                                                            ? selectedConversation.other_user_name
                                                            : undefined
                                                    }
                                                />
                                            </React.Fragment>
                                        );
                                    })}
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
                            <div className="flex-grow h-full flex flex-col items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <MessageSquare size={64} className="mx-auto mb-4" />
                                    <p className="text-lg">Select a conversation to start chatting</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowProfileModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="bg-blue-600 h-24 relative">
                            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-6 pb-6 pt-16 relative text-center">
                            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                                {profileDetails?.profile_picture ? (
                                    <img src={profileDetails.profile_picture} alt={profileDetails.name} className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-white" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-blue-100 flex items-center justify-center text-3xl text-blue-600 font-bold">
                                        {profileDetails?.name?.charAt(0) || selectedConversation?.other_user_name?.charAt(0)}
                                    </div>
                                )}
                            </div>

                            <div className="mt-2">
                                <h2 className="text-2xl font-bold text-gray-900">{profileDetails?.name || selectedConversation?.other_user_name}</h2>
                                <p className="text-gray-500 text-sm">Thapar University</p>

                                {loadingProfile ? (
                                    <div className="mt-8 flex justify-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                                ) : (
                                    <div className="mt-6 space-y-3 inline-block text-left w-full max-w-xs mx-auto">
                                        {profileDetails?.email && (
                                            <div className="flex items-center text-gray-600 group bg-gray-50 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors shrink-0">
                                                    <Mail size={16} className="text-blue-600" />
                                                </div>
                                                <span className="text-sm truncate">{profileDetails.email}</span>
                                            </div>
                                        )}
                                        {profileDetails?.phone && (
                                            <div className="flex items-center text-gray-600 group bg-gray-50 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors shrink-0">
                                                    <Phone size={16} className="text-green-600" />
                                                </div>
                                                <span className="text-sm">{profileDetails.phone}</span>
                                            </div>
                                        )}
                                        {profileDetails?.department && (
                                            <div className="flex items-center text-gray-600 group bg-gray-50 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors shrink-0">
                                                    <Building size={16} className="text-purple-600" />
                                                </div>
                                                <span className="text-sm">{profileDetails.department} {profileDetails.year ? `(${profileDetails.year} Year)` : ''}</span>
                                            </div>
                                        )}
                                        {profileDetails?.hostel && (
                                            <div className="flex items-center text-gray-600 group bg-gray-50 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-3 group-hover:bg-orange-200 transition-colors shrink-0">
                                                    <Home size={16} className="text-orange-600" />
                                                </div>
                                                <span className="text-sm">{profileDetails.hostel} Hostel</span>
                                            </div>
                                        )}

                                        <div className="pt-4 mt-6 border-t border-gray-100 flex justify-center">
                                            <p className="text-xs text-gray-400">
                                                Member since {new Date(profileDetails?.created_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
