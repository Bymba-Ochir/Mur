'use client';
import type { ReactNode } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import LoginModal from './LoginModal';
import { useState } from 'react';

export default function AuthRequired({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { lang } = useLanguage();
  const [showLogin, setShowLogin] = useState(false);

  if (loading) {
    return (
      <div className="content-panel flex min-h-48 items-center justify-center" role="status">
        <span className="text-sm text-[var(--muted)]">{lang === 'mn' ? 'Нэвтрэлтийг шалгаж байна...' : 'Checking your session...'}</span>
      </div>
    );
  }

  if (user) return children;

  return (
    <>
      <div className="content-panel mx-auto flex max-w-2xl flex-col items-center px-6 py-12 text-center">
        <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--eyebrow-bg)] text-[var(--primary)]" aria-hidden="true">
          <LogIn size={26} />
        </span>
        <h2 className="mb-2 text-xl font-bold text-[var(--text)]">
          {lang === 'mn' ? 'Зар нийтлэхийн тулд нэвтэрнэ үү' : 'Sign in to publish a listing'}
        </h2>
        <p className="mb-5 max-w-lg text-sm leading-6 text-[var(--muted)]">
          {lang === 'mn'
            ? 'Таны зар, зураг болон холбоо барих мэдээллийг аюулгүй хадгалахын тулд нэвтрэх шаардлагатай.'
            : 'Sign-in is required to securely save your listing, photos, and contact details.'}
        </p>
        <Button onClick={() => setShowLogin(true)}>
          {lang === 'mn' ? 'Нэвтрэх холбоос авах' : 'Get sign-in link'}
        </Button>
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
