import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import connectDB from './config/database';
import cron from 'node-cron';

// Import routes
import advertisementRoutes from './routes/advertisement.routes';
import userRoutes from './routes/user.routes';
import categoryRoutes from './routes/category.routes';
import reviewRoutes from './routes/review.routes';
import savedRoutes from './routes/saved.routes';
import chatRoutes from './routes/chat.routes';
import { checkExpiringAds } from './routes/advertisement.routes';
import verifyRoutes from './routes/verify.routes';
import paymentRoutes from './routes/payment.routes';

// Import socket setup
import setupSocket from './socket';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/test', (req, res) => {
  res.json({ message: 'API is working' });
});
app.use('/api/advertisements', advertisementRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/payment', paymentRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Schedule cron job to check for expiring ads (runs daily at midnight)
cron.schedule('0 0 * * *', () => {
  console.log('Checking for expiring advertisements...');
  checkExpiringAds();
});

// Setup Socket.IO
const io = setupSocket(httpServer);

// Add error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}).on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please free up the port or use a different one.`);
  } else {
    console.error('Error starting server:', error);
  }
  process.exit(1);
});