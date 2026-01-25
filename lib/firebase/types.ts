import type { DecodedIdToken } from 'firebase-admin/auth';

export type UserType = 'regular' | 'guest';

/**
 * Custom user type that matches our FirebaseSession user
 */
export interface SessionUser {
  id: string;
  email: string | null;
  name?: string | null;
  image?: string | null;
  type: UserType;
}

/**
 * Firebase session type to replace NextAuth Session
 */
export interface FirebaseSession {
  user: SessionUser;
}

/**
 * Determine user type from email
 */
function getUserTypeFromEmail(email: string | null | undefined): UserType {
  if (!email) return 'guest';
  if (email.includes('@lorelai-app.guest')) return 'guest';
  return 'regular';
}

/**
 * Convert Firebase decoded token to session format
 */
export function decodedTokenToSession(decodedToken: DecodedIdToken): FirebaseSession {
  const email = decodedToken.email || null;
  const userType = (decodedToken.type as UserType) || getUserTypeFromEmail(email);

  return {
    user: {
      id: decodedToken.uid,
      email,
      name: decodedToken.name,
      image: decodedToken.picture,
      type: userType,
    },
  };
}
