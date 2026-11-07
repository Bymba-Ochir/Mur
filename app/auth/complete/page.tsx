'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from '../../../components/LoginModal';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../lib/useAuth';
import { useLanguage } from '../../../lib/i18n';

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
    <div className="page-shell page-shell--narrow">
      <div className="state-panel">
        {loading || user ? <p role="status">{t('login_finishing')}</p> : (
          <>
            <p role="alert">{t('login_google_error')}</p>
            <Button onClick={() => setShowLogin(true)}>{t('nav_login')}</Button>
          </>
        )}
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
