'use client';
import { useLanguage } from '../lib/i18n';

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDoc {
  title: string;
  updated: string;
  sections: LegalSection[];
}

/**
 * Хууль эрх зүйн хуудсуудын нийтлэг рендер. MN/EN хоёр хэлний контентыг
 * props-ээр авч, одоогийн хэлээр харуулна. Контент өөрөө тусдаа бичигдэнэ
 * (i18n DICT-ийг хөдлөөхгүй — эдгээр нь урт, хуудас-төвтэй текст).
 */
export default function LegalContent({ mn, en }: { mn: LegalDoc; en: LegalDoc }) {
  const { lang } = useLanguage();
  const doc = lang === 'mn' ? mn : en;

  return (
    <article className="legal">
      <div className="eyebrow">⚖️</div>
      <h1>{doc.title}</h1>
      <p className="legal-updated">{doc.updated}</p>

      {doc.sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          {s.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </section>
      ))}

      <style jsx>{`
        .legal { max-width: 680px; }
        h1 { font-size: clamp(24px, 4vw, 32px); margin-bottom: var(--sp-1); }
        .legal-updated {
          font-size: 12.5px; color: var(--muted); margin-bottom: var(--sp-5);
          font-family: var(--font-mono);
        }
        section { margin-bottom: var(--sp-5); }
        h2 {
          font-size: 16.5px; color: var(--primary); margin-bottom: var(--sp-2);
          font-family: var(--font-display);
        }
        p { font-size: 14px; line-height: 1.7; color: var(--ink); margin-bottom: var(--sp-2); }
      `}</style>
    </article>
  );
}
