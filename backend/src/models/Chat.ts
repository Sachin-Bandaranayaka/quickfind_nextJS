import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  advertisement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'blocked'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
chatSchema.index({ participants: 1 });
chatSchema.index({ advertisement: 1 });
chatSchema.index({ updatedAt: -1 });

export default mongoose.model('Chat', chatSchema); 