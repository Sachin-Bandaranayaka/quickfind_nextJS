import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    enum: ['text', 'image', 'location'],
    default: 'text'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ 'readBy.user': 1 });

// Update chat's lastMessage and unreadCount
messageSchema.post('save', async function(doc) {
  const Chat = mongoose.model('Chat');
  const chat = await Chat.findById(doc.chat);
  
  if (chat) {
    // Update last message
    chat.lastMessage = doc._id;
    
    // Update unread count for all participants except sender
    chat.participants.forEach(participantId => {
      if (!participantId.equals(doc.sender)) {
        const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
        chat.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });
    
    await chat.save();
  }
});

export default mongoose.model('Message', messageSchema); 