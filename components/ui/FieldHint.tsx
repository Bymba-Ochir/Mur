'use client';

import { useLanguage } from '../../lib/i18n';

export default function FieldHint({ mn, en, id }: { mn: string; en: string; id?: string }) {
  const { lang } = useLanguage();
  return <p id={id} className="mx-0.5 mb-2 mt-1 text-[11.5px] leading-[1.5] text-[var(--muted)] max-[480px]:text-xs max-[480px]:leading-[1.55]">{lang === 'mn' ? mn : en}</p>;
}
