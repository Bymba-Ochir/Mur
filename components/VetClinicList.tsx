'use client';
import { useMemo, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { useLanguage } from '../lib/i18n';
import { useToast } from './Toast';
import { DISTRICTS } from '../lib/districts';
import { searchClinics, findNearestClinics } from '../lib/clinicService';
import ClinicMap from './ClinicMap';
import ClinicCard from './ClinicCard';
import AppointmentModal from './AppointmentModal';
import AppointmentsSection from './AppointmentsSection';
import LoginModal from './LoginModal';
import EmptyState from './ui/EmptyState';
import Button from './ui/Button';
import Icon from './ui/icons';
import type { VetClinic, VetService } from '../lib/types';
import type { TranslationKey } from '../lib/i18n';

const SERVICE_OPTIONS: VetService[] = ['Үзлэг', 'Вакцин', 'Мэс засал', 'Шүд арчилгаа', 'Рентген', 'ЭХО', 'Цусны шинжилгээ', 'Микрочип', 'Туулгалт', 'Арчилгаа'];
const SERVICE_I18N: Record<VetService, TranslationKey> = {
  'Үзлэг': 'service_exam', 'Вакцин': 'service_vaccination', 'Мэс засал': 'service_surgery', 'Шүд арчилгаа': 'service_dental',
  'Рентген': 'service_xray', 'ЭХО': 'service_ultrasound', 'Цусны шинжилгээ': 'service_blood_test',
  'Микрочип': 'service_microchip', 'Туулгалт': 'service_deworming', 'Арчилгаа': 'service_grooming',
};

export default function VetClinicList({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth(); const { t } = useLanguage(); const showToast = useToast();
  const [district, setDistrict] = useState(''); const [service, setService] = useState<VetService | ''>(''); const [query, setQuery] = useState('');
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null); const [locating, setLocating] = useState(false); const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bookingClinic, setBookingClinic] = useState<VetClinic | null>(null); const [showLogin, setShowLogin] = useState(false); const [apptRefreshKey, setApptRefreshKey] = useState(0);
  const hasFilters = Boolean(district || service || query || userCoords);
  const filtered = useMemo(() => { const result = searchClinics({ district, service, query }); return userCoords ? findNearestClinics(userCoords[0], userCoords[1], result, 20) : result; }, [district, service, query, userCoords]);

  function handleLocation() {
    if (!navigator.geolocation) { showToast(t('clinics_nearby_none'), 'error'); return; }
    setLocating(true); navigator.geolocation.getCurrentPosition((position) => { setUserCoords([position.coords.latitude, position.coords.longitude]); setLocating(false); }, () => { setLocating(false); showToast(t('clinics_nearby_none'), 'error'); });
  }
  function resetFilters() { setDistrict(''); setService(''); setQuery(''); setUserCoords(null); setSelectedId(null); }
  function handleBook(clinic: VetClinic) { if (!user) { setShowLogin(true); return; } setBookingClinic(clinic); }

  return (
    <div className={embedded ? 'clinic-embedded' : 'page-shell'}>
      {!embedded && <header className="page-header"><p className="eyebrow">{t('clinics_eyebrow')}</p><h1>{t('clinics_title')}</h1><p>{t('clinics_desc')}</p></header>}
      <aside className="data-notice" aria-labelledby="clinic-notice-title"><span><Icon name="info" size={20} /></span><div><h2 id="clinic-notice-title">{t('clinics_data_notice_title')}</h2><p>{t('clinics_data_notice_desc')}</p></div></aside>

      <section className="filters-panel" aria-labelledby="clinic-filters-title">
        <div className="filters-heading"><div><p className="filter-kicker">{t('clinics_filter_kicker')}</p><h2 id="clinic-filters-title">{t('clinics_filters_title')}</h2></div>{hasFilters && <button type="button" className="reset-filters" onClick={resetFilters}>{t('clinics_clear_filters')}</button>}</div>
        <div className="filter-grid">
          <label htmlFor="clinic-search"><span>{t('clinics_search_label')}</span><span className="input-wrap"><Icon name="search" size={18} /><input id="clinic-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('search_placeholder')} /></span></label>
          <label htmlFor="clinic-district"><span>{t('clinics_district_label')}</span><select id="clinic-district" value={district} onChange={(event) => setDistrict(event.target.value)}><option value="">{t('filter_all_districts')}</option>{DISTRICTS.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label htmlFor="clinic-service"><span>{t('clinics_service_label')}</span><select id="clinic-service" value={service} onChange={(event) => setService(event.target.value as VetService | '')}><option value="">{t('clinics_service_filter')}</option>{SERVICE_OPTIONS.map((value) => <option key={value} value={value}>{t(SERVICE_I18N[value])}</option>)}</select></label>
          <div className="location-action"><span>{t('clinics_map_title')}</span><Button variant="ghost" onClick={handleLocation} disabled={locating} aria-busy={locating}><Icon name="pin" size={17} />{locating ? t('clinics_locating') : t('clinics_use_location')}</Button></div>
        </div>
      </section>

      <div className="clinic-explorer">
        <section className="clinic-results" aria-labelledby="clinic-results-title">
          <div className="results-heading"><h2 id="clinic-results-title">{t('clinics_results_title')}</h2><p aria-live="polite">{filtered.length} {t('clinics_results_count')}</p></div>
          {filtered.length === 0 ? <EmptyState icon={<Icon name="cross" size={30} />} title={t('empty_no_results_title')} description={t('clinics_empty_desc')}><Button variant="secondary" onClick={resetFilters}>{t('clinics_clear_filters')}</Button></EmptyState> : <div className="clinic-list">{filtered.map((clinic) => <ClinicCard key={clinic.id} clinic={clinic} distanceKm={'distanceKm' in clinic ? (clinic as VetClinic & { distanceKm: number }).distanceKm : undefined} selected={selectedId === clinic.id} onSelect={() => setSelectedId(selectedId === clinic.id ? null : clinic.id)} onBook={() => handleBook(clinic)} />)}</div>}
        </section>
        <section className="map-panel" aria-labelledby="clinic-map-title"><div className="map-heading"><span className="map-icon"><Icon name="pin" size={18} /></span><h2 id="clinic-map-title">{t('clinics_map_title')}</h2></div><ClinicMap clinics={filtered} selectedId={selectedId} userCoords={userCoords} onSelect={setSelectedId} label={t('clinics_map_label')} userLocationLabel={t('clinics_user_location')} /></section>
      </div>

      {user && <AppointmentsSection refreshKey={apptRefreshKey} onChange={() => setApptRefreshKey((key) => key + 1)} />}
      {bookingClinic && <AppointmentModal clinic={bookingClinic} onClose={() => setBookingClinic(null)} onCreated={() => setApptRefreshKey((key) => key + 1)} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      <style jsx>{`
        .data-notice{display:flex;align-items:flex-start;gap:var(--sp-3);margin-bottom:var(--sp-5);padding:var(--sp-4);color:var(--primary);background:color-mix(in srgb,var(--clinic) 10%,var(--card));border:1px solid color-mix(in srgb,var(--clinic) 28%,var(--line));border-radius:var(--r-lg)}.data-notice>span{display:flex;padding:var(--sp-2);color:var(--clinic);background:var(--card);border-radius:var(--r-sm)}.data-notice h2{margin:0;color:var(--ink);font-size:var(--text-base)}.data-notice p{margin:var(--sp-1) 0 0;color:var(--muted);font-size:var(--text-sm);line-height:1.6}
        .filters-panel{margin-bottom:var(--sp-6);padding:var(--sp-5);background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl);box-shadow:var(--shadow-sm)}.filters-heading,.results-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:var(--sp-4);margin-bottom:var(--sp-4)}.filter-kicker{margin:0 0 var(--sp-1);color:var(--accent-deep);font-family:var(--font-mono);font-size:var(--text-xs);font-weight:800;text-transform:uppercase;letter-spacing:.06em}h2{margin:0;color:var(--ink);font-family:var(--font-heading);font-size:var(--text-xl)}.reset-filters{min-height:var(--touch-target);padding:var(--sp-2) var(--sp-3);color:var(--primary);background:transparent;border:0;border-radius:var(--r-sm);font:inherit;font-size:var(--text-sm);font-weight:700;cursor:pointer}.reset-filters:hover{background:var(--eyebrow-bg)}.reset-filters:focus-visible{outline:2px solid var(--border-focus);outline-offset:2px}
        .filter-grid{display:grid;grid-template-columns:minmax(15rem,1.5fr) repeat(2,minmax(10rem,1fr)) minmax(12rem,auto);gap:var(--sp-3);align-items:end}label,.location-action{display:flex;flex-direction:column;gap:var(--sp-2);min-width:0;color:var(--primary);font-size:var(--text-xs);font-weight:700}input,select{width:100%;min-height:var(--touch-target);padding:var(--sp-2) var(--sp-3);color:var(--ink);background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-sm);font:inherit;font-size:var(--text-sm)}input:focus-visible,select:focus-visible{outline:2px solid var(--border-focus);outline-offset:1px}.input-wrap{position:relative;display:flex;align-items:center}.input-wrap :global(svg){position:absolute;left:var(--sp-3);color:var(--muted);pointer-events:none}.input-wrap input{padding-left:var(--sp-8)}.location-action :global(.btn-base){width:100%;justify-content:center;white-space:nowrap}
        .clinic-explorer{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(22rem,.92fr);gap:var(--sp-5);align-items:start}.results-heading{align-items:center}.results-heading p{margin:0;color:var(--muted);font-size:var(--text-sm)}.clinic-list{display:grid;gap:var(--sp-4)}.map-panel{position:sticky;top:calc(var(--nav-h) + var(--sp-4));padding:var(--sp-4);background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl);box-shadow:var(--shadow-sm)}.map-heading{display:flex;align-items:center;gap:var(--sp-2);margin-bottom:var(--sp-3)}.map-heading h2{font-size:var(--text-lg)}.map-icon{display:flex;padding:var(--sp-2);color:var(--clinic);background:color-mix(in srgb,var(--clinic) 12%,var(--card));border-radius:var(--r-sm)}
        @media(max-width:1100px){.filter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.clinic-explorer{grid-template-columns:1fr}.map-panel{position:static;grid-row:1}}
        @media(max-width:640px){.data-notice,.filters-panel,.map-panel{padding:var(--sp-4);border-radius:var(--r-md)}.filter-grid{grid-template-columns:1fr}.filters-heading{align-items:flex-start}.results-heading{align-items:flex-start;flex-direction:column;gap:var(--sp-1)}}
      `}</style>
    </div>
  );
}
