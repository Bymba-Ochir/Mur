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
import type { MyPet } from '../../lib/types';
import { getErrorMessage } from '../../lib/utils';

export default function MyPetsPage() {
  const { user, loading } = useAuth();
  const showToast = useToast();
  const { t } = useLanguage();

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

  if (loading) return <p className="text-[var(--muted)]">{t('detail_loading')}</p>;

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
    <div className="page-shell page-shell--narrow">
      <div className="page-header">
        <div className="eyebrow">{t('mypets_eyebrow')}</div>
        <h1>{t('mypets_title')}</h1>
        <p>{t('mypets_desc')}</p>
      </div>

      <>
          {/* Sanuulga */}
          {!subscribed ? (
            <div className="mb-[var(--sp-4)] rounded-[var(--r-md)] bg-[var(--success-bg)] p-[var(--sp-3)]">
              <Button onClick={handleSubscribe} variant="primary">
                {t('mypets_subscribe')}
              </Button>
              {notifyError && <p className="mt-[var(--sp-1)] text-xs text-[var(--alert)]">{notifyError}</p>}
            </div>
          ) : (
            <p className="mb-[var(--sp-4)] text-[13px] text-[var(--success)]">{t('mypets_subscribed')}</p>
          )}

          {/* Нэмэх форм */}
          <form onSubmit={handleAdd} className="mb-[var(--sp-4)] [&_.field]:min-h-[var(--touch-target)] [&_.field]:rounded-[var(--r-sm)] [&_.field]:border [&_.field]:border-[var(--line)] [&_.field]:bg-[var(--card)] [&_.field]:px-[var(--sp-3)] [&_.field]:py-[var(--sp-2)] [&_.field]:text-[var(--ink)]" aria-label="Шинэ амьтан нэмэх">
            <FieldHint mn="Нэр, төрөл заавал. Нас, үүлдэр, жин болон вакцины мэдээлэл мэдэхгүй бол дараа нь нэмж болно." en="Name and type are required. Age, breed, weight and vaccine details can be added later." />
            <div className="mb-[var(--sp-2)] flex gap-[var(--sp-2)]">
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder={t('mypets_name_ph')} required
                className="field flex-[1_1_140px]"
              />
              <select className="field w-auto" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="Нохой">{TYPE_LABELS['Нохой']}</option>
                <option value="Муур">{TYPE_LABELS['Муур']}</option>
              </select>
            </div>
            <div className="mb-[var(--sp-2)] flex gap-[var(--sp-2)] max-sm:flex-wrap [&_.field]:flex-1">
              <input className="field flex-1" value={age} onChange={(e) => setAge(e.target.value)} placeholder={t('health_age_ph')} />
              <input className="field flex-1" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder={t('health_breed_ph')} />
              <input className="field flex-1" type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={t('health_weight_ph')} />
            </div>
            <div className="flex gap-[var(--sp-2)] max-sm:flex-wrap [&_.field]:flex-1">
              <span className="sr-only">Дараагийн вакцины нэр болон огноо</span>
              <input className="field flex-1" value={vaxName} onChange={(e) => setVaxName(e.target.value)} placeholder={t('health_next_vaccine_name_ph')} />
              <input className="field w-auto" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Button type="submit" disabled={busy} variant="accent">{t('mypets_add')}</Button>
            </div>
          </form>

          {/* Амьтдын жагсаалт */}
          {petsLoading ? (
            <div className="flex flex-col gap-[var(--sp-2)]">
              {[0, 1].map((i) => (
                <div key={i} className="skel-row h-[52px] rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--card)] p-[var(--sp-3)]" />
              ))}
            </div>
          ) : pets.length === 0 ? (
            <EmptyState icon={<Icon name="vaccine" size={30} />} description={t('mypets_none')} />
          ) : (
            <div className="flex flex-col gap-[var(--sp-2)]">
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

    </div>
  );
}
