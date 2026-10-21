'use client';

import { useLanguage } from '../../lib/i18n';

export default function FieldHint({ mn, en, id }: { mn: string; en: string; id?: string }) {
  const { lang } = useLanguage();
  return <p id={id} className="field-hint">{lang === 'mn' ? mn : en}<style jsx>{`
    .field-hint { margin: 4px 2px 8px; color: var(--muted); font-size: 11.5px; line-height: 1.5; }
    @media (max-width: 480px) { .field-hint { font-size: 12px; line-height: 1.55; } }
  `}</style></p>;
}
