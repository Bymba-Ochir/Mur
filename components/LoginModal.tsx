'use client';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../lib/useAuth';
import { useLanguage } from '../lib/i18n';

/** Имэйл (magic link) нэвтрэх модал — Navbar-аас салгагдсан. */
export default function LoginModal({ onClose }: { onClose: () => void }) {
  const { loginWithEmail } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
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

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <h2 id="login-modal-title" className="login-title">{t('login_title')}</h2>
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
            {err && <p id="login-error" className="err" role="alert">{err}</p>}
            <button type="submit" className="btn btn-primary">{t('login_button')}</button>
          </form>
        )}
        <button className="close" onClick={onClose} aria-label="Цонхыг хаах">{t('close')}</button>

        <style jsx>{`
          .overlay {
            position: fixed; inset: 0; background: var(--overlay);
            display: flex; align-items: center; justify-content: center; z-index: 100;
            animation: fadeIn 0.15s ease;
            padding: var(--sp-4);
          }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .modal {
            background: var(--card); border-radius: var(--r-lg); padding: 28px; max-width: 320px; width: 100%; color: var(--ink);
            box-shadow: var(--shadow-lift);
          }
          @media (max-width: 480px) {
            .modal { padding: 24px 20px; border-radius: var(--r-md); max-width: 100%; }
          }
          .modal h2 { font-family: var(--font-display); font-size: var(--text-xl); margin: 0 0 var(--sp-3); }
          .modal label { font-size: 13px; font-weight: 600; color: var(--primary); display: block; margin-bottom: 6px; }
          @media (max-width: 480px) {
            .modal label { font-size: 14px; }
          }
          .modal input {
            width: 100%; padding: var(--sp-2) var(--sp-3); border: 1.5px solid var(--line); border-radius: var(--r-sm);
            font-size: var(--text-base); margin-bottom: var(--sp-3); font-family: var(--font-body); background: var(--card); color: var(--ink);
            min-height: var(--touch-target);
          }
          @media (max-width: 480px) {
            .modal input { font-size: 16px; padding: 12px 14px; }
          }
          .modal .btn-primary { width: 100%; min-height: var(--touch-target); }
          .err { color: var(--alert); font-size: 12.5px; margin-bottom: 8px; }
          @media (max-width: 480px) {
            .err { font-size: 13px; }
          }
          .close { margin-top: 14px; background: none; border: none; color: var(--muted); font-size: 12.5px; cursor: pointer; min-height: var(--touch-target-sm); }
          @media (max-width: 480px) {
            .close { font-size: 13px; margin-top: 16px; }
          }
        `}</style>
      </div>
    </div>
  );
}
