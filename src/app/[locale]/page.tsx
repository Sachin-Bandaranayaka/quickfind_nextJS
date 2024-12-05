const fetchData = async () => {
  try {
    console.log('Fetching advertisements...');
    const response = await axios.get('http://localhost:5000/api/advertisements/recent');
    console.log('Response:', response.data);
    setData(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Full error object:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'An error occurred while fetching data'
      );
    } else {
      console.error('Unexpected error:', error);
      setError('An unexpected error occurred');
    }
  }
}; 