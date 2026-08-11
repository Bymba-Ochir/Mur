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
  }} style={{ minWidth: 44, minHeight: 44, borderRadius: 999, border: '1px solid var(--line)', background: active ? 'var(--eyebrow-bg)' : 'var(--card)', color: active ? 'var(--accent)' : 'var(--ink)', fontSize: 22, cursor: 'pointer' }}>{active ? '♥' : '♡'}</button>;
}
