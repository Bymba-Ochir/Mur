'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/useAuth';
import { useLanguage } from '../lib/i18n';
import { createAdoptionApplication, fetchAdoptionApplications, updateAdoptionApplication } from '../lib/workflowService';
import type { AdoptionApplication } from '../lib/workflowService';
import { getErrorMessage } from '../lib/utils';
import { useToast } from './Toast';
import Button from './ui/Button';
import Icon from './ui/icons';
import LoginModal from './LoginModal';

export default function AdoptionApplicationPanel({ adoptionId, ownerId }: { adoptionId:string;ownerId:string|null }) {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const { t, lang } = useLanguage();
  const showToast = useToast();
  const [items, setItems] = useState<AdoptionApplication[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState('');
  const owner = Boolean(user && ownerId === user.id);
  const labels = { pending:t('request_pending'), accepted:t('request_accepted'), rejected:t('request_rejected'), cancelled:t('request_cancelled') };

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError('');
    try { setItems(await fetchAdoptionApplications(adoptionId)); }
    catch (reason) { setError(getErrorMessage(reason) || t('adoption_request_load_error')); }
    finally { setLoading(false); }
  }, [adoptionId, user, t]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function submit() {
    setBusy(true);
    try { await createAdoptionApplication(adoptionId,message);setMessage('');showToast(t('adoption_request_sent'),'success');await load(); }
    catch (reason) { showToast(getErrorMessage(reason) || t('form_generic_error'),'error'); }
    finally { setBusy(false); }
  }
  async function decide(id:string,status:'accepted'|'rejected'|'cancelled') {
    setBusy(true);
    try { await updateAdoptionApplication(id,status);showToast(t('adoption_request_updated'),'success');await load(); }
    catch (reason) { showToast(getErrorMessage(reason) || t('form_generic_error'),'error'); }
    finally { setBusy(false); }
  }

  return <section className="workflow-card" aria-labelledby="adoption-request-title">
    <div className="workflow-heading"><span className="heading-icon" aria-hidden="true"><Icon name="heart" size={20}/></span><div><h2 id="adoption-request-title">{owner?`${t('adoption_requests_received')} (${items.length})`:t('adoption_request_title')}</h2>{!user&&<><p>{t('adoption_request_login')}</p><Button onClick={() => setShowLogin(true)}>{t('nav_login')}</Button>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</>}</div></div>
    {user&&loading&&<div className="request-loading" aria-busy="true"><span/><span/><span/></div>}
    {user&&error&&<div className="request-error" role="alert"><Icon name="alert" size={18}/><p>{error}</p><Button variant="ghost" onClick={()=>void load()}>{t('err_retry')}</Button></div>}
    {user&&!loading&&!error&&<>
      {!owner&&!items.some((item)=>item.status==='pending')&&<div className="workflow-form"><label htmlFor="adoption-request">{t('adoption_request_prompt')}</label><textarea id="adoption-request" value={message} onChange={(event)=>setMessage(event.target.value)} maxLength={1000} rows={5} placeholder={t('adoption_request_placeholder')}/><small>{message.length}/1000</small><Button variant="accent" onClick={submit} disabled={busy||message.trim().length<10}>{t('adoption_request_send')}</Button></div>}
      {items.length>0&&<div className="workflow-list">{items.map((item)=><article key={item.id}><div className="workflow-row"><strong data-status={item.status}>{labels[item.status]}</strong><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString(lang==='mn'?'mn-MN':'en-US')}</time></div><p>{item.message}</p>{owner&&<Link href={`/users/${item.applicantId}`}>{t('adoption_request_applicant')}<span aria-hidden="true">→</span></Link>}<div className="workflow-actions">{owner&&item.status==='pending'&&<><Button variant="primary" onClick={()=>void decide(item.id,'accepted')} disabled={busy}>{t('adoption_request_accept')}</Button><Button variant="ghost" onClick={()=>void decide(item.id,'rejected')} disabled={busy}>{t('adoption_request_reject')}</Button></>}{!owner&&item.status==='pending'&&<Button variant="ghost" onClick={()=>void decide(item.id,'cancelled')} disabled={busy}>{t('adoption_request_cancel')}</Button>}</div></article>)}</div>}
    </>}
    <style jsx>{`.workflow-card{margin-top:var(--sp-6);padding:var(--sp-6);background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl);box-shadow:var(--shadow-sm)}.workflow-heading{display:flex;align-items:flex-start;gap:var(--sp-3);margin-bottom:var(--sp-4)}.heading-icon{display:grid;place-items:center;flex:0 0 auto;width:2.6rem;height:2.6rem;color:var(--primary);background:var(--eyebrow-bg);border-radius:var(--r-sm)}h2{margin:0;font-family:var(--font-heading);font-size:var(--text-xl)}.workflow-heading p{margin:var(--sp-1) 0 0;color:var(--muted);font-size:var(--text-sm)}.workflow-form{display:flex;flex-direction:column;gap:var(--sp-2)}.workflow-form label{color:var(--primary);font-size:var(--text-sm);font-weight:700}.workflow-form textarea{width:100%;min-height:8rem;padding:var(--sp-3);color:var(--ink);background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-md);font:inherit;resize:vertical}.workflow-form textarea:focus-visible{outline:2px solid var(--border-focus);outline-offset:1px}.workflow-form small{align-self:flex-end;color:var(--muted)}.workflow-list{display:grid;gap:var(--sp-3)}.workflow-list article{padding:var(--sp-4);background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-md)}.workflow-list p{margin:var(--sp-3) 0;line-height:1.7;white-space:pre-wrap}.workflow-list a{display:inline-flex;gap:var(--sp-1);min-height:var(--touch-target);align-items:center;color:var(--primary);font-size:var(--text-sm);font-weight:700;text-decoration:none}.workflow-row,.workflow-actions{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2)}.workflow-row strong{padding:var(--sp-1) var(--sp-2);color:var(--primary);background:var(--eyebrow-bg);border-radius:var(--r-pill);font-size:var(--text-xs)}.workflow-row time{color:var(--muted);font-size:var(--text-xs)}.workflow-actions{justify-content:flex-end;flex-wrap:wrap;margin-top:var(--sp-3)}.request-loading{display:grid;gap:var(--sp-2)}.request-loading span{height:3rem;background:var(--surface-3);border-radius:var(--r-sm)}.request-error{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3);color:var(--alert);background:var(--alert-bg);border-radius:var(--r-md)}.request-error p{flex:1;margin:0}@media(max-width:640px){.workflow-card{padding:var(--sp-4);border-radius:var(--r-lg)}.workflow-row{align-items:flex-start;flex-direction:column}.workflow-actions :global(.btn-base){flex:1}}`}</style>
  </section>;
}
