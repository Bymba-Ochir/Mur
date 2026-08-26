'use client';
import { useState } from 'react';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import { useToast } from './Toast';
import { addVaccination, deleteVaccination } from '../lib/petHealthService';
import { getErrorMessage } from '../lib/utils';
import type { Vaccination } from '../lib/types';
import { X } from 'lucide-react';

export default function VaccinationsSection({
  petId, vaccinations, onUpdate,
}: {
  petId: string;
  vaccinations: Vaccination[];
  onUpdate: () => void;
}) {
  const { t } = useLanguage();
  const showToast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vetName, setVetName] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await addVaccination(petId, { vaccineName: name.trim(), vaccinationDate: date, vetName: vetName.trim() || undefined });
      setName(''); setVetName('');
      setShowForm(false);
      showToast(t('health_vax_added'), 'success');
      onUpdate();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally { setBusy(false); }
  }

  async function handleDelete(id: string) {
    try { await deleteVaccination(id); onUpdate(); } catch (err) { showToast(getErrorMessage(err), 'error'); }
  }

  return (
    <div>
      <div className="mb-[var(--sp-3)] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--primary)]">{t('health_section_vaccinations')}</h3>
        <Button variant="ghost" className="min-h-0 px-3 py-1.5 text-xs" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X size={15} aria-hidden="true" /> <span>Хаах</span></> : t('health_vax_add')}
        </Button>
      </div>

      {showForm && (
        <div className="mb-[var(--sp-3)] flex flex-col gap-[var(--sp-2)] rounded-[var(--r-md)] bg-[var(--eyebrow-bg)] p-[var(--sp-3)] [&_.field]:min-h-9 [&_.field]:text-[13px]">
          <p className="text-[11.5px] leading-[1.5] text-[var(--muted)]">Хийлгэсэн вакцины нэр, хийлгэсэн огноо, эмчийн нэрийг оруулна. Эмчийн нэр заавал биш.</p>
          <input className="field" placeholder={t('health_vax_name')} value={name} onChange={(e) => setName(e.target.value)} />
          <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input className="field" placeholder={t('health_vet_name')} value={vetName} onChange={(e) => setVetName(e.target.value)} />
          <Button variant="accent" className="min-h-9 text-[13px]" onClick={handleAdd} disabled={busy || !name.trim()}>
            {busy ? t('chat_sending') : t('health_vax_add')}
          </Button>
        </div>
      )}

      {vaccinations.length === 0 ? (
        <p className="text-[13px] text-[var(--muted)]">{t('health_vax_none')}</p>
      ) : (
        <div className="flex flex-col gap-[var(--sp-2)]">
          {vaccinations.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--card)] px-[var(--sp-3)] py-[var(--sp-2)]">
              <div>
                <p className="text-[13px] font-semibold">{v.vaccineName}</p>
                <p className="text-[11px] text-[var(--muted)]">{v.vaccinationDate}{v.vetName ? ` · ${v.vetName}` : ''}</p>
              </div>
              <button className="cursor-pointer border-0 bg-transparent p-1 text-[var(--alert)] hover:opacity-80" onClick={() => handleDelete(v.id)} aria-label="Устгах"><X size={14} aria-hidden="true" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
