'use client';
import type { ReactNode } from 'react';

/**
 * Хоосон (empty) төлөвийн нэгдсэн primitive.
 * Hardcode emoji-ийн оронд SVG icon prop-оор дамжуулна.
 */
export default function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  /** SVG icon node (жишээ: <Icon name="vaccine" />) — aria-hidden-той дугуй дэвсгэрт харагдана */
  icon: ReactNode;
  title?: string;
  description?: string;
  /** Нэмэлт агуулга (жишээ: action товч) */
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--line)] bg-[var(--card)] px-[var(--sp-4)] py-[var(--sp-6)] text-center max-[480px]:rounded-[var(--r-md)] max-[480px]:px-[var(--sp-3)] max-[480px]:py-[var(--sp-5)]">
      <div className="mx-auto mb-[var(--sp-3)] flex size-[72px] items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--eyebrow-bg)] text-[var(--primary)] max-[480px]:size-16" aria-hidden="true">{icon}</div>
      {title && <p className="mb-[var(--sp-2)] text-base font-bold text-[var(--primary)]">{title}</p>}
      {description && <p className="text-[13.5px] leading-[1.6] text-[var(--muted)]">{description}</p>}
      {children && <div className={description ? 'mt-[var(--sp-4)]' : ''}>{children}</div>}
    </div>
  );
}
