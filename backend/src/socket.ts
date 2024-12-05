import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import Message from './models/Message';
import Chat from './models/Chat';

export default function setupSocket(server: HTTPServer) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST']
    }
  });

  // Store user socket mappings
  const userSockets = new Map<string, string>();

  io.on('connection', (socket) => {
    console.log('New client connected');

    // User joins with their ID
    socket.on('join', (userId: string) => {
      userSockets.set(userId, socket.id);
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined`);
    });

    // Join a specific chat room
    socket.on('joinChat', (chatId: string) => {
      socket.join(`chat_${chatId}`);
      console.log(`Joined chat ${chatId}`);
    });

    // Leave a specific chat room
    socket.on('leaveChat', (chatId: string) => {
      socket.leave(`chat_${chatId}`);
      console.log(`Left chat ${chatId}`);
    });

    // Handle new message
    socket.on('sendMessage', async (data: {
      chatId: string;
      senderId: string;
      content: string;
      contentType?: string;
      metadata?: any;
    }) => {
      try {
        const { chatId, senderId, content, contentType = 'text', metadata = {} } = data;

        // Create and save message
        const message = new Message({
          chat: chatId,
          sender: senderId,
          content,
          contentType,
          metadata
        });

        await message.save();
        await message.populate('sender', 'name');

        // Emit message to all users in the chat
        io.to(`chat_${chatId}`).emit('newMessage', message);

        // Get chat to find other participants
        const chat = await Chat.findById(chatId);
        if (chat) {
          // Notify other participants
          chat.participants.forEach((participantId) => {
            if (participantId.toString() !== senderId) {
              io.to(`user_${participantId}`).emit('messageNotification', {
                chatId,
                message
              });
            }
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });

    // Handle typing status
    socket.on('typing', (data: { chatId: string; userId: string }) => {
      socket.to(`chat_${data.chatId}`).emit('userTyping', {
        chatId: data.chatId,
        userId: data.userId
      });
    });

    // Handle stop typing status
    socket.on('stopTyping', (data: { chatId: string; userId: string }) => {
      socket.to(`chat_${data.chatId}`).emit('userStoppedTyping', {
        chatId: data.chatId,
        userId: data.userId
      });
    });

    // Handle read receipts
    socket.on('markAsRead', async (data: { chatId: string; userId: string }) => {
      try {
        const { chatId, userId } = data;

        // Update messages in database
        await Message.updateMany(
          {
            chat: chatId,
            'readBy.user': { $ne: userId }
          },
          {
            $push: {
              readBy: {
                user: userId,
                readAt: new Date()
              }
            },
            $set: { status: 'read' }
          }
        );

        // Update chat unread count
        const chat = await Chat.findById(chatId);
        if (chat) {
          chat.unreadCount.set(userId, 0);
          await chat.save();
        }

        // Notify other participants
        socket.to(`chat_${chatId}`).emit('messagesRead', {
          chatId,
          userId
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      // Remove user from mapping
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }
      console.log('Client disconnected');
    });
  });

  return io;
} 