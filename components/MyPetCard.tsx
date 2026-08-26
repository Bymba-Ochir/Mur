'use client';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../lib/i18n';
import { vaccineStatus } from '../lib/vaccineService';
import type { MyPet, VaccineStatus } from '../lib/types';

const STATUS_LABEL: Record<VaccineStatus, { text: string; color: string }> = {
  overdue: { text: 'Хугацаа хэтэрсэн', color: 'var(--alert)' },
  soon: { text: 'Удахгүй болно', color: 'var(--accent)' },
  ok: { text: 'Хэвийн', color: 'var(--success)' },
  none: { text: 'Огноо тохируулаагүй', color: 'var(--muted)' },
};

export default function MyPetCard({
  pet, selected, onSelect, onDateChange, onDelete,
}: {
  pet: MyPet;
  selected: boolean;
  onSelect: () => void;
  onDateChange: (date: string) => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const status = vaccineStatus(pet.nextVaccineDate);
  const label = STATUS_LABEL[status];
  const typeLabel = pet.type === 'Нохой' ? t('type_dog') : pet.type === 'Муур' ? t('type_cat') : t('type_other');

  return (
    <div
      className={`card flex cursor-pointer items-start gap-[var(--sp-3)] transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] ease-[var(--ease-out)] hover:-translate-y-[3px] hover:border-[var(--primary-light)] hover:shadow-[var(--shadow-md)] ${selected ? 'border-[var(--border-focus)] shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_20%,transparent)]' : ''}`}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      role="button"
      tabIndex={0}
    >
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 font-[family-name:var(--font-display)] text-[14.5px] font-semibold text-[var(--primary)]">
          {pet.name}
        </p>
        <p className="my-0.5 text-[12.5px] text-[var(--muted)]">{typeLabel}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {pet.age && <span className="inline-block rounded-[var(--r-pill)] bg-[var(--surface-3)] px-2.5 py-[3px] text-[11px] font-semibold text-[var(--primary)]">{pet.age}</span>}
          {pet.breed && <span className="inline-block rounded-[var(--r-pill)] bg-[var(--surface-3)] px-2.5 py-[3px] text-[11px] font-semibold text-[var(--primary)]">{pet.breed}</span>}
          {pet.weight != null && <span className="inline-block rounded-[var(--r-pill)] bg-[var(--surface-3)] px-2.5 py-[3px] text-[11px] font-semibold text-[var(--primary)]">{pet.weight} кг</span>}
        </div>
        <p className={`mt-1 font-[family-name:var(--font-mono)] text-[11px] font-semibold ${status === 'overdue' ? 'text-[var(--alert)]' : status === 'soon' ? 'text-[var(--accent)]' : status === 'ok' ? 'text-[var(--success)]' : 'text-[var(--muted)]'}`}>
          {label.text}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <input
          type="date"
          defaultValue={pet.nextVaccineDate || ''}
          onChange={(e) => { e.stopPropagation(); onDateChange(e.target.value); }}
          onClick={(e) => e.stopPropagation()}
          className="field min-h-0 w-[130px] px-2 py-1.5 text-xs"
          aria-label={t('health_vax_next_date')}
        />
        <button
          className="cursor-pointer border-0 bg-transparent px-2 py-1 font-[family-name:var(--font-body)] text-xs text-[var(--alert)] opacity-70 transition-opacity duration-[var(--dur-fast)] hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); if (confirm('Устгах уу?')) onDelete(); }}
        >
          {t('mypets_delete')}
        </button>
        <button
          className="cursor-pointer rounded-[var(--r-sm)] border border-[var(--accent)] bg-transparent px-2.5 py-1 font-[family-name:var(--font-body)] text-[11px] font-semibold text-[var(--accent)] transition-all duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-[var(--accent)] hover:text-[var(--text-on-accent)]"
          onClick={(e) => { e.stopPropagation(); router.push(`/profiles/mypet/${pet.id}`); }}
        >
          {t('profiles_view_profile')}
        </button>
      </div>
    </div>
  );
}
