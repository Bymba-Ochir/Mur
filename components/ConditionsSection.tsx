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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>{t('health_section_conditions')}</h3>
        <Button variant="ghost" style={{ fontSize: 12, padding: '6px 12px', minHeight: 'auto' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕' : t('health_condition_add')}
        </Button>
      </div>

      {showForm && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)', padding: 'var(--sp-3)', background: 'var(--eyebrow-bg)', borderRadius: 'var(--r-md)' }}>
          <input className="field" placeholder={t('health_condition_name')} value={name} onChange={(e) => setName(e.target.value)} style={{ fontSize: 13, minHeight: 36 }} />
          <input className="field" type="date" value={diagnosisDate} onChange={(e) => setDiagnosisDate(e.target.value)} style={{ fontSize: 13, minHeight: 36 }} />
          <textarea className="field" placeholder={t('health_condition_notes')} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ fontSize: 13, resize: 'vertical' }} />
          <Button variant="accent" onClick={handleAdd} disabled={busy || !name.trim()} style={{ fontSize: 13, minHeight: 36 }}>
            {busy ? t('chat_sending') : t('health_condition_add')}
          </Button>
        </div>
      )}

      {conditions.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>{t('health_condition_none')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {conditions.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--sp-2) var(--sp-3)', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{c.conditionName}</p>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>{c.diagnosisDate || ''}{c.notes ? ` · ${c.notes}` : ''}</p>
              </div>
              <button className="danger-link" onClick={() => handleDelete(c.id)} style={{ fontSize: 11 }}>✕</button>
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
