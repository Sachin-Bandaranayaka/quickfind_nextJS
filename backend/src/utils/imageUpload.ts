import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Function to generate unique ID
const generateUniqueId = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only if not already initialized
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error: any) {
  if (!/already exists/.test(error.message)) {
    console.error('Firebase initialization error:', error);
  }
}

const storage = getStorage(app);

export const uploadImage = async (
  file: Express.Multer.File, 
  folder: string = 'general'
): Promise<string> => {
  try {
    if (!file.buffer) {
      throw new Error('No file buffer provided');
    }

    // Clean the original filename
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    
    // Generate unique file name
    const fileName = `${folder}/${generateUniqueId()}_${cleanFileName}`;
    const storageRef = ref(storage, fileName);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file.buffer, {
      contentType: file.mimetype,
    });

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`File uploaded successfully: ${fileName}`);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error(
      error instanceof Error 
        ? `Failed to upload image: ${error.message}`
        : 'Failed to upload image'
    );
  }
};

export const uploadMultipleImages = async (
  files: Express.Multer.File[],
  folder: string = 'general'
): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => uploadImage(file, folder));
    const urls = await Promise.all(uploadPromises);
    console.log(`Successfully uploaded ${urls.length} files to ${folder}/`);
    return urls;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw new Error(
      error instanceof Error 
        ? `Failed to upload images: ${error.message}`
        : 'Failed to upload images'
    );
  }
}; 