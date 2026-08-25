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
    <div className="mt-[var(--sp-4)] rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--card)] p-[var(--sp-4)]">
      <div className="mb-[var(--sp-4)] flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--primary)]">
          {pet.name} — {t('health_section_profile')}
        </h2>
        <Button variant="ghost" className="min-h-0 px-3 py-1.5 text-xs" onClick={onClose}>✕</Button>
      </div>

      {/* Профайл засах */}
      <div className="mb-[var(--sp-4)] flex flex-col gap-[var(--sp-2)] rounded-[var(--r-md)] bg-[var(--eyebrow-bg)] p-[var(--sp-3)] [&_label]:text-[11px] [&_label]:text-[var(--muted)] [&_.field]:min-h-9 [&_.field]:w-full [&_.field]:text-[13px]">
        <div className="flex gap-[var(--sp-2)] max-[480px]:flex-col">
          <div className="flex-1">
            <label>{t('health_age')}</label>
            <input className="field" value={age} onChange={(e) => setAge(e.target.value)} placeholder={t('health_age_ph')} />
          </div>
          <div className="flex-1">
            <label>{t('health_breed')}</label>
            <input className="field" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder={t('health_breed_ph')} />
          </div>
        </div>
        <div className="flex gap-[var(--sp-2)] max-[480px]:flex-col">
          <div className="flex-1">
            <label>{t('health_weight')}</label>
            <input className="field" type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={t('health_weight_ph')} />
          </div>
          <div className="flex-1">
            <label>{t('health_next_vaccine_name')}</label>
            <input className="field" value={vaxName} onChange={(e) => setVaxName(e.target.value)} placeholder={t('health_next_vaccine_name_ph')} />
          </div>
        </div>
        <Button variant="primary" className="min-h-9 w-full justify-center text-[13px]" onClick={handleSaveProfile} disabled={saving}>
          {saving ? t('chat_sending') : t('detail_save')}
        </Button>
      </div>

      {/* Эрүүл мэндийн хүснэгтүүд */}
      {loading ? (
        <p className="text-[13px] text-[var(--muted)]">{t('detail_loading')}</p>
      ) : health ? (
        <div className="flex flex-col gap-[var(--sp-5)]">
          <VaccinationsSection petId={pet.id} vaccinations={health.vaccinations} onUpdate={loadHealth} />
          <ConditionsSection petId={pet.id} conditions={health.conditions} onUpdate={loadHealth} />
          <MedicationsSection petId={pet.id} medications={health.medications} onUpdate={loadHealth} />
        </div>
      ) : null}
    </div>
  );
}
