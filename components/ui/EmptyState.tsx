'use client';
import type { ReactNode } from 'react';

/**
 * Хоосон (empty) төлөвийн нэгдсэн primitive.
 * 💉/👍 гэх мэт hardcode emoji-ийн оронд SVG icon prop-оор дамжуулна.
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
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">{icon}</div>
      {title && <p className="empty-title">{title}</p>}
      {description && <p className="empty-desc">{description}</p>}
      {children}
      <style jsx>{`
        .empty-state {
          text-align: center;
          padding: var(--sp-6) var(--sp-4);
          background: var(--card);
          border: 1px dashed var(--line);
          border-radius: var(--r-lg);
        }
        @media (max-width: 480px) {
          .empty-state { padding: var(--sp-5) var(--sp-3); border-radius: var(--r-md); }
        }
        .empty-icon {
          width: 72px; height: 72px; margin: 0 auto var(--sp-3);
          display: flex; align-items: center; justify-content: center;
          background: var(--eyebrow-bg); color: var(--primary);
          border: 1px solid var(--glass-border); border-radius: 50%;
        }
        @media (max-width: 480px) {
          .empty-icon { width: 64px; height: 64px; margin-bottom: var(--sp-3); }
        }
        .empty-title {
          font-weight: 700; color: var(--primary); font-size: 16px; margin-bottom: var(--sp-2);
        }
        .empty-desc {
          color: var(--muted); font-size: 13.5px; line-height: 1.6;
        }
        .empty-desc + :global(*) { margin-top: var(--sp-4); }
      `}</style>
    </div>
  );
}
