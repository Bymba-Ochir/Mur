'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../lib/useAuth';
import { fetchProfile, fetchProfileStats, isUserBlocked, reportUser, setUserBlocked } from '../lib/profileService';
import type { ProfileStats, UserProfile } from '../lib/profileService';
import { getErrorMessage } from '../lib/utils';
import { useToast } from './Toast';
import Button from './ui/Button';
import Icon from './ui/icons';

export default function UserProfileView({ userId, own = false }: { userId?: string; own?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const showToast = useToast();
  const targetId = own ? user?.id : userId;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!targetId) return;
    Promise.all([fetchProfile(targetId), fetchProfileStats(targetId)])
      .then(([p, s]) => { setProfile(p); setStats(s); })
      .catch((err) => setError(getErrorMessage(err)));
    if (user && user.id !== targetId) isUserBlocked(targetId).then(setBlocked).catch(() => {});
  }, [targetId, user]);

  if (authLoading && own) return <p className="page-shell">Уншиж байна...</p>;
  if (own && !user) return <div className="page-shell page-shell--narrow"><div className="card profile-panel"><h1>Миний profile</h1><p>Profile харахын тулд нэвтэрнэ үү.</p></div></div>;
  if (error) return <p className="page-shell error" role="alert">{error}</p>;
  if (!profile || !stats) return <p className="page-shell">Profile ачаалж байна...</p>;

  async function toggleBlock() {
    if (!targetId) return;
    try { await setUserBlocked(targetId, !blocked); setBlocked(!blocked); showToast(!blocked ? 'Хэрэглэгчийг хаалаа.' : 'Хаалтыг цуцаллаа.', 'success'); }
    catch (err) { showToast(getErrorMessage(err), 'error'); }
  }

  async function handleReport() {
    if (!targetId) return;
    const reason = window.prompt('Мэдээлэх шалтгаанаа бичнэ үү:');
    if (!reason) return;
    try { await reportUser(targetId, reason); showToast('Админд шалгуулахаар илгээлээ.', 'success'); }
    catch (err) { showToast(getErrorMessage(err), 'error'); }
  }

  return <div className="page-shell page-shell--narrow">
    <section className="card profile-panel">
      <div className="profile-head">
        <div className="profile-avatar">
          {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill sizes="96px" style={{ objectFit: 'cover' }} /> : <Icon name="paw" size={42} />}
        </div>
        <div className="profile-title">
          <h1>{profile.displayName}</h1>
          <div className="profile-badges">
            {profile.emailVerified && <span><Icon name="check" size={14} /> Email баталгаажсан</span>}
            {profile.isVolunteer && <span><Icon name="heart" size={14} /> Сайн дурын ажилтан</span>}
          </div>
          {profile.district && <p><Icon name="pin" size={15} /> {profile.district}</p>}
        </div>
      </div>
      {profile.bio && <p className="profile-bio">{profile.bio}</p>}
      <div className="profile-stats">
        <div><strong>{stats.pets}</strong><span>Нийт зар</span></div>
        <div><strong>{stats.resolved}</strong><span>Олдсон</span></div>
        <div><strong>{stats.adoptions}</strong><span>Үрчлүүлэх</span></div>
        <div><strong>{stats.sitting}</strong><span>Асрах үйлчилгээ</span></div>
      </div>
      <p className="profile-since">МӨР-д {new Date(profile.createdAt).toLocaleDateString('mn-MN')} өдөр нэгдсэн</p>
      <div className="profile-actions">
        {own ? <><Link href="/profile/edit" className="profile-link"><Icon name="pencil" size={17} /> Profile засах</Link><Link href="/settings" className="profile-link"><Icon name="lock" size={17} /> Тохиргоо</Link></>
          : user && user.id !== targetId ? <><Button variant="secondary" onClick={toggleBlock}><Icon name="lock" size={16} /> {blocked ? 'Хаалтыг цуцлах' : 'Хэрэглэгч хаах'}</Button><Button variant="ghost" onClick={handleReport}><Icon name="flag" size={16} /> Мэдээлэх</Button></> : null}
      </div>
    </section>
    <style jsx>{`
      .profile-panel{padding:var(--sp-6);margin-top:var(--sp-6)}.profile-head{display:flex;gap:var(--sp-4);align-items:center}.profile-avatar{width:96px;height:96px;border-radius:50%;position:relative;overflow:hidden;background:var(--surface-3);color:var(--primary);display:grid;place-items:center;flex:none}.profile-title{min-width:0}.profile-title h1{font-size:clamp(24px,4vw,36px);margin:0}.profile-title p,.profile-badges{display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:var(--muted);font-size:13px;margin-top:8px}.profile-badges span{display:inline-flex;align-items:center;gap:4px;background:var(--eyebrow-bg);padding:5px 8px;border-radius:var(--r-pill);color:var(--primary)}.profile-bio{white-space:pre-wrap;margin-top:var(--sp-5);line-height:1.7}.profile-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-2);margin-top:var(--sp-5)}.profile-stats div{background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-md);padding:var(--sp-3);text-align:center}.profile-stats strong,.profile-stats span{display:block}.profile-stats strong{font-size:24px;color:var(--primary)}.profile-stats span{font-size:12px;color:var(--muted)}.profile-since{font-size:12px;color:var(--muted);margin-top:var(--sp-4)}.profile-actions{display:flex;gap:var(--sp-2);flex-wrap:wrap;margin-top:var(--sp-4)}.profile-link{display:inline-flex;gap:8px;align-items:center;padding:11px 15px;border-radius:var(--r-md);background:var(--surface-2);border:1px solid var(--line);text-decoration:none;color:var(--ink)}@media(max-width:560px){.profile-panel{padding:var(--sp-4)}.profile-head{align-items:flex-start}.profile-avatar{width:72px;height:72px}.profile-stats{grid-template-columns:repeat(2,1fr)}}
    `}</style>
  </div>;
}
