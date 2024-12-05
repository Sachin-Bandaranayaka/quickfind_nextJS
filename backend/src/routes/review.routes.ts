import express from 'express';
import Review from '../models/Review';
import Advertisement from '../models/Advertisement';
import { uploadImage } from '../utils/imageUpload';

const router = express.Router();

// Get reviews for an advertisement
router.get('/advertisement/:adId', async (req, res) => {
  try {
    const { adId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    const sortOptions: any = {
      newest: { createdAt: -1 },
      helpful: { helpful: -1 },
      rating: { rating: -1 }
    };

    const reviews = await Review.find({ 
      advertisement: adId,
      status: 'approved'
    })
      .populate('user', 'name')
      .sort(sortOptions[sort as string])
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Review.countDocuments({ 
      advertisement: adId,
      status: 'approved'
    });

    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { 
        $match: { 
          advertisement: adId,
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      reviews,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalReviews: total
      },
      ratingDistribution: ratingDistribution.reduce((acc: any, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a review
router.post('/', async (req, res) => {
  try {
    const { advertisementId, userId, rating, comment, images } = req.body;

    // Check if user has already reviewed this advertisement
    const existingReview = await Review.findOne({
      advertisement: advertisementId,
      user: userId
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this advertisement' });
    }

    // Create review
    const review = new Review({
      advertisement: advertisementId,
      user: userId,
      rating,
      comment,
      status: 'approved' // You might want to change this based on your moderation needs
    });

    // Upload images if provided
    if (images && images.length > 0) {
      const uploadedImages = await Promise.all(
        images.map(async (image: string) => {
          const url = await uploadImage(image);
          return { url };
        })
      );
      review.images = uploadedImages;
    }

    await review.save();

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a review
router.put('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, images } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Update review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;

    // Upload new images if provided
    if (images && images.length > 0) {
      const uploadedImages = await Promise.all(
        images.map(async (image: string) => {
          const url = await uploadImage(image);
          return { url };
        })
      );
      review.images = uploadedImages;
    }

    await review.save();

    res.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a review
router.delete('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark review as helpful
router.post('/:reviewId/helpful', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Toggle helpful status
    const helpfulIndex = review.helpful.indexOf(userId);
    if (helpfulIndex === -1) {
      review.helpful.push(userId);
    } else {
      review.helpful.splice(helpfulIndex, 1);
    }

    await review.save();

    res.json(review);
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reply to a review (service provider only)
router.post('/:reviewId/reply', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.reply = {
      comment,
      createdAt: new Date()
    };

    await review.save();

    res.json(review);
  } catch (error) {
    console.error('Error replying to review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 