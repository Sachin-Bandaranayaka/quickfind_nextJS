import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  advertisement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentId: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  paymentDescription: String,
}, {
  timestamps: true,
});

export default mongoose.model('Payment', paymentSchema); 