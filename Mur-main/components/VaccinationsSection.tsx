'use client';

import { useState } from 'react';
import { useLanguage } from '../lib/i18n';
import { addVaccination, deleteVaccination } from '../lib/petHealthService';
import type { Vaccination } from '../lib/types';
import { getErrorMessage } from '../lib/utils';
import { useToast } from './Toast';
import Button from './ui/Button';
import Icon from './ui/icons';

export default function VaccinationsSection({ petId, vaccinations, onUpdate }: { petId: string; vaccinations: Vaccination[]; onUpdate: () => void }) {
  const { t } = useLanguage();
  const showToast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vetName, setVetName] = useState('');
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !date) return;
    setBusy(true);
    try {
      await addVaccination(petId, { vaccineName: name.trim(), vaccinationDate: date, vetName: vetName.trim() || undefined });
      setName(''); setVetName(''); setShowForm(false);
      showToast(t('health_vax_added'), 'success');
      onUpdate();
    } catch (error) { showToast(getErrorMessage(error), 'error'); }
    finally { setBusy(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try { await deleteVaccination(id); onUpdate(); }
    catch (error) { showToast(getErrorMessage(error), 'error'); }
    finally { setDeletingId(''); }
  }

  return (
    <section className="record-section" aria-labelledby={`vaccinations-${petId}`}>
      <header className="section-header">
        <div><span className="section-icon"><Icon name="vaccine" size={19} /></span><h3 id={`vaccinations-${petId}`}>{t('health_section_vaccinations')}</h3><span className="count">{vaccinations.length}</span></div>
        <Button variant="ghost" size="sm" onClick={() => setShowForm((open) => !open)} aria-expanded={showForm}><Icon name={showForm ? 'close' : 'plus'} size={15} />{showForm ? t('health_cancel_add') : t('health_vax_add')}</Button>
      </header>
      {showForm && <form className="record-form" onSubmit={handleAdd}>
        <p>{t('health_vax_hint')}</p>
        <div className="form-grid">
          <label><span>{t('health_vax_name')}</span><input className="field" required value={name} onChange={(event) => setName(event.target.value)} maxLength={200} /></label>
          <label><span>{t('health_vax_date')}</span><input className="field" type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label className="wide"><span>{t('health_vet_name')}</span><input className="field" value={vetName} onChange={(event) => setVetName(event.target.value)} maxLength={200} /></label>
        </div>
        <Button type="submit" variant="accent" size="sm" disabled={busy || !name.trim() || !date} aria-busy={busy}>{busy ? t('health_saving') : t('health_add_details')}</Button>
      </form>}
      {vaccinations.length === 0 ? <div className="record-empty"><Icon name="vaccine" size={22} /><p>{t('health_vax_none')}</p></div> : <ul className="record-list">
        {vaccinations.map((item) => <li key={item.id}><div><strong>{item.vaccineName}</strong><small><Icon name="calendar" size={13} />{item.vaccinationDate}{item.vetName ? ` · ${item.vetName}` : ''}</small></div><button type="button" className="delete-button" disabled={deletingId === item.id} onClick={() => void handleDelete(item.id)} aria-label={`${t('health_delete_item')}: ${item.vaccineName}`}><Icon name="trash" size={16} /></button></li>)}
      </ul>}
      <style jsx>{`
        .record-section{padding:var(--sp-4);background:var(--surface-subtle);border:1px solid var(--line);border-radius:var(--r-lg)}.section-header{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-3);margin-bottom:var(--sp-3)}.section-header>div{display:flex;align-items:center;gap:8px;min-width:0}.section-icon{display:grid;width:32px;height:32px;place-items:center;color:var(--primary);background:var(--eyebrow-bg);border-radius:10px}.section-header h3{font-size:var(--text-base)}.count{display:grid;min-width:22px;height:22px;place-items:center;color:var(--muted);background:var(--card);border:1px solid var(--line);border-radius:999px;font-size:11px}.record-form{display:grid;justify-items:start;gap:var(--sp-3);margin-bottom:var(--sp-3);padding:var(--sp-3);background:var(--card);border:1px solid var(--line);border-radius:var(--r-md)}.record-form>p{color:var(--muted);font-size:var(--text-xs);line-height:1.55}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sp-3);width:100%}.form-grid label{display:grid;gap:6px;color:var(--text);font-size:var(--text-xs);font-weight:650}.form-grid .wide{grid-column:1/-1}:global(.form-grid .field){width:100%;min-height:40px;font-size:var(--text-sm)}.record-list{display:grid;gap:8px;list-style:none}.record-list li{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-3);padding:var(--sp-3);background:var(--card);border:1px solid var(--line);border-radius:var(--r-md)}.record-list li>div{display:grid;gap:4px;min-width:0}.record-list strong{overflow-wrap:anywhere;font-size:var(--text-sm)}.record-list small{display:flex;align-items:center;gap:5px;color:var(--muted);font-size:var(--text-xs)}.delete-button{display:grid;flex:0 0 auto;width:36px;height:36px;place-items:center;color:var(--alert);background:transparent;border:1px solid transparent;border-radius:10px;cursor:pointer}.delete-button:hover{background:color-mix(in srgb,var(--alert) 9%,transparent);border-color:color-mix(in srgb,var(--alert) 25%,var(--line))}.delete-button:focus-visible{outline:2.5px solid var(--border-focus);outline-offset:2px}.delete-button:disabled{opacity:.45;cursor:wait}.record-empty{display:flex;align-items:center;gap:8px;padding:var(--sp-3);color:var(--muted);background:var(--card);border:1px dashed var(--line);border-radius:var(--r-md);font-size:var(--text-sm)}@media(max-width:560px){.section-header{align-items:flex-start;flex-direction:column}.section-header :global(.btn-base){width:100%}.form-grid{grid-template-columns:1fr}.form-grid .wide{grid-column:auto}.record-form :global(.btn-base){width:100%}}
      `}</style>
    </section>
  );
}
