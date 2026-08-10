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
      className={`card clinic-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(); } }}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="clinic-content">
        <div className="clinic-heading">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--primary)' }}>
            {clinic.name}
          </h3>
          {distanceKm != null && (
            <span className="chip">{distanceLabel(distanceKm)}</span>
          )}
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '2px 0' }}>
          <strong>{t('clinics_address')}</strong> {clinic.address}
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '2px 0' }}>
          <strong>{t('clinics_hours')}</strong> {clinic.hours}
        </p>
        {clinic.note && (
          <p style={{ fontSize: 12, color: 'var(--accent)', margin: '4px 0', fontStyle: 'italic' }}>
            {t('clinics_note')} {clinic.note}
          </p>
        )}
        <div className="clinic-services">
          {clinic.services.map((s) => (
            <span key={s} className="chip">{t(SERVICE_I18N[s] as 'service_exam')}</span>
          ))}
        </div>
        <div className="clinic-actions">
          <Button as="anchor" href={`tel:${clinic.phone}`} variant="ghost" style={{ fontSize: 12, minHeight: 36, minWidth: 'auto' }}>
            ☎ {t('clinics_call')}
          </Button>
          {onBook && (
            <Button variant="primary" style={{ fontSize: 12, minHeight: 36, minWidth: 148, background: 'var(--clinic)', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); onBook(); }}>
              {t('clinics_book')}
            </Button>
          )}
        </div>
      </div>

      <style jsx>{`
        .clinic-card {
          display: flex; gap: var(--sp-3); align-items: flex-start;
          padding: var(--sp-5);
          transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
        }
        .clinic-content { flex: 1; min-width: 0; }
        .clinic-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--sp-2); }
        .clinic-services { display: flex; flex-wrap: wrap; gap: 5px; margin-top: var(--sp-2); }
        .clinic-actions { display: flex; justify-content: flex-end; gap: var(--sp-2); margin-top: var(--sp-4); }
        .clinic-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary-light);
        }
        .clinic-card.selected { border-color: var(--border-focus); box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent); }
        .chip {
          display: inline-block; font-size: 11px; padding: 3px 10px;
          background: var(--surface-3); border-radius: var(--r-pill);
          color: var(--primary); font-weight: 600; white-space: nowrap;
        }
        @media (max-width: 640px) {
          .clinic-card { padding: var(--sp-4); }
          .clinic-actions { justify-content: stretch; }
          .clinic-actions :global(.btn-base) { flex: 1; min-width: 0 !important; }
        }
      `}</style>
    </div>
  );
}
