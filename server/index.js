const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const advertisementRoutes = require('./routes/advertisements');

const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// MongoDB connection with debug logging
mongoose.set('debug', true);  // Enable mongoose debug mode
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
  console.log('Connection state:', mongoose.connection.readyState);
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});

// Routes
app.use('/api/advertisements', advertisementRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', {
    message: err.message,
    stack: err.stack,
    name: err.name
  });
  res.status(500).json({
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 