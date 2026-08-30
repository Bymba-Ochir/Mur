'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/useAuth';
import { ensureMyProfile, updateMyProfile } from '../../lib/profileService';
import type { NotificationPreferences, UserProfile } from '../../lib/profileService';
import { getErrorMessage } from '../../lib/utils';
import { useToast } from '../../components/Toast';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/icons';

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const { supabase } = await import('../../lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Эхлээд нэвтэрнэ үү.');
  return fetch(path, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${session.access_token}` } });
}

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const showToast = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreferences>({ messages: true, matches: true, vaccines: true });
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) ensureMyProfile().then((p) => { setProfile(p); setPrefs(p.notificationPreferences); }).catch((e) => showToast(getErrorMessage(e), 'error')); }, [user, showToast]);

  async function savePreferences() {
    if (!profile) return;
    setBusy(true);
    try { await updateMyProfile({ displayName: profile.displayName, district: profile.district || '', bio: profile.bio, isVolunteer: profile.isVolunteer, notificationPreferences: prefs }); showToast('Мэдэгдлийн тохиргоо хадгалагдлаа.', 'success'); }
    catch (e) { showToast(getErrorMessage(e), 'error'); } finally { setBusy(false); }
  }

  async function exportData() {
    setBusy(true);
    try {
      const response = await authFetch('/api/account/export');
      if (!response.ok) throw new Error((await response.json()).error || 'Татаж чадсангүй.');
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `mur-data-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url);
    } catch (e) { showToast(getErrorMessage(e), 'error'); } finally { setBusy(false); }
  }

  async function deleteAccount() {
    const confirmation = window.prompt('Account болон бүх зараа бүрмөсөн устгахын тулд УСТГАХ гэж бичнэ үү.');
    if (confirmation !== 'УСТГАХ') return;
    setBusy(true);
    try {
      const response = await authFetch('/api/account/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmation }) });
      if (!response.ok) throw new Error((await response.json()).error || 'Account устгаж чадсангүй.');
      await logout(); router.push('/'); router.refresh();
    } catch (e) { showToast(getErrorMessage(e), 'error'); setBusy(false); }
  }

  if (loading) return <div className="page-shell page-shell--narrow"><div className="state-panel" aria-live="polite"><span className="state-panel__icon"><Icon name="lock" size={28} /></span><h2>Тохиргоо ачаалж байна</h2></div></div>;
  if (!user) return <div className="page-shell page-shell--narrow"><div className="state-panel"><span className="state-panel__icon"><Icon name="lock" size={28} /></span><h2>Тохиргоо</h2><p>Эхлээд нэвтэрнэ үү.</p></div></div>;
  return <div className="page-shell page-shell--narrow"><div className="page-header"><div className="eyebrow">Account</div><h1>Тохиргоо</h1><p>{user.email}</p></div>
    <section className="card setting-card"><h2><Icon name="bell" size={20} /> Мэдэгдэл</h2>{([['messages','Шинэ мессеж'],['matches','Төстэй амьтны зар'],['vaccines','Вакцины сануулга']] as const).map(([key,label]) => <label className="toggle-row" key={key}><span>{label}</span><input type="checkbox" checked={prefs[key]} onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })} /></label>)}<Button variant="primary" onClick={savePreferences} disabled={busy || !profile}>Хадгалах</Button></section>
    <section className="card setting-card"><h2><Icon name="lock" size={20} /> Миний өгөгдөл</h2><p>Profile, зар, хүсэлт болон бүртгэлтэй мэдээллээ JSON файлаар татна.</p><Button variant="secondary" onClick={exportData} disabled={busy}>Мэдээллээ татах</Button></section>
    <section className="card setting-card danger-zone"><h2><Icon name="trash" size={20} /> Account устгах</h2><p>Profile болон таны нийтэлсэн контент бүрмөсөн устна. Энэ үйлдлийг буцаах боломжгүй.</p><Button variant="danger" onClick={deleteAccount} disabled={busy}>Account бүрмөсөн устгах</Button></section>
    <style jsx>{`.setting-card{padding:var(--sp-5);margin-bottom:var(--sp-4)}.setting-card h2{display:flex;align-items:center;gap:8px;font-size:18px;margin-bottom:12px}.setting-card p{color:var(--muted);line-height:1.6;margin-bottom:14px}.toggle-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--line)}.toggle-row input{width:20px;height:20px}.danger-zone{border-color:color-mix(in srgb,var(--alert) 35%,var(--line))}`}</style>
  </div>;
}
