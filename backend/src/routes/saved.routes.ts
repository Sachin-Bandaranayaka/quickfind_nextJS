import express from 'express';
import SavedAd from '../models/SavedAd';
import Advertisement from '../models/Advertisement';

const router = express.Router();

// Get user's saved advertisements
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [savedAds, total] = await Promise.all([
      SavedAd.find({ user: userId })
        .populate({
          path: 'advertisement',
          populate: [
            { path: 'category', select: 'name' },
            { path: 'user', select: 'name' }
          ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      SavedAd.countDocuments({ user: userId })
    ]);

    // Filter out saved ads where the advertisement has been deleted
    const validSavedAds = savedAds.filter(saved => saved.advertisement);

    res.json({
      savedAds: validSavedAds,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalSaved: total
      }
    });
  } catch (error) {
    console.error('Error fetching saved ads:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save an advertisement
router.post('/', async (req, res) => {
  try {
    const { userId, advertisementId } = req.body;

    // Check if already saved
    const existing = await SavedAd.findOne({
      user: userId,
      advertisement: advertisementId
    });

    if (existing) {
      return res.status(400).json({ message: 'Advertisement already saved' });
    }

    // Check if advertisement exists
    const advertisement = await Advertisement.findById(advertisementId);
    if (!advertisement) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    const savedAd = new SavedAd({
      user: userId,
      advertisement: advertisementId
    });

    await savedAd.save();

    // Populate the saved ad with advertisement details
    await savedAd.populate({
      path: 'advertisement',
      populate: [
        { path: 'category', select: 'name' },
        { path: 'user', select: 'name' }
      ]
    });

    res.status(201).json(savedAd);
  } catch (error) {
    console.error('Error saving advertisement:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if an advertisement is saved by user
router.get('/check/:userId/:advertisementId', async (req, res) => {
  try {
    const { userId, advertisementId } = req.params;

    const savedAd = await SavedAd.findOne({
      user: userId,
      advertisement: advertisementId
    });

    res.json({ isSaved: !!savedAd });
  } catch (error) {
    console.error('Error checking saved status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a saved advertisement
router.delete('/:userId/:advertisementId', async (req, res) => {
  try {
    const { userId, advertisementId } = req.params;

    const result = await SavedAd.findOneAndDelete({
      user: userId,
      advertisement: advertisementId
    });

    if (!result) {
      return res.status(404).json({ message: 'Saved advertisement not found' });
    }

    res.json({ message: 'Advertisement removed from saved' });
  } catch (error) {
    console.error('Error removing saved advertisement:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 