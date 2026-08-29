'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/useAuth';
import { createAdoptionApplication, fetchAdoptionApplications, updateAdoptionApplication } from '../lib/workflowService';
import type { AdoptionApplication } from '../lib/workflowService';
import { getErrorMessage } from '../lib/utils';
import { useToast } from './Toast';
import Button from './ui/Button';

const LABEL = { pending: 'Хүлээгдэж байна', accepted: 'Зөвшөөрсөн', rejected: 'Татгалзсан', cancelled: 'Цуцалсан' } as const;

export default function AdoptionApplicationPanel({ adoptionId, ownerId }: { adoptionId: string; ownerId: string | null }) {
  const { user } = useAuth(); const showToast = useToast();
  const [items, setItems] = useState<AdoptionApplication[]>([]); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const owner = Boolean(user && ownerId === user.id);
  const load = useCallback(() => { if (user) fetchAdoptionApplications(adoptionId).then(setItems).catch(() => {}); }, [adoptionId, user]);
  useEffect(() => { load(); }, [load]);

  async function submit() { setBusy(true); try { await createAdoptionApplication(adoptionId, message); setMessage(''); showToast('Үрчлүүлэх хүсэлт илгээгдлээ.', 'success'); await load(); } catch (e) { showToast(getErrorMessage(e), 'error'); } finally { setBusy(false); } }
  async function decide(id: string, status: 'accepted' | 'rejected' | 'cancelled') { setBusy(true); try { await updateAdoptionApplication(id, status); showToast('Хүсэлтийн төлөв шинэчлэгдлээ.', 'success'); await load(); } catch (e) { showToast(getErrorMessage(e), 'error'); } finally { setBusy(false); } }

  if (!user) return <section className="workflow-card"><h2>Үрчлүүлэх хүсэлт</h2><p>Хүсэлт илгээхийн тулд нэвтэрнэ үү.</p><style jsx>{cardCss}</style></section>;
  return <section className="workflow-card"><h2>{owner ? `Ирсэн хүсэлт (${items.length})` : 'Үрчлүүлэх хүсэлт'}</h2>
    {!owner && !items.some((i) => i.status === 'pending') && <div className="workflow-form"><label htmlFor="adoption-request">Та амьтныг хэрхэн асрах тухайгаа бичнэ үү</label><textarea id="adoption-request" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={4} placeholder="Амьдрах орчин, өмнөх туршлага, гэр бүлийн нөхцөл..."/><small>{message.length}/1000</small><Button variant="accent" onClick={submit} disabled={busy || message.trim().length < 10}>Хүсэлт илгээх</Button></div>}
    {items.length > 0 && <div className="workflow-list">{items.map((item) => <article key={item.id}><div className="workflow-row"><strong>{LABEL[item.status]}</strong><small>{new Date(item.createdAt).toLocaleDateString('mn-MN')}</small></div><p>{item.message}</p>{owner && <Link href={`/users/${item.applicantId}`}>Хүсэлт гаргагчийн profile →</Link>}<div className="workflow-actions">{owner && item.status === 'pending' && <><Button variant="primary" onClick={() => decide(item.id, 'accepted')} disabled={busy}>Зөвшөөрөх</Button><Button variant="ghost" onClick={() => decide(item.id, 'rejected')} disabled={busy}>Татгалзах</Button></>}{!owner && item.status === 'pending' && <Button variant="ghost" onClick={() => decide(item.id, 'cancelled')} disabled={busy}>Хүсэлт цуцлах</Button>}</div></article>)}</div>}
    <style jsx>{cardCss}</style></section>;
}

const cardCss = `.workflow-card{margin-top:var(--sp-5);padding:var(--sp-5);border:1px solid var(--line);border-radius:var(--r-lg);background:var(--card)}.workflow-card h2{font-size:19px;margin-bottom:12px}.workflow-card>p{color:var(--muted)}.workflow-form{display:flex;flex-direction:column;gap:8px}.workflow-form label{font-size:13px;font-weight:650;color:var(--primary)}.workflow-form textarea{width:100%;padding:12px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface-2);color:var(--ink);font:inherit}.workflow-form small{text-align:right;color:var(--muted)}.workflow-list{display:grid;gap:10px}.workflow-list article{padding:14px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface-2)}.workflow-list p{white-space:pre-wrap;line-height:1.6;margin:9px 0}.workflow-list a{color:var(--primary);font-size:13px;text-decoration:none}.workflow-row,.workflow-actions{display:flex;justify-content:space-between;gap:8px;align-items:center}.workflow-row small{color:var(--muted)}.workflow-actions{justify-content:flex-end;margin-top:10px;flex-wrap:wrap}`;
