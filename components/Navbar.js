'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/useAuth';
import { isAdmin } from '../lib/adminService';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, loginWithEmail, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(null);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    if (user) isAdmin().then(setAdmin);
    else setAdmin(false);
  }, [user]);

  useEffect(() => {
    if (!showLogin) return;
    function handleKey(e) {
      if (e.key === 'Escape') setShowLogin(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showLogin]);

  async function handleSend(e) {
    e.preventDefault();
    setErr(null);
    try {
      await loginWithEmail(email);
      setSent(true);
    } catch (e2) {
      setErr('Алдаа гарлаа. Имэйлээ шалгаад дахин оролдоно уу.');
    }
  }

  return (
    <header className="navbar">
      <Link href="/" className="brand" aria-label="МӨР — Нүүр хуудас">
        <span className="brand-mark" aria-hidden="true">М</span>
        <span>МӨР</span>
      </Link>
      <nav aria-label="Үндсэн цэс">
        <Link href="/report-lost" className="nav-link-desktop">Алдсан</Link>
        <Link href="/report-found" className="nav-link-desktop">Олдсон</Link>
        <Link href="/listings" className="nav-link-desktop">Жагсаалт</Link>
        <Link href="/my-pets" className="nav-link-desktop">Миний амьтад</Link>
        {admin && <Link href="/admin" className="nav-link-desktop" style={{ color: 'var(--accent)' }}>🛡️ Админ</Link>}
        <ThemeToggle />
        {user ? (
          <button onClick={logout} className="link-btn">Гарах ({user.email})</button>
        ) : (
          <button onClick={() => setShowLogin(true)} className="link-btn">Нэвтрэх</button>
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
            <h2 id="login-modal-title" style={{ fontSize: 16, marginBottom: 12 }}>Нэвтрэх</h2>
            {sent ? (
              <p role="status">✅ Нэвтрэх холбоос имэйл рүү тань илгээгдлээ. Имэйлээ шалгаарай.</p>
            ) : (
              <form onSubmit={handleSend}>
                <label htmlFor="login-email">Имэйл хаяг</label>
                <input
                  id="login-email"
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ta@jishee.mn"
                  aria-describedby={err ? 'login-error' : undefined}
                />
                {err && <p id="login-error" className="err" role="alert">{err}</p>}
                <button type="submit" className="btn-primary">Нэвтрэх холбоос авах</button>
              </form>
            )}
            <button className="close" onClick={() => setShowLogin(false)} aria-label="Цонхыг хаах">Хаах</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .navbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 24px; background: var(--brand); color: #fff;
        }
        .brand { display: flex; align-items: center; gap: 8px; color: #fff; text-decoration: none; font-weight: 700; font-size: 18px; }
        .brand-mark {
          width: 30px; height: 30px; border-radius: 8px; background: var(--accent); color: var(--brand);
          display: flex; align-items: center; justify-content: center; font-weight: 700;
        }
        nav { display: flex; gap: 18px; align-items: center; }
        @media (max-width: 640px) {
          .nav-link-desktop { display: none; }
        }
        nav :global(a), .link-btn {
          color: #DCE9EC; text-decoration: none; font-size: 14px;
          background: none; border: none; cursor: pointer; font-family: inherit;
        }
        nav :global(a:hover), .link-btn:hover { color: #fff; }
        :global(a:focus-visible), .link-btn:focus-visible {
          outline: 2px solid #fff; outline-offset: 2px; border-radius: 4px;
        }
        .overlay {
          position: fixed; inset: 0; background: var(--overlay);
          display: flex; align-items: center; justify-content: center; z-index: 100;
        }
        .modal { background: var(--card); border-radius: 16px; padding: 24px; max-width: 320px; width: 90%; color: var(--ink); }
        .modal label { font-size: 13px; font-weight: 600; color: var(--primary); display: block; margin-bottom: 6px; }
        .modal input {
          width: 100%; padding: 10px 12px; border: 1.5px solid var(--line); border-radius: 9px;
          font-size: 14px; margin-bottom: 12px;
        }
        .btn-primary {
          width: 100%; padding: 11px; border-radius: 9px; border: none;
          background: var(--brand); color: #fff; font-weight: 600; cursor: pointer;
        }
        .err { color: var(--alert); font-size: 12.5px; margin-bottom: 8px; }
        .close { margin-top: 12px; background: none; border: none; color: var(--muted); font-size: 12.5px; cursor: pointer; }
      `}</style>
    </header>
  );
}
