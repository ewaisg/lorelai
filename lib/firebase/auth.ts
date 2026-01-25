/**
 * Firebase authentication helper to replace NextAuth auth() function
 * This module provides server-side authentication using Firebase
 */

import { getServerSession } from './auth-helpers';
import type { FirebaseSession, UserType } from './types';
import { decodedTokenToSession } from './types';

// Re-export UserType for convenience
export type { UserType };

/**
 * Get the current authenticated session
 * Mimics NextAuth's auth() function but uses Firebase
 */
export async function auth(): Promise<FirebaseSession | null> {
  const session = await getServerSession();

  if (!session) {
    return null;
  }

  return decodedTokenToSession(session);
}

/**
 * Get user type from email
 */
export function getUserType(email: string | null): UserType {
  if (!email) return 'guest';

  // Check if email matches guest pattern
  if (email.includes('@lorelai-app.guest')) {
    return 'guest';
  }

  return 'regular';
}
