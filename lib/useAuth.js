// lib/useAuth.js
'use client';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
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
  const loginWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
    });
    if (error) throw error;
  };

  const logout = () => supabase.auth.signOut();

  return { user, loading, loginWithEmail, logout };
}
