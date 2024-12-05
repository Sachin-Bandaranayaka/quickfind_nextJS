const Advertisement = require('../models/Advertisement');
const router = express.Router();

router.get('/recent', async (req, res) => {
  try {
    console.log('Attempting to fetch recent advertisements...');
    
    // Log the MongoDB connection state
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    
    const recentAds = await Advertisement.find()
      .select('-__v')  // Exclude the version key
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();  // Convert to plain JavaScript objects
    
    console.log('Fetched advertisements:', recentAds);
    return res.json(recentAds);
    
  } catch (error) {
    console.error('Detailed error in /recent route:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({ 
      message: 'Error fetching recent advertisements',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 