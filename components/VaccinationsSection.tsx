'use client';
import { useState } from 'react';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import { useToast } from './Toast';
import { addVaccination, deleteVaccination } from '../lib/petHealthService';
import { getErrorMessage } from '../lib/utils';
import type { Vaccination } from '../lib/types';

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>{t('health_section_vaccinations')}</h3>
        <Button variant="ghost" style={{ fontSize: 12, padding: '6px 12px', minHeight: 'auto' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕' : t('health_vax_add')}
        </Button>
      </div>

      {showForm && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)', padding: 'var(--sp-3)', background: 'var(--eyebrow-bg)', borderRadius: 'var(--r-md)' }}>
          <p style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>Хийлгэсэн вакцины нэр, хийлгэсэн огноо, эмчийн нэрийг оруулна. Эмчийн нэр заавал биш.</p>
          <input className="field" placeholder={t('health_vax_name')} value={name} onChange={(e) => setName(e.target.value)} style={{ fontSize: 13, minHeight: 36 }} />
          <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ fontSize: 13, minHeight: 36 }} />
          <input className="field" placeholder={t('health_vet_name')} value={vetName} onChange={(e) => setVetName(e.target.value)} style={{ fontSize: 13, minHeight: 36 }} />
          <Button variant="accent" onClick={handleAdd} disabled={busy || !name.trim()} style={{ fontSize: 13, minHeight: 36 }}>
            {busy ? t('chat_sending') : t('health_vax_add')}
          </Button>
        </div>
      )}

      {vaccinations.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>{t('health_vax_none')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {vaccinations.map((v) => (
            <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--sp-2) var(--sp-3)', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{v.vaccineName}</p>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>{v.vaccinationDate}{v.vetName ? ` · ${v.vetName}` : ''}</p>
              </div>
              <button className="danger-link" onClick={() => handleDelete(v.id)} style={{ fontSize: 11 }}>✕</button>
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
