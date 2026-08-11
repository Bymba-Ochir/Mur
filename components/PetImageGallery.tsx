'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface PetImageGalleryProps {
  images: string[];
  alt: string;
}

export default function PetImageGallery({ images, alt }: PetImageGalleryProps) {
  const photos = [...new Set(images.filter(Boolean))].slice(0, 4);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    if (!hovered || photos.length < 2) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (reducedMotion || !finePointer) return;

    let interval: ReturnType<typeof setInterval> | undefined;
    const delay = window.setTimeout(() => {
      interval = setInterval(() => setActive((current) => (current + 1) % photos.length), 2500);
    }, 1500);
    return () => {
      window.clearTimeout(delay);
      if (interval) clearInterval(interval);
    };
  }, [hovered, photos.length]);

  if (!photos.length) return null;

  const move = (direction: -1 | 1) => {
    setActive((current) => (current + direction + photos.length) % photos.length);
  };

  return (
    <div
      className="gallery"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setActive(0); }}
      onMouseMove={(event) => {
        if (photos.length < 2) return;
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        if ((event.target as HTMLElement).closest('.arrow')) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = Math.min(.999, Math.max(0, (event.clientX - rect.left) / rect.width));
        setActive(Math.floor(ratio * photos.length));
      }}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        if (touchStart.current == null) return;
        const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
        if (Math.abs(distance) > 38) move(distance < 0 ? 1 : -1);
        touchStart.current = null;
      }}
      aria-label={`${photos.length} зурагтай галерей. ${active + 1}-р зураг.`}
    >
      {photos.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt={`${alt} — ${index + 1}-р зураг`}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 320px"
          className={index === active ? 'active' : ''}
        />
      ))}

      {photos.length > 1 && <>
        <button
          className="arrow previous" type="button" aria-label="Өмнөх зураг"
          onPointerDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onTouchEnd={(event) => event.stopPropagation()}
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); move(-1); }}
        >‹</button>
        <button
          className="arrow next" type="button" aria-label="Дараах зураг"
          onPointerDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onTouchEnd={(event) => event.stopPropagation()}
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); move(1); }}
        >›</button>
        <div className="indicators" aria-hidden="true">
          {photos.map((_, index) => <span key={index} className={index === active ? 'active' : ''} />)}
        </div>
      </>}

      <style jsx>{`
        .gallery { position: absolute; inset: 0; overflow: hidden; background: var(--thumb-bg); }
        .gallery :global(img) {
          object-fit: cover; opacity: 0; transform: scale(1.01);
          transition: opacity 180ms ease, transform 400ms cubic-bezier(.16,1,.3,1);
        }
        .gallery :global(img.active) { opacity: 1; }
        .gallery:hover :global(img.active) { transform: scale(1.055); }
        .indicators {
          position: absolute; z-index: 3; left: 50%; bottom: 12px; transform: translateX(-50%);
          display: flex; gap: 5px; padding: 4px 6px; border-radius: 999px;
          background: rgba(12, 17, 31, .28); backdrop-filter: blur(5px);
        }
        .indicators span { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.55); transition: width 160ms ease, background 160ms ease; }
        .indicators span.active { width: 16px; border-radius: 999px; background: #fff; }
        .arrow {
          position: absolute; z-index: 3; top: 50%; transform: translateY(-50%);
          width: 34px; height: 42px; border: 0; border-radius: 999px;
          display: grid; place-items: center; color: #fff; background: rgba(12,17,31,.42);
          font: 600 28px/1 sans-serif; cursor: pointer; opacity: 0;
          transition: opacity 160ms ease, background 160ms ease;
        }
        .arrow:hover { background: rgba(12,17,31,.68); }
        .previous { left: 8px; } .next { right: 8px; }
        .gallery:hover .arrow, .arrow:focus-visible { opacity: 1; }
        @media (hover: none), (max-width: 640px) {
          .arrow { opacity: .82; width: 32px; height: 38px; }
          .indicators { bottom: 10px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .gallery :global(img), .indicators span, .arrow { transition: none; }
        }
      `}</style>
    </div>
  );
}
