'use client';
import { useLanguage } from '../lib/i18n';
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--sp-2)' }}>
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {clinic.services.map((s) => (
            <span key={s} className="chip">{t(SERVICE_I18N[s] as 'service_exam')}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)' }}>
          <a href={`tel:${clinic.phone}`} className="btn btn-ghost" style={{ fontSize: 12, minHeight: 36, minWidth: 'auto' }}>
            ☎ {t('clinics_call')}
          </a>
          {onBook && (
            <button className="btn btn-accent" style={{ fontSize: 12, minHeight: 36, flex: 1, justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); onBook(); }}>
              {t('clinics_book')}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .clinic-card {
          display: flex; gap: var(--sp-3); align-items: flex-start;
          transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
        }
        .clinic-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary-light);
        }
        .clinic-card.selected { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(232,114,92,0.2); }
        .chip {
          display: inline-block; font-size: 11px; padding: 3px 10px;
          background: var(--surface-3); border-radius: var(--r-pill);
          color: var(--primary); font-weight: 600; white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
