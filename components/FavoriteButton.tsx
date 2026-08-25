'use client';
import { useEffect, useState } from 'react';
import { isFavorite, toggleFavorite } from '../lib/listingService';
import { useAuth } from '../lib/useAuth';
import { useToast } from './Toast';

export default function FavoriteButton({ petId }: { petId: string }) {
  const { user } = useAuth();
  const showToast = useToast();
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) isFavorite(petId).then(setActive).catch(() => undefined); }, [petId, user]);
  return <button type="button" disabled={busy} aria-pressed={active} aria-label={active ? 'Хадгалснаас хасах' : 'Зар хадгалах'} onClick={async () => {
    if (!user) { showToast('Зар хадгалахын тулд нэвтэрнэ үү', 'info'); return; }
    setBusy(true);
    try { const added = await toggleFavorite(petId); setActive(added); showToast(added ? 'Зар хадгалагдлаа' : 'Хадгалснаас хаслаа', 'success'); }
    catch { showToast('Хадгалж чадсангүй', 'error'); } finally { setBusy(false); }
  }} className={`min-h-11 min-w-11 cursor-pointer rounded-full border border-[var(--line)] text-[22px] ${active ? 'bg-[var(--eyebrow-bg)] text-[var(--accent)]' : 'bg-[var(--card)] text-[var(--ink)]'}`}>{active ? '♥' : '♡'}</button>;
}
