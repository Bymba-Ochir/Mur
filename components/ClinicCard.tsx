'use client';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import { distanceLabel } from '../lib/clinicService';
import type { VetClinic } from '../lib/types';

const SERVICE_I18N: Record<string, string> = {
  'Үзлэг': 'service_exam',
  'Вакцин': 'service_vaccination',
  'Мэс засал': 'service_surgery',
  'Шүд арчилгаа': 'service_dental',
};

export default function ClinicCard({
  clinic, distanceKm, selected, onSelect, onBook,
}: {
  clinic: VetClinic;
  distanceKm?: number;
  selected?: boolean;
  onSelect?: () => void;
  onBook?: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div
      className={`card flex items-start gap-[var(--sp-3)] p-[var(--sp-5)] transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] ease-[var(--ease-out)] hover:-translate-y-[3px] hover:border-[var(--primary-light)] hover:shadow-[var(--shadow-md)] max-sm:p-[var(--sp-4)] ${selected ? 'border-[var(--border-focus)] shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_20%,transparent)]' : ''}`}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(); } }}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-[var(--sp-2)]">
          <h3 className="font-[family-name:var(--font-display)] text-[15px] font-semibold text-[var(--primary)]">
            {clinic.name}
          </h3>
          {distanceKm != null && (
            <span className="inline-block whitespace-nowrap rounded-[var(--r-pill)] bg-[var(--surface-3)] px-2.5 py-[3px] text-[11px] font-semibold text-[var(--primary)]">{distanceLabel(distanceKm)}</span>
          )}
        </div>
        <p className="my-0.5 text-[12.5px] text-[var(--muted)]">
          <strong>{t('clinics_address')}</strong> {clinic.address}
        </p>
        <p className="my-0.5 text-[12.5px] text-[var(--muted)]">
          <strong>{t('clinics_hours')}</strong> {clinic.hours}
        </p>
        {clinic.note && (
          <p className="my-1 text-xs italic text-[var(--accent)]">
            {t('clinics_note')} {clinic.note}
          </p>
        )}
        <div className="mt-[var(--sp-2)] flex flex-wrap gap-[5px]">
          {clinic.services.map((s) => (
            <span key={s} className="inline-block whitespace-nowrap rounded-[var(--r-pill)] bg-[var(--surface-3)] px-2.5 py-[3px] text-[11px] font-semibold text-[var(--primary)]">{t(SERVICE_I18N[s] as 'service_exam')}</span>
          ))}
        </div>
        <div className="mt-[var(--sp-4)] flex justify-end gap-[var(--sp-2)] max-sm:justify-stretch max-sm:[&_.btn-base]:min-w-0 max-sm:[&_.btn-base]:flex-1">
          <Button as="anchor" href={`tel:${clinic.phone}`} variant="ghost" className="min-h-9 min-w-0 text-xs">
            ☎ {t('clinics_call')}
          </Button>
          {onBook && (
            <Button variant="primary" className="min-h-9 min-w-[148px] justify-center bg-[var(--clinic)] text-xs" onClick={(e) => { e.stopPropagation(); onBook(); }}>
              {t('clinics_book')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
