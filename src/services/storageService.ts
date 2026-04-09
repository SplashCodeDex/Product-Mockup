/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Uploads a base64 image to Firebase Storage and returns the download URL.
 * @param uid User ID for path scoping
 * @param folder Folder name (e.g., 'assets', 'mockups')
 * @param base64 Data URL or raw base64 string
 * @returns Promise<string> Download URL
 */
export const uploadImage = async (uid: string, folder: string, base64: string): Promise<string> => {
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.png`;
  const storageRef = ref(storage, `users/${uid}/${folder}/${filename}`);
  
  // Handle both full data URLs and raw base64
  const format = base64.startsWith('data:') ? 'data_url' : 'base64';
  
  await uploadString(storageRef, base64, format);
  return getDownloadURL(storageRef);
};

/**
 * Deletes an image from Firebase Storage given its download URL.
 * @param url The download URL of the image
 */
export const deleteImage = async (url: string): Promise<void> => {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image from storage:', error);
    // We don't throw here to avoid blocking Firestore deletion if storage fails
  }
};
