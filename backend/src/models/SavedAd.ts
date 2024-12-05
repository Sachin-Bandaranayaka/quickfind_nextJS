import mongoose from 'mongoose';

const savedAdSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  advertisement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure a user can only save an ad once
savedAdSchema.index({ user: 1, advertisement: 1 }, { unique: true });

export default mongoose.model('SavedAd', savedAdSchema); 