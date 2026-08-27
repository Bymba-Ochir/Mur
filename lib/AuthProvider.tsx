// lib/AuthProvider.tsx
// Supabase session-ийг НЭГ удаа татаж, onAuthStateChange listener-ийг НЭГ
// үүсгэн бүх хэрэглэгчид (Navbar, admin, my-pets, PetDetail, VolunteerBadge)
// контекстээс уншина. Хуучнаар useAuth() бүр өөрийн listener үүсгэдэг байсан.
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // getUser() — шинэ supabase-js-д getSession()-ээс илүүдэхүйц (token verify)
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  /**
   * Имэйл рүү нэвтрэх холбоос (magic link) илгээнэ.
   * Google/Facebook OAuth тохируулах шаардлагагүй тул MVP-д хамгийн хурдан.
   */
  const loginWithEmail = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
    });
    if (error) throw error;
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth нь AuthProvider дотор ашиглагдах ёстой');
  return ctx;
}
