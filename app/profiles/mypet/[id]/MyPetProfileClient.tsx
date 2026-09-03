'use client';
import { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '../../../../lib/i18n';
import { fetchMyPetById } from '../../../../lib/vaccineService';
import { fetchPetHealth } from '../../../../lib/petHealthService';
import PetProfileLayout from '../../../../components/PetProfileLayout';
import Button from '../../../../components/ui/Button';
import { Icon } from '../../../../components/ui';
import VaccinationsSection from '../../../../components/VaccinationsSection';
import ConditionsSection from '../../../../components/ConditionsSection';
import MedicationsSection from '../../../../components/MedicationsSection';
import { getErrorMessage } from '../../../../lib/utils';
import type { MyPet, PetHealthData, PetProfileData, PetType } from '../../../../lib/types';

export default function MyPetProfileClient({ id }: { id: string }) {
  const { t } = useLanguage();
  const [pet, setPet] = useState<MyPet | null>(null);
  const [health, setHealth] = useState<PetHealthData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    fetchMyPetById(id)
      .then((p) => {
        setPet(p);
        return fetchPetHealth(id);
      })
      .then((h) => setHealth(h))
      .catch((err) => setError(getErrorMessage(err) || t('profiles_not_found')));
  }, [id, t]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  if (error) return <div className="page-shell page-shell--narrow"><div className="state-panel state-panel--error" role="alert"><span className="state-panel__icon"><Icon name="alert" size={28} /></span><h2>{t('profiles_not_found')}</h2><p>{error}</p><div className="detail-actions"><Button variant="secondary" onClick={() => void load()}>Дахин оролдох</Button><Button as="link" href="/my-pets" variant="ghost">Миний амьтад руу буцах</Button></div></div></div>;
  if (!pet) return <div className="page-shell page-shell--narrow"><div className="state-panel" aria-live="polite"><span className="state-panel__icon"><Icon name="vaccine" size={28} /></span><h2>{t('detail_loading')}</h2></div></div>;

  const data: PetProfileData = {
    kind: 'mypet',
    id: pet.id,
    name: pet.name,
    type: pet.type as PetType,
    age: pet.age || null,
    breed: pet.breed || null,
    gender: null,
    weight: pet.weight,
    description: null,
    photoUrl: pet.photoUrl,
    phone: null,
    district: null,
    place: null,
    createdAt: pet.createdAt,
    isOwner: true,
    nextVaccineName: pet.nextVaccineName,
    nextVaccineDate: pet.nextVaccineDate,
  };

  const healthSection = health ? (
    <div className="health-stack">
      <VaccinationsSection petId={pet.id} vaccinations={health.vaccinations} onUpdate={load} />
      <ConditionsSection petId={pet.id} conditions={health.conditions} onUpdate={load} />
      <MedicationsSection petId={pet.id} medications={health.medications} onUpdate={load} />
      <style jsx>{`.health-stack{display:flex;flex-direction:column;gap:var(--sp-5)}@media(max-width:640px){.health-stack{gap:var(--sp-3)}}`}</style>
    </div>
  ) : null;

  return <PetProfileLayout data={data} healthSection={healthSection} />;
}
