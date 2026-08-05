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
        <h2 id="login-modal-title" style={{ fontSize: 16, marginBottom: 12 }}>{t('login_title')}</h2>
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
          }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .modal {
            background: var(--card); border-radius: var(--r-lg); padding: 28px; max-width: 320px; width: 90%; color: var(--ink);
            box-shadow: var(--shadow-lift);
          }
          .modal h2 { font-family: var(--font-display); }
          .modal label { font-size: 13px; font-weight: 600; color: var(--primary); display: block; margin-bottom: 6px; }
          .modal input {
            width: 100%; padding: 11px 13px; border: 1.5px solid var(--line); border-radius: var(--r-sm);
            font-size: 14px; margin-bottom: 12px; font-family: var(--font-body); background: var(--card); color: var(--ink);
          }
          .modal .btn-primary { width: 100%; }
          .err { color: var(--alert); font-size: 12.5px; margin-bottom: 8px; }
          .close { margin-top: 14px; background: none; border: none; color: var(--muted); font-size: 12.5px; cursor: pointer; }
        `}</style>
      </div>
    </div>
  );
}
