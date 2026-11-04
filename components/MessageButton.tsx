'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/useAuth';
import { useLanguage } from '../lib/i18n';
import { findOrCreateListingConversation } from '../lib/chatService';
import type { ContactListing } from '../lib/listingContact';
import LoginModal from './LoginModal';
import { useToast } from './Toast';
import { getErrorMessage } from '../lib/utils';
import type { Pet } from '../lib/types';
import Icon from './ui/icons';

/**
 * Амьтны дэлгэрэнгүй хуудаснаас эзэнтэй холбогдох товч.
 * Зөвхөн бусад хэрэглэгчдэд харагдана (эзэн болон нэвтэрээгүй бол нуугдана).
 */
export default function MessageButton(props: { pet: Pick<Pet, 'id' | 'createdBy'> } | { listing: ContactListing }) {
  const listing: ContactListing = 'listing' in props ? props.listing : { kind: 'pet', id: props.pet.id, ownerId: props.pet.createdBy };
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const showToast = useToast();
  const [busy, setBusy] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Эзэн өөрийнхөө амьтанд — нуух
  if (user && listing.ownerId && user.id === listing.ownerId) return null;
  // Амьтны эзэн байхгүй бол — нуух
  if (!listing.ownerId) return null;

  async function handleClick() {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setBusy(true);
    try {
      const convId = await findOrCreateListingConversation(listing.kind, listing.id);
      router.push(`/messages/${convId}`);
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg?.includes('Өөрийнхөө')) {
        showToast(t('chat_cannot_message'), 'error');
      } else {
        showToast(msg || t('err_title'), 'error');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className="chat-btn"
        onClick={handleClick}
        disabled={busy}
        aria-busy={busy}
      >
        <Icon name="message" size={17} aria-hidden="true" /> {busy ? t('chat_starting') : t('chat_send_btn')}
      </button>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      <style jsx>{`
        .chat-btn {
          width: 100%;
          padding: 12px;
          border: 1.5px solid var(--primary);
          border-radius: var(--r-md);
          background: transparent;
          color: var(--primary);
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
          min-height: var(--touch-target); display:inline-flex; align-items:center; justify-content:center; gap:var(--sp-2);
        }
        .chat-btn:hover:not(:disabled) {
          background: var(--primary);
          color: #fff;
        }
        .chat-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .chat-btn:focus-visible {
          outline: 2.5px solid var(--accent); outline-offset: 2px;
        }
      `}</style>
    </>
  );
}
