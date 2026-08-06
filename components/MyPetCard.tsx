'use client';
import { useLanguage } from '../lib/i18n';
import { vaccineStatus } from '../lib/vaccineService';
import type { MyPet, VaccineStatus } from '../lib/types';

const STATUS_LABEL: Record<VaccineStatus, { text: string; color: string }> = {
  overdue: { text: '⚠️ Хугацаа хэтэрсэн', color: 'var(--alert)' },
  soon: { text: '🔔 Удахгүй болно', color: 'var(--accent)' },
  ok: { text: '✅ Хэвийн', color: 'var(--success)' },
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
  const { t } = useLanguage();
  const status = vaccineStatus(pet.nextVaccineDate);
  const label = STATUS_LABEL[status];
  const typeLabel = pet.type === 'Нохой' ? t('type_dog') : pet.type === 'Муур' ? t('type_cat') : t('type_other');

  return (
    <div
      className={`card pet-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--primary)', fontSize: 14.5, marginBottom: 2 }}>
          {pet.name}
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '2px 0' }}>{typeLabel}</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          {pet.age && <span className="chip">{pet.age}</span>}
          {pet.breed && <span className="chip">{pet.breed}</span>}
          {pet.weight != null && <span className="chip">{pet.weight} кг</span>}
        </div>
        <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: label.color, marginTop: 4 }}>
          {label.text}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <input
          type="date"
          className="field"
          defaultValue={pet.nextVaccineDate || ''}
          onChange={(e) => { e.stopPropagation(); onDateChange(e.target.value); }}
          onClick={(e) => e.stopPropagation()}
          style={{ fontSize: 12, padding: '6px 8px', width: 130, minHeight: 'auto' }}
          aria-label={t('health_vax_next_date')}
        />
        <button
          className="danger-link"
          onClick={(e) => { e.stopPropagation(); if (confirm('Устгах уу?')) onDelete(); }}
        >
          {t('mypets_delete')}
        </button>
      </div>

      <style jsx>{`
        .pet-card { display: flex; gap: var(--sp-3); align-items: flex-start; transition: border-color 0.15s ease; }
        .pet-card.selected { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(224,122,62,0.2); }
        .chip {
          display: inline-block; font-size: 11px; padding: 2px 8px;
          background: var(--eyebrow-bg); border-radius: var(--r-pill);
          color: var(--muted); font-weight: 500;
        }
        .danger-link {
          background: none; border: none; color: var(--alert); font-size: 12px;
          cursor: pointer; padding: 4px 8px; font-family: var(--font-body);
          opacity: 0.7; transition: opacity 0.15s ease;
        }
        .danger-link:hover { opacity: 1; }
      `}</style>
    </div>
  );
}
