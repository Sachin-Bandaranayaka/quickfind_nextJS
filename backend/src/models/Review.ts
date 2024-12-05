import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  advertisement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    maxLength: 500
  },
  images: [{
    url: String
  }],
  helpful: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reply: {
    comment: String,
    createdAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
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
reviewSchema.index({ advertisement: 1, user: 1 }, { unique: true }); // One review per user per ad
reviewSchema.index({ advertisement: 1, createdAt: -1 });
reviewSchema.index({ rating: -1 });

// Update advertisement rating on review changes
reviewSchema.post('save', async function(doc) {
  const Review = this.constructor;
  const Advertisement = mongoose.model('Advertisement');
  
  // Calculate new average rating
  const stats = await Review.aggregate([
    { $match: { advertisement: doc.advertisement, status: 'approved' } },
    {
      $group: {
        _id: '$advertisement',
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Update advertisement
  if (stats.length > 0) {
    await Advertisement.findByIdAndUpdate(doc.advertisement, {
      'rating.average': Math.round(stats[0].averageRating * 10) / 10,
      'rating.count': stats[0].count
    });
  }
});

export default mongoose.model('Review', reviewSchema); 