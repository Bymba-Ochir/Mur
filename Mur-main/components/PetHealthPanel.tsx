'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../lib/i18n';
import { fetchPetHealth } from '../lib/petHealthService';
import type { MyPet, PetHealthData } from '../lib/types';
import { getErrorMessage } from '../lib/utils';
import { updateMyPet } from '../lib/vaccineService';
import ConditionsSection from './ConditionsSection';
import MedicationsSection from './MedicationsSection';
import { useToast } from './Toast';
import Button from './ui/Button';
import Icon from './ui/icons';
import VaccinationsSection from './VaccinationsSection';

export default function PetHealthPanel({ pet, onProfileUpdated, onClose }: { pet: MyPet; onProfileUpdated: () => void; onClose: () => void }) {
  const { t } = useLanguage();
  const showToast = useToast();
  const [health, setHealth] = useState<PetHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [age, setAge] = useState(pet.age || '');
  const [breed, setBreed] = useState(pet.breed || '');
  const [weight, setWeight] = useState(pet.weight?.toString() || '');
  const [vaxName, setVaxName] = useState(pet.nextVaccineName || '');
  const [saving, setSaving] = useState(false);

  const loadHealth = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try { setHealth(await fetchPetHealth(pet.id)); }
    catch (error) { setLoadError(getErrorMessage(error)); }
    finally { setLoading(false); }
  }, [pet.id]);

  useEffect(() => { void Promise.resolve().then(loadHealth); }, [loadHealth]);

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateMyPet(pet.id, {
        age: age.trim() || null,
        breed: breed.trim() || null,
        weight: weight ? Number(weight) : null,
        nextVaccineName: vaxName.trim() || null,
      });
      showToast(t('health_profile_saved'), 'success');
      onProfileUpdated();
    } catch (error) { showToast(getErrorMessage(error), 'error'); }
    finally { setSaving(false); }
  }

  return (
    <section id={`health-panel-${pet.id}`} className="health-panel" aria-labelledby={`health-title-${pet.id}`}>
      <header className="panel-header">
        <span className="panel-icon" aria-hidden="true"><Icon name="vaccine" size={24} /></span>
        <div className="panel-heading">
          <p className="eyebrow">{t('health_panel_title')}</p>
          <h2 id={`health-title-${pet.id}`}>{pet.name}</h2>
          <p>{t('health_panel_desc')}</p>
        </div>
        <button type="button" className="close-button" onClick={onClose} aria-label={t('health_close')}><Icon name="close" size={20} /></button>
      </header>

      <form className="profile-form" onSubmit={handleSaveProfile}>
        <div className="form-intro"><h3>{t('health_section_profile')}</h3><p>{t('health_profile_desc')}</p></div>
        <div className="profile-grid">
          <label><span>{t('health_age')}</span><input className="field" value={age} onChange={(event) => setAge(event.target.value)} placeholder={t('health_age_ph')} maxLength={100} /></label>
          <label><span>{t('health_breed')}</span><input className="field" value={breed} onChange={(event) => setBreed(event.target.value)} placeholder={t('health_breed_ph')} maxLength={100} /></label>
          <label><span>{t('health_weight')}</span><input className="field" type="number" step="0.01" min="0" max="999.99" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder={t('health_weight_ph')} /></label>
          <label><span>{t('health_next_vaccine_name')}</span><input className="field" value={vaxName} onChange={(event) => setVaxName(event.target.value)} placeholder={t('health_next_vaccine_name_ph')} maxLength={200} /></label>
        </div>
        <div className="profile-actions"><Button type="submit" variant="primary" size="sm" disabled={saving} aria-busy={saving}><Icon name="check" size={16} />{saving ? t('health_saving') : t('health_save_profile')}</Button></div>
      </form>

      {loading ? (
        <div className="health-skeleton" aria-live="polite" aria-label={t('health_loading')}>{[0, 1, 2].map((item) => <div className="skeleton-block" key={item} />)}</div>
      ) : loadError ? (
        <div className="health-error" role="alert"><Icon name="alert" size={22} /><div><strong>{t('health_load_error')}</strong><p>{loadError}</p></div><Button variant="ghost" size="sm" onClick={() => void loadHealth()}>{t('health_retry')}</Button></div>
      ) : health ? (
        <div className="health-sections">
          <VaccinationsSection petId={pet.id} vaccinations={health.vaccinations} onUpdate={loadHealth} />
          <ConditionsSection petId={pet.id} conditions={health.conditions} onUpdate={loadHealth} />
          <MedicationsSection petId={pet.id} medications={health.medications} onUpdate={loadHealth} />
        </div>
      ) : null}

      <style jsx>{`
        .health-panel{margin-top:var(--sp-4);overflow:hidden;background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl);box-shadow:var(--shadow-md)}
        .panel-header{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--sp-3);align-items:start;padding:var(--sp-5);background:linear-gradient(135deg,var(--eyebrow-bg),color-mix(in srgb,var(--found) 12%,var(--card)));border-bottom:1px solid var(--line)}
        .panel-icon{display:grid;width:44px;height:44px;place-items:center;color:var(--primary);background:var(--card);border:1px solid var(--line);border-radius:var(--r-md);box-shadow:var(--shadow-xs)}
        .panel-heading{min-width:0}.panel-heading .eyebrow{margin-bottom:3px;color:var(--primary);font-size:var(--text-xs);font-weight:750;letter-spacing:.08em;text-transform:uppercase}.panel-heading h2{color:var(--text);font-family:var(--font-display);font-size:clamp(20px,3vw,26px);line-height:1.15}.panel-heading>p:last-child{max-width:620px;margin-top:5px;color:var(--muted);font-size:var(--text-sm);line-height:1.55}
        .close-button{display:grid;width:40px;height:40px;place-items:center;color:var(--muted);background:var(--card);border:1px solid var(--line);border-radius:999px;cursor:pointer;transition:color var(--dur-fast),border-color var(--dur-fast),background var(--dur-fast)}.close-button:hover{color:var(--primary);background:var(--eyebrow-bg);border-color:var(--primary-light)}.close-button:focus-visible{outline:2.5px solid var(--border-focus);outline-offset:2px}
        .profile-form{display:grid;gap:var(--sp-4);margin:var(--sp-5);padding:var(--sp-4);background:var(--surface-subtle);border:1px solid var(--line);border-radius:var(--r-lg)}.form-intro h3{color:var(--text);font-size:var(--text-lg)}.form-intro p{margin-top:3px;color:var(--muted);font-size:var(--text-sm)}
        .profile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sp-3)}label{display:grid;gap:6px;min-width:0;color:var(--text);font-size:var(--text-xs);font-weight:650}:global(.profile-grid .field){width:100%;min-height:42px;font-size:var(--text-sm)}.profile-actions{display:flex;justify-content:flex-end}
        .health-sections{display:grid;gap:var(--sp-4);padding:0 var(--sp-5) var(--sp-5)}.health-skeleton{display:grid;gap:var(--sp-3);padding:0 var(--sp-5) var(--sp-5)}.skeleton-block{min-height:112px;border-radius:var(--r-lg);background:linear-gradient(90deg,var(--surface-subtle),var(--eyebrow-bg),var(--surface-subtle));background-size:220% 100%;animation:shimmer 1.4s infinite}
        .health-error{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--sp-3);align-items:center;margin:0 var(--sp-5) var(--sp-5);padding:var(--sp-4);color:var(--alert);background:color-mix(in srgb,var(--alert) 8%,var(--card));border:1px solid color-mix(in srgb,var(--alert) 32%,var(--line));border-radius:var(--r-lg)}.health-error strong{color:var(--text);font-size:var(--text-sm)}.health-error p{margin-top:2px;color:var(--muted);font-size:var(--text-xs)}
        @keyframes shimmer{to{background-position:-220% 0}}@media(max-width:640px){.panel-header{padding:var(--sp-4)}.panel-icon{width:40px;height:40px}.profile-form{margin:var(--sp-4);padding:var(--sp-3)}.profile-grid{grid-template-columns:1fr}.profile-actions :global(.btn-base){width:100%}.health-sections,.health-skeleton{padding:0 var(--sp-4) var(--sp-4)}.health-error{grid-template-columns:auto minmax(0,1fr);margin:0 var(--sp-4) var(--sp-4)}.health-error :global(.btn-base){grid-column:1/-1;width:100%}}@media(prefers-reduced-motion:reduce){.skeleton-block{animation:none}}
      `}</style>
    </section>
  );
}
