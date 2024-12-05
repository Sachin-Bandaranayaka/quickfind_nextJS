import express from 'express';
import Advertisement from '../models/Advertisement';

const router = express.Router();

// Advanced search endpoint
router.get('/', async (req, res) => {
  try {
    const {
      q, // text search query
      category,
      district,
      city,
      lat, // latitude for location-based search
      lng, // longitude for location-based search
      radius = 10, // search radius in kilometers
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minRating,
      page = 1,
      limit = 12,
      language
    } = req.query;

    // Build query
    const query: any = { status: 'active' };

    // Text search
    if (q) {
      query.$text = { $search: q as string };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Location filters
    if (district) {
      query['location.district'] = district;
    }
    if (city) {
      query['location.city'] = city;
    }

    // Geospatial search
    if (lat && lng) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng as string), parseFloat(lat as string)]
          },
          $maxDistance: parseInt(radius as string) * 1000 // Convert km to meters
        }
      };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice as string);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice as string);
    }

    // Rating filter
    if (minRating) {
      query['rating.average'] = { $gte: parseFloat(minRating as string) };
    }

    // Language filter
    if (language) {
      query.language = language;
    }

    // Determine sort options
    const sortOptions: any = {};
    switch (sortBy) {
      case 'price':
        sortOptions.price = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'rating':
        sortOptions['rating.average'] = -1;
        break;
      case 'views':
        sortOptions.views = -1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const [results, total] = await Promise.all([
      Advertisement.find(query)
        .populate('category', 'name')
        .populate('user', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .select('-__v'),
      Advertisement.countDocuments(query)
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / Number(limit));

    // Format response
    res.json({
      results,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalResults: total,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1
      },
      filters: {
        sortBy,
        sortOrder,
        category,
        district,
        city,
        minPrice,
        maxPrice,
        minRating,
        radius
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get search suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { q, lat, lng } = req.query;

    if (!q) {
      return res.json([]);
    }

    const suggestions = await Advertisement.aggregate([
      {
        $search: {
          index: 'default',
          compound: {
            should: [
              {
                autocomplete: {
                  query: q as string,
                  path: 'title',
                  fuzzy: {
                    maxEdits: 1
                  }
                }
              },
              {
                autocomplete: {
                  query: q as string,
                  path: 'description',
                  fuzzy: {
                    maxEdits: 1
                  }
                }
              }
            ]
          }
        }
      },
      // If coordinates provided, add location score
      ...(lat && lng ? [{
        $addFields: {
          distance: {
            $sqrt: {
              $add: [
                { $pow: [{ $subtract: [parseFloat(lng as string), { $arrayElemAt: ['$location.coordinates', 0] }] }, 2] },
                { $pow: [{ $subtract: [parseFloat(lat as string), { $arrayElemAt: ['$location.coordinates', 1] }] }, 2] }
              ]
            }
          }
        }
      }] : []),
      {
        $project: {
          _id: 1,
          title: 1,
          category: 1,
          location: 1,
          distance: 1,
          score: { $meta: 'searchScore' }
        }
      },
      {
        $sort: lat && lng ? { distance: 1 } : { score: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json(suggestions);
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 