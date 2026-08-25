'use client';
import Image from 'next/image';
import { useRef, useState } from 'react';

const ARROW = 'arrow absolute top-1/2 z-4 h-[42px] w-9 -translate-y-1/2 cursor-pointer rounded-full border-0 bg-[rgba(12,17,31,.55)] font-sans text-[28px] font-semibold leading-none text-white';

export default function PetImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const photos = [...new Set(images.filter(Boolean))].slice(0, 4);
  const [active, setActive] = useState(0);
  const touchStart = useRef<number | null>(null);
  if (!photos.length) return null;
  const move = (direction: -1 | 1) => setActive((current) => (current + direction + photos.length) % photos.length);

  return <div className="absolute inset-0 overflow-hidden bg-[var(--thumb-bg)]" onMouseMove={(event) => {
    if (photos.length < 2 || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if ((event.target as HTMLElement).closest('.arrow')) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setActive(Math.floor(Math.min(.999, Math.max(0, (event.clientX - rect.left) / rect.width)) * photos.length));
  }} onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => {
    if (touchStart.current == null) return;
    const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
    if (Math.abs(distance) > 38) move(distance < 0 ? 1 : -1);
    touchStart.current = null;
  }} aria-label={`${photos.length} зурагтай галерей. ${active + 1}-р зураг.`}>
    {photos.map((src, index) => <Image key={src} src={src} alt={`${alt} — ${index + 1}-р зураг`} fill sizes="(max-width: 800px) 100vw, 520px" className={`object-cover transition-opacity duration-200 ${index === active ? 'opacity-100' : 'opacity-0'}`} />)}
    {photos.length > 1 && <><button className={`${ARROW} left-2`} type="button" aria-label="Өмнөх зураг" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.preventDefault(); e.stopPropagation(); move(-1); }}>‹</button><button className={`${ARROW} right-2`} type="button" aria-label="Дараах зураг" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.preventDefault(); e.stopPropagation(); move(1); }}>›</button><div className="absolute bottom-2.5 left-1/2 z-4 flex -translate-x-1/2 gap-[5px] rounded-full bg-[rgba(12,17,31,.3)] px-1.5 py-1" aria-hidden="true">{photos.map((_, index) => <span key={index} className={`h-1.5 rounded-full ${index === active ? 'w-4 bg-white' : 'w-1.5 bg-[rgba(255,255,255,.55)]'}`} />)}</div></>}
  </div>;
}
