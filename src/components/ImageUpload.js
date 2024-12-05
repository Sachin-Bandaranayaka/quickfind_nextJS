const uploadToCloudinary = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    formData.append('cloud_name', 'dvlnlxns9');

    // Validate file before upload
    if (!file || !isValidFileType(file)) {
      throw new Error('Invalid file type');
    }

    if (file.size > 10485760) { // 10MB limit example
      throw new Error('File size too large');
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dvlnlxns9/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary error response:', errorData);
      throw new Error(errorData.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url;

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Helper function to validate file type
const isValidFileType = (file) => {
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return acceptedTypes.includes(file.type);
}; 