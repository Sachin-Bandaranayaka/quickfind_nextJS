import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_VERIFY_SERVICE_ID,
  NODE_ENV
} = process.env;

let client: twilio.Twilio | null = null;

// Only initialize Twilio if credentials are provided
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  try {
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('Twilio client initialized successfully');
  } catch (error) {
    console.error('Error initializing Twilio client:', error);
  }
}

export const sendVerificationToken = async (phoneNumber: string) => {
  try {
    // In development, skip actual SMS sending if configured
    if (NODE_ENV === 'development' && process.env.SKIP_SMS_VERIFICATION === 'true') {
      console.log(`Development mode: Skipping SMS verification for ${phoneNumber}`);
      console.log('Verification code would be: 123456');
      return { status: 'pending', development: true };
    }

    if (!client || !TWILIO_VERIFY_SERVICE_ID) {
      throw new Error('Twilio is not properly configured');
    }

    // Clean and format the phone number
    const formattedNumber = formatPhoneNumber(phoneNumber);

    const verification = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_ID)
      .verifications.create({ 
        to: formattedNumber, 
        channel: 'sms',
        locale: 'en' // Can be changed based on user preference
      });

    console.log(`Verification token sent to ${formattedNumber}`);
    return verification;
  } catch (error) {
    console.error('Error sending verification token:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to send verification code'
    );
  }
};

export const verifyToken = async (phoneNumber: string, code: string) => {
  try {
    // In development, accept any 6-digit code or '123456'
    if (NODE_ENV === 'development' && process.env.SKIP_SMS_VERIFICATION === 'true') {
      const isValid = code === '123456' || /^\d{6}$/.test(code);
      console.log(`Development mode: Verification ${isValid ? 'successful' : 'failed'} for ${phoneNumber}`);
      return { status: isValid ? 'approved' : 'failed', development: true };
    }

    if (!client || !TWILIO_VERIFY_SERVICE_ID) {
      throw new Error('Twilio is not properly configured');
    }

    // Clean and format the phone number
    const formattedNumber = formatPhoneNumber(phoneNumber);

    const verification = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_ID)
      .verificationChecks.create({ 
        to: formattedNumber, 
        code 
      });

    console.log(`Verification check completed for ${formattedNumber}: ${verification.status}`);
    return verification;
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to verify code'
    );
  }
};

// Helper function to format phone numbers
const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add '+' if not present and the number doesn't start with the country code
  if (!cleaned.startsWith('94')) {
    // Assuming Sri Lankan numbers
    return `+94${cleaned.startsWith('0') ? cleaned.slice(1) : cleaned}`;
  }
  
  return `+${cleaned}`;
};

// Export for testing purposes
export const getTwilioClient = () => client; 