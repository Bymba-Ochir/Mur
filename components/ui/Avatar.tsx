'use client';
import Image from 'next/image';
import { PawPrint } from 'lucide-react';

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
        <span className="flex items-center justify-center leading-none" aria-hidden="true">{fallback ?? <PawPrint size={size * 0.5} />}</span>
      )}
    </span>
  );
}
