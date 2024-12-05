import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

export default mongoose.model('User', userSchema); 