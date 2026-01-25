'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './client-config';

interface FirebaseSessionContextType {
  user: User | null;
  loading: boolean;
  update: () => Promise<void>;
}

const FirebaseSessionContext = createContext<FirebaseSessionContextType>({
  user: null,
  loading: true,
  update: async () => {},
});

export function FirebaseSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);

      // Create server-side session cookie when user signs in
      if (user) {
        user.getIdToken().then((idToken) => {
          fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
          });
        });
      } else {
        // Remove server-side session cookie when user signs out
        fetch('/api/auth/session', {
          method: 'DELETE',
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const update = async () => {
    // Force refresh the auth state
    await auth.currentUser?.reload();
    setUser(auth.currentUser);
  };

  return (
    <FirebaseSessionContext.Provider value={{ user, loading, update }}>
      {children}
    </FirebaseSessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(FirebaseSessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a FirebaseSessionProvider');
  }
  return context;
}
