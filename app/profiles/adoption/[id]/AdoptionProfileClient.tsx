'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../../lib/useAuth';
import { useLanguage } from '../../../../lib/i18n';
import { fetchAdoptionById } from '../../../../lib/adoptionService';
import PetProfileLayout from '../../../../components/PetProfileLayout';
import Button from '../../../../components/ui/Button';
import { Icon } from '../../../../components/ui';
import { getErrorMessage } from '../../../../lib/utils';
import type { Adoption, PetProfileData } from '../../../../lib/types';

export default function AdoptionProfileClient({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [adoption, setAdoption] = useState<Adoption | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setAdoption(null);
    fetchAdoptionById(id)
      .then(setAdoption)
      .catch((err) => setError(getErrorMessage(err) || t('profiles_not_found')));
  }, [id, t]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  if (error) return <div className="page-shell page-shell--narrow"><div className="state-panel state-panel--error" role="alert"><span className="state-panel__icon"><Icon name="alert" size={28} /></span><h2>{t('profiles_not_found')}</h2><p>{error}</p><div className="detail-actions"><Button variant="secondary" onClick={() => void load()}>Дахин оролдох</Button><Button as="link" href="/adoptions" variant="ghost">Жагсаалт руу буцах</Button></div></div></div>;
  if (!adoption) return <div className="page-shell page-shell--narrow"><div className="state-panel" aria-live="polite"><span className="state-panel__icon"><Icon name="paw" size={28} /></span><h2>{t('detail_loading')}</h2></div></div>;

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
