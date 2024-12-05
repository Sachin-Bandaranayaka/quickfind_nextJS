import mongoose from 'mongoose';
import Category from '../models/Category';
import Advertisement from '../models/Advertisement';
import dotenv from 'dotenv';

dotenv.config();

const seedCategories = [
  {
    name: {
      en: 'Home Services',
      si: 'ගෘහ සේවා',
      ta: 'வீட்டு சேவைகள்'
    },
    slug: 'home-services',
    description: {
      en: 'Find reliable home service providers',
      si: 'විශ්වසනීය ගෘහ සේවා සපයන්නන් සොයන්න',
      ta: 'நம்பகமான வீட்டு சேவை வழங்குநர்களைக் கண்டறியவும்'
    },
    icon: '🏠'
  },
  {
    name: {
      en: 'Education',
      si: 'අධ්‍යාපන',
      ta: 'கல்வி'
    },
    slug: 'education',
    description: {
      en: 'Educational services and tutoring',
      si: 'අධ්‍යාපන සේවා සහ පෞද්ගලික උපදේශන',
      ta: 'கல்வி சேவைகள் மற்றும் டியூஷன்'
    },
    icon: '📚'
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Category.deleteMany({});
    await Advertisement.deleteMany({});

    // Insert categories
    const categories = await Category.insertMany(seedCategories);
    console.log('Categories seeded:', categories.length);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase(); 