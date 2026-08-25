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
    <article className="page-shell page-shell--narrow max-w-[680px]">
      <div className="eyebrow">⚖️</div>
      <h1 className="mb-[var(--sp-1)] text-[clamp(24px,4vw,32px)]">{doc.title}</h1>
      <p className="mb-[var(--sp-5)] font-[family-name:var(--font-mono)] text-[12.5px] text-[var(--muted)]">{doc.updated}</p>

      {doc.sections.map((s) => (
        <section className="mb-[var(--sp-5)]" key={s.heading}>
          <h2 className="mb-[var(--sp-2)] font-[family-name:var(--font-display)] text-[16.5px] text-[var(--primary)]">{s.heading}</h2>
          {s.paragraphs.map((p, i) => <p className="mb-[var(--sp-2)] text-sm leading-[1.7] text-[var(--ink)]" key={i}>{p}</p>)}
        </section>
      ))}
    </article>
  );
}
