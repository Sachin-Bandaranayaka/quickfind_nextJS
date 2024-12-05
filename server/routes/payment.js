router.post('/api/payment/initialize', async (req, res) => {
  try {
    const { amount, currency, email, phone, reference, metadata } = req.body;

    // Validate required fields
    if (!amount || !email || !phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields',
        details: {
          amount: !amount ? 'Amount is required' : null,
          email: !email ? 'Email is required' : null,
          phone: !phone ? 'Phone is required' : null
        }
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid amount'
      });
    }

    // Initialize payment with your payment provider
    // ... payment provider specific code ...

    res.json({
      status: 'success',
      message: 'Payment initialized',
      data: {
        authorization_url: 'URL_TO_PAYMENT_PAGE',
        reference: reference,
        amount: amount,
        email: email,
        metadata: metadata
      }
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to initialize payment'
    });
  }
}); 