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
import { getErrorMessage } from '../../lib/utils';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/icons';
import EmptyState from '../../components/ui/EmptyState';

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
  const [error, setError] = useState('');
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
      try {
        setError('');
        const data = await fetchConversationList();
        if (!cancelled) setConversations(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void Promise.resolve().then(load);

    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { cancelled = true; window.removeEventListener('focus', onFocus); };
  }, [user, authLoading]);

  return (
    <div className="page-shell page-shell--narrow">
      <div className="page-header">
        <div className="eyebrow">{t('messages_hub_nav')}</div>
        <h1>{tab === 'messages' ? t('chat_list_title') : t('assistant_title')}</h1>
        <p>{tab === 'messages' ? t('chat_list_desc') : t('assistant_desc')}</p>
      </div>

      <div className="hub-tabs" role="tablist" aria-label={t('messages_hub_nav')}>
        <button role="tab" aria-selected={tab === 'messages'} className={tab === 'messages' ? 'active' : ''} onClick={() => selectTab('messages')}>{t('messages_tab_chat')}</button>
        <button role="tab" aria-selected={tab === 'assistant'} className={tab === 'assistant' ? 'active' : ''} onClick={() => selectTab('assistant')}>{t('messages_tab_assistant')}</button>
      </div>

      {tab === 'assistant' ? <AssistantClient embedded /> : authLoading ? (
        <div className="state-panel" aria-live="polite"><span className="state-panel__icon"><Icon name="message" size={28} /></span><h2>{t('detail_loading')}</h2></div>
      ) : !user ? (
        <div className="state-panel"><span className="state-panel__icon"><Icon name="lock" size={28} /></span><h2>{t('chat_login_required')}</h2><p>Зурвас зөвхөн таны account-д харагдана.</p></div>
      ) : loading ? (
        <div className="state-panel" aria-live="polite"><span className="state-panel__icon"><Icon name="message" size={28} /></span><h2>{t('detail_loading')}</h2></div>
      ) : error ? (
        <div className="state-panel state-panel--error" role="alert"><span className="state-panel__icon"><Icon name="alert" size={28} /></span><h2>Зурвасуудыг ачаалж чадсангүй</h2><p>{error}</p><Button variant="secondary" onClick={() => window.location.reload()}>Дахин оролдох</Button></div>
      ) : conversations.length === 0 ? (
        <EmptyState icon={<Icon name="message" size={30} />} title={t('chat_none')} description={t('chat_none_desc')} />
      ) : (
        <div className="conv-list">
          {conversations.map((conv) => {
            const otherEmail = conv.initiatorId === user.id ? conv.ownerEmail : conv.initiatorEmail;
            const otherName = otherEmail.split('@')[0];
            return (
              <Link key={conv.id} href={`/messages/${conv.id}`} className={`conv-item${conv.unreadCount ? ' unread' : ''}`}>
                <div className="conv-thumb">
                  {conv.pet?.photoURL ? (
                    <Image src={conv.pet.photoURL} alt="" fill sizes="48px" style={{ objectFit: 'cover', borderRadius: 'var(--r-md)' }} />
                  ) : (
                    <span className="conv-thumb-placeholder"><Icon name="paw" size={22} /></span>
                  )}
                </div>
                <div className="conv-info">
                  <div className="conv-header">
                    <span className="conv-name">{otherName}</span>
                    {conv.unreadCount > 0 && <span className="unread-count" aria-label={`${conv.unreadCount} уншаагүй мессеж`}>{conv.unreadCount > 99 ? '99+' : conv.unreadCount}</span>}
                    {conv.lastMessage && (
                      <span className="conv-time">{relativeTime(conv.lastMessage.createdAt)}</span>
                    )}
                  </div>
                  <p className="conv-pet">
                    {conv.pet ? `${conv.pet.type}${conv.pet.name ? ' — ' + conv.pet.name : ''}` : t('chat_deleted_pet')}
                  </p>
                  {conv.lastMessage && (
                    <p className="conv-preview">{conv.lastMessage.content}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .hub-tabs {
          display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
          margin-bottom: var(--sp-4); padding: 4px; border-radius: var(--r-pill);
          background: var(--surface-2); border: 1px solid var(--border-subtle);
        }
        .hub-tabs button {
          min-height: 44px; padding: 9px 16px; border: 0; border-radius: var(--r-pill);
          background: transparent; color: var(--text-secondary); font: 600 13px var(--font-body); cursor: pointer;
        }
        .hub-tabs button.active { background: var(--surface-3); color: var(--primary); box-shadow: var(--shadow-xs); }
        .hub-state { padding: var(--sp-6); text-align: center; color: var(--muted); background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: var(--r-lg); }
        .conv-list { display: flex; flex-direction: column; gap: var(--sp-2); }
        .conv-item {
          display: flex; align-items: center; gap: var(--sp-3);
          padding: var(--sp-3) var(--sp-4); border-radius: var(--r-lg);
          text-decoration: none; color: var(--text-primary);
          background: var(--surface-2); border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-xs);
          transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
        }
        .conv-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary-light);
        }
        .conv-item.unread { border-color: color-mix(in srgb, var(--accent) 45%, var(--border-subtle)); background: color-mix(in srgb, var(--accent) 6%, var(--surface-2)); }
        .unread-count { min-width: 20px; height: 20px; padding: 0 6px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--r-pill); background: var(--accent); color: var(--accent-ink); font-size: 10px; font-weight: 800; }
        .conv-thumb {
          width: 48px; height: 48px; border-radius: var(--r-md); overflow: hidden;
          background: var(--thumb-bg); position: relative; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .conv-thumb-placeholder { font-size: 20px; }
        .conv-info { flex: 1; min-width: 0; }
        .conv-header { display: flex; justify-content: space-between; align-items: center; gap: var(--sp-2); }
        .conv-name { font-weight: 600; font-size: 14px; }
        .conv-time { font-size: 11px; color: var(--text-tertiary); white-space: nowrap; }
        .conv-pet { font-size: 12px; color: var(--primary); margin: 2px 0; }
        .conv-preview {
          font-size: 13px; color: var(--text-secondary); white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis; margin: 2px 0;
        }
        @media (max-width: 480px) {
          .hub-tabs button { padding-inline: 8px; font-size: 12.5px; }
          .conv-item { padding: var(--sp-3); border-radius: var(--r-md); }
        }
      `}</style>
    </div>
  );
}
