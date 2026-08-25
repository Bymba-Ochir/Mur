'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface NavItem { href: string; label: string; icon: (active: boolean) => ReactNode; }
const svgProps = (active: boolean) => ({ width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: active ? 2.4 : 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true });
const ITEMS: NavItem[] = [
  { href: '/', label: 'Нүүр', icon: (a) => <svg {...svgProps(a)}><path d="M3 11L12 4L21 11" /><path d="M5 10V20H19V10" /></svg> },
  { href: '/report-lost', label: 'Алдсан', icon: (a) => <svg {...svgProps(a)}><circle cx="12" cy="12" r="9" /><path d="M12 7V13L16 15" /></svg> },
  { href: '/report-found', label: 'Олдсон', icon: (a) => <svg {...svgProps(a)}><path d="M12 21C12 21 4 14.5 4 9.5C4 6.5 6.5 4 9.5 4C11 4 12 5 12 5C12 5 13 4 14.5 4C17.5 4 20 6.5 20 9.5C20 14.5 12 21 12 21Z" /></svg> },
  { href: '/listings', label: 'Жагсаалт', icon: (a) => <svg {...svgProps(a)}><rect x="3" y="4" width="8" height="8" rx="1.5" /><rect x="13" y="4" width="8" height="8" rx="1.5" /><rect x="3" y="14" width="8" height="6" rx="1.5" /><rect x="13" y="14" width="8" height="6" rx="1.5" /></svg> },
  { href: '/adoptions', label: 'Үрчлүүлэх', icon: (a) => <svg {...svgProps(a)}><path d="M12 21C12 21 4 14.5 4 9.5C4 6.5 6.5 4 9.5 4C11 4 12 5 12 5C12 5 13 4 14.5 4C17.5 4 20 6.5 20 9.5C20 14.5 12 21 12 21Z" /></svg> },
  { href: '/my-pets', label: 'Миний', icon: (a) => <svg {...svgProps(a)}><circle cx="12" cy="8" r="3.2" /><path d="M5 20C5 16.5 8 14 12 14C16 14 19 16.5 19 20" /></svg> },
];

const NAV = 'fixed inset-x-0 bottom-0 z-[150] hidden border-t border-[var(--glass-border)] bg-[var(--glass-bg)] px-1 pb-[calc(8px+env(safe-area-inset-bottom,0px))] pt-2 shadow-[0_-4px_24px_rgba(0,0,0,0.10)] backdrop-blur-[var(--glass-blur)] max-sm:flex max-[400px]:px-0.5 max-[400px]:pb-[calc(6px+env(safe-area-inset-bottom,0px))] max-[400px]:pt-1.5';
const ITEM = 'relative flex min-h-[var(--touch-target)] flex-1 flex-col items-center gap-0.5 px-0.5 py-1.5 text-[var(--muted)] no-underline transition-colors duration-200 active:scale-[0.92] [&>svg]:transition-transform [&>svg]:duration-200 max-[400px]:gap-px max-[400px]:px-px max-[400px]:py-1';

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith('/messages') || pathname.startsWith('/assistant')) return null;
  return (
    <nav className={NAV} aria-label="Гар утасны доод цэс">
      {ITEMS.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return <Link key={item.href} href={item.href} className={`${ITEM} ${active ? 'font-bold text-[var(--accent)] after:absolute after:top-0.5 after:h-[3px] after:w-5 after:rounded-[var(--r-pill)] after:bg-[var(--accent)] [&>svg]:-translate-y-px' : ''}`} aria-current={active ? 'page' : undefined}>{item.icon(active)}<span className={`text-[10px] min-[401px]:max-sm:text-[10.5px] max-[400px]:text-[9px] ${active ? 'font-bold' : 'font-semibold'}`}>{item.label}</span></Link>;
      })}
    </nav>
  );
}
