'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import LoginModal from './LoginModal';

type AuthRequiredProps = {
  children: ReactNode;
  title?: ReactNode;
  description?: ReactNode | null;
  loginLabel?: ReactNode;
  loadingLabel?: ReactNode;
  icon?: ReactNode;
};

/**
 * Shared authentication boundary for create/edit flows.
 *
 * The gate owns session/loading/login-modal behavior while callers can provide
 * flow-specific copy. Keeping that responsibility here prevents each form from
 * reimplementing auth state handling and accidentally mounting protected form
 * hooks before a user is available.
 */
export default function AuthRequired({
  children,
  title,
  description,
  loginLabel,
  loadingLabel,
  icon,
}: AuthRequiredProps) {
  const { user, loading } = useAuth();
  const { lang, t } = useLanguage();
  const [showLogin, setShowLogin] = useState(false);

  const resolvedTitle = title ?? (lang === 'mn' ? 'Зар оруулахын тулд нэвтэрнэ үү' : 'Sign in to create a listing');
  const resolvedDescription = description ?? null;
  const resolvedLoginLabel = loginLabel ?? t('nav_login');
  const resolvedLoadingLabel = loadingLabel ?? t('detail_loading');

  if (loading) {
    return (
      <div className="state-panel" role="status" aria-busy="true">
        <span>{resolvedLoadingLabel}</span>
      </div>
    );
  }

  if (user) return children;

  return (
    <>
      <section className="state-panel">
        <span className="state-panel__icon" aria-hidden="true">
          {icon ?? <LogIn size={26} />}
        </span>
        <h2>{resolvedTitle}</h2>
        {resolvedDescription ? <p>{resolvedDescription}</p> : null}
        <Button onClick={() => setShowLogin(true)}>{resolvedLoginLabel}</Button>
      </section>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
