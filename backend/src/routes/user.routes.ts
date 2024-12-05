import express from 'express';
import User from '../models/User';
import Advertisement from '../models/Advertisement';
import { sendEmail } from '../config/email';
import { emailTemplates } from '../templates/email';

const router = express.Router();

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/:userId', async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { name, email },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Register user
router.post('/register', async (req, res) => {
  try {
    const { phone, name, email } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User(req.body);
    await user.save();

    // Send welcome email if email is provided
    if (email) {
      const welcomeHtml = emailTemplates.welcome({
        name: name || 'User',
        postAdUrl: `${process.env.FRONTEND_URL}/post-ad`,
      });
      await sendEmail(email, 'Welcome to QuickFind.lk', welcomeHtml);
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's advertisements with pagination and filters
router.get('/:userId/advertisements', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter: any = { user: req.params.userId };

    if (status) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [ads, total] = await Promise.all([
      Advertisement.find(filter)
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Advertisement.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      ads,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalResults: total,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update advertisement status
router.patch('/:userId/advertisements/:adId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const ad = await Advertisement.findOneAndUpdate(
      { _id: req.params.adId, user: req.params.userId },
      { status },
      { new: true }
    );

    if (!ad) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    res.json(ad);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 