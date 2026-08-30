'use client';
import { useEffect, useState } from 'react';
import { isFavorite, toggleFavorite } from '../lib/listingService';
import { useAuth } from '../lib/useAuth';
import { useToast } from './Toast';
import Icon from './ui/icons';
import { useLanguage } from '../lib/i18n';

export default function FavoriteButton({ petId }: { petId: string }) {
  const { user } = useAuth(); const { t } = useLanguage(); const showToast = useToast(); const [active, setActive] = useState(false); const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!user) return;
    let current = true;
    void isFavorite(petId).then((value) => { if (current) setActive(value); }).catch(() => undefined);
    return () => { current = false; };
  }, [petId, user]);
  async function toggle() { if (!user) { showToast(t('favorite_login'), 'info'); return; } setBusy(true); try { const added = await toggleFavorite(petId); setActive(added); showToast(added ? t('favorite_added') : t('favorite_removed'), 'success'); } catch { showToast(t('favorite_error'), 'error'); } finally { setBusy(false); } }
  const visibleActive = Boolean(user && active);
  return <button type="button" disabled={busy} aria-busy={busy} aria-pressed={visibleActive} aria-label={visibleActive ? t('favorite_remove') : t('favorite_save')} onClick={() => void toggle()} className={`favorite-button${visibleActive ? ' active' : ''}`}><Icon name="heart" size={18} aria-hidden="true" /><span>{visibleActive ? t('favorite_saved') : t('favorite_save')}</span><style jsx>{`.favorite-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:var(--touch-target);padding:8px 13px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--card);color:var(--ink);font:650 13px var(--font-body);cursor:pointer;transition:background var(--dur-fast) ease,color var(--dur-fast) ease,border-color var(--dur-fast) ease}.favorite-button:hover{border-color:var(--primary-light);background:var(--eyebrow-bg)}.favorite-button.active{color:var(--accent);background:var(--eyebrow-bg);border-color:color-mix(in srgb,var(--accent) 35%,var(--line))}.favorite-button:disabled{opacity:.6;cursor:not-allowed}.favorite-button:focus-visible{outline:2px solid var(--border-focus);outline-offset:2px}`}</style></button>;
}
