'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { FormEvent } from 'react';
import { useAuth } from '../lib/useAuth';
import { isAdmin } from '../lib/adminService';
import ThemeToggle from './ThemeToggle';
import DonateButton from './DonateButton';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../lib/i18n';

export default function Navbar() {
  const { user, loginWithEmail, logout } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    const task = user ? isAdmin() : Promise.resolve(false);
    task.then(setAdmin);
  }, [user]);

  useEffect(() => {
    if (!showLogin) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowLogin(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showLogin]);

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
    <header className="navbar">
      <Link href="/" className="brand" aria-label="МӨР — Нүүр хуудас">
        <span className="brand-mark" aria-hidden="true">М</span>
        <span className="brand-name">МӨР</span>
      </Link>
      <nav aria-label="Үндсэн цэс">
        <Link href="/report-lost" className={`nav-link-desktop${pathname === '/report-lost' ? ' active' : ''}`}>{t('nav_lost')}</Link>
        <Link href="/report-found" className={`nav-link-desktop${pathname === '/report-found' ? ' active' : ''}`}>{t('nav_found')}</Link>
        <Link href="/listings" className={`nav-link-desktop${pathname === '/listings' ? ' active' : ''}`}>{t('nav_listings')}</Link>
        <Link href="/my-pets" className={`nav-link-desktop${pathname === '/my-pets' ? ' active' : ''}`}>{t('nav_mypets')}</Link>
        {admin && <Link href="/admin" className={`nav-link-desktop${pathname === '/admin' ? ' active' : ''}`} style={{ color: 'var(--accent)' }}>{t('nav_admin')}</Link>}
        <DonateButton />
        <LanguageToggle />
        <ThemeToggle />
        {user ? (
          <button onClick={logout} className="link-btn">{t('nav_logout_prefix')} <span className="email-hide">({user.email})</span></button>
        ) : (
          <button onClick={() => setShowLogin(true)} className="link-btn">{t('nav_login')}</button>
        )}
      </nav>

      {showLogin && (
        <div className="overlay" onClick={() => setShowLogin(false)}>
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
            <button className="close" onClick={() => setShowLogin(false)} aria-label="Цонхыг хаах">{t('close')}</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .navbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 28px;
          background: var(--glass-bg);
          -webkit-backdrop-filter: var(--glass-blur);
          backdrop-filter: var(--glass-blur);
          border-bottom: 1px solid var(--glass-border);
          color: var(--ink);
          position: sticky; top: 0; z-index: 90;
        }
        .brand { display: flex; align-items: center; gap: 10px; color: var(--primary); text-decoration: none; }
        .brand-name { font-family: var(--font-display); font-weight: 700; font-size: 18px; letter-spacing: -0.01em; }
        .brand-mark {
          width: 32px; height: 32px; border-radius: 10px;
          background: var(--grad-accent); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-weight: 700; font-size: 15px;
          box-shadow: var(--shadow-sm);
        }
        nav { display: flex; gap: 20px; align-items: center; }
        @media (max-width: 640px) {
          .nav-link-desktop { display: none; }
          .navbar { padding: 12px 16px; }
          .email-hide { display: none; }
        }
        nav :global(a), .link-btn {
          color: var(--muted); text-decoration: none; font-size: 13.5px; font-weight: 500;
          background: none; border: none; cursor: pointer; font-family: var(--font-body);
          transition: color 0.15s ease;
        }
        nav :global(a:hover), .link-btn:hover { color: var(--primary); }
        .nav-link-desktop { position: relative; }
        .nav-link-desktop.active { color: var(--primary); font-weight: 600; }
        .nav-link-desktop.active::after {
          content: ''; position: absolute; left: 0; right: 0; bottom: -6px; height: 2px;
          border-radius: 2px; background: var(--grad-accent);
        }
        :global(a:focus-visible), .link-btn:focus-visible {
          outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px;
        }
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
    </header>
  );
}
