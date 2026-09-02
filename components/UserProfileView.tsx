'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '../lib/useAuth';
import { fetchProfile, fetchProfileStats, isUserBlocked, reportUser, setUserBlocked } from '../lib/profileService';
import type { ProfileStats, UserProfile } from '../lib/profileService';
import { getErrorMessage } from '../lib/utils';
import { useToast } from './Toast';
import Button from './ui/Button';
import Icon from './ui/icons';
import Modal from './ui/Modal';
import FieldHint from './ui/FieldHint';
import { useLanguage } from '../lib/i18n';

export default function UserProfileView({ userId, own = false }: { userId?: string; own?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useLanguage();
  const showToast = useToast();
  const targetId = own ? user?.id : userId;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [actionBusy, setActionBusy] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    if (!targetId) return;
    let cancelled = false;
    async function load() {
      try {
        const [nextProfile, nextStats] = await Promise.all([fetchProfile(targetId!), fetchProfileStats(targetId!)]);
        if (!cancelled) { setProfile(nextProfile); setStats(nextStats); setError(''); }
        if (user && user.id !== targetId) {
          const nextBlocked = await isUserBlocked(targetId!);
          if (!cancelled) setBlocked(nextBlocked);
        }
      } catch (reason) {
        if (!cancelled) setError(getErrorMessage(reason));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [targetId, user, reloadKey]);

  function retryLoad() { setLoading(true); setError(''); setReloadKey((value) => value + 1); }

  async function toggleBlock() {
    if (!targetId || actionBusy) return;
    setActionBusy(true);
    try {
      await setUserBlocked(targetId, !blocked);
      setBlocked((value) => !value);
      showToast(blocked ? t('profile_unblocked_success') : t('profile_blocked_success'), 'success');
    } catch (reason) { showToast(getErrorMessage(reason), 'error'); }
    finally { setActionBusy(false); }
  }

  async function handleReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!targetId || reportReason.trim().length < 10 || actionBusy) return;
    setActionBusy(true); setReportError('');
    try {
      await reportUser(targetId, reportReason);
      showToast(t('profile_report_success'), 'success'); setShowReport(false); setReportReason('');
    } catch (reason) { setReportError(getErrorMessage(reason)); }
    finally { setActionBusy(false); }
  }

  if ((authLoading && own) || (targetId && loading)) return <ProfileSkeleton label={t('profile_loading')} />;
  if (own && !user) return <div className="page-shell page-shell--narrow"><div className="state-panel"><span className="state-panel__icon"><Icon name="lock" size={28} /></span><h2>{t('profile_login_title')}</h2><p>{t('profile_login_desc')}</p></div></div>;
  if (error) return <div className="page-shell page-shell--narrow"><div className="state-panel state-panel--error" role="alert"><span className="state-panel__icon"><Icon name="alert" size={28} /></span><h2>{t('profile_load_error')}</h2><p>{error}</p><Button variant="secondary" onClick={retryLoad}>{t('profile_retry')}</Button></div></div>;
  if (!profile || !stats) return <ProfileSkeleton label={t('profile_loading')} />;

  const joined = new Intl.DateTimeFormat(lang === 'mn' ? 'mn-MN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(profile.createdAt));
  const statItems = [
    { value: stats.pets, label: t('profile_stat_listings'), icon: 'paw' as const },
    { value: stats.resolved, label: t('profile_stat_resolved'), icon: 'check' as const },
    { value: stats.adoptions, label: t('profile_stat_adoptions'), icon: 'heart' as const },
    { value: stats.sitting, label: t('profile_stat_sitting'), icon: 'home' as const },
  ];

  return <div className="profile-page page-shell page-shell--narrow">
    <section className="profile-panel" aria-labelledby="profile-name">
      <div className="profile-cover" aria-hidden="true"><span /><span /><span /></div>
      <div className="profile-content">
        <div className="profile-head">
          <div className="profile-avatar">{profile.avatarUrl ? <Image src={profile.avatarUrl} alt={t('profile_avatar_alt')} fill sizes="(max-width: 560px) 84px, 112px" className="profile-photo" /> : <Icon name="paw" size={44} />}</div>
          <div className="profile-title"><p className="eyebrow">{own ? t('profile_title') : t('thread_participant_label')}</p><h1 id="profile-name">{profile.displayName}</h1><div className="profile-badges">{profile.emailVerified && <span><Icon name="check" size={14} />{t('profile_verified')}</span>}{profile.isVolunteer && <span className="volunteer"><Icon name="heart" size={14} />{t('profile_volunteer')}</span>}</div>{profile.district && <p className="district"><Icon name="pin" size={15} />{profile.district}</p>}</div>
        </div>
        {profile.bio ? <p className="profile-bio">{profile.bio}</p> : own && <p className="profile-bio empty-bio">{t('profile_bio_hint')}</p>}
        <dl className="profile-stats">{statItems.map((item) => <div key={item.label}><dt><Icon name={item.icon} size={18} />{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
        <p className="profile-since"><Icon name="calendar" size={15} />{t('profile_joined_prefix')} {joined} {t('profile_joined_suffix')}</p>
        <div className="profile-actions">{own ? <><Button as="link" href="/profile/edit" variant="primary"><Icon name="pencil" size={17} />{t('profile_edit_action')}</Button><Button as="link" href="/settings" variant="ghost"><Icon name="lock" size={17} />{t('profile_settings_action')}</Button></> : user && user.id !== targetId ? <><Button variant={blocked ? 'ghost' : 'secondary'} onClick={() => void toggleBlock()} disabled={actionBusy}><Icon name="lock" size={16} />{blocked ? t('profile_unblock_action') : t('profile_block_action')}</Button><Button variant="ghost" onClick={() => { setReportError(''); setShowReport(true); }} disabled={actionBusy}><Icon name="flag" size={16} />{t('profile_report_action')}</Button></> : null}</div>
      </div>
    </section>

    <Modal open={showReport} onClose={() => setShowReport(false)} title={t('profile_report_title')} closeLabel={t('close')} width="sm">
      <form className="report-form" onSubmit={handleReport}><p>{t('profile_report_desc')}</p><label htmlFor="profile-report-reason">{t('profile_report_reason')}</label><FieldHint mn="Хувийн нууц мэдээлэл оруулахгүй. Доромжилсон, хуурсан эсвэл дүрэм зөрчсөн үйлдлийг баримтаар товч тайлбарлана." en="Do not include private information. Briefly describe the misleading, abusive, or rule-breaking behavior with factual details." /><textarea id="profile-report-reason" value={reportReason} onChange={(event) => setReportReason(event.target.value)} placeholder={t('profile_report_placeholder')} minLength={10} maxLength={500} rows={5} required aria-invalid={Boolean(reportError)} aria-describedby={reportError ? 'profile-report-error' : 'profile-report-count'} /><div className="report-meta"><span id="profile-report-count">{reportReason.length}/500</span></div>{reportError && <p id="profile-report-error" className="report-error" role="alert">{reportError}</p>}<div className="report-actions"><Button type="button" variant="ghost" onClick={() => setShowReport(false)}>{t('profile_cancel')}</Button><Button type="submit" variant="danger" disabled={actionBusy || reportReason.trim().length < 10}>{t('profile_report_submit')}</Button></div></form>
    </Modal>

    <style jsx>{`
      .profile-page{width:100%}.profile-panel{overflow:hidden;margin-top:var(--sp-3);background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl);box-shadow:var(--shadow-md)}.profile-cover{position:relative;height:8rem;overflow:hidden;background:linear-gradient(135deg,color-mix(in srgb,var(--primary) 88%,white),color-mix(in srgb,var(--found) 74%,var(--primary)))}.profile-cover span{position:absolute;width:5rem;height:5rem;border:1rem solid rgba(255,255,255,.15);border-radius:50%}.profile-cover span:first-child{top:-2rem;left:8%}.profile-cover span:nth-child(2){right:18%;bottom:-3rem;width:8rem;height:8rem}.profile-cover span:last-child{top:1rem;right:4%;width:3rem;height:3rem;border-width:.65rem}.profile-content{padding:0 var(--sp-6) var(--sp-6)}.profile-head{display:flex;align-items:flex-end;gap:var(--sp-4);margin-top:-3.5rem}.profile-avatar{position:relative;display:grid;place-items:center;width:7rem;height:7rem;overflow:hidden;flex:0 0 auto;color:var(--primary);background:var(--surface-3);border:5px solid var(--card);border-radius:50%;box-shadow:var(--shadow-sm)}.profile-avatar :global(.profile-photo){object-fit:cover}.profile-title{min-width:0;padding-bottom:var(--sp-1)}.profile-title .eyebrow{margin:0 0 2px;color:var(--primary)}.profile-title h1{margin:0;overflow-wrap:anywhere;font-family:var(--font-display);font-size:clamp(1.65rem,4vw,2.35rem);line-height:var(--lh-tight)}.profile-badges{display:flex;flex-wrap:wrap;gap:var(--sp-2);margin-top:var(--sp-2)}.profile-badges span{display:inline-flex;align-items:center;gap:var(--sp-1);padding:5px 8px;color:var(--primary);background:var(--eyebrow-bg);border-radius:var(--r-pill);font-size:10px;font-weight:750}.profile-badges .volunteer{color:var(--accent-deep);background:color-mix(in srgb,var(--accent) 13%,var(--card))}.district{display:flex;align-items:center;gap:var(--sp-1);margin:var(--sp-2) 0 0;color:var(--muted);font-size:var(--text-xs)}.profile-bio{margin:var(--sp-5) 0 0;padding:var(--sp-4);color:var(--ink);background:var(--surface-2);border-left:3px solid var(--primary-light);border-radius:var(--r-md);line-height:1.7;white-space:pre-wrap}.profile-bio.empty-bio{color:var(--muted);font-style:italic}.profile-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--sp-3);margin:var(--sp-5) 0 0}.profile-stats div{display:flex;position:relative;min-height:6.5rem;padding:var(--sp-4);flex-direction:column-reverse;justify-content:space-between;background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-lg)}.profile-stats dt{display:flex;align-items:center;gap:var(--sp-1);color:var(--muted);font-size:var(--text-xs)}.profile-stats dd{margin:0;color:var(--primary);font-family:var(--font-display);font-size:1.75rem;font-weight:750}.profile-since{display:flex;align-items:center;gap:var(--sp-2);margin:var(--sp-4) 0 0;color:var(--muted);font-size:var(--text-xs)}.profile-actions{display:flex;flex-wrap:wrap;gap:var(--sp-2);margin-top:var(--sp-5)}.report-form>p{margin:0 0 var(--sp-4);color:var(--muted);font-size:var(--text-sm);line-height:1.6}.report-form label{display:block;margin-bottom:var(--sp-1);color:var(--ink);font-size:var(--text-sm);font-weight:700}.report-form textarea{width:100%;min-height:8rem;padding:var(--sp-3);color:var(--ink);background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-md);font:inherit;resize:vertical}.report-form textarea:focus-visible{outline:2px solid var(--border-focus);outline-offset:1px}.report-form textarea[aria-invalid="true"]{border-color:var(--alert)}.report-meta{display:flex;justify-content:flex-end;margin-top:var(--sp-1);color:var(--muted);font-size:10px}.report-error{margin:var(--sp-2) 0 0;color:var(--alert);font-size:var(--text-xs)}.report-actions{display:flex;justify-content:flex-end;gap:var(--sp-2);margin-top:var(--sp-4)}
      @media(max-width:760px){.profile-content{padding:0 var(--sp-4) var(--sp-5)}.profile-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.profile-panel{margin-top:0;border-right:0;border-left:0;border-radius:0}.profile-cover{height:6.5rem}.profile-head{align-items:flex-start;margin-top:-2.75rem}.profile-avatar{width:5.25rem;height:5.25rem;border-width:4px}.profile-title{padding-top:3rem}.profile-title .eyebrow{display:none}.profile-badges{margin-left:calc(-5.25rem - var(--sp-4));padding-top:var(--sp-3)}.profile-stats div{min-height:5.5rem;padding:var(--sp-3)}.profile-actions :global(.btn-base){width:100%}.report-actions{align-items:stretch;flex-direction:column-reverse}.report-actions :global(.btn-base){width:100%}}@media(prefers-reduced-motion:reduce){.profile-panel{scroll-behavior:auto}}
    `}</style>
  </div>;
}

function ProfileSkeleton({ label }: { label: string }) {
  return <div className="profile-skeleton page-shell page-shell--narrow" aria-busy="true" aria-label={label}><span className="sr-only">{label}</span><div className="cover" /><div className="identity"><span /><div><span /><span /></div></div><div className="bio" /><div className="stats">{[0,1,2,3].map((item)=><span key={item} />)}</div><style jsx>{`.profile-skeleton{overflow:hidden;background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl)}.cover{height:8rem;background:var(--surface-3)}.identity{display:flex;align-items:center;gap:var(--sp-4);padding:0 var(--sp-6);margin-top:-3rem}.identity>span{width:7rem;height:7rem;background:var(--surface-3);border:5px solid var(--card);border-radius:50%}.identity>div{display:flex;width:45%;flex-direction:column;gap:var(--sp-2)}.identity>div span,.bio,.stats span{height:.75rem;background:var(--surface-3);border-radius:var(--r-pill)}.identity>div span:first-child{width:60%;height:1.5rem}.bio{height:5rem;margin:var(--sp-5) var(--sp-6)}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-3);padding:0 var(--sp-6) var(--sp-6)}.stats span{height:6rem;border-radius:var(--r-lg)}@media(max-width:760px){.stats{grid-template-columns:repeat(2,1fr);padding-inline:var(--sp-4)}.bio{margin-inline:var(--sp-4)}}`}</style></div>;
}
