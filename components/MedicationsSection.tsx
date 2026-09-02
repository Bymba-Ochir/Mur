'use client';

import { useState } from 'react';
import { useLanguage } from '../lib/i18n';
import { addMedication, deleteMedication, updateMedicationReminder } from '../lib/petHealthService';
import type { Medication } from '../lib/types';
import { getErrorMessage } from '../lib/utils';
import { useToast } from './Toast';
import Button from './ui/Button';
import Icon from './ui/icons';

export default function MedicationsSection({ petId, medications, onUpdate }: { petId: string; medications: Medication[]; onUpdate: () => void }) {
  const { t } = useLanguage();
  const showToast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [updatingId, setUpdatingId] = useState('');

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await addMedication(petId, { name: name.trim(), dosage: dosage.trim() || undefined, frequency: frequency.trim() || undefined, startDate: startDate || undefined, endDate: endDate || undefined });
      setName(''); setDosage(''); setFrequency(''); setStartDate(''); setEndDate(''); setShowForm(false);
      showToast(t('health_med_added'), 'success'); onUpdate();
    } catch (error) { showToast(getErrorMessage(error), 'error'); }
    finally { setBusy(false); }
  }

  async function handleDelete(id: string) {
    setUpdatingId(id);
    try { await deleteMedication(id); onUpdate(); }
    catch (error) { showToast(getErrorMessage(error), 'error'); }
    finally { setUpdatingId(''); }
  }

  async function handleReminderChange(id: string, date: string) {
    setUpdatingId(id);
    try { await updateMedicationReminder(id, date); onUpdate(); }
    catch (error) { showToast(getErrorMessage(error), 'error'); }
    finally { setUpdatingId(''); }
  }

  return (
    <section className="record-section" aria-labelledby={`medications-${petId}`}>
      <header className="section-header">
        <div><span className="section-icon"><Icon name="calendar" size={19} /></span><h3 id={`medications-${petId}`}>{t('health_section_medications')}</h3><span className="count">{medications.length}</span></div>
        <Button variant="ghost" size="sm" onClick={() => setShowForm((open) => !open)} aria-expanded={showForm}><Icon name={showForm ? 'close' : 'plus'} size={15} />{showForm ? t('health_cancel_add') : t('health_med_add')}</Button>
      </header>
      {showForm && <form className="record-form" onSubmit={handleAdd}>
        <p>{t('health_med_hint')}</p>
        <div className="form-grid">
          <label className="wide"><span>{t('health_med_name')}</span><input className="field" required value={name} onChange={(event) => setName(event.target.value)} maxLength={200} /></label>
          <label><span>{t('health_dosage')}</span><input className="field" value={dosage} onChange={(event) => setDosage(event.target.value)} maxLength={100} /></label>
          <label><span>{t('health_frequency')}</span><input className="field" value={frequency} onChange={(event) => setFrequency(event.target.value)} maxLength={100} /></label>
          <label><span>{t('health_start_date')}</span><input className="field" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label><span>{t('health_end_date')}</span><input className="field" type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
        </div>
        <Button type="submit" variant="accent" size="sm" disabled={busy || !name.trim()} aria-busy={busy}>{busy ? t('health_saving') : t('health_add_details')}</Button>
      </form>}
      {medications.length === 0 ? <div className="record-empty"><Icon name="calendar" size={22} /><p>{t('health_med_none')}</p></div> : <ul className="record-list">
        {medications.map((item) => <li key={item.id}>
          <div className="record-main"><div className="record-title"><strong>{item.name}</strong><button type="button" className="delete-button" disabled={updatingId === item.id} onClick={() => void handleDelete(item.id)} aria-label={`${t('health_delete_item')}: ${item.name}`}><Icon name="trash" size={16} /></button></div>
            {(item.dosage || item.frequency || item.startDate || item.endDate) && <small>{[item.dosage, item.frequency, item.startDate, item.endDate].filter(Boolean).join(' · ')}</small>}
            <label className="reminder"><span><Icon name="bell" size={14} />{t('health_reminder_date')}</span><input type="date" className="field" defaultValue={item.nextReminderDate || ''} disabled={updatingId === item.id} onChange={(event) => void handleReminderChange(item.id, event.target.value)} /></label>
          </div>
        </li>)}
      </ul>}
      <style jsx>{`
        .record-section{padding:var(--sp-4);background:var(--surface-subtle);border:1px solid var(--line);border-radius:var(--r-lg)}.section-header{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-3);margin-bottom:var(--sp-3)}.section-header>div{display:flex;align-items:center;gap:8px;min-width:0}.section-icon{display:grid;width:32px;height:32px;place-items:center;color:var(--accent-deep);background:color-mix(in srgb,var(--accent) 18%,var(--card));border-radius:10px}.section-header h3{font-size:var(--text-base)}.count{display:grid;min-width:22px;height:22px;place-items:center;color:var(--muted);background:var(--card);border:1px solid var(--line);border-radius:999px;font-size:11px}.record-form{display:grid;justify-items:start;gap:var(--sp-3);margin-bottom:var(--sp-3);padding:var(--sp-3);background:var(--card);border:1px solid var(--line);border-radius:var(--r-md)}.record-form>p{color:var(--muted);font-size:var(--text-xs);line-height:1.55}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sp-3);width:100%}.form-grid label{display:grid;gap:6px;color:var(--text);font-size:var(--text-xs);font-weight:650}.form-grid .wide{grid-column:1/-1}:global(.form-grid .field){width:100%;min-height:40px;font-size:var(--text-sm)}.record-list{display:grid;gap:8px;list-style:none}.record-list li{padding:var(--sp-3);background:var(--card);border:1px solid var(--line);border-radius:var(--r-md)}.record-main{display:grid;gap:6px}.record-title{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-3)}.record-title strong{overflow-wrap:anywhere;font-size:var(--text-sm)}.record-main>small{color:var(--muted);font-size:var(--text-xs);overflow-wrap:anywhere}.delete-button{display:grid;flex:0 0 auto;width:36px;height:36px;place-items:center;color:var(--alert);background:transparent;border:1px solid transparent;border-radius:10px;cursor:pointer}.delete-button:hover{background:color-mix(in srgb,var(--alert) 9%,transparent);border-color:color-mix(in srgb,var(--alert) 25%,var(--line))}.delete-button:focus-visible{outline:2.5px solid var(--border-focus);outline-offset:2px}.delete-button:disabled{opacity:.45;cursor:wait}.reminder{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-3);margin-top:4px;padding-top:var(--sp-2);border-top:1px solid var(--line);color:var(--muted);font-size:var(--text-xs);font-weight:650}.reminder span{display:flex;align-items:center;gap:6px}:global(.reminder .field){width:150px;min-height:36px;font-size:var(--text-xs)}.record-empty{display:flex;align-items:center;gap:8px;padding:var(--sp-3);color:var(--muted);background:var(--card);border:1px dashed var(--line);border-radius:var(--r-md);font-size:var(--text-sm)}@media(max-width:560px){.section-header{align-items:flex-start;flex-direction:column}.section-header :global(.btn-base){width:100%}.form-grid{grid-template-columns:1fr}.form-grid .wide{grid-column:auto}.record-form :global(.btn-base){width:100%}.reminder{align-items:flex-start;flex-direction:column}:global(.reminder .field){width:100%}}
      `}</style>
    </section>
  );
}
