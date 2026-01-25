'use server';

import { adminStorage } from './config';
import { getServerSession } from './auth-helpers';

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFileToFirebase(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  userId: string
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    const session = await getServerSession();

    if (!session || session.uid !== userId) {
      return { error: 'Unauthorized' };
    }

    // Validate file size (5MB limit)
    if (fileBuffer.length > 5 * 1024 * 1024) {
      return { error: 'File size should be less than 5MB' };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(contentType)) {
      return { error: 'File type should be JPEG or PNG' };
    }

    // Create unique file path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `uploads/${userId}/${timestamp}-${sanitizedFileName}`;

    // Upload to Firebase Storage
    const bucket = adminStorage.bucket();
    const file = bucket.file(filePath);

    await file.save(fileBuffer, {
      metadata: {
        contentType,
      },
      resumable: false,
    });

    // Make file publicly accessible
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return { url: publicUrl, path: filePath };
  } catch (error: any) {
    console.error('Failed to upload file to Firebase Storage:', error);
    return { error: error.message || 'Upload failed' };
  }
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFileFromFirebase(
  filePath: string,
  userId: string
): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await getServerSession();

    if (!session || session.uid !== userId) {
      return { error: 'Unauthorized' };
    }

    // Verify the file belongs to the user
    if (!filePath.startsWith(`uploads/${userId}/`)) {
      return { error: 'Unauthorized to delete this file' };
    }

    const bucket = adminStorage.bucket();
    await bucket.file(filePath).delete();

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete file from Firebase Storage:', error);
    return { error: error.message || 'Delete failed' };
  }
}

/**
 * Get a signed URL for a file (for temporary access)
 */
export async function getFileSignedUrl(filePath: string): Promise<string> {
  try {
    const bucket = adminStorage.bucket();
    const file = bucket.file(filePath);

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    return url;
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

/**
 * Check if a file exists in Firebase Storage
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const bucket = adminStorage.bucket();
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error('Failed to check if file exists:', error);
    return false;
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(filePath: string) {
  try {
    const bucket = adminStorage.bucket();
    const file = bucket.file(filePath);
    const [metadata] = await file.getMetadata();
    return {
      name: metadata.name,
      size: metadata.size,
      contentType: metadata.contentType,
      timeCreated: metadata.timeCreated,
      updated: metadata.updated,
    };
  } catch (error) {
    console.error('Failed to get file metadata:', error);
    throw new Error('Failed to get file metadata');
  }
}

/**
 * List all files for a user
 */
export async function listUserFiles(userId: string) {
  try {
    const session = await getServerSession();

    if (!session || session.uid !== userId) {
      throw new Error('Unauthorized');
    }

    const bucket = adminStorage.bucket();
    const [files] = await bucket.getFiles({
      prefix: `uploads/${userId}/`,
    });

    return files.map((file) => ({
      path: file.name,
      url: `https://storage.googleapis.com/${bucket.name}/${file.name}`,
    }));
  } catch (error) {
    console.error('Failed to list user files:', error);
    throw new Error('Failed to list user files');
  }
}
