import mongoose from 'mongoose';

const advertisementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  price: String,
  priceType: {
    type: String,
    enum: ['fixed', 'negotiable', 'free'],
    default: 'fixed',
  },
  location: {
    district: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
  },
  contactNumber: {
    type: String,
    required: true,
  },
  whatsapp: String,
  images: [String],
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'rejected', 'expired'],
    default: 'draft'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  reviewNotes: {
    type: String
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  views: {
    type: Number,
    default: 0,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

const Advertisement = mongoose.model('Advertisement', advertisementSchema);

export default Advertisement; 