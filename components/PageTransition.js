'use client';
import { usePathname } from 'next/navigation';

/**
 * Next.js App Router-д зориулсан хөнгөн хуудас шилжилтийн animation
 * (нэмэлт сан (Framer Motion гэх мэт) шаардахгүй, CSS-суурьтай).
 */
export default function PageTransition({ children }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
