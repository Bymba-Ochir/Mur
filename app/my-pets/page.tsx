'use client';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../lib/useAuth';
import {
  createMyPet, fetchMyPets, updateVaccineDate, deleteMyPet, vaccineStatus,
} from '../../lib/vaccineService';
import { subscribeToVaccineReminders, isSubscribed } from '../../lib/push';
import { useToast } from '../../components/Toast';
import { useLanguage } from '../../lib/i18n';
import type { MyPet, VaccineStatus } from '../../lib/types';
import { getErrorMessage } from '../../lib/utils';

export default function MyPetsPage() {
  const { user, loading } = useAuth();
  const showToast = useToast();
  const { t } = useLanguage();
  const STATUS_LABEL: Record<VaccineStatus, { text: string; color: string }> = {
    overdue: { text: t('status_overdue'), color: 'var(--alert)' },
    soon: { text: t('status_soon'), color: 'var(--accent)' },
    ok: { text: t('status_ok'), color: 'var(--success)' },
    none: { text: t('status_none'), color: 'var(--muted)' },
  };
  const TYPE_LABELS: Record<string, string> = { 'Нохой': t('type_dog'), 'Муур': t('type_cat') };
  const [pets, setPets] = useState<MyPet[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [name, setName] = useState('');
  const [type, setType] = useState('Нохой');
  const [date, setDate] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setPetsLoading(true);
    try {
      const data = await fetchMyPets();
      setPets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPetsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Schedule the load to avoid synchronous setState in effect
      Promise.resolve().then(load);
    }
    isSubscribed().then(setSubscribed);
  }, [user, load]);

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name) return;
    setBusy(true);
    try {
      await createMyPet({ name, type, nextVaccineDate: date || null });
      setName(''); setDate('');
      await load();
      showToast('Амьтан бүртгэгдлээ', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDateChange(id: string, newDate: string) {
    await updateVaccineDate(id, newDate);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Устгах уу?')) return;
    await deleteMyPet(id);
    load();
  }

  async function handleSubscribe() {
    setNotifyError(null);
    try {
      await subscribeToVaccineReminders();
      setSubscribed(true);
    } catch (err) {
      setNotifyError(getErrorMessage(err));
    }
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>{t('detail_loading')}</p>;

  if (!user) {
    return (
      <div>
        <div className="page-header">
          <div className="eyebrow">{t('mypets_eyebrow')}</div>
          <h1>{t('mypets_title')}</h1>
          <p>{t('mypets_login_required')}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="page-header">
        <div className="eyebrow">{t('mypets_eyebrow')}</div>
        <h1>{t('mypets_title')}</h1>
        <p>{t('mypets_desc')}</p>
      </div>

      {!subscribed ? (
        <div style={{ background: 'var(--success-bg)', padding: 'var(--sp-3)', borderRadius: 'var(--r-md)', marginBottom: 'var(--sp-4)' }}>
          <button onClick={handleSubscribe} className="btn btn-primary">
            {t('mypets_subscribe')}
          </button>
          {notifyError && <p style={{ color: 'var(--alert)', fontSize: 12, marginTop: 'var(--sp-1)' }}>{notifyError}</p>}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--success)', marginBottom: 'var(--sp-4)' }}>{t('mypets_subscribed')}</p>
      )}

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap', marginBottom: 'var(--sp-5)' }} aria-label="Шинэ амьтан нэмэх">
        <input
          className="field" value={name} onChange={(e) => setName(e.target.value)}
          placeholder={t('mypets_name_ph')} required
          aria-label={t('mypets_name_ph')}
          style={{ flex: '1 1 140px', width: 'auto' }}
        />
        <select className="field" value={type} onChange={(e) => setType(e.target.value)}
          aria-label={t('type_label')}
          style={{ width: 'auto' }}>
          <option value="Нохой">{TYPE_LABELS['Нохой']}</option>
          <option value="Муур">{TYPE_LABELS['Муур']}</option>
        </select>
        <input
          className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)}
          aria-label="Дараагийн вакцины огноо"
          style={{ width: 'auto' }}
        />
        <button type="submit" disabled={busy} className="btn btn-accent">
          {t('mypets_add')}
        </button>
      </form>

      {petsLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {[0, 1].map((i) => (
            <div key={i} className="skel-row" style={{
              background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)',
              padding: 'var(--sp-3)', height: 52,
            }} />
          ))}
        </div>
      ) : pets.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 'var(--sp-6) var(--sp-4)', background: 'var(--card)',
          border: '1px dashed var(--line)', borderRadius: 'var(--r-lg)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 'var(--sp-2)' }}>💉</div>
          <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>{t('mypets_none')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {pets.map((p) => {
            const st = vaccineStatus(p.nextVaccineDate);
            const label = STATUS_LABEL[st];
            return (
              <div key={p.id} className="card" style={{
                padding: 'var(--sp-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-2)', flexWrap: 'wrap',
              }}>
                <div>
                  <b style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>{p.name}</b>
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}> — {TYPE_LABELS[p.type] || p.type}</span>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: label.color, marginTop: 'var(--sp-1)' }}>{label.text}</div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                  <input
                    className="field"
                    type="date"
                    defaultValue={p.nextVaccineDate || ''}
                    onChange={(e) => handleDateChange(p.id, e.target.value)}
                    aria-label={`${p.name}-ийн дараагийн вакцины огноо`}
                    style={{ width: 'auto', fontSize: 12.5 }}
                  />
                  <button onClick={() => handleDelete(p.id)} aria-label={`${p.name}-ийг устгах`} className="danger-link" style={{
                    background: 'none', border: 'none', color: 'var(--alert)', cursor: 'pointer', fontSize: 13,
                  }}>
                    {t('mypets_delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .danger-link { transition: opacity 0.15s ease; }
        .danger-link:hover { opacity: 0.75; }
      `}</style>
    </div>
  );
}
