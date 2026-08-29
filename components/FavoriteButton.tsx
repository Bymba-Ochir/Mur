'use client';
import { useEffect, useState } from 'react';
import { isFavorite, toggleFavorite } from '../lib/listingService';
import { useAuth } from '../lib/useAuth';
import { useToast } from './Toast';
import Icon from './ui/icons';

export default function FavoriteButton({ petId }: { petId: string }) {
  const { user } = useAuth(); const showToast = useToast(); const [active, setActive] = useState(false); const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!user) return;
    let current = true;
    void isFavorite(petId).then((value) => { if (current) setActive(value); }).catch(() => undefined);
    return () => { current = false; };
  }, [petId, user]);
  async function toggle() { if (!user) { showToast('Зар хадгалахын тулд нэвтэрнэ үү.', 'info'); return; } setBusy(true); try { const added = await toggleFavorite(petId); setActive(added); showToast(added ? 'Зар хадгалагдлаа.' : 'Хадгалснаас хаслаа.', 'success'); } catch { showToast('Зарыг хадгалж чадсангүй.', 'error'); } finally { setBusy(false); } }
  const visibleActive = Boolean(user && active);
  return <button type="button" disabled={busy} aria-pressed={visibleActive} aria-label={visibleActive ? 'Хадгалснаас хасах' : 'Зар хадгалах'} onClick={() => void toggle()} className={`favorite-button${visibleActive ? ' active' : ''}`}><Icon name="heart" size={20} aria-hidden="true" /><span>{visibleActive ? 'Хадгалсан' : 'Хадгалах'}</span><style jsx>{`.favorite-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:42px;padding:8px 13px;border:1px solid var(--line);border-radius:var(--r-pill);background:var(--card);color:var(--ink);font:650 13px var(--font-body);cursor:pointer}.favorite-button.active{color:var(--accent);background:var(--eyebrow-bg);border-color:color-mix(in srgb,var(--accent) 35%,var(--line))}.favorite-button:disabled{opacity:.6;cursor:not-allowed}`}</style></button>;
}
