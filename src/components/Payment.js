const initializePayment = async (formData) => {
  try {
    // Ensure all required fields are present and properly formatted
    const paymentData = {
      amount: 1000, // Set your appropriate amount here
      currency: 'USD',
      email: formData.email,
      phone: formData.phone,
      reference: `REF-${Date.now()}`,
      metadata: {
        advertisementId: formData.advertisementId || 'PENDING',
        description: formData.description,
        phone: formData.phone
      }
    };

    // Validate the data before sending
    if (!paymentData.amount || paymentData.amount <= 0) {
      throw new Error('Invalid amount');
    }

    if (!paymentData.email) {
      throw new Error('Customer email is required');
    }

    // Log the request data for debugging
    console.log('Payment initialization data:', paymentData);

    const response = await fetch('http://localhost:5000/api/payment/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Payment initialization error:', errorData);
      throw new Error(errorData.message || 'Payment initialization failed');
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Payment error:', error);
    throw error;
  }
};

// Example usage in your form submission handler
const handleSubmit = async (formData) => {
  try {
    if (!formData.email || !formData.phone) {
      throw new Error('Email and phone are required');
    }

    const paymentData = await initializePayment(formData);
    
    if (paymentData.authorization_url) {
      window.location.href = paymentData.authorization_url;
    }

  } catch (error) {
    console.error('Payment failed:', error);
    // Show error to user through your UI
  }
}; 