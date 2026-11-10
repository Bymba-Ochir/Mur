'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/useAuth';
import { isAdmin } from '../lib/adminService';
import ThemeToggle from './ThemeToggle';
import FeedbackButton from './FeedbackButton';
import LanguageToggle from './LanguageToggle';
import LoginModal from './LoginModal';
import { useLanguage } from '../lib/i18n';
import Icon from './ui/icons';
import type { IconName } from './ui/icons';
import Button from './ui/Button';
import BrandLogo, { BrandMark } from './ui/BrandLogo';
import { subscribeToNotifications, unreadNotificationCount } from '../lib/workflowService';

function truncateEmail(email: string): string {
  const [local] = email.split('@');
  if (!local) return email;
  return local.length > 10 ? `${local.slice(0, 9)}…` : local;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [showLogin, setShowLogin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [adminState, setAdminState] = useState<{ userId: string; allowed: boolean } | null>(null);
  const admin = Boolean(user && adminState?.userId === user.id && adminState.allowed);
  const [unreadState, setUnreadState] = useState<{ userId: string; count: number } | null>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuFirstFocus = useRef<'first' | 'last'>('first');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const servicesButtonRef = useRef<HTMLButtonElement>(null);

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
    const desktop = window.matchMedia?.('(width > 1040px)');
    if (!desktop) return;
    function closeHiddenMenu(event: MediaQueryListEvent) {
      if (event.matches) setShowMobileMenu(false);
      else setShowServices(false);
    }
    desktop.addEventListener('change', closeHiddenMenu);
    return () => desktop.removeEventListener('change', closeHiddenMenu);
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
      const visible = focusable.filter((element) => element.offsetParent !== null);
      const first = visible[0];
      const last = visible[visible.length - 1];
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
      if (showServices && !servicesRef.current?.contains(e.target as Node)) setShowServices(false);
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
    if (showUserMenu || showMobileMenu || showServices) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showMobileMenu, showServices]);

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
  interface UserMenuItem { href?: string; label: string; isLink: boolean; danger?: boolean; onClick?: () => void; icon?: IconName; }

  const primaryLinks: NavLinkItem[] = [
    { href: '/report-lost', label: t('nav_lost'), icon: 'alert' },
    { href: '/report-found', label: t('nav_found'), icon: 'eye' },
    { href: '/listings', label: t('nav_listings'), icon: 'search' },
  ];
  const serviceLinks: NavLinkItem[] = [
    { href: '/adoptions', label: t('nav_adoptions'), icon: 'heart' },
    { href: '/sitting', label: t('nav_sitting'), icon: 'home' },
    { href: '/clinics', label: t('health_tab_clinics'), icon: 'cross' },
  ];
  const messagesLink = { href: '/messages', label: t('messages_hub_nav'), icon: 'message' } as const;
  const myPetsLink = { href: '/my-pets', label: t('nav_mypets'), icon: 'paw' } as const;
  const mobileLinks: NavLinkItem[] = [...primaryLinks, ...serviceLinks, messagesLink, ...(!user ? [myPetsLink] : [])];

  const userMenuItems: UserMenuItem[] = [
    { href: '/profile', label: t('nav_profile'), isLink: true, icon: 'user' },
    { href: '/notifications', label: visibleUnreadNotifications ? `${t('nav_notifications')} (${visibleUnreadNotifications})` : t('nav_notifications'), isLink: true, icon: 'bell' },
    { ...myPetsLink, isLink: true },
    { href: '/saved', label: t('nav_saved'), isLink: true, icon: 'bookmark' },
    { href: '/activity', label: t('nav_activity'), isLink: true, icon: 'calendar' },
    { href: '/settings', label: t('nav_settings'), isLink: true, icon: 'settings' },
    ...(admin ? [{ href: '/admin', label: t('nav_admin'), isLink: true, icon: 'shield' as const }] : []),
    { label: t('nav_logout'), isLink: false, danger: true, onClick: logout },
  ];

  return (
    <header className="navbar-wrap">
      <div className="navbar">
        {/* Brand */}
        <Link href="/" className="brand" aria-label={t('brand_home_label')}>
          <BrandLogo />
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
          <div
            className="services-nav"
            ref={servicesRef}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setShowServices(false);
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Escape' || !showServices) return;
              event.preventDefault();
              event.stopPropagation();
              setShowServices(false);
              servicesButtonRef.current?.focus();
            }}
          >
            <button
              type="button"
              ref={servicesButtonRef}
              className={`nav-link services-trigger${serviceLinks.some((link) => isActiveRoute(link.href)) ? ' active' : ''}`}
              aria-expanded={showServices}
              aria-controls="nav-services"
              onClick={() => { setShowUserMenu(false); setShowServices((open) => !open); }}
            >
              {t('nav_services')}
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            <ul className="services-dropdown" id="nav-services" hidden={!showServices}>
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link className="mobile-nav-link" href={link.href} aria-current={isActiveRoute(link.href) ? 'page' : undefined} onClick={() => setShowServices(false)}>
                    {link.icon && <Icon name={link.icon} size={17} aria-hidden="true" />}{link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="nav-tools">
          <Link className="nav-tool-link" href={messagesLink.href} aria-label={messagesLink.label} title={messagesLink.label} aria-current={isActiveRoute(messagesLink.href) ? 'page' : undefined}>
            <Icon name={messagesLink.icon} size={18} aria-hidden="true" />
          </Link>
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <div className="nav-feedback"><FeedbackButton /></div>

        <div className="nav-right">
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
                onClick={() => { setShowServices(false); setShowUserMenu((open) => !open); }}
                aria-expanded={showUserMenu}
                aria-haspopup="menu"
                aria-controls="user-menu-popover"
                aria-label={t('nav_user_menu_label')}
                title={user.email ?? t('nav_user_menu_label')}
              >
                <span className="user-avatar" aria-hidden="true"><BrandMark size={19} /></span>
                <span className="user-email">{user.email ? truncateEmail(user.email) : ''}</span>
                {visibleUnreadNotifications > 0 && <span className="notification-badge" aria-label={`${visibleUnreadNotifications} уншаагүй мэдэгдэл`}>{visibleUnreadNotifications > 99 ? '99+' : visibleUnreadNotifications}</span>}
                <svg className={`user-chevron${showUserMenu ? ' open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {showUserMenu && (
                <div id="user-menu-popover" className="user-dropdown" onKeyDown={handleUserMenuKey} role="menu" aria-label={t('nav_user_menu_label')}>
                  <div className="dropdown-header">
                    <span className="dropdown-avatar" aria-hidden="true"><BrandMark size={24} /></span>
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
                        className="dropdown-item"
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
                        <span className="dropdown-icon" aria-hidden="true"><Icon name="logout" size={17} /></span>
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

        <div className="mobile-actions">
          <button
            type="button"
            ref={mobileMenuButtonRef}
            className={`mobile-menu-btn ${showMobileMenu ? 'active' : ''}`}
            onClick={() => { setShowUserMenu(false); setShowMobileMenu((open) => !open); }}
            aria-haspopup="dialog"
            aria-expanded={showMobileMenu}
            aria-controls={showMobileMenu ? 'mobile-menu' : undefined}
            aria-label={showMobileMenu ? t('nav_close_menu') : t('nav_open_menu')}
          >
            <span className="menu-icon" aria-hidden="true">
              <span className="menu-line" />
              <span className="menu-line" />
              <span className="menu-line" />
            </span>
          </button>
        </div>
      </div>
      {showMobileMenu && (
        <>
          <button className="mobile-backdrop" type="button" tabIndex={-1} aria-label={t('nav_close_menu')} onClick={() => setShowMobileMenu(false)} />
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
                {mobileLinks.map((link) => (
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
              </nav>
              <div className="mobile-menu-actions">
                <div className="mobile-menu-row">
                  <LanguageToggle />
                  <ThemeToggle />
                </div>
                <div className="mobile-menu-account">
                  {user ? (
                    <div className="mobile-user-section">
                      <div className="mobile-user-info">
                        <span className="user-avatar" aria-hidden="true"><BrandMark size={19} /></span>
                        <span>{user.email ? truncateEmail(user.email) : t('nav_guest')}</span>
                      </div>
                      <div className="mobile-user-actions">
                        {userMenuItems.map((item) => item.href && (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="mobile-nav-link"
                            aria-current={isActiveRoute(item.href) ? 'page' : undefined}
                            onClick={handleMobileLinkClick}
                          >
                            {item.icon && <Icon name={item.icon} size={18} aria-hidden="true" />}{item.label}
                          </Link>
                        ))}
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
          </div>
        </>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </header>
  );
}
