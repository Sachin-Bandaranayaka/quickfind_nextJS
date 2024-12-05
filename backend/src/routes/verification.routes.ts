import express from 'express';
import { sendVerificationToken, verifyToken } from '../config/twilio';
import User from '../models/User';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

// Rate limiting for verification attempts
const verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: 'Too many verification attempts. Please try again later.'
});

const codeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per 15 minutes
  message: 'Too many code verification attempts. Please try again later.'
});

// Validate phone number format
const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // Basic validation for Sri Lankan phone numbers
  const pattern = /^(?:\+94|0)?[1-9][0-9]{8}$/;
  return pattern.test(phoneNumber);
};

// Send verification code
router.post('/send-code', verificationLimiter, async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number is required' 
      });
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid phone number format' 
      });
    }

    // Check if phone number is already verified for another user
    const existingUser = await User.findOne({ 
      phone: phoneNumber,
      isPhoneVerified: true 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This phone number is already registered'
      });
    }

    const verification = await sendVerificationToken(phoneNumber);
    
    res.json({ 
      success: true,
      status: verification.status,
      message: 'Verification code sent successfully'
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send verification code'
    });
  }
});

// Verify code
router.post('/verify-code', codeLimiter, async (req, res) => {
  try {
    const { phoneNumber, code, userId } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number and code are required' 
      });
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid phone number format' 
      });
    }

    const verification = await verifyToken(phoneNumber, code);
    
    if (verification.status === 'approved') {
      // Update user's phone verification status if userId is provided
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          phone: phoneNumber,
          isPhoneVerified: true
        });
      }

      res.json({
        success: true,
        message: 'Phone number verified successfully',
        status: 'approved'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid verification code',
        status: verification.status
      });
    }
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : 'Failed to verify code'
    });
  }
});

// Check verification status
router.get('/status/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    const user = await User.findOne({ phone: phoneNumber });
    
    if (!user) {
      return res.json({
        success: true,
        isVerified: false,
        message: 'Phone number not found'
      });
    }

    res.json({
      success: true,
      isVerified: user.isPhoneVerified,
      message: user.isPhoneVerified 
        ? 'Phone number is verified'
        : 'Phone number is not verified'
    });
  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to check verification status'
    });
  }
});

export default router; 