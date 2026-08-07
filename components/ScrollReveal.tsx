'use client';
import { useEffect, useRef, type ReactNode } from 'react';

/**
 * ScrollReveal — IntersectionObserver ашиглан элементийг scroll үед reveal хийх.
 * `.reveal` классыг `.visible` болгоно. `stagger-children` классыг ашиглавал
 * хүүхэд элементүүд дараалсан үед гарч ирнэ.
 *
 * Жишээ:
 *   <ScrollReveal><div className="my-section">...</div></ScrollReveal>
 *   <ScrollReveal className="stagger-children"><div>...</div><div>...</div></ScrollReveal>
 */
export default function ScrollReveal({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          obs.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}
