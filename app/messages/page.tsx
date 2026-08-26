'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../lib/useAuth';
import { useLanguage } from '../../lib/i18n';
import { fetchConversationList } from '../../lib/chatService';
import { relativeTime } from '../../lib/relativeTime';
import type { ConversationPreview } from '../../lib/types';
import AssistantClient from '../assistant/AssistantClient';
import LoadError from '../../components/LoadError';
import { PawPrint } from 'lucide-react';

type HubTab = 'messages' | 'assistant';

function subscribeToHistory(callback: () => void) {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

function getTabFromUrl(): HubTab {
  return new URLSearchParams(window.location.search).get('tab') === 'assistant' ? 'assistant' : 'messages';
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const tab = useSyncExternalStore(subscribeToHistory, getTabFromUrl, () => 'messages');

  function selectTab(next: HubTab) {
    const url = next === 'assistant' ? '/messages?tab=assistant' : '/messages';
    window.history.replaceState(null, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;
    async function load() {
      setLoadError(false);
      try {
        const data = await fetchConversationList();
        if (!cancelled) setConversations(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { cancelled = true; window.removeEventListener('focus', onFocus); };
  }, [user, authLoading, reloadKey]);

  return (
    <div className="page-shell page-shell--narrow">
      <div className="page-header">
        <div className="eyebrow">{t('messages_hub_nav')}</div>
        <h1>{tab === 'messages' ? t('chat_list_title') : t('assistant_title')}</h1>
        <p>{tab === 'messages' ? t('chat_list_desc') : t('assistant_desc')}</p>
      </div>

      <div className="mb-[var(--sp-4)] grid grid-cols-2 gap-1 rounded-[var(--r-pill)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-1" role="tablist" aria-label={t('messages_hub_nav')}>
        <button role="tab" aria-selected={tab === 'messages'} className={`min-h-11 cursor-pointer rounded-[var(--r-pill)] border-0 px-4 py-[9px] font-[family-name:var(--font-body)] text-[13px] font-semibold max-[480px]:px-2 max-[480px]:text-[12.5px] ${tab === 'messages' ? 'bg-[var(--surface-3)] text-[var(--primary)] shadow-[var(--shadow-xs)]' : 'bg-transparent text-[var(--text-secondary)]'}`} onClick={() => selectTab('messages')}>{t('messages_tab_chat')}</button>
        <button role="tab" aria-selected={tab === 'assistant'} className={`min-h-11 cursor-pointer rounded-[var(--r-pill)] border-0 px-4 py-[9px] font-[family-name:var(--font-body)] text-[13px] font-semibold max-[480px]:px-2 max-[480px]:text-[12.5px] ${tab === 'assistant' ? 'bg-[var(--surface-3)] text-[var(--primary)] shadow-[var(--shadow-xs)]' : 'bg-transparent text-[var(--text-secondary)]'}`} onClick={() => selectTab('assistant')}>{t('messages_tab_assistant')}</button>
      </div>

      {tab === 'assistant' ? <AssistantClient embedded /> : authLoading ? (
        <div className="rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-[var(--sp-6)] text-center text-[var(--muted)]">{t('detail_loading')}</div>
      ) : !user ? (
        <div className="rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-[var(--sp-6)] text-center text-[var(--muted)]">{t('chat_login_required')}</div>
      ) : loading ? (
        <div className="rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-[var(--sp-6)] text-center text-[var(--muted)]">{t('detail_loading')}</div>
      ) : loadError ? (
        <LoadError onRetry={() => { setLoading(true); setReloadKey((key) => key + 1); }} />
      ) : conversations.length === 0 ? (
        <div className="py-[var(--sp-6)] text-center">
          <p className="mb-2 text-lg font-semibold text-[var(--primary)]">
            {t('chat_none')}
          </p>
          <p className="text-[var(--muted)]">{t('chat_none_desc')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-[var(--sp-2)]">
          {conversations.map((conv) => {
            const otherEmail = conv.initiatorId === user.id ? conv.ownerEmail : conv.initiatorEmail;
            const otherName = otherEmail.split('@')[0];
            return (
              <Link key={conv.id} href={`/messages/${conv.id}`} className="flex items-center gap-[var(--sp-3)] rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-[var(--sp-4)] py-[var(--sp-3)] text-[var(--text-primary)] no-underline shadow-[var(--shadow-xs)] transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-[var(--primary-light)] hover:shadow-[var(--shadow-md)] max-[480px]:rounded-[var(--r-md)] max-[480px]:p-[var(--sp-3)]">
                <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--r-md)] bg-[var(--thumb-bg)]">
                  {conv.pet?.photoURL ? (
                    <Image src={conv.pet.photoURL} alt="" fill sizes="48px" className="rounded-[var(--r-md)] object-cover" />
                  ) : (
                    <PawPrint size={22} aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-[var(--sp-2)]">
                    <span className="text-sm font-semibold">{otherName}</span>
                    {conv.lastMessage && (
                      <span className="whitespace-nowrap text-[11px] text-[var(--text-tertiary)]">{relativeTime(conv.lastMessage.createdAt)}</span>
                    )}
                  </div>
                  <p className="my-0.5 text-xs text-[var(--primary)]">
                    {conv.pet ? `${conv.pet.type}${conv.pet.name ? ' — ' + conv.pet.name : ''}` : t('chat_deleted_pet')}
                  </p>
                  {conv.lastMessage && (
                    <p className="my-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-[var(--text-secondary)]">{conv.lastMessage.content}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
}
