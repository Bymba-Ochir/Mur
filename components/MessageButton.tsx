'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/useAuth';
import { useLanguage } from '../lib/i18n';
import { findOrCreateConversation } from '../lib/chatService';
import LoginModal from './LoginModal';
import { useToast } from './Toast';
import { getErrorMessage } from '../lib/utils';
import type { Pet } from '../lib/types';

/**
 * Амьтны дэлгэрэнгүй хуудаснаас эзэнтэй холбогдох товч.
 * Зөвхөн бусад хэрэглэгчдэд харагдана (эзэн болон нэвтэрээгүй бол нуугдана).
 */
export default function MessageButton({ pet }: { pet: Pet }) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const showToast = useToast();
  const [busy, setBusy] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Эзэн өөрийнхөө амьтанд — нуух
  if (user && pet.createdBy && user.id === pet.createdBy) return null;
  // Амьтны эзэн байхгүй бол — нуух
  if (!pet.createdBy) return null;

  async function handleClick() {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setBusy(true);
    try {
      const convId = await findOrCreateConversation(pet.id);
      router.push(`/messages/${convId}`);
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg?.includes('Өөрийнхөө')) {
        showToast(t('chat_cannot_message'), 'error');
      } else {
        showToast(msg || 'Алдаа', 'error');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className="min-h-[var(--touch-target)] w-full cursor-pointer rounded-[var(--r-md)] border-[1.5px] border-[var(--primary)] bg-transparent p-3 font-[family-name:var(--font-body)] text-sm font-semibold text-[var(--primary)] transition-colors duration-150 hover:not-disabled:bg-[var(--primary)] hover:not-disabled:text-white focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
        onClick={handleClick}
        disabled={busy}
      >
        {busy ? t('chat_starting') : t('chat_send_btn')}
      </button>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
