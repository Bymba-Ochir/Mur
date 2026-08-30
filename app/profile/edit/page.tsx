'use client';
import { useEffect, useState } from 'react';
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

export default function ProfileEditPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const showToast = useToast();
  const [displayName, setDisplayName] = useState('');
  const [district, setDistrict] = useState<District | ''>('');
  const [bio, setBio] = useState('');
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    ensureMyProfile().then((p) => {
      setDisplayName(p.displayName); setDistrict(p.district || ''); setBio(p.bio);
      setIsVolunteer(p.isVolunteer); setAvatarUrl(p.avatarUrl);
    }).catch((err) => showToast(getErrorMessage(err), 'error'));
  }, [user, showToast]);

  async function save() {
    setBusy(true);
    try {
      await updateMyProfile({ displayName, district, bio, isVolunteer });
      showToast('Profile хадгалагдлаа.', 'success'); router.push('/profile');
    } catch (err) { showToast(getErrorMessage(err), 'error'); }
    finally { setBusy(false); }
  }

  async function changeAvatar(file?: File) {
    if (!file) return;
    setBusy(true);
    try { setAvatarUrl(await uploadMyAvatar(file)); showToast('Profile зураг шинэчлэгдлээ.', 'success'); }
    catch (err) { showToast(getErrorMessage(err), 'error'); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="page-shell page-shell--narrow"><div className="state-panel" aria-live="polite"><span className="state-panel__icon"><Icon name="paw" size={28} /></span><h2>Profile ачаалж байна</h2></div></div>;
  if (!user) return <div className="page-shell page-shell--narrow"><div className="state-panel"><span className="state-panel__icon"><Icon name="lock" size={28} /></span><h2>Profile засах</h2><p>Эхлээд нэвтэрнэ үү.</p></div></div>;

  return <div className="page-shell page-shell--narrow"><div className="page-header"><div className="eyebrow">Миний бүртгэл</div><h1>Profile засах</h1><p>Нийтэд харагдах мэдээллээ удирдана.</p></div>
    <section className="card edit-card">
      <div className="avatar-row"><div className="avatar-preview">{avatarUrl ? <Image src={avatarUrl} alt="Profile зураг" fill sizes="88px" style={{ objectFit: 'cover' }} /> : <Icon name="paw" size={38} />}</div><label className="upload-btn">Зураг сонгох<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => changeAvatar(e.target.files?.[0])} hidden /></label></div>
      <label htmlFor="display-name">Харагдах нэр</label><input id="display-name" className="field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={100} required />
      <label htmlFor="district">Дүүрэг</label><select id="district" className="field" value={district} onChange={(e) => setDistrict(e.target.value as District | '')}><option value="">Сонгоогүй</option>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select>
      <label htmlFor="bio">Товч танилцуулга</label><textarea id="bio" className="field" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} rows={5} /><small>{bio.length}/500</small>
      <label className="check-row"><input type="checkbox" checked={isVolunteer} onChange={(e) => setIsVolunteer(e.target.checked)} /> Сайн дурын ажилд оролцох сонирхолтой</label>
      <div className="actions"><Button variant="primary" onClick={save} disabled={busy || !displayName.trim()}>{busy ? 'Хадгалж байна...' : 'Хадгалах'}</Button><Button variant="ghost" onClick={() => router.back()}>Цуцлах</Button></div>
    </section>
    <style jsx>{`.edit-card{padding:var(--sp-6);display:flex;flex-direction:column;gap:8px}.edit-card label{font-size:13px;font-weight:600;color:var(--primary);margin-top:12px}.edit-card small{color:var(--muted);text-align:right}.avatar-row{display:flex;align-items:center;gap:var(--sp-4);margin-bottom:8px}.avatar-preview{position:relative;overflow:hidden;width:88px;height:88px;border-radius:50%;display:grid;place-items:center;background:var(--surface-3);color:var(--primary)}.upload-btn{margin:0!important;padding:10px 14px;border:1px solid var(--line);border-radius:var(--r-md);cursor:pointer}.check-row{display:flex;align-items:center;gap:10px}.check-row input{width:18px;height:18px}.actions{display:flex;gap:8px;margin-top:18px}@media(max-width:560px){.edit-card{padding:var(--sp-4)}}`}</style>
  </div>;
}
