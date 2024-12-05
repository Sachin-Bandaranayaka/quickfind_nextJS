import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  advertisement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement',
    required: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: [
      'inappropriate',
      'spam',
      'fraud',
      'duplicate',
      'wrongCategory',
      'offensive',
      'other'
    ],
    required: true
  },
  description: {
    type: String,
    maxLength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'rejected'],
    default: 'pending'
  },
  adminNotes: String,
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
reportSchema.index({ advertisement: 1, reporter: 1 }, { unique: true }); // One report per user per ad
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });

// When a report is created, check if there are multiple reports for the same ad
reportSchema.post('save', async function(doc) {
  const Report = this.constructor;
  const Advertisement = mongoose.model('Advertisement');
  
  // Count reports for this advertisement
  const reportCount = await Report.countDocuments({
    advertisement: doc.advertisement,
    status: { $in: ['pending', 'reviewed'] }
  });

  // If there are multiple reports, flag the advertisement for review
  if (reportCount >= 3) {
    await Advertisement.findByIdAndUpdate(doc.advertisement, {
      status: 'flagged',
      flagReason: 'multiple_reports'
    });
  }
});

export default mongoose.model('Report', reportSchema); 