'use client';
import { useState } from 'react';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import { useToast } from './Toast';
import { addCondition, deleteCondition } from '../lib/petHealthService';
import { getErrorMessage } from '../lib/utils';
import type { MedicalCondition } from '../lib/types';

export default function ConditionsSection({
  petId, conditions, onUpdate,
}: {
  petId: string;
  conditions: MedicalCondition[];
  onUpdate: () => void;
}) {
  const { t } = useLanguage();
  const showToast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [diagnosisDate, setDiagnosisDate] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await addCondition(petId, { conditionName: name.trim(), diagnosisDate: diagnosisDate || undefined, notes: notes.trim() || undefined });
      setName(''); setDiagnosisDate(''); setNotes('');
      setShowForm(false);
      showToast(t('health_condition_added'), 'success');
      onUpdate();
    } catch (err) { showToast(getErrorMessage(err), 'error'); }
    finally { setBusy(false); }
  }

  async function handleDelete(id: string) {
    try { await deleteCondition(id); onUpdate(); } catch (err) { showToast(getErrorMessage(err), 'error'); }
  }

  return (
    <div>
      <div className="mb-[var(--sp-3)] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--primary)]">{t('health_section_conditions')}</h3>
        <Button variant="ghost" className="min-h-0 px-3 py-1.5 text-xs" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕' : t('health_condition_add')}
        </Button>
      </div>

      {showForm && (
        <div className="mb-[var(--sp-3)] flex flex-col gap-[var(--sp-2)] rounded-[var(--r-md)] bg-[var(--eyebrow-bg)] p-[var(--sp-3)] [&_.field]:min-h-9 [&_.field]:text-[13px]">
          <p className="text-[11.5px] leading-[1.5] text-[var(--muted)]">Малын эмчийн оношилсон өвчин, оношлогдсон огноо болон шаардлагатай тэмдэглэлийг хадгална.</p>
          <input className="field" placeholder={t('health_condition_name')} value={name} onChange={(e) => setName(e.target.value)} />
          <input className="field" type="date" value={diagnosisDate} onChange={(e) => setDiagnosisDate(e.target.value)} />
          <textarea className="field resize-y" placeholder={t('health_condition_notes')} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          <Button variant="accent" className="min-h-9 text-[13px]" onClick={handleAdd} disabled={busy || !name.trim()}>
            {busy ? t('chat_sending') : t('health_condition_add')}
          </Button>
        </div>
      )}

      {conditions.length === 0 ? (
        <p className="text-[13px] text-[var(--muted)]">{t('health_condition_none')}</p>
      ) : (
        <div className="flex flex-col gap-[var(--sp-2)]">
          {conditions.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--card)] px-[var(--sp-3)] py-[var(--sp-2)]">
              <div>
                <p className="text-[13px] font-semibold">{c.conditionName}</p>
                <p className="text-[11px] text-[var(--muted)]">{c.diagnosisDate || ''}{c.notes ? ` · ${c.notes}` : ''}</p>
              </div>
              <button className="cursor-pointer border-0 bg-transparent p-1 text-[11px] text-[var(--alert)] hover:opacity-80" onClick={() => handleDelete(c.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
