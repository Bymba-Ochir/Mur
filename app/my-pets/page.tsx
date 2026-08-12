'use client';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../lib/useAuth';
import {
  createMyPet, fetchMyPets, deleteMyPet,
} from '../../lib/vaccineService';
import { subscribeToVaccineReminders, isSubscribed } from '../../lib/push';
import { useToast } from '../../components/Toast';
import { useLanguage } from '../../lib/i18n';
import MyPetCard from '../../components/MyPetCard';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Icon from '../../components/ui/icons';
import PetHealthPanel from '../../components/PetHealthPanel';
import FieldHint from '../../components/ui/FieldHint';
import VetClinicList from '../../components/VetClinicList';
import type { MyPet } from '../../lib/types';
import { getErrorMessage } from '../../lib/utils';

type Tab = 'pets' | 'clinics';

export default function MyPetsPage() {
  const { user, loading } = useAuth();
  const showToast = useToast();
  const { t } = useLanguage();

  const [tab, setTab] = useState<Tab>('pets');
  const [pets, setPets] = useState<MyPet[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  // Нэмэх форм
  const [name, setName] = useState('');
  const [type, setType] = useState('Нохой');
  const [age, setAge] = useState('');
  const [breed, setBreed] = useState('');
  const [weight, setWeight] = useState('');
  const [vaxName, setVaxName] = useState('');
  const [date, setDate] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const TYPE_LABELS: Record<string, string> = { 'Нохой': t('type_dog'), 'Муур': t('type_cat') };

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
      Promise.resolve().then(load);
    }
    isSubscribed().then(setSubscribed);
  }, [user, load]);

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name) return;
    setBusy(true);
    try {
      await createMyPet({
        name, type,
        age: age || null,
        breed: breed || null,
        weight: weight ? Number(weight) : null,
        nextVaccineName: vaxName || null,
        nextVaccineDate: date || null,
      });
      setName(''); setAge(''); setBreed(''); setWeight(''); setVaxName(''); setDate('');
      await load();
      showToast('Амьтан бүртгэгдлээ', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Устгах уу?')) return;
    await deleteMyPet(id);
    if (selectedPetId === id) setSelectedPetId(null);
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

  const selectedPet = pets.find((p) => p.id === selectedPetId) || null;

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
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <div className="eyebrow">{t('mypets_eyebrow')}</div>
        <h1>{t('mypets_title')}</h1>
        <p>{t('mypets_desc')}</p>
      </div>

      {/* Tabs */}
      <div className="tab-bar" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'pets'}
          className={`tab ${tab === 'pets' ? 'active' : ''}`}
          onClick={() => setTab('pets')}
        >
          {t('health_tab_pets')}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'clinics'}
          className={`tab ${tab === 'clinics' ? 'active' : ''}`}
          onClick={() => setTab('clinics')}
        >
          {t('health_tab_clinics')}
        </button>
      </div>

      {tab === 'clinics' ? (
        <VetClinicList />
      ) : (
        <>
          {/* Sanuulga */}
          {!subscribed ? (
            <div style={{ background: 'var(--success-bg)', padding: 'var(--sp-3)', borderRadius: 'var(--r-md)', marginBottom: 'var(--sp-4)' }}>
              <Button onClick={handleSubscribe} variant="primary">
                {t('mypets_subscribe')}
              </Button>
              {notifyError && <p style={{ color: 'var(--alert)', fontSize: 12, marginTop: 'var(--sp-1)' }}>{notifyError}</p>}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--success)', marginBottom: 'var(--sp-4)' }}>{t('mypets_subscribed')}</p>
          )}

          {/* Нэмэх форм */}
          <form onSubmit={handleAdd} style={{ marginBottom: 'var(--sp-4)' }} aria-label="Шинэ амьтан нэмэх">
            <FieldHint mn="Нэр, төрөл заавал. Нас, үүлдэр, жин болон вакцины мэдээлэл мэдэхгүй бол дараа нь нэмж болно." en="Name and type are required. Age, breed, weight and vaccine details can be added later." />
            <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
              <input
                className="field" value={name} onChange={(e) => setName(e.target.value)}
                placeholder={t('mypets_name_ph')} required
                style={{ flex: '1 1 140px' }}
              />
              <select className="field" value={type} onChange={(e) => setType(e.target.value)} style={{ width: 'auto' }}>
                <option value="Нохой">{TYPE_LABELS['Нохой']}</option>
                <option value="Муур">{TYPE_LABELS['Муур']}</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
              <input className="field" value={age} onChange={(e) => setAge(e.target.value)} placeholder={t('health_age_ph')} style={{ flex: 1 }} />
              <input className="field" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder={t('health_breed_ph')} style={{ flex: 1 }} />
              <input className="field" type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={t('health_weight_ph')} style={{ flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
              <span className="sr-only">Дараагийн вакцины нэр болон огноо</span>
              <input className="field" value={vaxName} onChange={(e) => setVaxName(e.target.value)} placeholder={t('health_next_vaccine_name_ph')} style={{ flex: 1 }} />
              <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 'auto' }} />
              <Button type="submit" disabled={busy} variant="accent">{t('mypets_add')}</Button>
            </div>
          </form>

          {/* Амьтдын жагсаалт */}
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
            <EmptyState icon={<Icon name="vaccine" size={30} />} description={t('mypets_none')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {pets.map((p) => (
                <MyPetCard
                  key={p.id}
                  pet={p}
                  selected={selectedPetId === p.id}
                  onSelect={() => setSelectedPetId(selectedPetId === p.id ? null : p.id)}
                  onDateChange={load}
                  onDelete={() => handleDelete(p.id)}
                />
              ))}
            </div>
          )}

          {/* Эрүүл мэндийн дэлгэрэнгүй */}
          {selectedPet && (
            <PetHealthPanel
              pet={selectedPet}
              onProfileUpdated={load}
              onClose={() => setSelectedPetId(null)}
            />
          )}
        </>
      )}

      <style jsx>{`
        .tab-bar {
          display: flex; gap: 2px; margin-bottom: var(--sp-4);
          background: var(--eyebrow-bg); border-radius: var(--r-pill); padding: 3px;
        }
        .tab {
          flex: 1; padding: 8px 16px; border: none; border-radius: var(--r-pill);
          background: transparent; font-family: var(--font-body); font-size: 13px;
          font-weight: 600; color: var(--muted); cursor: pointer;
          transition: all 0.15s ease;
        }
        .tab.active {
          background: var(--card); color: var(--primary);
          box-shadow: var(--shadow-sm);
        }
        .tab:hover:not(.active) { color: var(--primary); }
      `}</style>
    </div>
  );
}
