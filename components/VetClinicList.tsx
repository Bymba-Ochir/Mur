'use client';
import { useMemo, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import Button from './ui/Button';
import { useLanguage } from '../lib/i18n';
import { useToast } from './Toast';
import { DISTRICTS } from '../lib/districts';
import { searchClinics, findNearestClinics } from '../lib/clinicService';
import ClinicMap from './ClinicMap';
import ClinicCard from './ClinicCard';
import AppointmentModal from './AppointmentModal';
import AppointmentsSection from './AppointmentsSection';
import LoginModal from './LoginModal';
import type { VetClinic, VetService } from '../lib/types';

const SERVICE_OPTIONS: (VetService | '')[] = ['', 'Үзлэг', 'Вакцин', 'Мэс засал', 'Шүд арчилгаа'];

export default function VetClinicList({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const showToast = useToast();

  const [district, setDistrict] = useState('');
  const [service, setService] = useState<VetService | ''>('');
  const [query, setQuery] = useState('');
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bookingClinic, setBookingClinic] = useState<VetClinic | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [apptRefreshKey, setApptRefreshKey] = useState(0);

  const filtered = useMemo(() => {
    let list = searchClinics({ district, service, query });
    if (userCoords) {
      list = findNearestClinics(userCoords[0], userCoords[1], list, 20);
    }
    return list;
  }, [district, service, query, userCoords]);

  function handleLocation() {
    if (!navigator.geolocation) {
      showToast(t('clinics_nearby_none'), 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => {
        setLocating(false);
        showToast(t('clinics_nearby_none'), 'error');
      },
    );
  }

  function handleBook(clinic: VetClinic) {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setBookingClinic(clinic);
  }

  return (
    <div className={embedded ? 'clinic-embedded' : 'page-shell'}>
      {!embedded && (
        <div className="page-header">
          <div className="eyebrow">{t('clinics_eyebrow')}</div>
          <h1>{t('clinics_title')}</h1>
          <p>{t('clinics_desc')}</p>
        </div>
      )}

      {/* Газрын зураг */}
      <ClinicMap
        clinics={filtered}
        selectedId={selectedId}
        userCoords={userCoords}
        onSelect={setSelectedId}
      />

      {/* Шүүлтүүр + Байршил */}
      <div className="filter-bar content-panel" style={{ marginTop: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
        <select className="filter" aria-label={t('filter_all_districts')} value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="">{t('filter_all_districts')}</option>
          {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select className="filter" aria-label={t('clinics_service_filter')} value={service} onChange={(e) => setService(e.target.value as VetService | '')}>
          <option value="">{t('clinics_service_filter')}</option>
          {SERVICE_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s!}>{s}</option>
          ))}
        </select>
        <input
          className="filter"
          type="search"
          placeholder={t('search_placeholder')}
          aria-label={t('search_placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button
          variant="ghost"
          onClick={handleLocation}
          disabled={locating}
          style={{ whiteSpace: 'nowrap', minHeight: 'var(--touch-target-sm)' }}
        >
          {locating ? t('clinics_locating') : t('clinics_use_location')}
        </Button>
      </div>

      {/* Эмнэлгүүдийн жагсаалт */}
      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 'var(--sp-6) 0' }}>
          {t('empty_no_results_title')}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {filtered.map((c) => (
            <ClinicCard
              key={c.id}
              clinic={c}
              distanceKm={'distanceKm' in c ? (c as { distanceKm: number }).distanceKm : undefined}
              selected={selectedId === c.id}
              onSelect={() => setSelectedId(selectedId === c.id ? null : c.id)}
              onBook={() => handleBook(c)}
            />
          ))}
        </div>
      )}

      {/* Миний захиалгууд */}
      {user && (
        <AppointmentsSection
          refreshKey={apptRefreshKey}
          onChange={() => setApptRefreshKey((k) => k + 1)}
        />
      )}

      {/* Цаг захиалгын модал */}
      {bookingClinic && (
        <AppointmentModal
          clinic={bookingClinic}
          onClose={() => setBookingClinic(null)}
          onCreated={() => setApptRefreshKey((k) => k + 1)}
        />
      )}

      {/* Нэвтрэх модал */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
