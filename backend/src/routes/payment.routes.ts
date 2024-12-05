import express from 'express';
import { nanoid } from 'nanoid';
import { getPaymentConfig, verifyPayment } from '../config/payhere';
import Payment from '../models/Payment';
import Advertisement from '../models/Advertisement';

const router = express.Router();

// Initialize payment for a new advertisement
router.post('/initialize', async (req, res) => {
  try {
    console.log('Payment initialization request:', req.body);
    const { email, phone, description, advertisementId } = req.body;

    if (!email || !phone || !description || !advertisementId) {
      console.error('Missing required fields:', { email, phone, description, advertisementId });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generate unique order ID
    const orderId = nanoid();
    console.log('Generated order ID:', orderId);

    // Create payment record
    const payment = new Payment({
      orderId,
      advertisement: advertisementId,
      amount: 500, // LKR
      paymentDescription: description,
    });
    await payment.save();
    console.log('Payment record created:', payment);

    // Get PayHere configuration
    const config = getPaymentConfig(orderId, email, phone, description);
    console.log('PayHere config generated:', config);

    res.json(config);
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({ 
      message: 'Failed to initialize payment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PayHere notification webhook
router.post('/notify', async (req, res) => {
  try {
    console.log('Payment notification received:', req.body);
    const isValid = verifyPayment(req.body);
    if (!isValid) {
      console.error('Invalid payment signature');
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    const { order_id, payment_id, payhere_amount, status_code } = req.body;

    // Find payment record
    const payment = await Payment.findOne({ orderId: order_id });
    if (!payment) {
      console.error('Payment not found:', order_id);
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Update payment status
    payment.paymentId = payment_id;
    payment.status = status_code === '2' ? 'completed' : 'failed';
    await payment.save();
    console.log('Payment status updated:', payment);

    // If payment successful, update advertisement status
    if (status_code === '2') {
      const ad = await Advertisement.findByIdAndUpdate(payment.advertisement, {
        paymentStatus: 'completed',
        status: 'pending', // Set to pending for admin review
      });
      console.log('Advertisement updated:', ad);
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error processing payment notification:', error);
    res.status(500).json({ message: 'Failed to process payment notification' });
  }
});

export default router; 