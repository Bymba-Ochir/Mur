'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../../lib/useAuth';
import { ensureMyProfile, updateMyProfile, uploadMyAvatar } from '../../../lib/profileService';
import { DISTRICTS } from '../../../lib/districts';
import type { District } from '../../../lib/districts';
import { getErrorMessage } from '../../../lib/utils';
import { useToast } from '../../../components/Toast';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/icons';
import FieldHint from '../../../components/ui/FieldHint';
import { useLanguage } from '../../../lib/i18n';

export default function ProfileEditPage() {
  const { user } = useAuth();
  return <ProfileEditContent key={user?.id ?? 'guest'} />;
}

function ProfileEditContent() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const showToast = useToast();
  const [displayName, setDisplayName] = useState('');
  const [district, setDistrict] = useState<District | ''>('');
  const [bio, setBio] = useState('');
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [nameError, setNameError] = useState('');
  const active = useRef(false);
  const mutation = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    async function load() {
      try {
        const profile = await ensureMyProfile();
        if (!cancelled) { setDisplayName(profile.displayName); setDistrict(profile.district || ''); setBio(profile.bio); setIsVolunteer(profile.isVolunteer); setAvatarUrl(profile.avatarUrl); setLoadError(''); }
      } catch (reason) { if (!cancelled) setLoadError(getErrorMessage(reason)); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [user?.id, reloadKey]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.current || !active.current) return;
    const cleanedName = displayName.trim();
    if (cleanedName.length < 2) { setNameError(t('profile_name_error')); return; }
    mutation.current = true;
    setSaving(true); setNameError('');
    try {
      await updateMyProfile({ displayName: cleanedName, district, bio, isVolunteer });
      if (!active.current) return;
      showToast(t('profile_saved'), 'success'); router.push('/profile');
    } catch (reason) { if (active.current) showToast(getErrorMessage(reason), 'error'); }
    finally { mutation.current = false; if (active.current) setSaving(false); }
  }

  async function changeAvatar(file?: File) {
    if (!file || mutation.current || !active.current) return;
    mutation.current = true;
    setAvatarBusy(true);
    try {
      const url = await uploadMyAvatar(file);
      if (active.current) { setAvatarUrl(url); showToast(t('profile_avatar_saved'), 'success'); }
    } catch (reason) { if (active.current) showToast(getErrorMessage(reason), 'error'); }
    finally { mutation.current = false; if (active.current) setAvatarBusy(false); }
  }

  if (authLoading || (user && loading)) return <EditSkeleton label={t('profile_loading')} />;
  if (!user) return <div className="page-shell page-shell--narrow"><div className="state-panel"><span className="state-panel__icon"><Icon name="lock" size={28} /></span><h2>{t('profile_edit_title')}</h2><p>{t('profile_login_desc')}</p></div></div>;
  if (loadError) return <div className="page-shell page-shell--narrow"><div className="state-panel state-panel--error" role="alert"><span className="state-panel__icon"><Icon name="alert" size={28} /></span><h2>{t('profile_edit_load_error')}</h2><p>{loadError}</p><Button variant="secondary" onClick={() => { setLoading(true); setLoadError(''); setReloadKey((value) => value + 1); }}>{t('profile_retry')}</Button></div></div>;

  return <div className="profile-edit-page page-shell page-shell--narrow">
    <header className="page-header"><div className="eyebrow">{t('profile_edit_eyebrow')}</div><h1>{t('profile_edit_title')}</h1><p>{t('profile_edit_desc')}</p></header>
    <form className="edit-card" onSubmit={save} noValidate>
      <section className="avatar-section" aria-labelledby="avatar-heading"><div className="avatar-preview">{avatarUrl ? <Image src={avatarUrl} alt={t('profile_avatar_alt')} fill sizes="104px" className="avatar-photo" /> : <Icon name="paw" size={40} />}{avatarBusy && <span className="avatar-loading" aria-live="polite"><Icon name="sparkles" size={20} className="spin" /></span>}</div><div><h2 id="avatar-heading">{t('profile_avatar_alt')}</h2><p>{t('profile_avatar_hint')}</p><label className={`upload-btn${avatarBusy ? ' disabled' : ''}`}><Icon name="camera" size={17} />{t('profile_avatar_upload')}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; void changeAvatar(file); }} disabled={avatarBusy || saving} /></label></div></section>
      <div className="form-grid">
        <div className="form-field full"><label htmlFor="display-name">{t('profile_name_label')}</label><FieldHint mn="Бусад хэрэглэгчид харагдах нэр. Имэйл болон утасны дугаар бүү оруулаарай." en="This name is visible to other users. Do not include your email or phone number." /><input id="display-name" disabled={saving} className="field" value={displayName} onChange={(event) => { setDisplayName(event.target.value); if (nameError) setNameError(''); }} maxLength={100} minLength={2} required aria-invalid={Boolean(nameError)} aria-describedby={nameError ? 'display-name-error' : 'display-name-hint'} /><small id="display-name-hint">{t('profile_name_hint')} · {displayName.length}/100</small>{nameError && <p id="display-name-error" className="field-error" role="alert">{nameError}</p>}</div>
        <div className="form-field"><label htmlFor="district">{t('profile_district_label')}</label><select id="district" disabled={saving} className="field" value={district} onChange={(event) => setDistrict(event.target.value as District | '')}><option value="">{t('profile_district_none')}</option>{DISTRICTS.map((item) => <option key={item}>{item}</option>)}</select></div>
        <label className="volunteer-field"><input type="checkbox" disabled={saving} checked={isVolunteer} onChange={(event) => setIsVolunteer(event.target.checked)} /><span><strong>{t('profile_volunteer_label')}</strong><small>{t('profile_volunteer')}</small></span></label>
        <div className="form-field full"><label htmlFor="bio">{t('profile_bio_label')}</label><textarea id="bio" disabled={saving} className="field" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={500} rows={6} aria-describedby="bio-hint" /><div className="field-meta"><small id="bio-hint">{t('profile_bio_hint')}</small><small>{bio.length}/500</small></div></div>
      </div>
      <div className="actions"><Button type="button" variant="ghost" onClick={() => router.back()} disabled={saving || avatarBusy}>{t('profile_cancel')}</Button><Button type="submit" variant="primary" disabled={saving || avatarBusy || displayName.trim().length < 2} aria-busy={saving}>{saving ? t('profile_saving') : t('profile_save')}</Button></div>
    </form>
    <style jsx>{`
      .profile-edit-page{width:100%}.edit-card{padding:var(--sp-6);background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl);box-shadow:var(--shadow-sm)}.avatar-section{display:flex;align-items:center;gap:var(--sp-5);padding-bottom:var(--sp-5);border-bottom:1px solid var(--line)}.avatar-preview{position:relative;display:grid;place-items:center;width:6.5rem;height:6.5rem;overflow:hidden;flex:0 0 auto;color:var(--primary);background:var(--surface-3);border:4px solid var(--eyebrow-bg);border-radius:50%}.avatar-preview :global(.avatar-photo){object-fit:cover}.avatar-loading{position:absolute;inset:0;display:grid;place-items:center;color:white;background:rgba(23,26,43,.58)}.avatar-section h2{margin:0;color:var(--ink);font-size:var(--text-lg)}.avatar-section p{margin:var(--sp-1) 0 var(--sp-3);color:var(--muted);font-size:var(--text-xs)}.upload-btn{display:inline-flex;align-items:center;gap:var(--sp-2);min-height:var(--touch-target);padding:var(--sp-2) var(--sp-4);color:var(--primary);background:var(--eyebrow-bg);border:1px solid var(--primary-light);border-radius:var(--r-md);font-size:var(--text-sm);font-weight:700;cursor:pointer}.upload-btn input{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.upload-btn:focus-within{outline:2px solid var(--border-focus);outline-offset:2px}.upload-btn.disabled{opacity:.55;cursor:not-allowed}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);margin-top:var(--sp-5)}.form-field{display:flex;min-width:0;flex-direction:column}.form-field.full{grid-column:1/-1}.form-field>label{margin-bottom:var(--sp-1);color:var(--ink);font-size:var(--text-sm);font-weight:700}.form-field .field{width:100%;min-height:var(--touch-target)}.form-field textarea.field{min-height:9rem;resize:vertical;line-height:1.6}.form-field>small,.field-meta small{color:var(--muted);font-size:10px}.form-field>small{margin-top:var(--sp-1);text-align:right}.field-meta{display:flex;justify-content:space-between;gap:var(--sp-3);margin-top:var(--sp-1)}.field-meta small:first-child{max-width:75%}.field-error{margin:var(--sp-1) 0 0;color:var(--alert);font-size:var(--text-xs)}.field[aria-invalid="true"]{border-color:var(--alert)}.volunteer-field{display:flex;align-items:center;gap:var(--sp-3);min-height:var(--touch-target);padding:var(--sp-3);background:var(--eyebrow-bg);border:1px solid var(--glass-border);border-radius:var(--r-md);cursor:pointer}.volunteer-field input{width:1.2rem;height:1.2rem;accent-color:var(--primary)}.volunteer-field span{display:flex;flex-direction:column}.volunteer-field strong{color:var(--ink);font-size:var(--text-sm)}.volunteer-field small{color:var(--muted);font-size:10px}.actions{display:flex;justify-content:flex-end;gap:var(--sp-2);margin-top:var(--sp-5);padding-top:var(--sp-4);border-top:1px solid var(--line)}.spin{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
      @media(max-width:680px){.edit-card{padding:var(--sp-4);border-radius:var(--r-lg)}.form-grid{grid-template-columns:1fr}.form-field.full{grid-column:auto}.avatar-section{align-items:flex-start}.avatar-preview{width:5.5rem;height:5.5rem}.actions{align-items:stretch;flex-direction:column-reverse}.actions :global(.btn-base){width:100%}}@media(max-width:430px){.avatar-section{flex-direction:column}.avatar-preview{align-self:center}.avatar-section>div:last-child{text-align:center}.upload-btn{justify-content:center;width:100%}.field-meta small:first-child{max-width:68%}}@media(prefers-reduced-motion:reduce){.spin{animation:none}}
    `}</style>
  </div>;
}

