'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from '../../../components/LoginModal';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../lib/useAuth';
import { useLanguage } from '../../../lib/i18n';
import styles from '../../recovery.module.css';

export default function AuthCompletePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [showLogin, setShowLogin] = useState(false);

  // The shared browser client exchanges the PKCE code during initialization.
  useEffect(() => {
    if (loading) return;
    if (user) router.replace('/');
    else window.history.replaceState(null, '', '/auth/complete');
  }, [loading, router, user]);

  return (
    <section className={styles.panel} aria-labelledby="login-complete-title">
      {loading || user ? (
        <>
          <h1 id="login-complete-title">{t('login_title')}</h1>
          <p className={styles.desc} role="status">{t('login_finishing')}</p>
        </>
      ) : (
        <>
          <h1 id="login-complete-title">{t('login_complete_failed')}</h1>
          <p className={styles.desc} role="alert">{t('login_complete_hint')}</p>
          <div className={styles.actions}>
            <Button className={styles.action + ' ' + styles.primary} onClick={() => setShowLogin(true)}>{t('nav_login')}</Button>
            <Button as="link" href="/" className={styles.action} variant="ghost">{t('nf_home')}</Button>
          </div>
        </>
      )}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </section>
  );
}
