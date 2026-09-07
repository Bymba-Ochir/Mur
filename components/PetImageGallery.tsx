'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { useLanguage } from '../lib/i18n';

export default function PetImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const { t } = useLanguage();
  const photos = [...new Set(images.filter(Boolean))].slice(0, 4);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const active = Math.max(0, photos.indexOf(selectedPhoto || ''));
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  if (!photos.length) return null;

  const move = (direction: -1 | 1) => setSelectedPhoto(photos[(active + direction + photos.length) % photos.length]);

  return <div
    className="gallery"
    onMouseMove={(event) => {
      if (photos.length < 2 || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      if ((event.target as HTMLElement).closest('.arrow')) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = Math.min(.999, Math.max(0, (event.clientX - rect.left) / rect.width));
      setSelectedPhoto(photos[Math.floor(ratio * photos.length)]);
    }}
    onTouchStart={(event) => {
      const touch = event.touches[0];
      touchStart.current = event.touches.length === 1 && touch ? { x: touch.clientX, y: touch.clientY } : null;
    }}
    onTouchCancel={() => { touchStart.current = null; }}
    onKeyDown={(event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); event.stopPropagation(); move(event.key === 'ArrowLeft' ? -1 : 1);
      }
    }}
    onTouchEnd={(event) => {
      if (touchStart.current == null) return;
      const end = event.changedTouches[0];
      const distance = (end?.clientX ?? touchStart.current.x) - touchStart.current.x;
      const vertical = (end?.clientY ?? touchStart.current.y) - touchStart.current.y;
      if (Math.abs(distance) > 38 && Math.abs(distance) > Math.abs(vertical)) move(distance < 0 ? 1 : -1);
      touchStart.current = null;
    }}
    role="group"
    aria-label={`${photos.length} ${t('detail_gallery_label')}`}
  >
    {photos.map((src, index) => <Image key={src} src={src} alt={`${alt} — ${index + 1} ${t('detail_gallery_image')}`} aria-hidden={index !== active} fill sizes="(max-width: 900px) 100vw, 620px" className={index === active ? 'active' : ''} />)}
    {photos.length > 1 && <>
      <button className="arrow previous" type="button" aria-label={t('detail_gallery_previous')} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.preventDefault(); e.stopPropagation(); move(-1); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg></button>
      <button className="arrow next" type="button" aria-label={t('detail_gallery_next')} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.preventDefault(); e.stopPropagation(); move(1); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg></button>
      <div className="dots" aria-hidden="true">{photos.map((_, index) => <span key={index} className={index === active ? 'active' : ''} />)}</div>
      <span className="counter" aria-live="polite">{active + 1} / {photos.length}</span>
    </>}
    <style jsx>{`
      .gallery { position: absolute; inset: 0; overflow: hidden; background: var(--thumb-bg); touch-action: pan-y; }
      .gallery :global(img) { object-fit: cover; opacity: 0; transition: opacity 180ms ease; }
      .gallery :global(img.active) { opacity: 1; }
      .arrow { position: absolute; z-index: 4; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; display:grid; place-items:center; border: 1px solid rgba(255,255,255,.35); border-radius: 50%; background: rgba(12,17,31,.62); color: #fff; cursor: pointer; transition: background .15s ease, transform .15s ease; }
      .arrow svg { width:22px; height:22px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
      .arrow:hover { background:rgba(12,17,31,.82); }
      .arrow:focus-visible { outline:3px solid #fff; outline-offset:2px; }
      .previous { left: 12px; } .next { right: 12px; }
      .dots { position: absolute; z-index: 4; left: 50%; bottom: 10px; transform: translateX(-50%); display: flex; gap: 5px; padding: 4px 6px; border-radius: 999px; background: rgba(12,17,31,.3); }
      .dots span { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.55); }
      .dots span.active { width: 16px; border-radius: 999px; background: #fff; }
      .counter { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; }
      @media (max-width:480px) { .arrow { width:44px; height:44px; } .previous{left:8px}.next{right:8px} }
      @media (prefers-reduced-motion:reduce) { .gallery :global(img),.arrow { transition:none; } }
    `}</style>
  </div>;
}
