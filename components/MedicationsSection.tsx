'use client';
import { useState } from 'react';
import { useLanguage } from '../lib/i18n';
import { useToast } from './Toast';
import { addMedication, deleteMedication, updateMedicationReminder } from '../lib/petHealthService';
import { getErrorMessage } from '../lib/utils';
import type { Medication } from '../lib/types';

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>{t('health_section_medications')}</h3>
        <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px', minHeight: 'auto' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕' : t('health_med_add')}
        </button>
      </div>

      {showForm && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)', padding: 'var(--sp-3)', background: 'var(--eyebrow-bg)', borderRadius: 'var(--r-md)' }}>
          <input className="field" placeholder={t('health_med_name')} value={name} onChange={(e) => setName(e.target.value)} style={{ fontSize: 13, minHeight: 36 }} />
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <input className="field" placeholder={t('health_dosage')} value={dosage} onChange={(e) => setDosage(e.target.value)} style={{ fontSize: 13, minHeight: 36, flex: 1 }} />
            <input className="field" placeholder={t('health_frequency')} value={frequency} onChange={(e) => setFrequency(e.target.value)} style={{ fontSize: 13, minHeight: 36, flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--muted)' }}>{t('health_start_date')}</label>
              <input className="field" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ fontSize: 13, minHeight: 36, width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--muted)' }}>{t('health_end_date')}</label>
              <input className="field" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ fontSize: 13, minHeight: 36, width: '100%' }} />
            </div>
          </div>
          <button className="btn btn-accent" onClick={handleAdd} disabled={busy || !name.trim()} style={{ fontSize: 13, minHeight: 36 }}>
            {busy ? t('chat_sending') : t('health_med_add')}
          </button>
        </div>
      )}

      {medications.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>{t('health_med_none')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {medications.map((m) => (
            <div key={m.id} style={{ padding: 'var(--sp-2) var(--sp-3)', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {m.dosage && `${m.dosage}`}{m.frequency && ` · ${m.frequency}`}
                    {m.startDate && ` · ${m.startDate}`}
                  </p>
                </div>
                <button className="danger-link" onClick={() => handleDelete(m.id)} style={{ fontSize: 11 }}>✕</button>
              </div>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>{t('health_reminder_date')}</label>
                <input
                  type="date"
                  className="field"
                  defaultValue={m.nextReminderDate || ''}
                  onChange={(e) => handleReminderChange(m.id, e.target.value)}
                  style={{ fontSize: 11, padding: '4px 6px', width: 120, minHeight: 'auto' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .danger-link { background: none; border: none; color: var(--alert); cursor: pointer; padding: 4px; }
        .danger-link:hover { opacity: 0.8; }
      `}</style>
    </div>
  );
}
