'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/useAuth';
import { isAdmin } from '../lib/adminService';
import ThemeToggle from './ThemeToggle';
import DonateButton from './DonateButton';
import LanguageToggle from './LanguageToggle';
import LoginModal from './LoginModal';
import { useLanguage } from '../lib/i18n';

function truncateEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.length > 3 ? local.slice(0, 3) + '...' : local;
  return `${visible}@${domain}`;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [showLogin, setShowLogin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [admin, setAdmin] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileMenu]);

  useEffect(() => {
    const task = user ? isAdmin() : Promise.resolve(false);
    task.then(setAdmin);
  }, [user]);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setShowMobileMenu(false);
      }
    }
    if (showUserMenu || showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showMobileMenu]);

  // Escape key to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        setShowMobileMenu(false);
        setShowLogin(false);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Close mobile menu on link click
  const handleMobileLinkClick = () => {
    setShowMobileMenu(false);
  };

interface NavLinkItem { href: string; label: string; } interface UserMenuItem { href?: string; label: string; isLink: boolean; accent?: boolean; danger?: boolean; onClick?: () => void; }
  const navLinks: NavLinkItem[] = [
    { href: '/report-lost', label: t('nav_lost') },
    { href: '/report-found', label: t('nav_found') },
    { href: '/listings', label: t('nav_listings') },
    { href: '/my-pets', label: t('nav_mypets') },
  ];

  const userMenuItems: UserMenuItem[] = [
    { href: '/my-pets', label: t('nav_mypets'), isLink: true },
    ...(admin ? [{ href: '/admin', label: t('nav_admin'), isLink: true, accent: true }] : []),
    { label: t('nav_logout'), isLink: false, danger: true, onClick: logout },
  ];

  return (
    <header className="navbar">
      <Link href="/" className="brand" aria-label="МӨР — Нүүр хуудас">
        <span className="brand-mark" aria-hidden="true">М</span>
        <span className="brand-name">МӨР</span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="nav-desktop" aria-label="Үндсэн цэс">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link${pathname === link.href ? ' active' : ''}`}
            onClick={handleMobileLinkClick}
          >
            {link.label}
          </Link>
        ))}
        {admin && (
          <Link
            href="/admin"
            className={`nav-link${pathname === '/admin' ? ' active' : ''}`}
            style={{ color: 'var(--accent)' }}
            onClick={handleMobileLinkClick}
          >
            {t('nav_admin')}
          </Link>
        )}
        <DonateButton />
        <LanguageToggle />
        <ThemeToggle />
        {user ? (
          <div className="user-menu" ref={userMenuRef}>
            <button
              className="user-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-expanded={showUserMenu}
              aria-haspopup="true"
              aria-label={t('nav_user_menu_label')}
            >
              <span className="user-avatar" aria-hidden="true">👤</span>
              <span className="user-email">{user.email ? truncateEmail(user.email) : ''}</span>
              <span className="user-chevron" aria-hidden="true">{showUserMenu ? '▲' : '▼'}</span>
            </button>
            {showUserMenu && (
              <div className="user-dropdown" role="menu">
                {userMenuItems.map((item, idx) => (
                  item.isLink && item.href ? (
                    <Link
                      key={idx}
                      href={item.href}
                      className={`dropdown-item${item.accent ? ' dropdown-accent' : ''}`}
                      role="menuitem"
                      style={item.accent ? { color: 'var(--accent)' } : undefined}
                      onClick={handleMobileLinkClick}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={idx}
                      className={`dropdown-item${item.danger ? ' dropdown-danger' : ''}`}
                      role="menuitem"
                      onClick={item.onClick}
                    >
                      {item.label}
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        ) : (
          <button className="link-btn btn-base" onClick={() => setShowLogin(true)}>
            {t('nav_login')}
          </button>
        )}
      </nav>

      {/* Mobile Menu Button */}
      <div className="mobile-actions">
        <DonateButton />
        <button
          className={`mobile-menu-btn ${showMobileMenu ? 'active' : ''}`}
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          aria-expanded={showMobileMenu}
          aria-controls="mobile-menu"
          aria-label={showMobileMenu ? t('nav_close_menu') : t('nav_open_menu')}
        >
          <span className="menu-icon">
            <span className="menu-line"></span>
            <span className="menu-line"></span>
            <span className="menu-line"></span>
          </span>
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {showMobileMenu && (
        <div
          id="mobile-menu"
          className="mobile-menu-overlay"
          onClick={() => setShowMobileMenu(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
        >
          <div className="mobile-menu-panel" ref={mobileMenuRef} onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <h2 id="mobile-menu-title" className="eyebrow">{t('nav_menu_title')}</h2>
              <button
                className="mobile-close-btn"
                onClick={() => setShowMobileMenu(false)}
                aria-label={t('nav_close_menu')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="mobile-nav" aria-label="Мобайл цэс">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`mobile-nav-link${pathname === link.href ? ' active' : ''}`}
                  onClick={handleMobileLinkClick}
                >
                  {link.label}
                </Link>
              ))}
              {admin && (
                <Link
                  href="/admin"
                  className={`mobile-nav-link${pathname === '/admin' ? ' active' : ''}`}
                  style={{ color: 'var(--accent)' }}
                  onClick={handleMobileLinkClick}
                >
                  {t('nav_admin')}
                </Link>
              )}
            </nav>
            <div className="mobile-menu-actions">
              <DonateButton />
              <div className="mobile-menu-row">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              {user ? (
                <div className="mobile-user-section">
                  <div className="mobile-user-info">
                    <span className="user-avatar" aria-hidden="true">👤</span>
                    <span>{user.email ? truncateEmail(user.email) : t('nav_guest')}</span>
                  </div>
                  <div className="mobile-user-actions">
                    <Link href="/my-pets" className="btn-base btn-ghost" onClick={handleMobileLinkClick}>
                      {t('nav_mypets')}
                    </Link>
                    {admin && (
                      <Link href="/admin" className="btn-base btn-ghost" style={{ color: 'var(--accent)' }} onClick={handleMobileLinkClick}>
                        {t('nav_admin')}
                      </Link>
                    )}
                    <button className="btn-base btn-danger" onClick={logout}>
                      {t('nav_logout')}
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn-base btn-primary" style={{ width: '100%' }} onClick={() => { setShowLogin(true); setShowMobileMenu(false); }}>
                  {t('nav_login')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      <style jsx>{`
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--sp-3);
          padding: var(--sp-3) var(--sp-4);
          background: var(--glass-bg);
          -webkit-backdrop-filter: var(--glass-blur);
          backdrop-filter: var(--glass-blur);
          border-bottom: 1px solid var(--glass-border);
          color: var(--ink);
          position: sticky;
          top: 0;
          z-index: 90;
          min-height: var(--touch-target);
        }

        @media (min-width: 1440px) {
          .navbar { padding: var(--sp-4) max(calc((100vw - 1200px) / 2), var(--sp-4)); }
        }

        .brand {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          color: var(--primary);
          text-decoration: none;
          flex-shrink: 0;
        }
        .brand-name {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: var(--text-xl);
          letter-spacing: -0.02em;
        }
        @media (min-width: 1025px) {
          .brand-name { font-size: var(--text-2xl); }
        }
        .brand-mark {
          width: 36px;
          height: 36px;
          border-radius: var(--r-sm);
          background: var(--grad-accent);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: var(--text-base);
          box-shadow: var(--shadow-sm);
        }
        @media (min-width: 1025px) {
          .brand-mark { width: 40px; height: 40px; font-size: 15px; }
        }

        /* Desktop Navigation */
        .nav-desktop {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          flex: 1;
          justify-content: flex-end;
          min-width: 0;
        }
        @media (min-width: 1200px) {
          .nav-desktop { gap: var(--sp-3); }
        }
        .nav-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: var(--touch-target);
          padding: var(--sp-2) var(--sp-3);
          color: var(--muted);
          text-decoration: none;
          font-family: var(--font-body);
          font-size: var(--text-sm);
          font-weight: 500;
          border-radius: var(--r-md);
          transition: color 0.15s ease, background 0.15s ease;
          white-space: nowrap;
        }
        @media (min-width: 1025px) {
          .nav-link { font-size: var(--text-base); padding: var(--sp-2) var(--sp-4); }
        }
        .nav-link:hover { color: var(--primary); background: var(--eyebrow-bg); }
        .nav-link.active {
          color: var(--primary);
          font-weight: 600;
          background: var(--eyebrow-bg);
        }
        .nav-link:focus-visible,
        .link-btn:focus-visible,
        .user-btn:focus-visible,
        .dropdown-item:focus-visible,
        .mobile-menu-btn:focus-visible,
        .mobile-nav-link:focus-visible {
          outline: 2.5px solid var(--accent);
          outline-offset: 2px;
          border-radius: var(--r-sm);
        }

        /* User Menu Dropdown (Desktop) */
        .user-menu { position: relative; }
        .user-btn {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          min-height: var(--touch-target);
          padding: var(--sp-2) var(--sp-3);
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: var(--r-pill);
          cursor: pointer;
          font-family: var(--font-body);
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--ink);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .user-btn:hover { border-color: var(--accent); box-shadow: var(--shadow-sm); }
        .user-avatar { font-size: var(--text-base); line-height: 1; }
        .user-email {
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @media (min-width: 1025px) {
          .user-email { max-width: 180px; }
        }
        .user-chevron {
          font-size: var(--text-2xs);
          color: var(--muted);
          margin-left: var(--sp-1);
          transition: transform 0.15s ease;
        }

        .user-dropdown {
          position: absolute;
          top: calc(100% + var(--sp-2));
          right: 0;
          min-width: 200px;
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: var(--r-lg);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          z-index: 100;
          animation: dropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          width: 100%;
          min-height: var(--touch-target);
          padding: var(--sp-3) var(--sp-4);
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: var(--text-base);
          font-weight: 500;
          color: var(--ink);
          text-decoration: none;
          transition: background 0.15s ease;
        }
        .dropdown-item:hover { background: var(--eyebrow-bg); }
        .dropdown-accent { color: var(--accent); }
        .dropdown-danger { color: var(--alert); }
        .dropdown-danger:hover { background: var(--alert-bg); }

        /* Mobile Actions Container */
        .mobile-actions {
          display: none;
          align-items: center;
          gap: var(--sp-2);
        }

        .mobile-actions :global(.donate-btn) {
          min-height: 40px;
          font-size: 13px;
          padding: 8px 14px;
        }

        @media (max-width: 480px) {
          .mobile-actions :global(.donate-btn) {
            min-height: 38px;
            font-size: 12px;
            padding: 6px 12px;
          }
        }

        /* Mobile Menu Button */
        .mobile-menu-btn {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: var(--touch-target);
          height: var(--touch-target);
          background: transparent;
          border: 1.5px solid var(--line);
          border-radius: var(--r-md);
          cursor: pointer;
          padding: 0;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .mobile-menu-btn:hover {
          background: var(--eyebrow-bg);
          border-color: var(--primary);
        }

        .menu-icon {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 18px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .menu-line {
          height: 2px;
          background: var(--ink);
          border-radius: 2px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: center;
        }

        .mobile-menu-btn.active .menu-line:nth-child(1) {
          transform: translateY(6px) rotate(45deg);
        }

        .mobile-menu-btn.active .menu-line:nth-child(2) {
          opacity: 0;
          transform: scaleX(0);
        }

        .mobile-menu-btn.active .menu-line:nth-child(3) {
          transform: translateY(-6px) rotate(-45deg);
        }

        /* Mobile Menu Overlay */
        .mobile-menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          justify-content: flex-end;
          z-index: 200;
          animation: fadeIn 0.25s ease;
          padding-bottom: var(--safe-bottom);
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .mobile-menu-panel {
          width: 100%;
          max-width: 360px;
          height: 100dvh;
          background: var(--card);
          border-left: 1px solid var(--line);
          box-shadow: -8px 0 32px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .mobile-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--sp-5) var(--sp-4);
          border-bottom: 1px solid var(--line);
          background: var(--bg);
        }

        .mobile-menu-header :global(.eyebrow) {
          margin-bottom: 0;
        }

        .mobile-close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: transparent;
          border: 1.5px solid var(--line);
          border-radius: var(--r-md);
          cursor: pointer;
          color: var(--ink);
          transition: all 0.2s ease;
        }

        .mobile-close-btn:hover {
          background: var(--eyebrow-bg);
          border-color: var(--primary);
          transform: rotate(90deg);
        }

        .mobile-nav {
          display: flex;
          flex-direction: column;
          padding: var(--sp-4) var(--sp-3);
          gap: var(--sp-2);
          flex: 1;
          overflow-y: auto;
        }
        .mobile-nav-link {
          display: flex;
          align-items: center;
          min-height: 48px;
          padding: var(--sp-3) var(--sp-4);
          color: var(--ink);
          text-decoration: none;
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 500;
          border-radius: var(--r-md);
          transition: all 0.2s ease;
        }
        .mobile-nav-link:hover {
          background: var(--eyebrow-bg);
          color: var(--primary);
          transform: translateX(4px);
        }
        .mobile-nav-link.active {
          background: var(--eyebrow-bg);
          color: var(--primary);
          font-weight: 600;
        }

        .mobile-menu-actions {
          margin-top: auto;
          padding: var(--sp-5) var(--sp-4) calc(var(--sp-6) + var(--safe-bottom));
          display: flex;
          flex-direction: column;
          gap: var(--sp-4);
          border-top: 1px solid var(--line);
          background: var(--bg);
        }

        .mobile-menu-actions :global(.donate-btn) {
          width: 100%;
          min-height: 48px;
          font-size: 15px;
          padding: 12px 20px;
        }

        .mobile-menu-row {
          display: flex;
          gap: var(--sp-2);
        }

        .mobile-menu-row > * {
          flex: 1;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-user-section {
          display: flex;
          flex-direction: column;
          gap: var(--sp-3);
          padding-top: var(--sp-3);
          border-top: 1px solid var(--line);
        }
        .mobile-user-info {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
          padding: var(--sp-3);
          background: var(--card);
          border-radius: var(--r-lg);
          border: 1px solid var(--line);
          font-size: 14px;
        }
        .mobile-user-actions {
          display: flex;
          flex-direction: column;
          gap: var(--sp-2);
        }

        .mobile-user-actions :global(.btn-base) {
          min-height: 48px;
          font-size: 15px;
        }

        /* Responsive Breakpoints */
        @media (max-width: 768px) {
          .nav-desktop { display: none; }
          .mobile-actions { display: flex; }
          .mobile-menu-btn { display: flex; }
          .navbar { padding: var(--sp-3) var(--sp-3); }
        }

        @media (max-width: 480px) {
          .brand-name { font-size: var(--text-lg); }
          .brand-mark { width: 32px; height: 32px; font-size: var(--text-sm); }
          .navbar { padding: var(--sp-2) var(--sp-2); min-height: 52px; }
          .mobile-menu-panel { max-width: 100%; }
          .mobile-actions { gap: var(--sp-1); }
        }

        @media (max-width: 360px) {
          .brand-name { font-size: var(--text-base); }
          .brand-mark { width: 28px; height: 28px; font-size: 12px; }
          .navbar { padding: var(--sp-1) var(--sp-2); min-height: 48px; }
        }
      `}</style>
    </header>
  );
}