'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../../lib/useAuth';
import { useLanguage } from '../../../../lib/i18n';
import { fetchAdoptionById } from '../../../../lib/adoptionService';
import PetProfileLayout from '../../../../components/PetProfileLayout';
import { getErrorMessage } from '../../../../lib/utils';
import type { Adoption, PetProfileData } from '../../../../lib/types';

export default function AdoptionProfileClient({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [adoption, setAdoption] = useState<Adoption | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdoptionById(id)
      .then(setAdoption)
      .catch((err) => setError(getErrorMessage(err) || t('profiles_not_found')));
  }, [id, t]);

  if (error) return <p style={{ color: 'var(--alert)', padding: 'var(--sp-6)' }}>{error}</p>;
  if (!adoption) return <p style={{ color: 'var(--muted)', padding: 'var(--sp-6)' }}>{t('detail_loading')}</p>;

  const data: PetProfileData = {
    kind: 'adoption',
    id: adoption.id,
    name: adoption.name,
    type: adoption.type,
    age: adoption.age || null,
    breed: adoption.breed || null,
    gender: adoption.gender,
    weight: null,
    description: adoption.description || null,
    photoUrl: adoption.photoURL,
    phone: adoption.phone || null,
    district: adoption.district || null,
    place: adoption.place || null,
    createdAt: adoption.createdAt,
    isOwner: !!user && adoption.createdBy === user.id,
  };

  return <PetProfileLayout data={data} />;
}
