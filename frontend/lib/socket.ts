import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

class SocketService {
    private socket: Socket | null = null;

    connect(token: string): Socket {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io(SOCKET_URL, {
            auth: {
                token,
            },
            transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
        });

        this.socket.on('disconnect', () => {
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        return this.socket;
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket(): Socket | null {
        return this.socket;
    }

    // Join a chat room
    joinChat(chatId: string): void {
        if (this.socket) {
            this.socket.emit('join_chat', chatId);
        }
    }

    // Send a message
    sendMessage(data: { chatId: string; message: string; senderId: string }): void {
        if (this.socket) {
            this.socket.emit('send_message', data);
        }
    }

    // Listen for new messages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onNewMessage(callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on('new_message', callback);
        }
    }

    // Send typing indicator
    sendTyping(data: { chatId: string; userId: string; isTyping: boolean }): void {
        if (this.socket) {
            this.socket.emit('typing', data);
        }
    }

    // Listen for typing indicator
    onUserTyping(callback: (data: { chatId: string; userId: string; isTyping: boolean }) => void): void {
        if (this.socket) {
            this.socket.on('user_typing', callback);
        }
    }

    // Remove all listeners
    removeAllListeners(): void {
        if (this.socket) {
            this.socket.removeAllListeners();
        }
    }
}

export const socketService = new SocketService();
export default socketService;