function EditSkeleton({ label }: { label: string }) {
  return <div className="edit-skeleton page-shell page-shell--narrow" aria-busy="true" aria-label={label}><span className="sr-only">{label}</span><div className="heading"><span /><span /></div><div className="panel"><div className="avatar"><span /><div><span /><span /></div></div>{[0,1,2,3].map((item)=><span className="field-skeleton" key={item} />)}</div><style jsx>{`.heading{display:flex;flex-direction:column;gap:var(--sp-2);margin-bottom:var(--sp-5)}.heading span{width:45%;height:1.8rem;background:var(--surface-3);border-radius:var(--r-pill)}.heading span:last-child{width:65%;height:.8rem}.panel{display:flex;padding:var(--sp-6);flex-direction:column;gap:var(--sp-4);background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl)}.avatar{display:flex;align-items:center;gap:var(--sp-4)}.avatar>span{width:6rem;height:6rem;background:var(--surface-3);border-radius:50%}.avatar>div{display:flex;width:45%;flex-direction:column;gap:var(--sp-2)}.avatar>div span,.field-skeleton{height:.8rem;background:var(--surface-3);border-radius:var(--r-pill)}.avatar>div span:first-child{height:1.2rem}.field-skeleton{height:3rem;border-radius:var(--r-md)}@media(max-width:680px){.panel{padding:var(--sp-4)}}`}</style></div>;
}
