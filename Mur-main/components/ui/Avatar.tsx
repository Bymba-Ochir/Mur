'use client';
import Image from 'next/image';
import Icon from './icons';

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
        <span className="avatar-fallback" aria-hidden="true">{fallback ?? <Icon name="paw" size={Math.max(16, Math.round(size * 0.48))} />}</span>
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
        .avatar-fallback { display:grid; place-items:center; color:var(--primary); line-height: 1; }
      `}</style>
    </span>
  );
}
