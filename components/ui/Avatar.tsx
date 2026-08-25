'use client';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: number;
  fallback?: React.ReactNode;
  className?: string;
}

export default function Avatar({ src, alt = '', size = 40, fallback, className = '' }: AvatarProps) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--surface-3)] ${className}`} style={{ width: size, height: size }}>
      {src ? (
        <Image src={src} alt={alt} width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <span className="leading-none" style={{ fontSize: size * 0.5 }} aria-hidden="true">{fallback ?? '🐾'}</span>
      )}
    </span>
  );
}
