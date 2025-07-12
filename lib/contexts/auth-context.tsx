"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { signInUser, signOutUser, AuthResult, createUser } from "@/lib/firebase/auth";

interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  createdAt?: Date;
  updatedAt?: Date;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Obtener el perfil del usuario desde Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfile({
              uid: user.uid,
              email: user.email || '',
              role: userData.role || 'user',
              createdAt: userData.createdAt?.toDate(),
              updatedAt: userData.updatedAt?.toDate(),
            });
          } else {
            // Si no existe el documento del usuario, crearlo con rol 'user'
            const newUserProfile = {
              uid: user.uid,
              email: user.email || '',
              role: 'user' as const,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            
            await setDoc(userDocRef, newUserProfile);
            setUserProfile({
              uid: user.uid,
              email: user.email || '',
              role: 'user',
            });
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    return await signInUser(email, password);
  };

  const signUp = async (
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    const result = await createUser(email, password);
    
    if (result.user) {
      // Crear el perfil del usuario en Firestore
      try {
        const userDocRef = doc(db, 'users', result.user.uid);
        await setDoc(userDocRef, {
          uid: result.user.uid,
          email: result.user.email,
          role: 'user',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error creating user profile:', error);
      }
    }
    
    return result;
  };

  const signOut = async (): Promise<void> => {
    await signOutUser();
  };

  const value: AuthContextType = {
    user,
    userProfile,
    isAdmin: userProfile?.role === 'admin',
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
