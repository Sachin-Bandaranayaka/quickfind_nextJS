import crypto from 'crypto';

const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID!;
const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET!;
const PAYHERE_URL = process.env.NODE_ENV === 'production'
  ? 'https://www.payhere.lk/pay/checkout'
  : 'https://sandbox.payhere.lk/pay/checkout';

export const getPaymentConfig = (
  orderId: string,
  email: string,
  phone: string,
  description: string
) => {
  const config = {
    merchant_id: MERCHANT_ID,
    return_url: `${process.env.FRONTEND_URL}/payment/success`,
    cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    notify_url: `${process.env.FRONTEND_URL}/api/payment/notify`,
    order_id: orderId,
    items: description,
    amount: '500.00',
    currency: 'LKR',
    first_name: 'Customer',
    last_name: '',
    email: email,
    phone: phone,
    address: 'Sri Lanka',
    city: 'Colombo',
    country: 'Sri Lanka',
    delivery_address: 'No',
    delivery_city: 'No',
    delivery_country: 'No',
  };

  // Generate hash
  const hashedSecret = crypto
    .createHash('md5')
    .update(
      `${MERCHANT_ID}${config.order_id}${config.amount}${config.currency}${MERCHANT_SECRET}`
    )
    .digest('hex')
    .toUpperCase();

  return {
    ...config,
    hash: hashedSecret,
    url: PAYHERE_URL,
  };
};

export const verifyPayment = (notification: any) => {
  const {
    merchant_id,
    order_id,
    payhere_amount,
    payhere_currency,
    status_code,
    md5sig,
  } = notification;

  const calculatedHash = crypto
    .createHash('md5')
    .update(
      `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${
        MERCHANT_SECRET.toUpperCase()
      }`
    )
    .digest('hex')
    .toUpperCase();

  return calculatedHash === md5sig;
}; 