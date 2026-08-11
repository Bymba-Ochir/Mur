'use client';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../lib/useAuth';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';

/** Имэйл (magic link) нэвтрэх модал — Navbar-аас салгагдсан. */
export default function LoginModal({ onClose }: { onClose: () => void }) {
  const { loginWithEmail } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  async function handleSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    try {
      await loginWithEmail(email);
      setSent(true);
    } catch {
      setErr(t('login_error'));
    }
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="login-overlay" onClick={onClose}>
      <div
        className="login-modal-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <h2 id="login-modal-title" className="login-modal-title">{t('login_title')}</h2>
        {sent ? (
          <p role="status">{t('login_sent')}</p>
        ) : (
          <form onSubmit={handleSend}>
            <label htmlFor="login-email">{t('login_email_label')}</label>
            <input
              id="login-email"
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ta@jishee.mn"
              aria-describedby={err ? 'login-error' : undefined}
            />
            {err && <p id="login-error" className="login-error" role="alert">{err}</p>}
            <Button type="submit" variant="primary">{t('login_button')}</Button>
          </form>
        )}
        <button className="login-modal-close" onClick={onClose} aria-label="Цонхыг хаах">{t('close')}</button>
      </div>
    </div>,
    document.body,
  );
}
