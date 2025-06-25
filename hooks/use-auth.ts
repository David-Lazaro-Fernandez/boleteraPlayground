import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { signInUser, signOutUser, AuthResult } from '@/lib/firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    return await signInUser(email, password);
  };

  const signOut = async (): Promise<void> => {
    await signOutUser();
  };

  return {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user
  };
} 