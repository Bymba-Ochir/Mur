'use client';
import { useState } from 'react';
import { useLanguage } from '../lib/i18n';
import { VET_CLINICS } from '../lib/vetClinics';
import { DISTRICTS } from '../lib/districts';

export default function VetClinicList() {
  const { t } = useLanguage();
  const [district, setDistrict] = useState('');

  const filtered = district
    ? VET_CLINICS.filter((c) => c.district === district)
    : VET_CLINICS;

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">{t('clinics_eyebrow')}</div>
        <h1>{t('clinics_title')}</h1>
        <p>{t('clinics_desc')}</p>
      </div>

      <select
        className="field"
        value={district}
        onChange={(e) => setDistrict(e.target.value)}
        style={{ maxWidth: 300, marginBottom: 'var(--sp-4)' }}
      >
        <option value="">{t('filter_all_districts')}</option>
        {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
      </select>

      {filtered.length === 0 ? (
        <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 'var(--sp-6) 0' }}>{t('empty_no_results_title')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {filtered.map((clinic) => (
            <div key={clinic.id} className="card" style={{ padding: 'var(--sp-4)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>
                {clinic.name}
              </h3>
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
              <a
                href={`tel:${clinic.phone}`}
                className="btn btn-ghost"
                style={{ marginTop: 'var(--sp-2)', fontSize: 13, display: 'inline-flex', minWidth: 'auto' }}
              >
                ☎ {t('clinics_call')}: {clinic.phone}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
