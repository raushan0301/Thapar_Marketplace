import React from 'react';

interface MessageBubbleProps {
    message: {
        id: string;
        message: string;
        sender_id: string;
        created_at: string;
        is_read: boolean;
    };
    isOwnMessage: boolean;
    senderName?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isOwnMessage,
    senderName,
}) => {
    const formatTime = (dateString: string) => {
        // Ensure date is treated as UTC if no timezone offset is present
        // This fixes the issue where server timestamps are parsed as local time causing a shift
        const safeDateString = dateString && !dateString.includes('Z') && !dateString.includes('+')
            ? `${dateString}Z`
            : dateString;

        const date = new Date(safeDateString);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata',
        });
    };

    return (
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                {!isOwnMessage && senderName && (
                    <p className="text-xs text-gray-500 mb-1 ml-2">{senderName}</p>
                )}
                <div
                    className={`rounded-lg px-4 py-2 ${isOwnMessage
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                        }`}
                >
                    <p className="whitespace-pre-wrap break-words">{message.message}</p>
                    <div className="flex items-center justify-end mt-1 space-x-1">
                        <span className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                            {formatTime(message.created_at)}
                        </span>
                        {isOwnMessage && (
                            <span className={`text-xs ${message.is_read ? 'text-green-400' : 'text-blue-100'}`}>
                                ✓✓
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
