import express from 'express';
import Category from '../models/Category';
import slugify from 'slugify';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    console.log('Fetching categories...');
    const categories = await Category.find()
      .sort({ 'name.en': 1 });
    console.log('Categories found:', categories.length);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new category
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    
    if (!name?.en || !name?.si || !name?.ta) {
      return res.status(400).json({ 
        message: 'Name is required in all languages' 
      });
    }

    const slug = slugify(name.en.toLowerCase());

    // Check if category with same slug exists
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return res.status(400).json({ 
        message: 'Category with this name already exists' 
      });
    }

    const category = new Category({
      name,
      slug,
      description,
      icon,
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ 
      message: 'Error creating category',
      error: error.message 
    });
  }
});

// Update category
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const slug = slugify(name.en.toLowerCase());

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name,
        slug,
        description,
        icon,
      },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete category
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add this new route to get categories count
router.get('/count', async (req, res) => {
  try {
    const count = await Category.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error counting categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 