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
import Icon from './ui/icons';
import type { IconName } from './ui/icons';
import Button from './ui/Button';

function truncateEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.length > 3 ? local.slice(0, 3) + '...' : local;
  return `${visible}@${domain}`;
}

const PawSVG = (
  <svg viewBox="0 0 24 24" fill="none" width="17" height="17" aria-hidden="true" focusable="false">
    <path d="M12 21c-3.5-3-8-6.2-8-10.4C4 7.2 6.4 5 9.2 5c1.2 0 2.3.5 3 1.3.7-.8 1.8-1.3 3-1.3 2.8 0 5.2 2.2 5.2 5.6 0 4.2-4.5 7.4-8 10.4z" fill="#FFFFFF" />
  </svg>
);

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
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showMobileMenu]);

  useEffect(() => {
    const task = user ? isAdmin() : Promise.resolve(false);
    task.then(setAdmin);
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node) &&
        !mobileMenuButtonRef.current?.contains(e.target as Node)
      ) {
        setShowMobileMenu(false);
      }
    }
    if (showUserMenu || showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showMobileMenu]);

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

  const handleMobileLinkClick = () => { setShowMobileMenu(false); };

  interface NavLinkItem { href: string; label: string; icon?: IconName; }
  interface UserMenuItem { href?: string; label: string; isLink: boolean; accent?: boolean; danger?: boolean; onClick?: () => void; icon?: IconName; }

  const allLinks: NavLinkItem[] = [
    { href: '/report-lost', label: t('nav_lost'), icon: 'alert' },
    { href: '/report-found', label: t('nav_found'), icon: 'eye' },
    { href: '/listings', label: t('nav_listings'), icon: 'search' },
    { href: '/adoptions', label: t('nav_adoptions'), icon: 'heart' },
    { href: '/sitting', label: t('nav_sitting'), icon: 'home' },
    { href: '/clinics', label: t('health_tab_clinics'), icon: 'cross' },
    { href: '/assistant', label: t('assistant_nav'), icon: 'bot' },
    { href: '/messages', label: t('nav_messages'), icon: 'message' },
    { href: '/my-pets', label: t('nav_mypets'), icon: 'vaccine' },
  ];

  /* Desktop: primary text links (Алдсан/Олдсон/Жагсаалт/Үрчлүүлэх) + icon rail */
  const primaryLinks = allLinks.slice(0, 4);
  const railLinks = allLinks.slice(4);

  const userMenuItems: UserMenuItem[] = [
    { href: '/saved', label: 'Хадгалсан зүйлс', isLink: true, icon: 'search' },
    { href: '/my-pets', label: t('nav_mypets'), isLink: true, icon: 'vaccine' },
    { href: '/messages', label: t('nav_messages'), isLink: true, icon: 'message' },
    ...(admin ? [{ href: '/admin', label: t('nav_admin'), isLink: true, accent: true, icon: 'shield' as IconName }] : []),
    { label: t('nav_logout'), isLink: false, danger: true, onClick: logout },
  ];

  return (
    <header className={`navbar-wrap${scrolled ? ' scrolled' : ''}`}>
      <header className="navbar">
        {/* Brand */}
        <Link href="/" className="brand" aria-label="МӨР — Нүүр хуудас">
          <span className="brand-mark">{PawSVG}</span>
          <span className="brand-name">МӨР</span>
        </Link>

        {/* Desktop: text nav links */}
        <nav className="nav-links" aria-label="Үндсэн цэс">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link${pathname === link.href ? ' active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <span className="nav-divider" aria-hidden="true" />

        {/* Desktop: icon rail (compact circles) */}
        <div className="icon-rail">
          {railLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`icon-rail-btn${pathname === link.href ? ' active' : ''}`}
              data-tip={link.label}
              aria-label={link.label}
            >
              {link.icon && <Icon name={link.icon} size={17} />}
            </Link>
          ))}
          {admin && (
            <Link
              href="/admin"
              className={`icon-rail-btn is-admin${pathname === '/admin' ? ' active' : ''}`}
              data-tip={t('nav_admin')}
              aria-label={t('nav_admin')}
            >
              <Icon name="shield" size={17} />
            </Link>
          )}
        </div>

        {/* Right side: donate + toggles + user/account */}
        <div className="nav-right">
          <DonateButton />
          <LanguageToggle />
          <ThemeToggle />
          {user ? (
            <div className="user-menu" ref={userMenuRef}>
              <button
                className="user-pill"
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
                        onClick={() => setShowUserMenu(false)}
                      >
                        {item.icon && <Icon name={item.icon} size={16} aria-hidden="true" />}
                        {item.label}
                      </Link>
                    ) : (
                      <button
                        key={idx}
                        className={`dropdown-item${item.danger ? ' dropdown-danger' : ''}`}
                        role="menuitem"
                        onClick={() => { item.onClick?.(); setShowUserMenu(false); }}
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
        </div>

        {/* Mobile: hamburger only */}
        <div className="mobile-actions">
          <button
            ref={mobileMenuButtonRef}
            className={`mobile-menu-btn ${showMobileMenu ? 'active' : ''}`}
            onClick={() => setShowMobileMenu((open) => !open)}
            aria-expanded={showMobileMenu}
            aria-controls="mobile-menu"
            aria-label={showMobileMenu ? t('nav_close_menu') : t('nav_open_menu')}
          >
            <span className="menu-icon">
              <span className="menu-line" />
              <span className="menu-line" />
              <span className="menu-line" />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Dropdown */}
      {showMobileMenu && (
        <div
          id="mobile-menu"
          className="mobile-dropdown"
          ref={mobileMenuRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
        >
          <div className="mobile-dropdown-inner">
            <nav className="mobile-nav" aria-label="Мобайл цэс">
              {allLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`mobile-nav-link${pathname === link.href ? ' active' : ''}`}
                  onClick={handleMobileLinkClick}
                >
                  {link.icon && <Icon name={link.icon} size={18} aria-hidden="true" />}
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
                  <Icon name="shield" size={18} aria-hidden="true" />
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
                    <Button variant="danger" fullWidth onClick={() => { logout(); setShowMobileMenu(false); }}>
                      {t('nav_logout')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="primary" fullWidth onClick={() => { setShowLogin(true); setShowMobileMenu(false); }}>
                  {t('nav_login')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      <style jsx>{`
        /* ─── Outer wrapper — floating dock ─── */
        .navbar-wrap {
          position: fixed;
          top: 16px;
          left: 0;
          right: 0;
          z-index: 90;
          display: flex;
          justify-content: center;
          padding: 0 var(--sp-5);
          pointer-events: none;
        }

        /* ─── Navbar bar (floating dock) ─── */
        .navbar {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: var(--sp-3);
          width: 100%;
          max-width: 1160px;
          height: 60px;
          padding: 0 var(--sp-4);
          background: var(--glass-bg);
          -webkit-backdrop-filter: var(--glass-blur);
          backdrop-filter: var(--glass-blur);
          border: 1px solid var(--glass-border);
          border-radius: var(--r-lg);
          box-shadow: var(--shadow-sm);
          color: var(--ink);
          transition: box-shadow 0.3s var(--ease-out), border-color 0.3s var(--ease-out), background 0.3s var(--ease-out);
        }
        .navbar-wrap.scrolled .navbar {
          box-shadow: var(--shadow-lg);
          border-color: var(--border-strong);
          background: var(--glass-bg);
        }

        @media (min-width: 1440px) {
          .navbar { padding: 0 var(--sp-6); }
        }
        @media (max-width: 768px) {
          .navbar-wrap { padding: 0 var(--sp-3); }
          .navbar { height: 52px; }
        }
        @media (max-width: 480px) {
          .navbar-wrap { padding: 0 var(--sp-2); }
          .navbar { height: 48px; padding: 0 var(--sp-2); }
        }

        /* ─── Brand ─── */
        .brand {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          color: var(--ink);
          text-decoration: none;
          flex-shrink: 0;
          transition: transform 0.2s var(--ease-out);
        }
        .brand:hover { transform: scale(1.02); }
        .brand-name {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: var(--text-base);
          letter-spacing: 0.01em;
        }
        @media (min-width: 1025px) {
          .brand-name { font-size: var(--text-lg); }
        }
        .brand-mark {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: var(--grad-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-xs);
          transition: transform 0.2s var(--ease-out);
        }
        .brand:hover .brand-mark { transform: rotate(-8deg) scale(1.06); }
        @media (max-width: 480px) {
          .brand-mark { width: 28px; height: 28px; }
          .brand-name { font-size: var(--text-sm); }
        }

        /* ─── Desktop text nav links ─── */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 1;
          padding-left: var(--sp-3);
        }
        .nav-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 13px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: var(--text-sm);
          font-weight: 500;
          border-radius: var(--r-pill);
          transition: color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
          white-space: nowrap;
        }
        .nav-link:hover { color: var(--text-primary); background: var(--surface-3); }
        .nav-link.active { color: var(--text-primary); background: var(--surface-3); font-weight: 600; }

        /* Medium desktop: preserve the action rail without squeezing the CTA. */
        @media (max-width: 1180px) {
          .nav-links { display: none; }
          .nav-divider { display: none; }
        }

        /* ─── Divider ─── */
        .nav-divider {
          width: 1px;
          height: 20px;
          background: var(--border-subtle);
          flex-shrink: 0;
          margin: 0 var(--sp-1);
        }
        @media (max-width: 1180px) {
          .nav-divider { display: none; }
        }

        /* ─── Desktop icon rail ─── */
        .icon-rail {
          display: flex;
          align-items: center;
          gap: clamp(4px, 0.45vw, 8px);
          background: var(--surface-2);
          border: 1px solid var(--border-subtle);
          border-radius: var(--r-pill);
          padding: 5px 7px;
          flex-shrink: 0;
        }
        .icon-rail-btn {
          width: clamp(34px, 2.7vw, 38px);
          height: 36px;
          flex: 0 0 auto;
          border-radius: var(--r-pill);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          position: relative;
          text-decoration: none;
          transition: color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
        }
        .icon-rail-btn:hover { color: var(--text-primary); background: var(--surface-3); }
        .icon-rail-btn.active { color: var(--text-primary); background: var(--surface-3); }
        .icon-rail-btn.is-admin { color: var(--primary-light); }

        .icon-rail-btn[data-tip]:hover::after {
          content: attr(data-tip);
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: var(--surface-2);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          font-size: 11.5px;
          font-weight: 500;
          padding: 5px 9px;
          border-radius: 7px;
          white-space: nowrap;
          box-shadow: var(--shadow-sm);
          pointer-events: none;
          z-index: 5;
        }

        @media (max-width: 1040px) {
          .icon-rail { display: none; }
        }

        @media (min-width: 1041px) and (max-width: 1100px) {
          .icon-rail { gap: 4px; padding-inline: 5px; }
          .icon-rail-btn { width: 34px; }
        }

        /* ─── Right side actions ─── */
        .nav-right {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          flex-shrink: 0;
          margin-left: auto;
        }

        /* ─── User menu pill + dropdown ─── */
        .user-menu { position: relative; }
        .user-pill {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 4px 5px;
          border-radius: var(--r-pill);
          background: var(--surface-2);
          border: 1px solid var(--border-subtle);
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
        }
        .user-pill:hover { border-color: var(--border-strong); background: var(--surface-3); }
        .user-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--grad-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-on-accent);
          font-size: 11px;
          font-weight: 700;
          line-height: 1;
        }
        .user-email {
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @media (min-width: 1200px) {
          .user-email { max-width: 160px; }
        }
        .user-chevron {
          font-size: 10px;
          color: var(--text-secondary);
          opacity: 0.6;
          margin-right: 6px;
          transition: transform 0.15s ease;
        }

        .user-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          min-width: 210px;
          background: var(--surface-2);
          border: 1px solid var(--border-subtle);
          border-radius: var(--r-md);
          padding: 6px;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          z-index: 100;
          max-height: calc(100vh - 100px);
          overflow-y: auto;
          animation: dropdownIn 0.2s var(--ease-out);
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          min-height: var(--touch-target);
          padding: 11px 12px;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--r-sm);
          transition: background var(--dur-fast) var(--ease-out);
        }
        .dropdown-item:hover { background: var(--surface-3); color: var(--text-primary); }
        .dropdown-accent { color: var(--accent); }
        .dropdown-danger { color: var(--alert); }

        /* ─── Shared focus-visible ─── */
        .link-btn:focus-visible,
        .user-pill:focus-visible,
        .dropdown-item:focus-visible,
        .mobile-menu-btn:focus-visible,
        .mobile-nav-link:focus-visible,
        .nav-link:focus-visible,
        .icon-rail-btn:focus-visible {
          outline: 2.5px solid var(--border-focus);
          outline-offset: 2px;
          border-radius: var(--r-sm);
        }

        /* ─── Mobile: hamburger ─── */
        .mobile-actions {
          display: none;
          align-items: center;
          flex-shrink: 0;
        }
        .mobile-menu-btn {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: var(--touch-target);
          height: var(--touch-target);
          background: var(--surface-2);
          border: 1px solid var(--border-subtle);
          border-radius: var(--r-pill);
          cursor: pointer;
          padding: 0;
          transition: all 0.3s var(--ease-out);
        }
        .mobile-menu-btn:hover { background: var(--surface-3); border-color: var(--border-strong); }

        .menu-icon {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 18px;
        }
        .menu-line {
          height: 2px;
          background: var(--text-secondary);
          border-radius: 2px;
          transition: all 0.3s var(--ease-out);
          transform-origin: center;
        }
        .mobile-menu-btn.active .menu-line:nth-child(1) { transform: translateY(6px) rotate(45deg); }
        .mobile-menu-btn.active .menu-line:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .mobile-menu-btn.active .menu-line:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

        /* ─── Mobile Dropdown Panel ─── */
        .mobile-dropdown {
          position: absolute;
          top: calc(16px + 52px + 8px);
          left: var(--sp-3);
          right: var(--sp-3);
          background: var(--surface-2);
          border: 1px solid var(--border-subtle);
          border-radius: var(--r-lg);
          box-shadow: var(--shadow-lg);
          z-index: 89;
          max-height: calc(100dvh - 90px);
          overflow-y: auto;
          overscroll-behavior: contain;
          pointer-events: auto;
          animation: dropdownSlide 0.25s var(--ease-out);
        }
        @keyframes dropdownSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mobile-dropdown-inner {
          display: flex;
          flex-direction: column;
        }

        .mobile-nav {
          display: flex;
          flex-direction: column;
          padding: var(--sp-3) var(--sp-3) 0;
          gap: var(--sp-1);
        }
        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          min-height: 44px;
          padding: var(--sp-2) var(--sp-3);
          color: var(--text-secondary);
          text-decoration: none;
          font-family: var(--font-body);
          font-size: 14.5px;
          font-weight: 500;
          border-radius: var(--r-md);
          transition: all 0.15s ease;
        }
        .mobile-nav-link:hover { background: var(--surface-3); color: var(--text-primary); }
        .mobile-nav-link.active { background: var(--surface-3); color: var(--text-primary); font-weight: 600; }

        .mobile-menu-actions {
          padding: var(--sp-3);
          display: flex;
          flex-direction: column;
          gap: var(--sp-3);
          border-top: 1px solid var(--border-subtle);
          margin-top: var(--sp-3);
        }
        .mobile-menu-actions :global(.donate-btn) {
          width: 100%;
          min-height: 44px;
          font-size: 14px;
          padding: 10px 16px;
        }
        .mobile-menu-row {
          display: flex;
          gap: var(--sp-2);
        }
        .mobile-menu-row > * {
          flex: 1;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-user-section {
          display: flex;
          flex-direction: column;
          gap: var(--sp-2);
          padding-top: var(--sp-2);
          border-top: 1px solid var(--border-subtle);
        }
        .mobile-user-info {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
          padding: var(--sp-2) var(--sp-3);
          background: var(--surface-3);
          border-radius: var(--r-md);
          font-size: 13px;
          color: var(--text-secondary);
        }
        .mobile-user-actions {
          display: flex;
          flex-direction: column;
          gap: var(--sp-2);
        }
        .mobile-user-actions :global(.btn-base) {
          min-height: 44px;
          font-size: 14px;
        }

        /* ─── Responsive: ≤1040px hide desktop rails, show hamburger ─── */
        @media (max-width: 1040px) {
          .mobile-actions { display: flex; }
          .nav-right :global(.donate-btn) { display: none; }
        }

        /* ─── Responsive: ≤640px hide toggles from nav-right (use hamburger) ─── */
        @media (max-width: 640px) {
          .nav-right { display: none; }
        }
      `}</style>
    </header>
  );
}
