'use client';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../lib/useAuth';
import { googleLoginEnabled } from '../lib/supabaseClient';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import Modal from './ui/Modal';
import FieldHint from './ui/FieldHint';

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const [openingGoogle, setOpeningGoogle] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleGoogle() {
    setErr(null);
    setOpeningGoogle(true);
    try {
      await loginWithGoogle();
    } catch {
      setErr(t('login_google_error'));
    } finally {
      setOpeningGoogle(false);
    }
  }

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
        ) : googleLoginEnabled ? (
          <>
            <Button onClick={handleGoogle} disabled={openingGoogle} aria-busy={openingGoogle}>
              {t('login_google')}
            </Button>
            {err && <p className="login-error" role="alert">{err}</p>}
          </>
        ) : (
          <form onSubmit={handleSend}>
            <label htmlFor="login-email">{t('login_email_label')}</label>
            <FieldHint mn="Нууц үг шаардахгүй. Энэ имэйл рүү нэг удаагийн нэвтрэх холбоос очно. Ирэхгүй бол Spam/Junk хавтсаа шалгана уу." en="No password is needed. A one-time sign-in link will be sent to this email. Check Spam/Junk if it does not arrive." />
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
