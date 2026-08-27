'use client';
import { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '../../../../lib/i18n';
import { fetchMyPetById } from '../../../../lib/vaccineService';
import { fetchPetHealth } from '../../../../lib/petHealthService';
import PetProfileLayout from '../../../../components/PetProfileLayout';
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
    fetchMyPetById(id)
      .then((p) => {
        setPet(p);
        return fetchPetHealth(id);
      })
      .then((h) => setHealth(h))
      .catch((err) => setError(getErrorMessage(err) || t('profiles_not_found')));
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  if (error) return <p style={{ color: 'var(--alert)', padding: 'var(--sp-6)' }}>{error}</p>;
  if (!pet) return <p style={{ color: 'var(--muted)', padding: 'var(--sp-6)' }}>{t('detail_loading')}</p>;

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <VaccinationsSection petId={pet.id} vaccinations={health.vaccinations} onUpdate={load} />
      <ConditionsSection petId={pet.id} conditions={health.conditions} onUpdate={load} />
      <MedicationsSection petId={pet.id} medications={health.medications} onUpdate={load} />
    </div>
  ) : null;

  return <PetProfileLayout data={data} healthSection={healthSection} />;
}
