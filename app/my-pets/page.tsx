'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../lib/useAuth';
import { createMyPet, updateMyPet, fetchMyPets, deleteMyPet, updateVaccineDate, vaccineStatus } from '../../lib/vaccineService';
import { subscribeToVaccineReminders, isVaccineSubscribed } from '../../lib/push';
import { useToast } from '../../components/Toast';
import { useLanguage } from '../../lib/i18n';
import MyPetCard from '../../components/MyPetCard';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Icon from '../../components/ui/icons';
import Modal from '../../components/ui/Modal';
import LoginModal from '../../components/LoginModal';
import PetHealthPanel from '../../components/PetHealthPanel';
import MyPetRegistrationForm from '../../components/MyPetRegistrationForm';
import type { MyPetRegistrationValues } from '../../components/MyPetRegistrationForm';
import type { MyPet } from '../../lib/types';
import { getErrorMessage } from '../../lib/utils';

export default function MyPetsPage() {
  const { user, loading: authLoading } = useAuth();
  const showToast = useToast();
  const { t, lang } = useLanguage();
  const [showAddForm, setShowAddForm] = useState<boolean | null>(null);
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [pets, setPets] = useState<MyPet[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<MyPet | null>(null);
  const [addFormKey, setAddFormKey] = useState(0);
  const [subscribed, setSubscribed] = useState(false); const [notifyError, setNotifyError] = useState(''); const [busy, setBusy] = useState(false); const [petsError, setPetsError] = useState(''); const [deleteTarget, setDeleteTarget] = useState<MyPet | null>(null); const [deleteBusy, setDeleteBusy] = useState(false); const [showLogin, setShowLogin] = useState(false);

  const load = useCallback(async () => {
    setPetsLoading(true); setPetsError('');
    try { setPets(await fetchMyPets()); }
    catch (reason) { setPetsError(getErrorMessage(reason)); }
    finally { setPetsLoading(false); }
  }, []);

  useEffect(() => {
    if (user) void Promise.resolve().then(load);
    void isVaccineSubscribed().then(setSubscribed).catch(() => setSubscribed(false));
  }, [user, load]);

  async function handleAdd(values: MyPetRegistrationValues) {
    if (busy) return;
    setBusy(true);
    try {
      await createMyPet(values);
      setShowAddForm(false); setAddFormKey(value => value + 1); await load(); showToast(t('mypets_registered'), 'success');
    }
    finally { setBusy(false); }
  }

  async function handleEdit(values: MyPetRegistrationValues) {
    if (!editTarget || busy) return;
    setBusy(true);
    try {
      await updateMyPet(editTarget.id, values);
      setEditTarget(null); await load(); showToast(t('health_profile_saved'), 'success');
    } finally { setBusy(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleteBusy) return;
    setDeleteBusy(true);
    try { await deleteMyPet(deleteTarget.id); if (selectedPetId === deleteTarget.id) setSelectedPetId(null); setDeleteTarget(null); await load(); }
    catch (reason) { showToast(getErrorMessage(reason), 'error'); }
    finally { setDeleteBusy(false); }
  }

  async function handleVaccineDate(petId: string, nextDate: string) {
    await updateVaccineDate(petId, nextDate);
    setPets((current) => current.map((pet) => pet.id === petId ? { ...pet, nextVaccineDate: nextDate || null } : pet));
  }

  async function handleSubscribe() {
    if (notifyBusy) return;
    setNotifyBusy(true);
    setNotifyError('');
    try { await subscribeToVaccineReminders(); setSubscribed(true); }
    catch (reason) { setNotifyError(getErrorMessage(reason)); }
    finally { setNotifyBusy(false); }
  }

  const addFormOpen = showAddForm ?? (!petsLoading && !petsError && pets.length === 0);
  const priority = { overdue: 0, soon: 1, none: 2, ok: 3 };
  const sortedPets = [...pets].sort((a, b) => priority[vaccineStatus(a.nextVaccineDate)] - priority[vaccineStatus(b.nextVaccineDate)]);
  const attentionCount = pets.filter((pet) => ['overdue', 'soon'].includes(vaccineStatus(pet.nextVaccineDate))).length;
  const selectedPet = pets.find((pet) => pet.id === selectedPetId) || null;

  if (authLoading) return <MyPetsSkeleton label={t('mypets_loading')} />;
  if (!user) return <div className="page-shell page-shell--narrow"><header className="page-header"><div className="eyebrow">{t('mypets_eyebrow')}</div><h1>{t('mypets_title')}</h1><p>{t('mypets_login_required')}</p></header><div className="state-panel"><span className="state-panel__icon"><Icon name="lock" size={28} /></span><h2>{t('profile_login_title')}</h2><p>{t('profile_login_desc')}</p><Button variant="primary" onClick={() => setShowLogin(true)}>{t('messages_login_action')}</Button></div>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</div>;

  return <div className="my-pets-page page-shell page-shell--narrow">
    <header className="page-header"><div className="eyebrow">{t('mypets_eyebrow')}</div><h1>{t('mypets_title')}</h1><p>{t('mypets_desc')}</p></header>
    <aside className={`notification-card${subscribed ? ' active' : ''}`}><span className="notification-icon"><Icon name={subscribed ? 'check' : 'bell'} size={22} /></span><div><strong>{t('mypets_notification_title')}</strong><p>{subscribed ? t('mypets_subscribed') : t('mypets_notification_desc')}</p>{notifyError && <p className="notify-error" role="alert">{notifyError}</p>}</div>{!subscribed && <Button variant="primary" disabled={notifyBusy} aria-busy={notifyBusy} onClick={() => void handleSubscribe()}>{t('mypets_subscribe')}</Button>}</aside>
    <div className="quick-actions"><Button variant="secondary" disabled={busy} onClick={() => setShowAddForm(!addFormOpen)} aria-expanded={addFormOpen} aria-controls="add-pet-section">{addFormOpen ? t('close') : t('mypets_add')}</Button><Button as="link" href="/clinics" variant="ghost">{t('clinics_title')}</Button></div>
    {!petsLoading && !petsError && attentionCount > 0 && <p role="status">{lang === 'mn' ? `${attentionCount} амьтны вакцины хугацааг шалгаарай.` : `Check vaccine dates for ${attentionCount} pets.`}</p>}
    <section id="add-pet-section" hidden={!addFormOpen} className="add-section" aria-labelledby="add-pet-title"><div className="section-title"><span><Icon name="plus" size={20} /></span><div><h2 id="add-pet-title">{t('mypets_form_title')}</h2><p>{t('mypets_form_desc')}</p></div></div><MyPetRegistrationForm key={addFormKey} saving={busy} onSave={handleAdd} /></section>
    <section className="pets-section" aria-labelledby="pets-list-title"><div className="list-heading"><div><h2 id="pets-list-title">{t('mypets_list_title')}</h2><p>{pets.length} {t('mypets_count_suffix')}</p></div></div>{petsError ? <div className="state-panel state-panel--error" role="alert"><span className="state-panel__icon"><Icon name="alert" size={28} /></span><h2>{t('mypets_load_error')}</h2><p>{petsError}</p><Button variant="secondary" onClick={() => void load()}>{t('mypets_retry')}</Button></div> : petsLoading ? <PetsListSkeleton label={t('mypets_loading')} /> : pets.length === 0 ? <EmptyState icon={<Icon name="vaccine" size={30} />} title={t('mypets_none')} description={t('mypets_form_desc')} /> : <div className="pet-list">{sortedPets.map((pet) => <MyPetCard key={pet.id} pet={pet} selected={selectedPetId === pet.id} onEdit={() => { setSelectedPetId(null); setEditTarget(pet); }} onSelect={() => setSelectedPetId(selectedPetId === pet.id ? null : pet.id)} onDateChange={(nextDate) => handleVaccineDate(pet.id, nextDate)} onDelete={() => setDeleteTarget(pet)} />)}</div>}</section>
    {selectedPet && <PetHealthPanel key={selectedPet.id} pet={selectedPet} onProfileUpdated={load} onClose={() => setSelectedPetId(null)} />}
    <Modal open={Boolean(editTarget)} onClose={() => !busy && setEditTarget(null)} title={t('mypets_edit')} closeLabel={t('close')}>{editTarget && <MyPetRegistrationForm key={editTarget.id} initial={editTarget} saving={busy} onSave={handleEdit} onCancel={() => setEditTarget(null)} />}</Modal>
    <Modal open={Boolean(deleteTarget)} onClose={() => !deleteBusy && setDeleteTarget(null)} title={t('mypets_delete_title')} closeLabel={t('close')} width="sm"><div className="delete-confirm"><span><Icon name="alert" size={24} /></span><p><strong>{deleteTarget?.name}</strong><br />{t('mypets_delete_desc')}</p><div><Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleteBusy}>{t('mypets_delete_cancel')}</Button><Button variant="danger" onClick={() => void confirmDelete()} disabled={deleteBusy}>{t('mypets_delete')}</Button></div></div></Modal>
    <style jsx>{`
      .my-pets-page{width:100%}.notification-card{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) var(--sp-4);background:var(--card);border:1px solid var(--border-subtle);border-radius:var(--r-lg)}.notification-card.active{background:var(--success-bg);border-color:color-mix(in srgb,var(--success) 28%,var(--line))}.notification-icon{display:flex;align-items:center;justify-content:center;width:2.75rem;height:2.75rem;flex:0 0 auto;color:var(--primary);background:var(--card);border-radius:var(--r-md)}.notification-card.active .notification-icon{color:var(--success-text)}.notification-card>div{min-width:0;flex:1}.notification-card strong{color:var(--ink);font-size:var(--text-sm)}.notification-card p{margin:2px 0 0;color:var(--muted);font-size:var(--text-xs);line-height:1.5}.notification-card .notify-error{color:var(--alert)}.add-section,.pets-section{margin-top:var(--sp-6);padding:var(--sp-5);background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl);box-shadow:var(--shadow-xs)}.section-title{display:flex;align-items:flex-start;gap:var(--sp-3);margin-bottom:var(--sp-4)}.section-title>span{display:flex;padding:var(--sp-2);color:var(--primary);background:var(--eyebrow-bg);border-radius:var(--r-md)}.section-title h2,.list-heading h2{margin:0;color:var(--ink);font-family:var(--font-display);font-size:var(--text-xl)}.section-title p,.list-heading p{margin:var(--sp-1) 0 0;color:var(--muted);font-size:var(--text-xs)}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sp-3);margin-top:var(--sp-4)}.form-grid label{display:flex;min-width:0;flex-direction:column;gap:var(--sp-1)}.form-grid label>span{color:var(--ink);font-size:var(--text-xs);font-weight:700}.form-grid .field{width:100%;min-height:var(--touch-target)}.form-actions{display:flex;justify-content:flex-end;margin-top:var(--sp-4)}.list-heading{display:flex;justify-content:space-between;margin-bottom:var(--sp-4)}.pet-list{display:flex;flex-direction:column;gap:var(--sp-3)}.delete-confirm{text-align:center}.delete-confirm>span{display:flex;align-items:center;justify-content:center;width:3.5rem;height:3.5rem;margin:0 auto var(--sp-3);color:var(--alert);background:var(--alert-bg);border-radius:50%}.delete-confirm p{margin:0;color:var(--muted);font-size:var(--text-sm);line-height:1.6}.delete-confirm p strong{color:var(--ink);font-size:var(--text-base)}.delete-confirm>div{display:flex;justify-content:center;gap:var(--sp-2);margin-top:var(--sp-4)}
      @media(max-width:700px){.add-section,.pets-section{padding:var(--sp-4);border-radius:var(--r-lg)}.form-grid{grid-template-columns:1fr}.form-actions :global(.btn-base){width:100%}}@media(max-width:520px){.notification-card{align-items:stretch;flex-direction:column;padding:var(--sp-3) var(--sp-4);background:var(--card);border:1px solid var(--border-subtle);}.notification-card :global(.btn-base){width:100%}.notification-icon{align-self:flex-start}.add-section,.pets-section{padding:var(--sp-3);border-right:0;border-left:0;border-radius:0}.delete-confirm>div{align-items:stretch;flex-direction:column-reverse}.delete-confirm :global(.btn-base){width:100%}}
    `}</style>
  </div>;
}

function MyPetsSkeleton({ label }: { label: string }) { return <div className="page-shell page-shell--narrow"><PetsListSkeleton label={label} /></div>; }
function PetsListSkeleton({ label }: { label: string }) { return <div className="pets-skeleton" aria-busy="true" aria-label={label}><span className="sr-only">{label}</span>{[0,1,2].map((item)=><span key={item} />)}<style jsx>{`.pets-skeleton{display:flex;flex-direction:column;gap:var(--sp-3)}.pets-skeleton>span:not(.sr-only){height:9rem;background:var(--surface-3);border-radius:var(--r-lg)}@media(max-width:520px){.pets-skeleton>span:not(.sr-only){height:14rem;border-radius:var(--r-md)}}`}</style></div>; }
