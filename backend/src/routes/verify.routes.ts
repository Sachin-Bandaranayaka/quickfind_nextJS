import express from 'express';
import twilio from 'twilio';

const router = express.Router();
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Send verification code
router.post('/send', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_ID!)
      .verifications.create({ to: phoneNumber, channel: 'sms' });
    
    res.json({ status: verification.status });
  } catch (error) {
    console.error('Error sending verification:', error);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
});

// Check verification code
router.post('/check', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_ID!)
      .verificationChecks.create({ to: phoneNumber, code });

    if (verification.status === 'approved') {
      res.json({ status: 'approved' });
    } else {
      res.status(400).json({ message: 'Invalid verification code' });
    }
  } catch (error) {
    console.error('Error checking verification:', error);
    res.status(500).json({ message: 'Failed to verify code' });
  }
});

export default router; 