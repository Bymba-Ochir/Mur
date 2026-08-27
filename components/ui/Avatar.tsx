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
    <span className={`avatar ${className}`} style={{ width: size, height: size }}>
      {src ? (
        <Image src={src} alt={alt} width={size} height={size} className="avatar-img" />
      ) : (
        <span className="avatar-fallback" aria-hidden="true">{fallback ?? '🐾'}</span>
      )}
      <style jsx>{`
        .avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          overflow: hidden;
          background: var(--surface-3);
          border: 1px solid var(--border-subtle);
          flex-shrink: 0;
        }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-fallback { font-size: calc(var(--size, 40px) * 0.5); line-height: 1; }
      `}</style>
    </span>
  );
}
