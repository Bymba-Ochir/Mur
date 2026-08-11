'use client';
import { useLanguage } from '../lib/i18n';
import { getPetBreeds } from '../lib/petBreeds';
import type { PetType } from '../lib/types';

export default function BreedSelect({
  id,
  name = 'breed',
  type,
  value,
  onChange,
  className,
}: {
  id: string;
  name?: string;
  type: PetType;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const { lang, t } = useLanguage();
  const breeds = getPetBreeds(type);

  return (
    <select id={id} name={name} value={value} onChange={(event) => onChange(event.target.value)} className={className}>
      <option value="">{t('breed_choose')}</option>
      {breeds.map((breed) => (
        <option key={breed.value} value={breed.value}>{breed[lang]}</option>
      ))}
    </select>
  );
}
