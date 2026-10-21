'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from '../../components/LoginModal';
import { useToast } from '../../components/Toast';
import Button from '../../components/ui/Button';
import Icon, { type IconName } from '../../components/ui/icons';
import Modal from '../../components/ui/Modal';
import { useLanguage } from '../../lib/i18n';
import { ensureMyProfile, updateMyProfile } from '../../lib/profileService';
import type { NotificationPreferences, UserProfile } from '../../lib/profileService';
import { useAuth } from '../../lib/useAuth';
import { getErrorMessage } from '../../lib/utils';

const DEFAULT_PREFERENCES: NotificationPreferences = { messages: true, matches: true, vaccines: true };
const DELETE_WORD = 'УСТГАХ';

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const { supabase } = await import('../../lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Эхлээд нэвтэрнэ үү.');
  return fetch(path, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${session.access_token}` } });
}

async function responseError(response: Response, fallback: string): Promise<string> {
  try { return (await response.json()).error || fallback; }
  catch { return fallback; }
}

function SettingsSkeleton({ label }: { label: string }) {
  return <main className="page-shell page-shell--narrow settings-skeleton" aria-busy="true" aria-label={label}><span className="sr-only">{label}</span><div className="skeleton-heading"><span /><span /></div>{[0, 1, 2].map((item) => <div className="skeleton-card" key={item}><span /><span /><span /></div>)}<style jsx>{`
    .settings-skeleton{display:grid;gap:var(--sp-4)}.skeleton-heading,.skeleton-card{display:grid;gap:10px}.skeleton-heading span,.skeleton-card span{background:linear-gradient(90deg,var(--surface-2),var(--surface-3),var(--surface-2));background-size:220% 100%;border-radius:var(--r-md);animation:settings-shimmer 1.4s infinite}.skeleton-heading span{width:48%;height:32px}.skeleton-heading span:last-child{width:68%;height:13px}.skeleton-card{padding:var(--sp-5);background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl)}.skeleton-card span{height:15px}.skeleton-card span:first-child{width:38%;height:23px}.skeleton-card span:last-child{width:30%;height:42px}@keyframes settings-shimmer{to{background-position:-220% 0}}@media(prefers-reduced-motion:reduce){.skeleton-heading span,.skeleton-card span{animation:none}}
  `}</style></main>;
}

export default function SettingsPage() {
  const { user } = useAuth();
  return <SettingsContent key={user?.id ?? 'guest'} />;
}

function SettingsContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const showToast = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [savedPrefs, setSavedPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  const active = useRef(false);
  const savingRef = useRef(false);
  const requestVersion = useRef(0);

  const loadProfile = useCallback(async () => {
    if (!user?.id || !active.current) return;
    const version = ++requestVersion.current;
    setProfileLoading(true); setLoadError('');
    try {
      const loaded = await ensureMyProfile();
      if (!active.current || version !== requestVersion.current) return;
      setProfile(loaded); setPrefs(loaded.notificationPreferences); setSavedPrefs(loaded.notificationPreferences);
    } catch (reason) { if (active.current && version === requestVersion.current) setLoadError(getErrorMessage(reason)); }
    finally { if (active.current && version === requestVersion.current) setProfileLoading(false); }
  }, [user?.id]);

  useEffect(() => {
    active.current = true;
    let disposed = false;
    const requests = requestVersion;
    void Promise.resolve().then(() => { if (!disposed) void loadProfile(); });
    return () => { disposed = true; active.current = false; requests.current++; };
  }, [loadProfile]);

  const preferencesChanged = prefs.messages !== savedPrefs.messages || prefs.matches !== savedPrefs.matches || prefs.vaccines !== savedPrefs.vaccines;

  async function savePreferences() {
    if (!profile || !preferencesChanged || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await updateMyProfile({ displayName: profile.displayName, district: profile.district || '', bio: profile.bio, isVolunteer: profile.isVolunteer, notificationPreferences: prefs });
      if (!active.current) return;
      setSavedPrefs(prefs);
      showToast(t('settings_saved'), 'success');
    } catch (reason) { if (active.current) showToast(getErrorMessage(reason), 'error'); }
    finally { savingRef.current = false; if (active.current) setSaving(false); }
  }

  async function exportData() {
    setExporting(true);
    try {
      const response = await authFetch('/api/account/export');
      if (!response.ok) throw new Error(await responseError(response, t('settings_export_error')));
      const blob = await response.blob();
      if (!active.current) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `mur-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
      showToast(t('settings_exported'), 'success');
    } catch (reason) { if (active.current) showToast(getErrorMessage(reason), 'error'); }
    finally { if (active.current) setExporting(false); }
  }

  function openDeleteModal() {
    setDeleteConfirmation(''); setDeleteError(''); setShowDelete(true);
  }

  async function deleteAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deleteConfirmation !== DELETE_WORD) { setDeleteError(t('settings_delete_mismatch')); return; }
    setDeleting(true); setDeleteError('');
    try {
      const response = await authFetch('/api/account/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmation: deleteConfirmation }) });
      if (!response.ok) throw new Error(await responseError(response, t('settings_delete_error')));
      if (!active.current) return;
      await logout(); router.push('/'); router.refresh();
    } catch (reason) { if (active.current) { setDeleteError(getErrorMessage(reason)); setDeleting(false); } }
  }

  if (authLoading || (user && profileLoading)) return <SettingsSkeleton label={t('settings_loading')} />;
  if (!user) return <main className="page-shell page-shell--narrow"><div className="state-panel"><span className="state-panel__icon"><Icon name="lock" size={28} /></span><h1>{t('settings_login_title')}</h1><p>{t('settings_login_desc')}</p><Button variant="primary" onClick={() => setShowLogin(true)}><Icon name="lock" size={17} />{t('notifications_login_action')}</Button></div>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</main>;
  if (loadError) return <main className="page-shell page-shell--narrow"><div className="state-panel state-panel--error" role="alert"><span className="state-panel__icon"><Icon name="alert" size={28} /></span><h1>{t('settings_load_error')}</h1><p>{loadError}</p><Button variant="secondary" onClick={() => void loadProfile()}><Icon name="arrowRight" size={17} />{t('settings_retry')}</Button></div></main>;

  const preferenceRows: Array<{ key: keyof NotificationPreferences; icon: IconName; title: string; description: string }> = [
    { key: 'messages', icon: 'message', title: t('settings_messages_title'), description: t('settings_messages_desc') },
    { key: 'matches', icon: 'search', title: t('settings_matches_title'), description: t('settings_matches_desc') },
    { key: 'vaccines', icon: 'vaccine', title: t('settings_vaccines_title'), description: t('settings_vaccines_desc') },
  ];

  return <main className="page-shell page-shell--narrow settings-page">
    <header className="settings-hero"><div><p className="eyebrow">{t('settings_eyebrow')}</p><h1>{t('settings_title')}</h1><p>{t('settings_desc')}</p></div><div className="account-chip"><span><Icon name="lock" size={18} /></span><div><small>{t('settings_account_label')}</small><strong>{user.email}</strong></div></div></header>

    <section className="setting-section" aria-labelledby="notification-settings-title">
      <header className="section-header"><span className="section-icon"><Icon name="bell" size={22} /></span><div><h2 id="notification-settings-title">{t('settings_notifications_title')}</h2><p>{t('settings_notifications_desc')}</p></div></header>
      <div className="preference-list">{preferenceRows.map((row) => <label className="preference-row" key={row.key}><span className="preference-icon"><Icon name={row.icon} size={19} /></span><span className="preference-copy"><strong>{row.title}</strong><small>{row.description}</small></span><input className="switch-input" type="checkbox" checked={prefs[row.key]} onChange={(event) => setPrefs((current) => ({ ...current, [row.key]: event.target.checked }))} /><span className="switch-track" aria-hidden="true"><span /></span></label>)}</div>
      <footer className="section-actions"><p aria-live="polite">{preferencesChanged ? t('settings_notifications_desc') : t('settings_no_changes')}</p><Button variant="primary" onClick={() => void savePreferences()} disabled={saving || !profile || !preferencesChanged} aria-busy={saving}><Icon name="check" size={16} />{saving ? t('settings_saving') : t('settings_save')}</Button></footer>
    </section>

    <section className="setting-section data-section" aria-labelledby="data-settings-title">
      <header className="section-header"><span className="section-icon sky"><Icon name="shield" size={22} /></span><div><h2 id="data-settings-title">{t('settings_data_title')}</h2><p>{t('settings_data_desc')}</p></div></header>
      <div className="section-body"><div className="data-visual" aria-hidden="true"><Icon name="share" size={26} /></div><Button variant="secondary" onClick={() => void exportData()} disabled={exporting || deleting} aria-busy={exporting}><Icon name="share" size={16} />{exporting ? t('settings_exporting') : t('settings_export')}</Button></div>
    </section>

    <section className="setting-section danger-section" aria-labelledby="danger-settings-title">
      <header className="section-header"><span className="section-icon danger"><Icon name="trash" size={22} /></span><div><h2 id="danger-settings-title">{t('settings_danger_title')}</h2><p>{t('settings_danger_desc')}</p></div></header>
      <div className="section-body"><span className="danger-note"><Icon name="alert" size={18} />{t('settings_delete_modal_desc')}</span><Button variant="danger" onClick={openDeleteModal} disabled={deleting || exporting}><Icon name="trash" size={16} />{t('settings_delete_action')}</Button></div>
    </section>

    <Modal open={showDelete} onClose={() => { if (!deleting) setShowDelete(false); }} title={t('settings_delete_modal_title')} closeLabel={t('close')} width="sm" panelClassName="settings-delete-modal">
      <form className="delete-form" onSubmit={deleteAccount}>
        <div className="delete-warning"><Icon name="alert" size={22} /><p>{t('settings_delete_modal_desc')}</p></div>
        <label htmlFor="delete-confirmation">{t('settings_delete_label')} <code>{DELETE_WORD}</code></label>
        <input id="delete-confirmation" className="field" value={deleteConfirmation} onChange={(event) => { setDeleteConfirmation(event.target.value); if (deleteError) setDeleteError(''); }} placeholder={t('settings_delete_placeholder')} autoComplete="off" disabled={deleting} aria-invalid={Boolean(deleteError)} aria-describedby={deleteError ? 'delete-confirmation-error' : undefined} />
        {deleteError && <p id="delete-confirmation-error" className="delete-error" role="alert">{deleteError}</p>}
        <div className="delete-actions"><Button type="button" variant="ghost" onClick={() => setShowDelete(false)} disabled={deleting}>{t('settings_delete_cancel')}</Button><Button type="submit" variant="danger" disabled={deleting || deleteConfirmation !== DELETE_WORD} aria-busy={deleting}><Icon name="trash" size={16} />{deleting ? t('settings_deleting') : t('settings_delete_action')}</Button></div>
      </form>
    </Modal>

    <style jsx>{`
      .settings-page{padding-bottom:var(--sp-8)}.settings-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:var(--sp-5);align-items:end;margin-bottom:var(--sp-5);padding:clamp(20px,4vw,34px);background:linear-gradient(135deg,var(--eyebrow-bg),color-mix(in srgb,var(--found) 12%,var(--card)));border:1px solid var(--line);border-radius:var(--r-xl)}.settings-hero .eyebrow{margin-bottom:5px;color:var(--primary);font-size:var(--text-xs);font-weight:750;letter-spacing:.09em;text-transform:uppercase}.settings-hero h1{font-family:var(--font-display);font-size:clamp(30px,5vw,46px);line-height:1.08}.settings-hero>div>p:last-child{max-width:600px;margin-top:8px;color:var(--muted);line-height:1.6}.account-chip{display:flex;align-items:center;gap:10px;max-width:280px;padding:var(--sp-3);background:var(--card);border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--shadow-xs)}.account-chip>span{display:grid;width:38px;height:38px;place-items:center;color:var(--primary);background:var(--eyebrow-bg);border-radius:50%}.account-chip div{display:grid;gap:2px;min-width:0}.account-chip small{color:var(--muted);font-size:10px}.account-chip strong{overflow:hidden;font-size:var(--text-xs);text-overflow:ellipsis;white-space:nowrap}.setting-section{overflow:hidden;margin-bottom:var(--sp-4);background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl);box-shadow:var(--shadow-xs)}.section-header{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-5);background:var(--surface-2);border-bottom:1px solid var(--line)}.section-icon{display:grid;width:46px;height:46px;place-items:center;color:var(--primary);background:var(--eyebrow-bg);border-radius:var(--r-md)}.section-icon.sky{color:var(--found-deep);background:color-mix(in srgb,var(--found) 17%,var(--card))}.section-icon.danger{color:var(--alert);background:var(--alert-bg)}.section-header h2{font-size:var(--text-lg)}.section-header p{max-width:620px;margin-top:4px;color:var(--muted);font-size:var(--text-sm);line-height:1.5}.preference-list{display:grid;padding:0 var(--sp-5)}.preference-row{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--sp-3);align-items:center;min-height:78px;padding:var(--sp-3) 0;cursor:pointer}.preference-row+.preference-row{border-top:1px solid var(--line)}.preference-icon{display:grid;width:38px;height:38px;place-items:center;color:var(--primary);background:var(--surface-3);border-radius:var(--r-md)}.preference-copy{display:grid;gap:4px;min-width:0}.preference-copy strong{font-size:var(--text-sm)}.preference-copy small{color:var(--muted);font-size:var(--text-xs);line-height:1.45}.switch-input{position:absolute;right:0;width:48px;height:28px;opacity:0;cursor:pointer}.switch-track{position:relative;width:48px;height:28px;background:var(--surface-3);border:1px solid var(--line);border-radius:999px;transition:background var(--dur-fast),border-color var(--dur-fast)}.switch-track span{position:absolute;top:3px;left:3px;width:20px;height:20px;background:var(--card);border-radius:50%;box-shadow:var(--shadow-xs);transition:transform var(--dur-fast)}.switch-input:checked+.switch-track{background:var(--primary);border-color:var(--primary)}.switch-input:checked+.switch-track span{transform:translateX(20px)}.switch-input:focus-visible+.switch-track{outline:2.5px solid var(--border-focus);outline-offset:2px}.section-actions,.section-body{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-4);padding:var(--sp-4) var(--sp-5);border-top:1px solid var(--line)}.section-actions p{color:var(--muted);font-size:var(--text-xs)}.section-body{border-top:0}.data-visual{display:grid;width:48px;height:48px;place-items:center;color:var(--found-deep);background:color-mix(in srgb,var(--found) 15%,var(--card));border-radius:50%}.danger-section{border-color:color-mix(in srgb,var(--alert) 30%,var(--line))}.danger-note{display:flex;align-items:center;gap:8px;max-width:540px;color:var(--alert);font-size:var(--text-xs);line-height:1.5}.delete-form{display:grid;gap:var(--sp-3)}.delete-warning{display:flex;align-items:flex-start;gap:var(--sp-3);padding:var(--sp-3);color:var(--alert);background:var(--alert-bg);border-radius:var(--r-md)}.delete-warning p{color:var(--text);font-size:var(--text-sm);line-height:1.55}.delete-form label{color:var(--text);font-size:var(--text-sm);font-weight:700}.delete-form code{margin-left:5px;padding:3px 6px;color:var(--alert);background:var(--alert-bg);border-radius:5px;font-family:var(--font-mono)}.delete-form .field{width:100%}.delete-form .field[aria-invalid=true]{border-color:var(--alert)}.delete-error{color:var(--alert);font-size:var(--text-xs)}.delete-actions{display:flex;justify-content:flex-end;gap:var(--sp-2);margin-top:var(--sp-2);padding-top:var(--sp-3);border-top:1px solid var(--line)}@media(max-width:720px){.settings-hero{grid-template-columns:1fr;align-items:start}.account-chip{max-width:none}.section-header{align-items:flex-start;padding:var(--sp-4)}.preference-list{padding:0 var(--sp-4)}.section-actions,.section-body{align-items:stretch;padding:var(--sp-4);flex-direction:column}.section-actions :global(.btn-base),.section-body :global(.btn-base){width:100%}.data-visual{display:none}.delete-actions{align-items:stretch;flex-direction:column-reverse}.delete-actions :global(.btn-base){width:100%}}@media(max-width:440px){.preference-row{grid-template-columns:auto minmax(0,1fr);padding-right:58px}.switch-track{position:absolute;right:0}.section-icon{width:42px;height:42px}}
    `}</style>
  </main>;
}
