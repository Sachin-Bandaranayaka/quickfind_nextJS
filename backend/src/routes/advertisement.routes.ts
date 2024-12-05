import express from 'express';
import Advertisement from '../models/Advertisement';
import User from '../models/User';
import { sendEmail } from '../config/email';
import { emailTemplates } from '../templates/email';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Get all advertisements with filters
router.get('/', async (req, res) => {
  try {
    console.log('Fetching advertisements with query:', req.query);
    const { category, district, city, language, status = 'active', search, limit = 10, page = 1 } = req.query;
    const filter: any = { status };

    if (category) filter.category = category;
    if (district) filter['location.district'] = district;
    if (city) filter['location.city'] = city;
    if (language) filter.language = language;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('Using filter:', filter);
    const skip = (Number(page) - 1) * Number(limit);
    
    const [ads, total] = await Promise.all([
      Advertisement.find(filter)
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Advertisement.countDocuments(filter)
    ]);
    
    console.log('Advertisements found:', ads.length);
    res.json({
      ads,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalResults: total,
        hasNextPage: Number(page) < Math.ceil(total / Number(limit)),
        hasPrevPage: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get single advertisement
router.get('/:id', async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id)
      .populate('category', 'name')
      .populate('user', 'name');

    if (!ad) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    // Increment views
    ad.views += 1;
    await ad.save();

    res.json(ad);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new advertisement
router.post('/', async (req, res) => {
  try {
    const ad = new Advertisement({
      ...req.body,
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    await ad.save();

    // Send confirmation email to the advertiser
    if (ad.user) {
      const user = await User.findById(ad.user);
      if (user?.email) {
        await sendEmail(
          user.email,
          'Your Advertisement is Live!',
          `Your advertisement "${ad.title}" is now live on QuickFind.lk`
        );
      }
    }

    res.status(201).json(ad);
  } catch (error) {
    console.error('Error creating advertisement:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send inquiry to advertiser
router.post('/:id/inquiries', async (req, res) => {
  try {
    const { name, contact, message } = req.body;
    const ad = await Advertisement.findById(req.params.id).populate('user');

    if (!ad) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    // Send email to the advertiser
    const user = ad.user as any;
    if (user?.email) {
      const inquiryHtml = emailTemplates.inquiryReceived({
        name: user.name || 'User',
        adTitle: ad.title,
        inquirerName: name,
        inquirerContact: contact,
        message,
        inquiryUrl: `${process.env.FRONTEND_URL}/dashboard/inquiries`,
      });
      await sendEmail(user.email, 'New Inquiry Received', inquiryHtml);
    }

    res.json({ message: 'Inquiry sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Check for expiring advertisements and send notifications
export const checkExpiringAds = async () => {
  try {
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const expiringAds = await Advertisement.find({
      status: 'active',
      expiresAt: {
        $gt: new Date(),
        $lt: threeDaysFromNow,
      },
    }).populate('user');

    for (const ad of expiringAds) {
      const user = ad.user as any;
      if (user?.email) {
        const daysLeft = Math.ceil((ad.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const expiringHtml = emailTemplates.adExpiring({
          name: user.name || 'User',
          adTitle: ad.title,
          daysLeft,
          renewUrl: `${process.env.FRONTEND_URL}/dashboard/ads`,
        });
        await sendEmail(user.email, 'Your Advertisement is Expiring Soon', expiringHtml);
      }
    }
  } catch (error) {
    console.error('Error checking expiring ads:', error);
  }
};

// Get pending advertisements
router.get('/pending', adminAuth, async (req, res) => {
  try {
    const ads = await Advertisement.find({ status: 'pending' })
      .populate('user', 'name email')
      .sort('-createdAt');
    res.json(ads);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Review advertisement
router.post('/:id/review', adminAuth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const ad = await Advertisement.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewNotes: notes,
        reviewedAt: new Date(),
        reviewedBy: req.user._id
      },
      { new: true }
    );

    if (!ad) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    // Send email notification to the advertiser
    const user = await User.findById(ad.user);
    if (user?.email) {
      const emailHtml = emailTemplates.adReviewComplete({
        name: user.name || 'User',
        adTitle: ad.title,
        status,
        notes,
        viewUrl: `${process.env.FRONTEND_URL}/ads/${ad._id}`
      });
      await sendEmail(
        user.email,
        `Your Advertisement has been ${status === 'active' ? 'Approved' : 'Rejected'}`,
        emailHtml
      );
    }

    res.json(ad);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;