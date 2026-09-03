'use client';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import Icon from './ui/icons';
import { distanceLabel } from '../lib/clinicService';
import type { VetClinic, VetService } from '../lib/types';
import type { TranslationKey } from '../lib/i18n';

const SERVICE_I18N: Record<VetService, TranslationKey> = {
  'Үзлэг': 'service_exam', 'Вакцин': 'service_vaccination', 'Мэс засал': 'service_surgery', 'Шүд арчилгаа': 'service_dental',
  'Рентген': 'service_xray', 'ЭХО': 'service_ultrasound', 'Цусны шинжилгээ': 'service_blood_test',
  'Микрочип': 'service_microchip', 'Туулгалт': 'service_deworming', 'Арчилгаа': 'service_grooming',
};

export default function ClinicCard({ clinic, distanceKm, selected, onSelect, onBook }: { clinic: VetClinic; distanceKm?: number; selected?: boolean; onSelect?: () => void; onBook?: () => void; }) {
  const { t, lang } = useLanguage();
  return (
    <article className={`clinic-card${selected ? ' selected' : ''}`} aria-label={clinic.name}>
      <div className="clinic-heading"><span className="clinic-icon" aria-hidden="true"><Icon name="cross" size={22} /></span><div><h3>{clinic.name}</h3><p className="district"><Icon name="pin" size={14} aria-hidden="true" />{clinic.district}</p></div>{distanceKm != null && <span className="distance">{distanceLabel(distanceKm, lang)}</span>}</div>
      <dl className="clinic-facts">
        <div><dt>{t('clinics_address').replace(':', '')}</dt><dd>{clinic.address}</dd></div>
        <div><dt>{t('clinics_hours').replace(':', '')}</dt><dd>{clinic.hours}</dd></div>
        <div className="phone-fact"><dt>{t('clinics_phone_visible')}</dt><dd className="phone-list">{(clinic.phones || [clinic.phone]).map((phone) => <a key={phone} href={`tel:${phone}`}><Icon name="phone" size={14} />{phone}</a>)}</dd></div>
      </dl>
      {clinic.note && <p className="clinic-note"><Icon name="info" size={15} aria-hidden="true" />{clinic.note}</p>}
      <div className="service-heading"><strong>{t('clinics_services')}</strong><span className={clinic.serviceDetailsVerified ? 'verified' : 'unverified'}><Icon name={clinic.serviceDetailsVerified ? 'check' : 'info'} size={13} />{clinic.serviceDetailsVerified ? t('clinics_services_verified') : t('clinics_services_unverified')}</span></div>
      <div className="services" aria-label={t('clinics_services')}>{clinic.services.map((service) => <span key={service}>{t(SERVICE_I18N[service])}</span>)}</div>
      <div className="source-row"><span><Icon name="check" size={13} />{t('clinics_verified')}: {clinic.verifiedAt}</span><a href={clinic.mapUrl} target="_blank" rel="noopener noreferrer"><Icon name="pin" size={14} />{t('clinics_open_maps')}</a>{clinic.websiteUrl && <a href={clinic.websiteUrl} target="_blank" rel="noopener noreferrer"><Icon name="share" size={14} />{t('clinics_open_page')}</a>}</div>
      <div className="clinic-actions">
        {onSelect && <Button variant={selected ? 'secondary' : 'ghost'} onClick={onSelect} aria-pressed={selected}><Icon name="pin" size={15} />{selected ? t('clinics_selected') : t('clinics_show_map')}</Button>}
        <Button as="anchor" href={`tel:${clinic.phone}`} variant="ghost"><Icon name="phone" size={15} />{t('clinics_call')}</Button>
        {onBook && <Button variant="primary" onClick={onBook}><Icon name="calendar" size={15} />{t('clinics_book')}</Button>}
      </div>
      <style jsx>{`
        .clinic-card{display:flex;flex-direction:column;gap:var(--sp-3);padding:var(--sp-5);background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl);box-shadow:var(--shadow-sm);transition:border-color var(--dur-base) var(--ease-out),box-shadow var(--dur-base) var(--ease-out),transform var(--dur-base) var(--ease-out)}
        @media(hover:hover) and (pointer:fine){.clinic-card:hover{transform:translateY(-3px);border-color:var(--primary-light);box-shadow:var(--shadow-md)}}.clinic-card.selected{border-color:var(--border-focus);box-shadow:0 0 0 2px color-mix(in srgb,var(--primary) 18%,transparent),var(--shadow-md)}
        .clinic-heading{display:flex;align-items:flex-start;gap:var(--sp-3)}.clinic-icon{display:flex;align-items:center;justify-content:center;width:2.75rem;height:2.75rem;flex:0 0 auto;color:var(--clinic);background:color-mix(in srgb,var(--clinic) 14%,var(--card));border-radius:var(--r-md)}.clinic-heading>div{flex:1;min-width:0}h3{margin:0;color:var(--ink);font-family:var(--font-display);font-size:var(--text-lg);line-height:var(--lh-tight)}.district{display:flex;align-items:center;gap:var(--sp-1);margin:var(--sp-1) 0 0;color:var(--muted);font-size:var(--text-xs)}.distance{padding:5px 9px;color:var(--primary);background:var(--eyebrow-bg);border-radius:var(--r-pill);font-size:var(--text-xs);font-weight:800;white-space:nowrap}
        .clinic-facts{display:grid;grid-template-columns:1.35fr .65fr;gap:var(--sp-2);margin:0}.clinic-facts div{padding:var(--sp-3);background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-sm)}.clinic-facts .phone-fact{grid-column:1/-1}dt{color:var(--muted);font-size:var(--text-xs);font-weight:700}dd{margin:var(--sp-1) 0 0;color:var(--ink);font-size:var(--text-sm);line-height:1.5;overflow-wrap:anywhere}.phone-list{display:flex;flex-wrap:wrap;gap:var(--sp-2)}.phone-list a{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:6px 10px;color:var(--primary);background:var(--eyebrow-bg);border-radius:var(--r-sm);font-weight:800;text-decoration:none}.phone-list a:hover{text-decoration:underline}.clinic-note{display:flex;align-items:flex-start;gap:var(--sp-2);margin:0;padding:var(--sp-3);color:var(--accent-deep);background:color-mix(in srgb,var(--accent) 10%,var(--card));border-radius:var(--r-sm);font-size:var(--text-sm);line-height:1.5}.clinic-note :global(svg){flex:0 0 auto;margin-top:2px}.service-heading{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);flex-wrap:wrap}.service-heading strong{font-size:var(--text-xs)}.service-heading span{display:inline-flex;align-items:center;gap:5px;color:var(--muted);font-size:11px}.service-heading .verified{color:var(--success)}.services{display:flex;flex-wrap:wrap;gap:var(--sp-2)}.services span{padding:5px 10px;color:var(--primary);background:var(--surface-3);border-radius:var(--r-pill);font-size:var(--text-xs);font-weight:700}.source-row{display:flex;align-items:center;gap:var(--sp-3);flex-wrap:wrap;padding-top:var(--sp-2);border-top:1px solid var(--line);font-size:11px}.source-row span,.source-row a{display:inline-flex;align-items:center;gap:5px}.source-row span{color:var(--muted)}.source-row a{min-height:36px;color:var(--primary);font-weight:700;text-decoration:none}.source-row a:hover{text-decoration:underline}.clinic-actions{display:flex;justify-content:flex-end;gap:var(--sp-2);margin-top:auto;padding-top:var(--sp-2);flex-wrap:wrap}
        @media(max-width:700px){.clinic-card{padding:var(--sp-4);border-radius:var(--r-md)}.clinic-facts{grid-template-columns:1fr}.phone-list a{min-height:var(--touch-target)}.source-row{display:grid;grid-template-columns:1fr 1fr}.source-row>span{grid-column:1/-1}.source-row a{min-height:var(--touch-target)}.clinic-actions{align-items:stretch;flex-direction:column}.clinic-actions :global(.btn-base){width:100%;justify-content:center}}
      `}</style>
    </article>
  );
}
