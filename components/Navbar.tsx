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
    { href: '/messages', label: t('messages_hub_nav'), icon: 'message' },
    { href: '/my-pets', label: t('nav_mypets'), icon: 'vaccine' },
  ];

  /* Desktop: primary text links (Алдсан/Олдсон/Жагсаалт/Үрчлүүлэх) + icon rail */
  const primaryLinks = allLinks.slice(0, 4);
  const railLinks = allLinks.slice(4);

  const userMenuItems: UserMenuItem[] = [
    { href: '/my-pets', label: t('nav_mypets'), isLink: true, icon: 'vaccine' },
    { href: '/messages', label: t('messages_hub_nav'), isLink: true, icon: 'message' },
    ...(admin ? [{ href: '/admin', label: t('nav_admin'), isLink: true, accent: true, icon: 'shield' as IconName }] : []),
    { label: t('nav_logout'), isLink: false, danger: true, onClick: logout },
  ];

  return (
    <header className={`navbar-wrap pointer-events-none fixed inset-x-0 top-4 z-[90] flex justify-center px-[var(--sp-5)] max-md:px-[var(--sp-3)] max-[480px]:px-[var(--sp-2)]${scrolled ? ' scrolled' : ''}`}>
      <header className={`navbar pointer-events-auto flex h-[60px] w-full max-w-[1160px] items-center gap-[var(--sp-3)] rounded-[var(--r-lg)] border bg-[var(--glass-bg)] px-[var(--sp-4)] text-[var(--ink)] backdrop-blur-[var(--glass-blur)] transition-[box-shadow,border-color,background] duration-300 ease-[var(--ease-out)] min-[1440px]:px-[var(--sp-6)] max-md:h-[52px] max-[480px]:h-12 max-[480px]:px-[var(--sp-2)] ${scrolled ? 'border-[var(--border-strong)] shadow-[var(--shadow-lg)]' : 'border-[var(--glass-border)] shadow-[var(--shadow-sm)]'}`}>
        {/* Brand */}
        <Link href="/" className="brand flex shrink-0 items-center gap-[var(--sp-2)] text-[var(--ink)] no-underline transition-transform duration-200 ease-[var(--ease-out)] hover:scale-[1.02]" aria-label="МӨР — Нүүр хуудас">
          <span className="brand-mark flex size-8 items-center justify-center rounded-[9px] bg-[image:var(--grad-brand)] shadow-[var(--shadow-xs)] transition-transform duration-200 ease-[var(--ease-out)] group-hover:-rotate-6 group-hover:scale-[1.06] max-[480px]:size-7">{PawSVG}</span>
          <span className="brand-name font-[family-name:var(--font-display)] text-[length:var(--text-base)] font-bold tracking-[0.01em] min-[1025px]:text-[length:var(--text-lg)] max-[480px]:text-[length:var(--text-sm)]">МӨР</span>
        </Link>

        {/* Desktop: text nav links */}
        <nav className="nav-links flex flex-1 items-center gap-0.5 pl-[var(--sp-3)]" aria-label="Үндсэн цэс">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link inline-flex items-center justify-center whitespace-nowrap rounded-[var(--r-pill)] px-[13px] py-2 text-[length:var(--text-sm)] no-underline transition-[color,background] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] ${pathname === link.href ? 'active bg-[var(--surface-3)] font-semibold text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <span className="nav-divider mx-[var(--sp-1)] h-5 w-px shrink-0 bg-[var(--border-subtle)] max-[1180px]:hidden" aria-hidden="true" />

        {/* Desktop: icon rail (compact circles) */}
        <div className="icon-rail flex shrink-0 items-center gap-[clamp(4px,0.45vw,8px)] rounded-[var(--r-pill)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-[7px] py-[5px] max-[1040px]:hidden min-[1041px]:max-[1100px]:gap-1 min-[1041px]:max-[1100px]:px-[5px]">
          {railLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`icon-rail-btn relative flex h-9 w-[clamp(34px,2.7vw,38px)] flex-none items-center justify-center rounded-[var(--r-pill)] no-underline transition-[color,background] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] min-[1041px]:max-[1100px]:w-[34px] ${pathname === link.href ? 'active bg-[var(--surface-3)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
              data-tip={link.label}
              aria-label={link.label}
            >
              {link.icon && <Icon name={link.icon} size={17} />}
            </Link>
          ))}
          {admin && (
            <Link
              href="/admin"
              className={`icon-rail-btn is-admin relative flex h-9 w-[clamp(34px,2.7vw,38px)] flex-none items-center justify-center rounded-[var(--r-pill)] text-[var(--primary-light)] no-underline transition-[color,background] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-3)] focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] min-[1041px]:max-[1100px]:w-[34px] ${pathname === '/admin' ? 'active bg-[var(--surface-3)] text-[var(--text-primary)]' : ''}`}
              data-tip={t('nav_admin')}
              aria-label={t('nav_admin')}
            >
              <Icon name="shield" size={17} />
            </Link>
          )}
        </div>

        {/* Right side: donate + toggles + user/account */}
        <div className="nav-right ml-auto flex shrink-0 items-center gap-[var(--sp-2)]">
          <DonateButton />
          <LanguageToggle />
          <ThemeToggle />
          {user ? (
            <div className="user-menu relative" ref={userMenuRef}>
              <button
                className="user-pill flex cursor-pointer items-center gap-[7px] rounded-[var(--r-pill)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-[5px] py-1 text-[length:var(--text-xs)] font-medium text-[var(--text-secondary)] transition-[border-color,background] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-expanded={showUserMenu}
                aria-haspopup="true"
                aria-label={t('nav_user_menu_label')}
              >
                <span className="user-avatar flex size-[26px] items-center justify-center rounded-full bg-[image:var(--grad-brand)] text-[11px] font-bold leading-none text-[var(--text-on-accent)]" aria-hidden="true">👤</span>
                <span className="user-email max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap min-[1200px]:max-w-40">{user.email ? truncateEmail(user.email) : ''}</span>
                <span className="user-chevron mr-1.5 text-[10px] text-[var(--text-secondary)] opacity-60 transition-transform duration-150" aria-hidden="true">{showUserMenu ? '▲' : '▼'}</span>
              </button>
              {showUserMenu && (
                <div className="user-dropdown absolute right-0 top-[calc(100%+10px)] z-[100] max-h-[calc(100vh-100px)] min-w-[210px] overflow-y-auto rounded-[var(--r-md)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-1.5 shadow-[var(--shadow-lg)]" role="menu">
                  {userMenuItems.map((item, idx) => (
                    item.isLink && item.href ? (
                      <Link
                        key={idx}
                        href={item.href}
                        className={`dropdown-item flex min-h-[var(--touch-target)] w-full cursor-pointer items-center gap-2.5 rounded-[var(--r-sm)] border-0 bg-transparent px-3 py-[11px] text-left font-[family-name:var(--font-body)] text-[length:var(--text-sm)] font-medium no-underline transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] ${item.accent ? 'dropdown-accent text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}
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
                        className={`dropdown-item flex min-h-[var(--touch-target)] w-full cursor-pointer items-center gap-2.5 rounded-[var(--r-sm)] border-0 bg-transparent px-3 py-[11px] text-left font-[family-name:var(--font-body)] text-[length:var(--text-sm)] font-medium transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] ${item.danger ? 'dropdown-danger text-[var(--alert)]' : 'text-[var(--text-secondary)]'}`}
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
        <div className="mobile-actions hidden shrink-0 items-center max-[1040px]:flex">
          <button
            ref={mobileMenuButtonRef}
            className={`mobile-menu-btn flex size-[var(--touch-target)] cursor-pointer flex-col items-center justify-center rounded-[var(--r-pill)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-0 transition-all duration-300 ease-[var(--ease-out)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] ${showMobileMenu ? 'active [&_.menu-line:nth-child(1)]:translate-y-1.5 [&_.menu-line:nth-child(1)]:rotate-45 [&_.menu-line:nth-child(2)]:scale-x-0 [&_.menu-line:nth-child(2)]:opacity-0 [&_.menu-line:nth-child(3)]:-translate-y-1.5 [&_.menu-line:nth-child(3)]:-rotate-45' : ''}`}
            onClick={() => setShowMobileMenu((open) => !open)}
            aria-expanded={showMobileMenu}
            aria-controls="mobile-menu"
            aria-label={showMobileMenu ? t('nav_close_menu') : t('nav_open_menu')}
          >
            <span className="menu-icon flex w-[18px] flex-col gap-1">
              <span className="menu-line h-0.5 origin-center rounded-sm bg-[var(--text-secondary)] transition-all duration-300 ease-[var(--ease-out)]" />
              <span className="menu-line h-0.5 origin-center rounded-sm bg-[var(--text-secondary)] transition-all duration-300 ease-[var(--ease-out)]" />
              <span className="menu-line h-0.5 origin-center rounded-sm bg-[var(--text-secondary)] transition-all duration-300 ease-[var(--ease-out)]" />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Dropdown */}
      {showMobileMenu && (
        <div
          id="mobile-menu"
          className="mobile-dropdown pointer-events-auto absolute left-[var(--sp-3)] right-[var(--sp-3)] top-[calc(16px+52px+8px)] z-[89] max-h-[calc(100dvh-90px)] overflow-y-auto overscroll-contain rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--surface-2)] shadow-[var(--shadow-lg)]"
          ref={mobileMenuRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
        >
          <div className="mobile-dropdown-inner flex flex-col">
            <nav className="mobile-nav flex flex-col gap-[var(--sp-1)] px-[var(--sp-3)] pt-[var(--sp-3)]" aria-label="Мобайл цэс">
              {allLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`mobile-nav-link flex min-h-11 items-center gap-[var(--sp-2)] rounded-[var(--r-md)] px-[var(--sp-3)] py-[var(--sp-2)] font-[family-name:var(--font-body)] text-[14.5px] no-underline transition-all duration-150 hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] ${pathname === link.href ? 'active bg-[var(--surface-3)] font-semibold text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'}`}
                  onClick={handleMobileLinkClick}
                >
                  {link.icon && <Icon name={link.icon} size={18} aria-hidden="true" />}
                  {link.label}
                </Link>
              ))}
              {admin && (
                <Link
                  href="/admin"
                  className={`mobile-nav-link flex min-h-11 items-center gap-[var(--sp-2)] rounded-[var(--r-md)] px-[var(--sp-3)] py-[var(--sp-2)] font-[family-name:var(--font-body)] text-[14.5px] font-medium text-[var(--accent)] no-underline transition-all duration-150 hover:bg-[var(--surface-3)] focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] ${pathname === '/admin' ? 'active bg-[var(--surface-3)] font-semibold' : ''}`}
                  onClick={handleMobileLinkClick}
                >
                  <Icon name="shield" size={18} aria-hidden="true" />
                  {t('nav_admin')}
                </Link>
              )}
            </nav>
            <div className="mobile-menu-actions mt-[var(--sp-3)] flex flex-col gap-[var(--sp-3)] border-t border-[var(--border-subtle)] p-[var(--sp-3)] [&_.donate-btn]:min-h-11 [&_.donate-btn]:w-full [&_.donate-btn]:px-4 [&_.donate-btn]:py-2.5 [&_.donate-btn]:text-sm">
              <DonateButton />
              <div className="mobile-menu-row flex gap-[var(--sp-2)] [&>*]:flex [&>*]:min-h-10 [&>*]:flex-1 [&>*]:items-center [&>*]:justify-center">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              {user ? (
                <div className="mobile-user-section flex flex-col gap-[var(--sp-2)] border-t border-[var(--border-subtle)] pt-[var(--sp-2)]">
                  <div className="mobile-user-info flex items-center gap-[var(--sp-3)] rounded-[var(--r-md)] bg-[var(--surface-3)] px-[var(--sp-3)] py-[var(--sp-2)] text-[13px] text-[var(--text-secondary)]">
                    <span className="user-avatar" aria-hidden="true">👤</span>
                    <span>{user.email ? truncateEmail(user.email) : t('nav_guest')}</span>
                  </div>
                  <div className="mobile-user-actions flex flex-col gap-[var(--sp-2)] [&_.btn-base]:min-h-11 [&_.btn-base]:text-sm">
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
    </header>
  );
}
