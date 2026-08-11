'use client';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../lib/useAuth';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import Modal from './ui/Modal';

/** Имэйл (magic link) нэвтрэх модал — Navbar-аас салгагдсан. */
export default function LoginModal({ onClose }: { onClose: () => void }) {
  const { loginWithEmail } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
    <Modal open onClose={onClose} title={t('login_title')} closeLabel={t('close')} width="sm" panelClassName="login-modal-panel">
        {sent ? (
          <p className="login-sent" role="status">{t('login_sent')}</p>
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
    </Modal>
  );
}
