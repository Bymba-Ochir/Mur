'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

export default function PetImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const photos = [...new Set(images.filter(Boolean))].slice(0, 4);
  const [active, setActive] = useState(0);
  const touchStart = useRef<number | null>(null);
  if (!photos.length) return null;

  const move = (direction: -1 | 1) => setActive((current) => (current + direction + photos.length) % photos.length);

  return <div
    className="gallery"
    onMouseMove={(event) => {
      if (photos.length < 2 || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
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
    {photos.map((src, index) => <Image key={src} src={src} alt={`${alt} — ${index + 1}-р зураг`} fill sizes="(max-width: 800px) 100vw, 520px" className={index === active ? 'active' : ''} />)}
    {photos.length > 1 && <>
      <button className="arrow previous" type="button" aria-label="Өмнөх зураг" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.preventDefault(); e.stopPropagation(); move(-1); }}>‹</button>
      <button className="arrow next" type="button" aria-label="Дараах зураг" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.preventDefault(); e.stopPropagation(); move(1); }}>›</button>
      <div className="dots" aria-hidden="true">{photos.map((_, index) => <span key={index} className={index === active ? 'active' : ''} />)}</div>
    </>}
    <style jsx>{`
      .gallery { position: absolute; inset: 0; overflow: hidden; background: var(--thumb-bg); }
      .gallery :global(img) { object-fit: cover; opacity: 0; transition: opacity 180ms ease; }
      .gallery :global(img.active) { opacity: 1; }
      .arrow { position: absolute; z-index: 4; top: 50%; transform: translateY(-50%); width: 36px; height: 42px; border: 0; border-radius: 999px; background: rgba(12,17,31,.55); color: #fff; font: 600 28px/1 sans-serif; cursor: pointer; }
      .previous { left: 8px; } .next { right: 8px; }
      .dots { position: absolute; z-index: 4; left: 50%; bottom: 10px; transform: translateX(-50%); display: flex; gap: 5px; padding: 4px 6px; border-radius: 999px; background: rgba(12,17,31,.3); }
      .dots span { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.55); }
      .dots span.active { width: 16px; border-radius: 999px; background: #fff; }
    `}</style>
  </div>;
}
