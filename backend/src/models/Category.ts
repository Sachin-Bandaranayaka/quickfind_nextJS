import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true },
    si: { type: String, required: true },
    ta: { type: String, required: true }
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    en: String,
    si: String,
    ta: String
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  icon: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Category = mongoose.model('Category', categorySchema);

export default Category; 