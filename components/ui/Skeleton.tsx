'use client';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
  className?: string;
}

export default function Skeleton({ width = '100%', height = 14, radius = 'var(--r-sm)', className = '' }: SkeletonProps) {
  return (
    <span className={`skel-row block shrink-0 bg-[var(--thumb-bg)] ${className}`} style={{ width, height, borderRadius: radius }} aria-hidden="true" />
  );
}
