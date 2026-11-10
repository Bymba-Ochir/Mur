'use client';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../lib/useAuth';
import { googleLoginEnabled } from '../lib/supabaseClient';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import Modal from './ui/Modal';
import FieldHint from './ui/FieldHint';
import styles from './LoginModal.module.css';

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
    <Modal open onClose={onClose} title={t('login_title')} closeLabel={t('close')} width="sm" panelClassName={styles.panel}>
        {sent ? (
          <p className={styles.lead} role="status">{t('login_sent')}</p>
        ) : googleLoginEnabled ? (
          <>
            <p className={styles.lead}>{t('login_google_hint')}</p>
            <Button className={styles.submit} onClick={handleGoogle} disabled={openingGoogle} aria-busy={openingGoogle}>
              {t(openingGoogle ? 'login_google_opening' : 'login_google')}
            </Button>
            {err && <p className={styles.error} role="alert">{err}</p>}
          </>
        ) : (
          <form onSubmit={handleSend}>
            <label htmlFor="login-email">{t('login_email_label')}</label>
            <FieldHint mn="Нууц үг шаардахгүй. Энэ имэйл рүү нэг удаагийн нэвтрэх холбоос очно. Ирэхгүй бол Spam/Junk хавтсаа шалгана уу." en="No password is needed. A one-time sign-in link will be sent to this email. Check Spam/Junk if it does not arrive." />
            <input
              id="login-email"
              type="email" autoComplete="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ta@jishee.mn"
              aria-describedby={err ? 'login-error' : undefined}
            />
            {err && <p id="login-error" className={styles.error} role="alert">{err}</p>}
            <Button className={styles.submit} type="submit">{t('login_button')}</Button>
          </form>
        )}
    </Modal>
  );
}
