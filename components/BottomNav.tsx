'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: (active: boolean) => ReactNode;
}

const ITEMS: NavItem[] = [
  { href: '/', label: 'Нүүр', icon: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 11L12 4L21 11" /><path d="M5 10V20H19V10" />
    </svg>
  )},
  { href: '/report-lost', label: 'Алдсан', icon: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" /><path d="M12 7V13L16 15" />
    </svg>
  )},
  { href: '/report-found', label: 'Олдсон', icon: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 21C12 21 4 14.5 4 9.5C4 6.5 6.5 4 9.5 4C11 4 12 5 12 5C12 5 13 4 14.5 4C17.5 4 20 6.5 20 9.5C20 14.5 12 21 12 21Z" />
    </svg>
  )},
  { href: '/listings', label: 'Жагсаалт', icon: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="4" width="8" height="8" rx="1.5" /><rect x="13" y="4" width="8" height="8" rx="1.5" />
      <rect x="3" y="14" width="8" height="6" rx="1.5" /><rect x="13" y="14" width="8" height="6" rx="1.5" />
    </svg>
  )},
  { href: '/adoptions', label: 'Үрчлүүлэх', icon: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 21C12 21 4 14.5 4 9.5C4 6.5 6.5 4 9.5 4C11 4 12 5 12 5C12 5 13 4 14.5 4C17.5 4 20 6.5 20 9.5C20 14.5 12 21 12 21Z" />
    </svg>
  )},
  { href: '/my-pets', label: 'Миний', icon: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="3.2" /><path d="M5 20C5 16.5 8 14 12 14C16 14 19 16.5 19 20" />
    </svg>
  )},
];

export default function BottomNav() {
  const pathname = usePathname();

  // Чат хуудас дээр доод цэсийг нуух (композер бүтэн өргөнтэй байх)
  if (pathname.startsWith('/messages') || pathname.startsWith('/assistant')) return null;

  return (
    <nav className="bottom-nav" aria-label="Гар утасны доод цэс">
      {ITEMS.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`bn-item ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
            {item.icon(active)}
            <span>{item.label}</span>
          </Link>
        );
      })}

      <style jsx>{`
        .bottom-nav { display: none; }
        @media (max-width: 640px) {
          .bottom-nav {
            display: flex;
            position: fixed; bottom: 0; left: 0; right: 0; z-index: 150;
            background: var(--glass-bg);
            -webkit-backdrop-filter: var(--glass-blur);
            backdrop-filter: var(--glass-blur);
            border-top: 1px solid var(--glass-border);
            padding: 8px 4px calc(8px + env(safe-area-inset-bottom, 0px));
            box-shadow: 0 -4px 24px rgba(23,34,39,0.08);
          }
        }
        @media (max-width: 400px) {
          .bottom-nav {
            padding: 6px 2px calc(6px + env(safe-area-inset-bottom, 0px));
          }
        }
        .bn-item {
          position: relative;
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
          padding: 6px 2px; text-decoration: none; color: var(--muted);
          min-height: var(--touch-target);
          transition: color 0.2s ease;
        }
        .bn-item:active { transform: scale(0.92); }
        .bn-item > :global(svg) { transition: transform 0.2s cubic-bezier(0.16,1,0.3,1); }
        .bn-item.active > :global(svg) { transform: translateY(-1px); }
        @media (max-width: 400px) {
          .bn-item {
            padding: 4px 1px;
            gap: 1px;
          }
        }
        .bn-item span { font-size: 10px; font-weight: 600; }
        @media (max-width: 400px) {
          .bn-item span { font-size: 9px; }
        }
        @media (min-width: 401px) and (max-width: 640px) {
          .bn-item span { font-size: 10.5px; }
        }
        .bn-item.active { color: var(--accent); }
        .bn-item.active span { font-weight: 700; }
        .bn-item.active::after {
          content: '';
          position: absolute;
          top: 2px;
          width: 20px;
          height: 3px;
          border-radius: var(--r-pill);
          background: var(--accent);
          transition: transform 0.2s cubic-bezier(0.16,1,0.3,1);
        }
      `}</style>
    </nav>
  );
}
