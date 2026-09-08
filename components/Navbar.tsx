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
import { subscribeToNotifications, unreadNotificationCount } from '../lib/workflowService';

function truncateEmail(email: string): string {
  const [local] = email.split('@');
  if (!local) return email;
  return local.length > 10 ? `${local.slice(0, 9)}…` : local;
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
  const [adminState, setAdminState] = useState<{ userId: string; allowed: boolean } | null>(null);
  const admin = Boolean(user && adminState?.userId === user.id && adminState.allowed);
  const [unreadState, setUnreadState] = useState<{ userId: string; count: number } | null>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuFirstFocus = useRef<'first' | 'last'>('first');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!showUserMenu) return;
    const frame = requestAnimationFrame(() => {
      const items = userMenuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
      if (items?.length) items[userMenuFirstFocus.current === 'last' ? items.length - 1 : 0].focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [showUserMenu]);

  function handleUserMenuKey(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation(); setShowUserMenu(false); userMenuButtonRef.current?.focus(); return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    if (!items.length) return;
    event.preventDefault();
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next].focus();
  }

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1041px)');
    const closeMobile = () => { if (desktop.matches) setShowMobileMenu(false); };
    desktop.addEventListener('change', closeMobile);
    return () => desktop.removeEventListener('change', closeMobile);
  }, []);

  useEffect(() => {
    if (!showMobileMenu) return;
    const previousOverflow = document.body.style.overflow;
    const mobileTrigger = mobileMenuButtonRef.current;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.requestAnimationFrame(() => mobileCloseButtonRef.current?.focus());

    function keepFocusInside(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowMobileMenu(false);
        return;
      }
      if (event.key !== 'Tab' || !mobileMenuRef.current) return;
      const focusable = Array.from(mobileMenuRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', keepFocusInside);
    return () => {
      window.cancelAnimationFrame(focusTimer);
      document.removeEventListener('keydown', keepFocusInside);
      document.body.style.overflow = previousOverflow;
      mobileTrigger?.focus();
    };
  }, [showMobileMenu]);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const userId = user.id;
    void isAdmin().then((allowed) => {
      if (active) setAdminState({ userId, allowed });
    }).catch(() => {
      if (active) setAdminState({ userId, allowed: false });
    });
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    let requestVersion = 0;
    const userId = user.id;
    const refresh = () => {
      const version = ++requestVersion;
      void unreadNotificationCount().then((count) => {
        if (active && version === requestVersion) setUnreadState({ userId, count });
      }).catch(() => {
        if (active && version === requestVersion) setUnreadState({ userId, count: 0 });
      });
    };
    refresh();
    const unsubscribe = subscribeToNotifications(userId, refresh);
    window.addEventListener('focus', refresh);
    return () => { active = false; unsubscribe(); window.removeEventListener('focus', refresh); };
  }, [user?.id, pathname]);

  const visibleUnreadNotifications = user && unreadState?.userId === user.id ? unreadState.count : 0;

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
  const isActiveRoute = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));

  interface NavLinkItem { href: string; label: string; icon?: IconName; }
  interface UserMenuItem { href?: string; label: string; isLink: boolean; accent?: boolean; danger?: boolean; onClick?: () => void; icon?: IconName; }

  const allLinks: NavLinkItem[] = [
    { href: '/report-lost', label: t('nav_lost'), icon: 'alert' },
    { href: '/report-found', label: t('nav_found'), icon: 'eye' },
    { href: '/listings', label: t('nav_listings'), icon: 'search' },
    { href: '/adoptions', label: t('nav_adoptions'), icon: 'heart' },
    { href: '/sitting', label: t('nav_sitting'), icon: 'home' },
    { href: '/clinics', label: t('health_tab_clinics'), icon: 'cross' },
    { href: '/messages', label: t('messages_hub_nav'), icon: 'message' },
    { href: '/my-pets', label: t('nav_mypets'), icon: 'vaccine' },
  ];

  /* Desktop: primary text links (Алдсан/Олдсон/Жагсаалт/Үрчлүүлэх) + icon rail */
  const primaryLinks = allLinks.slice(0, 4);
  const railLinks = allLinks.slice(4);

  const userMenuItems: UserMenuItem[] = [
    { href: '/profile', label: t('nav_profile'), isLink: true, icon: 'paw' },
    { href: '/notifications', label: visibleUnreadNotifications ? `${t('nav_notifications')} (${visibleUnreadNotifications})` : t('nav_notifications'), isLink: true, icon: 'bell' },
    { href: '/saved', label: t('nav_saved'), isLink: true, icon: 'heart' },
    { href: '/activity', label: t('nav_activity'), isLink: true, icon: 'calendar' },
    { href: '/settings', label: t('nav_settings'), isLink: true, icon: 'lock' },
    { href: '/my-pets', label: t('nav_mypets'), isLink: true, icon: 'vaccine' },
    { href: '/messages', label: t('messages_hub_nav'), isLink: true, icon: 'message' },
    ...(admin ? [{ href: '/admin', label: t('nav_admin'), isLink: true, accent: true, icon: 'shield' as IconName }] : []),
    { label: t('nav_logout'), isLink: false, danger: true, onClick: logout },
  ];

  return (
    <header className={`navbar-wrap${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar">
        {/* Brand */}
        <Link href="/" className="brand" aria-label={t('brand_home_label')}>
          <span className="brand-mark">{PawSVG}</span>
          <span className="brand-name">МӨР</span>
        </Link>

        {/* Desktop: text nav links */}
        <nav className="nav-links" aria-label={t('nav_primary_label')}>
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link${isActiveRoute(link.href) ? ' active' : ''}`}
              aria-current={isActiveRoute(link.href) ? 'page' : undefined}
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
              className={`icon-rail-btn${isActiveRoute(link.href) ? ' active' : ''}`}
              aria-current={isActiveRoute(link.href) ? 'page' : undefined}
              data-tip={link.label}
              aria-label={link.label}
            >
              {link.icon && <Icon name={link.icon} size={17} />}
              <span className="icon-rail-label">{link.label}</span>
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
              <span className="icon-rail-label">{t('nav_admin')}</span>
            </Link>
          )}
        </div>

        {/* Right side: donate + toggles + user/account */}
        <div className="nav-right">
          <DonateButton />
          <LanguageToggle />
          <ThemeToggle />
          {user ? (
            <div className="user-menu" ref={userMenuRef} onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setShowUserMenu(false);
            }}>
              <button
                className="user-pill"
                ref={userMenuButtonRef}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault(); userMenuFirstFocus.current = event.key === 'ArrowUp' ? 'last' : 'first'; setShowUserMenu(true);
                  }
                }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-expanded={showUserMenu}
                aria-haspopup="menu"
                aria-controls="user-menu-popover"
                aria-label={t('nav_user_menu_label')}
                title={user.email ?? t('nav_user_menu_label')}
              >
                <span className="user-avatar" aria-hidden="true"><Icon name="paw" size={15} /></span>
                <span className="user-email">{user.email ? truncateEmail(user.email) : ''}</span>
                {visibleUnreadNotifications > 0 && <span className="notification-badge" aria-label={`${visibleUnreadNotifications} уншаагүй мэдэгдэл`}>{visibleUnreadNotifications > 99 ? '99+' : visibleUnreadNotifications}</span>}
                <svg className={`user-chevron${showUserMenu ? ' open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {showUserMenu && (
                <div id="user-menu-popover" className="user-dropdown" onKeyDown={handleUserMenuKey} role="menu" aria-label={t('nav_user_menu_label')}>
                  <div className="dropdown-header">
                    <span className="dropdown-avatar" aria-hidden="true"><Icon name="paw" size={17} /></span>
                    <span className="dropdown-identity">
                      <strong>{t('nav_profile')}</strong>
                      <small title={user.email ?? undefined}>{user.email ?? t('nav_guest')}</small>
                    </span>
                  </div>
                  <div className="dropdown-list">
                  {userMenuItems.map((item, idx) => (
                    item.isLink && item.href ? (
                      <Link
                        key={idx}
                        href={item.href}
                        className={`dropdown-item${item.accent ? ' dropdown-accent' : ''}`}
                        role="menuitem"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <span className="dropdown-icon" aria-hidden="true">
                          {item.icon && <Icon name={item.icon} size={17} />}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    ) : (
                      <button
                        key={idx}
                        type="button"
                        className={`dropdown-item${item.danger ? ' dropdown-danger' : ''}`}
                        role="menuitem"
                        onClick={() => { item.onClick?.(); setShowUserMenu(false); }}
                      >
                        <span className="dropdown-icon" aria-hidden="true"><Icon name="arrowRight" size={17} /></span>
                        <span>{item.label}</span>
                      </button>
                    )
                  ))}
                  </div>
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
      </div>

      {/* Mobile Dropdown */}
      {showMobileMenu && (
        <>
          <button className="mobile-backdrop" type="button" aria-label={t('nav_close_menu')} onClick={() => setShowMobileMenu(false)} />
          <div
            id="mobile-menu"
            className="mobile-dropdown"
            ref={mobileMenuRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
          >
            <div className="mobile-dropdown-inner">
              <div className="mobile-menu-heading">
                <h2 id="mobile-menu-title">{t('nav_menu_title')}</h2>
                <button ref={mobileCloseButtonRef} type="button" className="mobile-close-btn" aria-label={t('nav_close_menu')} onClick={() => setShowMobileMenu(false)}>
                  <Icon name="close" size={19} />
                </button>
              </div>
            <nav className="mobile-nav" aria-label={t('nav_mobile_label')}>
              {allLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`mobile-nav-link${isActiveRoute(link.href) ? ' active' : ''}`}
                  aria-current={isActiveRoute(link.href) ? 'page' : undefined}
                  onClick={handleMobileLinkClick}
                >
                  {link.icon && <Icon name={link.icon} size={18} aria-hidden="true" />}
                  {link.label}
                </Link>
              ))}
              {admin && (
                <Link
                  href="/admin"
                  className={`mobile-nav-link mobile-nav-link--admin${pathname === '/admin' ? ' active' : ''}`}
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
                    <span className="user-avatar" aria-hidden="true"><Icon name="paw" size={15} /></span>
                    <span>{user.email ? truncateEmail(user.email) : t('nav_guest')}</span>
                  </div>
                  <div className="mobile-user-actions">
                    <Link href="/profile" className="mobile-nav-link" onClick={handleMobileLinkClick}><Icon name="paw" size={18} /> {t('nav_profile')}</Link>
                    <Link href="/notifications" className="mobile-nav-link" onClick={handleMobileLinkClick}><Icon name="bell" size={18} /> {t('nav_notifications')} {visibleUnreadNotifications > 0 && <span className="mobile-badge">{visibleUnreadNotifications}</span>}</Link>
                    <Link href="/saved" className="mobile-nav-link" onClick={handleMobileLinkClick}><Icon name="heart" size={18} /> {t('nav_saved')}</Link>
                    <Link href="/activity" className="mobile-nav-link" onClick={handleMobileLinkClick}><Icon name="calendar" size={18} /> {t('nav_activity')}</Link>
                    <Link href="/settings" className="mobile-nav-link" onClick={handleMobileLinkClick}><Icon name="lock" size={18} /> {t('nav_settings')}</Link>
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
        </>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      <style jsx global>{`
        /* ─── Outer wrapper — floating dock ─── */
        .navbar-wrap {
          position: fixed;
          top: max(12px, env(safe-area-inset-top));
          left: 0;
          right: 0;
          z-index: 90;
          display: flex;
          justify-content: center;
          padding: 0 var(--sp-5);
          pointer-events: none;
        }

        /* ─── Navbar bar (floating dock) ─── */
        .navbar-wrap .navbar {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: var(--sp-3);
          width: 100%;
          max-width: 1360px;
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
          .navbar-wrap .navbar { padding: 0 var(--sp-6); }
        }
        @media (max-width: 768px) {
          .navbar-wrap { padding: 0 var(--sp-3); }
          .navbar-wrap .navbar { height: 52px; }
        }
        @media (max-width: 480px) {
          .navbar-wrap { padding: 0 var(--sp-2); }
          .navbar-wrap .navbar { height: 48px; padding: 0 var(--sp-2); }
        }

        /* ─── Brand ─── */
        .navbar-wrap .brand {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          color: var(--ink);
          text-decoration: none;
          flex-shrink: 0;
          transition: transform 0.2s var(--ease-out);
        }
        .navbar-wrap .brand:hover { transform: scale(1.02); }
        .navbar-wrap .brand-name {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: var(--text-base);
          letter-spacing: 0.01em;
        }
        @media (min-width: 1025px) {
          .navbar-wrap .brand-name { font-size: var(--text-lg); }
        }
        .navbar-wrap .brand-mark {
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
        .navbar-wrap .brand:hover .brand-mark { transform: rotate(-8deg) scale(1.06); }
        @media (max-width: 480px) {
          .navbar-wrap .brand-mark { width: 28px; height: 28px; }
          .navbar-wrap .brand-name { font-size: var(--text-sm); }
        }

        /* ─── Desktop text nav links ─── */
        .navbar-wrap .nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 1;
          padding-left: var(--sp-3);
        }
        .navbar-wrap .nav-link {
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
        .navbar-wrap .nav-link:hover { color: var(--text-primary); background: var(--surface-3); }
        .navbar-wrap .nav-link.active { color: var(--text-primary); background: var(--surface-3); font-weight: 600; }

        /* Medium desktop: холбоосуудыг алга болголгүй бага зэрэг шахна. */
        @media (min-width: 1041px) and (max-width: 1180px) {
          .navbar-wrap .navbar { gap: 8px; padding-inline: var(--sp-3); }
          .navbar-wrap .nav-links { gap: 0; padding-left: var(--sp-1); }
          .navbar-wrap .nav-link { padding-inline: 8px; font-size: 12.5px; }
          .navbar-wrap .nav-divider { margin-inline: 0; }
          .navbar-wrap .icon-rail { gap: 3px; padding-inline: 5px; }
          .navbar-wrap .icon-rail-btn { width: 32px; height: 34px; }
          .navbar-wrap .nav-right { gap: 5px; }
        }

        /* ─── Divider ─── */
        .navbar-wrap .nav-divider {
          width: 1px;
          height: 20px;
          background: var(--border-subtle);
          flex-shrink: 0;
          margin: 0 var(--sp-1);
        }
        /* ─── Desktop icon rail ─── */
        .navbar-wrap .icon-rail {
          display: flex;
          align-items: center;
          gap: clamp(4px, 0.45vw, 8px);
          background: var(--surface-2);
          border: 1px solid var(--border-subtle);
          border-radius: var(--r-pill);
          padding: 5px 7px;
          flex-shrink: 0;
        }
        .navbar-wrap .icon-rail-btn {
          min-width: 36px;
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
        .navbar-wrap .icon-rail-label {
          display: none;
          overflow: hidden;
          font-size: 11.5px;
          font-weight: 650;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @media (min-width: 1281px) {
          .navbar-wrap .icon-rail-btn { width: auto; gap: 6px; padding-inline: 10px; }
          .navbar-wrap .icon-rail-label { display: inline; }
          .navbar-wrap .icon-rail-btn[data-tip]::after { display: none; }
        }
        .navbar-wrap .icon-rail-btn:hover { color: var(--text-primary); background: var(--surface-3); }
        .navbar-wrap .icon-rail-btn.active { color: var(--text-primary); background: var(--surface-3); }
        .navbar-wrap .icon-rail-btn.is-admin { color: var(--primary-light); }

        .navbar-wrap .icon-rail-btn[data-tip]:hover::after,
        .navbar-wrap .icon-rail-btn[data-tip]:focus-visible::after {
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

        @media (max-width: 1180px) and (min-width: 1041px) { .navbar-wrap .nav-right .donate-btn { display: none; } }

        /* ─── Right side actions ─── */
        .navbar-wrap .nav-right {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          flex-shrink: 0;
          margin-left: auto;
        }

        /* ─── User menu pill + dropdown ─── */
        .navbar-wrap .user-menu { position: relative; }
        .navbar-wrap .user-pill {
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
          min-height: 38px;
          transition: border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
        }
        .navbar-wrap .user-pill:hover { border-color: var(--border-strong); background: var(--surface-3); }
        .navbar-wrap .user-avatar {
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
        .navbar-wrap .user-email {
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @media (min-width: 1200px) {
          .navbar-wrap .user-email { max-width: 160px; }
        }
        .navbar-wrap .user-chevron {
          color: var(--text-secondary);
          opacity: 0.6;
          margin-right: 6px;
          transition: transform 0.15s ease;
        }
        .navbar-wrap .user-chevron.open { transform: rotate(180deg); }
        .navbar-wrap .notification-badge,.navbar-wrap .mobile-badge {
          min-width: 19px;
          height: 19px;
          padding: 0 5px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--r-pill);
          background: var(--alert);
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          line-height: 1;
        }
        .navbar-wrap .mobile-badge { margin-left: auto; }

        .navbar-wrap .user-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: min(288px, calc(100vw - 32px));
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
        .navbar-wrap .dropdown-header {
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr);
          align-items: center;
          gap: 10px;
          padding: 10px 10px 12px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .navbar-wrap .dropdown-avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          color: var(--text-on-accent);
          background: var(--grad-brand);
          border-radius: 50%;
        }
        .navbar-wrap .dropdown-identity { display: grid; min-width: 0; gap: 2px; }
        .navbar-wrap .dropdown-identity strong { color: var(--text-primary); font-size: var(--text-sm); }
        .navbar-wrap .dropdown-identity small {
          overflow: hidden;
          color: var(--text-tertiary);
          font-size: var(--text-xs);
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .navbar-wrap .dropdown-list { display: grid; gap: 2px; padding-top: 5px; }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .navbar-wrap .dropdown-item {
          display: grid;
          grid-template-columns: 30px minmax(0, 1fr);
          align-items: center;
          gap: 8px;
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
        .navbar-wrap .dropdown-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          color: currentColor;
          background: var(--surface-3);
          border-radius: var(--r-sm);
        }
        .navbar-wrap .dropdown-item:hover { background: var(--surface-3); color: var(--text-primary); }
        .navbar-wrap .dropdown-accent { color: var(--accent); }
        .navbar-wrap .dropdown-danger { margin-top: 4px; color: var(--alert); border-top: 1px solid var(--border-subtle); }

        /* ─── Shared focus-visible ─── */
        .navbar-wrap .link-btn:focus-visible,
        .navbar-wrap .user-pill:focus-visible,
        .navbar-wrap .dropdown-item:focus-visible,
        .navbar-wrap .mobile-menu-btn:focus-visible,
        .navbar-wrap .mobile-nav-link:focus-visible,
        .navbar-wrap .nav-link:focus-visible,
        .navbar-wrap .icon-rail-btn:focus-visible {
          outline: 2.5px solid var(--border-focus);
          outline-offset: 2px;
          border-radius: var(--r-sm);
        }

        /* ─── Mobile: hamburger ─── */
        .navbar-wrap .mobile-actions {
          display: none;
          align-items: center;
          flex-shrink: 0;
        }
        .navbar-wrap .mobile-menu-btn {
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
        .navbar-wrap .mobile-menu-btn:hover { background: var(--surface-3); border-color: var(--border-strong); }
        .navbar-wrap .mobile-menu-btn:active { transform: scale(0.96); }

        .navbar-wrap .menu-icon {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 18px;
        }
        .navbar-wrap .menu-line {
          height: 2px;
          background: var(--text-secondary);
          border-radius: 2px;
          transition: all 0.3s var(--ease-out);
          transform-origin: center;
        }
        .navbar-wrap .mobile-menu-btn.active .menu-line:nth-child(1) { transform: translateY(6px) rotate(45deg); }
        .navbar-wrap .mobile-menu-btn.active .menu-line:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .navbar-wrap .mobile-menu-btn.active .menu-line:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

        /* ─── Mobile Dropdown Panel ─── */
        .navbar-wrap .mobile-backdrop {
          position: fixed; inset: 0; z-index: 88; pointer-events: auto;
          border: 0; background: color-mix(in srgb, var(--overlay) 72%, transparent);
          -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px);
          animation: backdropIn 0.18s ease-out;
        }
        @keyframes backdropIn { from { opacity: 0; } to { opacity: 1; } }
        .navbar-wrap .mobile-dropdown {
          position: absolute;
          top: calc(max(12px, env(safe-area-inset-top)) + 60px + 8px);
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
        .navbar-wrap .mobile-dropdown-inner {
          display: flex;
          flex-direction: column;
        }
        .navbar-wrap .mobile-menu-heading {
          display: flex; align-items: center; justify-content: space-between;
          min-height: 56px; padding: 8px var(--sp-3) 6px var(--sp-4);
          border-bottom: 1px solid var(--border-subtle);
        }
        .navbar-wrap .mobile-menu-heading h2 { margin: 0; font-size: var(--text-base); }
        .navbar-wrap .mobile-close-btn {
          width: var(--touch-target); height: var(--touch-target); display: inline-flex;
          align-items: center; justify-content: center; border: 1px solid var(--border-subtle);
          border-radius: var(--r-pill); color: var(--text-secondary); background: var(--surface-2); cursor: pointer;
        }
        .navbar-wrap .mobile-close-btn:hover { color: var(--text-primary); background: var(--surface-3); }
        .navbar-wrap .mobile-close-btn:active { transform: scale(0.96); }

        .navbar-wrap .mobile-nav {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          padding: var(--sp-3) var(--sp-3) 0;
          gap: var(--sp-1);
        }
        .navbar-wrap .mobile-nav-link {
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
        .navbar-wrap .mobile-nav-link:hover { background: var(--surface-3); color: var(--text-primary); }
        .navbar-wrap .mobile-nav-link.active { background: color-mix(in srgb, var(--primary) 10%, var(--surface-2)); color: var(--primary); font-weight: 650; }
        .navbar-wrap .mobile-nav-link--admin { color: var(--primary); }
        .navbar-wrap .mobile-nav-link:active { transform: scale(0.985); }

        .navbar-wrap .mobile-menu-actions {
          padding: var(--sp-3);
          display: flex;
          flex-direction: column;
          gap: var(--sp-3);
          border-top: 1px solid var(--border-subtle);
          margin-top: var(--sp-3);
        }
        .navbar-wrap .mobile-menu-actions .donate-btn {
          width: 100%;
          min-height: 44px;
          font-size: 14px;
          padding: 10px 16px;
        }
        .navbar-wrap .mobile-menu-row {
          display: flex;
          gap: var(--sp-2);
        }
        .navbar-wrap .mobile-menu-row > * {
          flex: 1;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .navbar-wrap .mobile-user-section {
          display: flex;
          flex-direction: column;
          gap: var(--sp-2);
          padding-top: var(--sp-2);
          border-top: 1px solid var(--border-subtle);
        }
        .navbar-wrap .mobile-user-info {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
          padding: var(--sp-2) var(--sp-3);
          background: var(--surface-3);
          border-radius: var(--r-md);
          font-size: 13px;
          color: var(--text-secondary);
        }
        .navbar-wrap .mobile-user-actions {
          display: flex;
          flex-direction: column;
          gap: var(--sp-2);
        }
        .navbar-wrap .mobile-user-actions .btn-base {
          min-height: 44px;
          font-size: 14px;
        }

        /* ─── Responsive: ≤1040px hide desktop rails, show hamburger ─── */
        @media (max-width: 1040px) {
          .navbar-wrap .mobile-actions { display: flex; }
          .navbar-wrap .nav-links, .navbar-wrap .nav-divider, .navbar-wrap .icon-rail { display: none; }
          .navbar-wrap .nav-right .donate-btn { display: none; }
        }

        /* ─── Responsive: ≤640px hide toggles from nav-right (use hamburger) ─── */
        @media (max-width: 640px) {
          .navbar-wrap .nav-right { display: none; }
          .navbar-wrap .mobile-dropdown { top: calc(max(12px, env(safe-area-inset-top)) + 52px + 8px); }
          .navbar-wrap .mobile-nav { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .navbar-wrap .mobile-dropdown { top: calc(max(12px, env(safe-area-inset-top)) + 48px + 8px); left: var(--sp-2); right: var(--sp-2); max-height: calc(100dvh - 72px); }
          .navbar-wrap .mobile-menu-heading { min-height: 52px; padding-left: var(--sp-3); }
        }
        @media (prefers-reduced-motion: reduce) {
          .navbar-wrap .brand, .navbar-wrap .brand-mark, .navbar-wrap .mobile-menu-btn, .navbar-wrap .menu-line, .navbar-wrap .mobile-dropdown, .navbar-wrap .mobile-backdrop, .navbar-wrap .user-dropdown { animation: none; transition: none; }
        }

/* Keep all navigation within the floating bar, including long translations. */
.navbar-wrap .navbar { min-width:0; }
.navbar-wrap .nav-links { min-width:0; flex:1 1 auto; }
.navbar-wrap .nav-link { min-height:44px; flex-shrink:0; }
.navbar-wrap .icon-rail-label { display:none; }
.navbar-wrap .icon-rail-btn { width:36px; min-width:36px; padding-inline:0; }
.navbar-wrap .icon-rail-btn[data-tip]:hover::after,
.navbar-wrap .icon-rail-btn[data-tip]:focus-visible::after { display:block; }
.navbar-wrap .dropdown-list { display:grid; }
.navbar-wrap .dropdown-item { display:grid; grid-template-columns:30px minmax(0,1fr); width:100%; min-height:44px; gap:10px; }
.navbar-wrap .user-dropdown { width:min(300px,calc(100vw - 32px)); max-height:calc(100dvh - 100px); overflow-y:auto; }
.navbar-wrap .user-email { max-width:100px; }
@media (min-width:1041px) and (max-width:1280px) {
 .navbar-wrap .nav-right .donate-btn { display:none; }
 .navbar-wrap .nav-link { padding-inline:8px; font-size:12px; }
 .navbar-wrap .navbar { gap:8px; }
}
@media (min-width:1041px) {
 .navbar-wrap .mobile-dropdown,.navbar-wrap .mobile-backdrop { display:none; }
}
`}</style>
    </header>
  );
}
