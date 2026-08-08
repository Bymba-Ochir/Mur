'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import { useToast } from './Toast';
import { updateMyPet } from '../lib/vaccineService';
import { fetchPetHealth } from '../lib/petHealthService';
import { getErrorMessage } from '../lib/utils';
import VaccinationsSection from './VaccinationsSection';
import ConditionsSection from './ConditionsSection';
import MedicationsSection from './MedicationsSection';
import type { MyPet, PetHealthData } from '../lib/types';

export default function PetHealthPanel({
  pet, onProfileUpdated, onClose,
}: {
  pet: MyPet;
  onProfileUpdated: () => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const showToast = useToast();
  const [health, setHealth] = useState<PetHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [age, setAge] = useState(pet.age || '');
  const [breed, setBreed] = useState(pet.breed || '');
  const [weight, setWeight] = useState(pet.weight?.toString() || '');
  const [vaxName, setVaxName] = useState(pet.nextVaccineName || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet.id]);

  async function loadHealth() {
    try {
      const data = await fetchPetHealth(pet.id);
      setHealth(data);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally { setLoading(false); }
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await updateMyPet(pet.id, {
        age: age || null,
        breed: breed || null,
        weight: weight ? Number(weight) : null,
        nextVaccineName: vaxName || null,
      });
      showToast(t('health_profile_saved'), 'success');
      onProfileUpdated();
    } catch (err) { showToast(getErrorMessage(err), 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ marginTop: 'var(--sp-4)', padding: 'var(--sp-4)', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--primary)' }}>
          {pet.name} — {t('health_section_profile')}
        </h2>
        <Button variant="ghost" style={{ fontSize: 12, padding: '6px 12px', minHeight: 'auto' }} onClick={onClose}>✕</Button>
      </div>

      {/* Профайл засах */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)', padding: 'var(--sp-3)', background: 'var(--eyebrow-bg)', borderRadius: 'var(--r-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)' }}>{t('health_age')}</label>
            <input className="field" value={age} onChange={(e) => setAge(e.target.value)} placeholder={t('health_age_ph')} style={{ fontSize: 13, minHeight: 36, width: '100%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)' }}>{t('health_breed')}</label>
            <input className="field" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder={t('health_breed_ph')} style={{ fontSize: 13, minHeight: 36, width: '100%' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)' }}>{t('health_weight')}</label>
            <input className="field" type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={t('health_weight_ph')} style={{ fontSize: 13, minHeight: 36, width: '100%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)' }}>{t('health_next_vaccine_name')}</label>
            <input className="field" value={vaxName} onChange={(e) => setVaxName(e.target.value)} placeholder={t('health_next_vaccine_name_ph')} style={{ fontSize: 13, minHeight: 36, width: '100%' }} />
          </div>
        </div>
        <Button variant="primary" onClick={handleSaveProfile} disabled={saving} style={{ fontSize: 13, minHeight: 36, width: '100%', justifyContent: 'center' }}>
          {saving ? t('chat_sending') : t('detail_save')}
        </Button>
      </div>

      {/* Эрүүл мэндийн хүснэгтүүд */}
      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>{t('detail_loading')}</p>
      ) : health ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          <VaccinationsSection petId={pet.id} vaccinations={health.vaccinations} onUpdate={loadHealth} />
          <ConditionsSection petId={pet.id} conditions={health.conditions} onUpdate={loadHealth} />
          <MedicationsSection petId={pet.id} medications={health.medications} onUpdate={loadHealth} />
        </div>
      ) : null}
    </div>
  );
}
