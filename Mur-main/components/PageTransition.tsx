'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Next.js App Router-д зориулсан хөнгөн хуудас шилжилтийн animation
 * (нэмэлт сан (Framer Motion гэх мэт) шаардахгүй, CSS-суурьтай).
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
