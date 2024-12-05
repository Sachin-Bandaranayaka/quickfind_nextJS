import express from 'express';
import Chat from '../models/Chat';
import Message from '../models/Message';
import { uploadImage } from '../utils/imageUpload';

const router = express.Router();

// Get user's chats
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [chats, total] = await Promise.all([
      Chat.find({ 
        participants: userId,
        status: 'active'
      })
        .populate('participants', 'name')
        .populate('advertisement', 'title images')
        .populate('lastMessage')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Chat.countDocuments({ 
        participants: userId,
        status: 'active'
      })
    ]);

    res.json({
      chats,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalChats: total
      }
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat messages
router.get('/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      Message.find({ chat: chatId })
        .populate('sender', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Message.countDocuments({ chat: chatId })
    ]);

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalMessages: total
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start a new chat
router.post('/', async (req, res) => {
  try {
    const { advertisementId, userId, serviceProviderId } = req.body;

    // Check if chat already exists
    let chat = await Chat.findOne({
      advertisement: advertisementId,
      participants: { $all: [userId, serviceProviderId] },
      status: 'active'
    });

    if (chat) {
      return res.json(chat);
    }

    // Create new chat
    chat = new Chat({
      advertisement: advertisementId,
      participants: [userId, serviceProviderId],
      unreadCount: new Map([
        [serviceProviderId.toString(), 0],
        [userId.toString(), 0]
      ])
    });

    await chat.save();

    // Populate chat details
    await chat.populate([
      { path: 'participants', select: 'name' },
      { path: 'advertisement', select: 'title images' }
    ]);

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { senderId, content, contentType = 'text', metadata = {} } = req.body;

    // Check if chat exists and user is a participant
    const chat = await Chat.findOne({
      _id: chatId,
      participants: senderId,
      status: 'active'
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Handle image upload if content type is image
    let processedContent = content;
    if (contentType === 'image') {
      processedContent = await uploadImage(content);
    }

    const message = new Message({
      chat: chatId,
      sender: senderId,
      content: processedContent,
      contentType,
      metadata
    });

    await message.save();

    // Populate sender details
    await message.populate('sender', 'name');

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.post('/:chatId/read', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    // Update messages
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

    // Reset unread count for user
    const chat = await Chat.findById(chatId);
    if (chat) {
      chat.unreadCount.set(userId.toString(), 0);
      await chat.save();
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Archive/Block chat
router.patch('/:chatId/status', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { status } = req.body;

    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { status },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error updating chat status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 