'use server';

import { adminAuth, adminDb } from './config';
import { cookies } from 'next/headers';
import type { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Create a server-side session cookie for Firebase authentication
 */
export async function createServerSession(idToken: string) {
  try {
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const cookieStore = await cookies();
    cookieStore.set('firebase_session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to create session cookie:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove server-side session cookie
 */
export async function removeServerSession() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('firebase_session');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to remove session cookie:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current authenticated user from server-side session
 */
export async function getServerSession(): Promise<DecodedIdToken | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('firebase_session')?.value;

    if (!session) return null;

    const decodedClaims = await adminAuth.verifySessionCookie(session, true);
    return decodedClaims;
  } catch (error) {
    // Session expired or invalid
    return null;
  }
}

/**
 * Create a new Firebase user with email and password
 */
export async function createFirebaseUser(email: string, password: string) {
  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: false,
    });

    // Create user document in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      createdAt: new Date().toISOString(),
      type: 'regular',
    });

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error('Failed to create Firebase user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a guest user account
 */
export async function createGuestFirebaseUser() {
  try {
    const email = `guest-${Date.now()}@lorelai-app.guest`;
    const password = Math.random().toString(36).slice(-16);

    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: true,
    });

    // Set custom claims for guest user
    await adminAuth.setCustomUserClaims(userRecord.uid, { type: 'guest' });

    // Create user document in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      createdAt: new Date().toISOString(),
      type: 'guest',
    });

    return { success: true, uid: userRecord.uid, email, password };
  } catch (error: any) {
    console.error('Failed to create guest user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify Firebase ID token
 */
export async function verifyIdToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return { success: true, decodedToken };
  } catch (error: any) {
    console.error('Failed to verify ID token:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user by UID
 */
export async function getUserByUid(uid: string) {
  try {
    const userRecord = await adminAuth.getUser(uid);
    return { success: true, user: userRecord };
  } catch (error: any) {
    console.error('Failed to get user by UID:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete user by UID
 */
export async function deleteUserByUid(uid: string) {
  try {
    await adminAuth.deleteUser(uid);
    await adminDb.collection('users').doc(uid).delete();
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return { success: false, error: error.message };
  }
}
