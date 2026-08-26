'use client';
import { useState } from 'react';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import { useToast } from './Toast';
import { addMedication, deleteMedication, updateMedicationReminder } from '../lib/petHealthService';
import { getErrorMessage } from '../lib/utils';
import type { Medication } from '../lib/types';
import { X } from 'lucide-react';

export default function MedicationsSection({
  petId, medications, onUpdate,
}: {
  petId: string;
  medications: Medication[];
  onUpdate: () => void;
}) {
  const { t } = useLanguage();
  const showToast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await addMedication(petId, {
        name: name.trim(),
        dosage: dosage.trim() || undefined,
        frequency: frequency.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setName(''); setDosage(''); setFrequency(''); setStartDate(''); setEndDate('');
      setShowForm(false);
      showToast(t('health_med_added'), 'success');
      onUpdate();
    } catch (err) { showToast(getErrorMessage(err), 'error'); }
    finally { setBusy(false); }
  }

  async function handleDelete(id: string) {
    try { await deleteMedication(id); onUpdate(); } catch (err) { showToast(getErrorMessage(err), 'error'); }
  }

  async function handleReminderChange(id: string, date: string) {
    try { await updateMedicationReminder(id, date); onUpdate(); } catch (err) { showToast(getErrorMessage(err), 'error'); }
  }

  return (
    <div>
      <div className="mb-[var(--sp-3)] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--primary)]">{t('health_section_medications')}</h3>
        <Button variant="ghost" className="min-h-0 px-3 py-1.5 text-xs" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X size={15} aria-hidden="true" /> <span>Хаах</span></> : t('health_med_add')}
        </Button>
      </div>

      {showForm && (
        <div className="mb-[var(--sp-3)] flex flex-col gap-[var(--sp-2)] rounded-[var(--r-md)] bg-[var(--eyebrow-bg)] p-[var(--sp-3)] [&_.field]:min-h-9 [&_.field]:text-[13px]">
          <p className="text-[11.5px] leading-[1.5] text-[var(--muted)]">Эмийн нэр, эмчийн заасан тун, өгөх давтамж болон хэрэглэх хугацааг оруулна. Эмчийн зааврыг өөрчилж болохгүй.</p>
          <input className="field" placeholder={t('health_med_name')} value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex gap-[var(--sp-2)] [&_.field]:flex-1">
            <input className="field" placeholder={t('health_dosage')} value={dosage} onChange={(e) => setDosage(e.target.value)} />
            <input className="field" placeholder={t('health_frequency')} value={frequency} onChange={(e) => setFrequency(e.target.value)} />
          </div>
          <div className="flex gap-[var(--sp-2)] [&>div]:flex-1 [&_label]:text-[11px] [&_label]:text-[var(--muted)] [&_.field]:w-full">
            <div>
              <label>{t('health_start_date')}</label>
              <input className="field" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label>{t('health_end_date')}</label>
              <input className="field" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <Button variant="accent" className="min-h-9 text-[13px]" onClick={handleAdd} disabled={busy || !name.trim()}>
            {busy ? t('chat_sending') : t('health_med_add')}
          </Button>
        </div>
      )}

      {medications.length === 0 ? (
        <p className="text-[13px] text-[var(--muted)]">{t('health_med_none')}</p>
      ) : (
        <div className="flex flex-col gap-[var(--sp-2)]">
          {medications.map((m) => (
            <div key={m.id} className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--card)] px-[var(--sp-3)] py-[var(--sp-2)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-semibold">{m.name}</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {m.dosage && `${m.dosage}`}{m.frequency && ` · ${m.frequency}`}
                    {m.startDate && ` · ${m.startDate}`}
                  </p>
                </div>
                <button className="cursor-pointer border-0 bg-transparent p-1 text-[var(--alert)] hover:opacity-80" onClick={() => handleDelete(m.id)} aria-label="Устгах"><X size={14} aria-hidden="true" /></button>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <label className="text-[11px] text-[var(--muted)]">{t('health_reminder_date')}</label>
                <input
                  type="date"
                  defaultValue={m.nextReminderDate || ''}
                  onChange={(e) => handleReminderChange(m.id, e.target.value)}
                  className="field min-h-0 w-[120px] px-1.5 py-1 text-[11px]"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
