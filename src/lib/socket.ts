/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string) {
    // Disconnect existing connection if any
    this.disconnect();
    
    this.userId = userId;
    console.log('🔌 Attempting to connect to WebSocket server...');
    
    this.socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}`, {
      query: { userId },
      transports: ['websocket', 'polling'], // Allow fallback to polling
      timeout: 20000,
      forceNew: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      console.log('Socket ID:', this.socket?.id);
      console.log('User ID:', userId);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      console.error('Error details:', error);
    });

    // Add a generic event listener to catch all events for debugging
    this.socket.onAny((eventName, ...args) => {
      console.log(`📨 Received event: ${eventName}`, args);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from WebSocket server...');
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  onNotification(callback: (data: any) => void) {
    if (this.socket) {
      console.log('👂 Setting up notification listener...');
      this.socket.on('notification', (data) => {
        console.log('📧 Notification received:', data);
        callback(data);
      });
    } else {
      console.warn('⚠️ Cannot set up notification listener: socket not connected');
    }
  }

  offNotification() {
    if (this.socket) {
      console.log('🔇 Removing notification listener...');
      this.socket.off('notification');
    }
  }

  // Method to test if socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Method to get current user ID
  getCurrentUserId(): string | null {
    return this.userId;
  }

  // Method to manually emit a test event (for debugging)
  emitTest(data: any) {
    if (this.socket) {
      console.log('🧪 Emitting test event:', data);
      this.socket.emit('test', data);
    }
  }
}

export const socketService = new SocketService();