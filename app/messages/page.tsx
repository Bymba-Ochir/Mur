'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../lib/useAuth';
import { useLanguage } from '../../lib/i18n';
import { fetchConversationList } from '../../lib/chatService';
import { relativeTime } from '../../lib/relativeTime';
import type { ConversationPreview, PetType } from '../../lib/types';
import AssistantClient from '../assistant/AssistantClient';
import { getErrorMessage } from '../../lib/utils';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/icons';
import EmptyState from '../../components/ui/EmptyState';
import LoginModal from '../../components/LoginModal';

type HubTab = 'messages' | 'assistant';

function subscribeToHistory(callback: () => void) {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

function getTabFromUrl(): HubTab {
  return new URLSearchParams(window.location.search).get('tab') === 'assistant' ? 'assistant' : 'messages';
}


export default function MessagesPage() {
  const { user } = useAuth();
  return <MessagesContent key={user?.id ?? 'guest'} />;
}

function MessagesContent() {
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useLanguage();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const tab = useSyncExternalStore(subscribeToHistory, getTabFromUrl, () => 'messages');

  function selectTab(next: HubTab) {
    window.history.replaceState(null, '', next === 'assistant' ? '/messages?tab=assistant' : '/messages');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  function retryLoad() {
    setLoading(true);
    setError('');
    setReloadKey((value) => value + 1);
  }

  useEffect(() => {
    if (authLoading || !user?.id) return;
    let cancelled = false;
    let requestVersion = 0;
    async function load() {
      const version = ++requestVersion;
      try {
        const data = await fetchConversationList();
        if (!cancelled && version === requestVersion) { setConversations(data); setError(''); }
      } catch (err) {
        if (!cancelled && version === requestVersion) setError(getErrorMessage(err));
      } finally {
        if (!cancelled && version === requestVersion) setLoading(false);
      }
    }
    void load();
    const onFocus = () => { void load(); };
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);
    return () => { cancelled = true; window.removeEventListener('focus', onFocus); window.removeEventListener('online', onFocus); };
  }, [user?.id, authLoading, reloadKey]);

  const unreadTotal = conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);
  const petTypeLabel = (type: PetType) => type === 'Нохой' ? t('type_dog') : type === 'Муур' ? t('type_cat') : t('type_other');

  return (
    <div className="messages-page page-shell page-shell--narrow">
      <header className="page-header messages-heading">
        <div className="eyebrow">{t('messages_hub_nav')}</div>
        <h1>{tab === 'messages' ? t('chat_list_title') : t('assistant_title')}</h1>
        <p>{tab === 'messages' ? t('chat_list_desc') : t('assistant_desc')}</p>
      </header>

      <nav className="hub-tabs" role="tablist" aria-label={t('messages_hub_nav')} onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 'messages' : event.key === 'End' ? 'assistant' : tab === 'messages' ? 'assistant' : 'messages';
        selectTab(next); document.getElementById(`${next}-tab`)?.focus();
      }}>
        <button id="messages-tab" type="button" role="tab" aria-selected={tab === 'messages'} aria-controls="messages-panel" tabIndex={tab === 'messages' ? 0 : -1} className={tab === 'messages' ? 'active' : ''} onClick={() => selectTab('messages')}><Icon name="message" size={17} />{t('messages_tab_chat')}</button>
        <button id="assistant-tab" type="button" role="tab" aria-selected={tab === 'assistant'} aria-controls="assistant-panel" tabIndex={tab === 'assistant' ? 0 : -1} className={tab === 'assistant' ? 'active' : ''} onClick={() => selectTab('assistant')}><Icon name="bot" size={17} />{t('messages_tab_assistant')}</button>
      </nav>

      {tab === 'assistant' ? (
        <section id="assistant-panel" role="tabpanel" aria-labelledby="assistant-tab"><AssistantClient embedded /></section>
      ) : (
        <section id="messages-panel" role="tabpanel" aria-labelledby="messages-tab" className="messages-panel">
          {!authLoading && user && !loading && !error && conversations.length > 0 && (
            <div className="messages-summary" aria-live="polite"><span className="summary-icon" aria-hidden="true"><Icon name="message" size={20} /></span><div><strong>{t('messages_summary')}</strong><p>{unreadTotal > 0 ? `${unreadTotal} ${t('messages_unread')}` : t('messages_all_read')}</p></div><span className={`summary-dot${unreadTotal > 0 ? ' active' : ''}`} aria-hidden="true" /></div>
          )}

          {authLoading ? <ConversationSkeleton label={t('messages_loading')} /> : !user ? (
            <div className="state-panel private-state"><span className="state-panel__icon"><Icon name="lock" size={28} /></span><h2>{t('chat_login_required')}</h2><p>{t('messages_private_desc')}</p><div className="state-actions"><Button variant="primary" onClick={() => setShowLogin(true)}><Icon name="lock" size={17} />{t('messages_login_action')}</Button><Button as="link" href="/listings" variant="ghost">{t('messages_browse_action')}</Button></div></div>
          ) : loading ? <ConversationSkeleton label={t('messages_loading')} /> : error ? (
            <div className="state-panel state-panel--error" role="alert"><span className="state-panel__icon"><Icon name="alert" size={28} /></span><h2>{t('messages_load_error')}</h2><p>{error}</p><Button variant="secondary" onClick={retryLoad}><Icon name="arrowRight" size={17} />{t('messages_retry')}</Button></div>
          ) : conversations.length === 0 ? (
            <EmptyState icon={<Icon name="message" size={30} />} title={t('chat_none')} description={t('chat_none_desc')}><Button as="link" href="/listings" variant="secondary">{t('messages_browse_action')}</Button></EmptyState>
          ) : (
            <div className="conv-list" aria-label={t('chat_list_title')}>
              {conversations.map((conv) => {
                const otherName = conv.initiatorId === user.id ? conv.ownerName : conv.initiatorName;
                const petName = conv.pet ? `${petTypeLabel(conv.pet.type)}${conv.pet.name ? ` — ${conv.pet.name}` : ''}` : t('chat_deleted_pet');
                return (
                  <Link key={conv.id} href={`/messages/${conv.id}`} className={`conv-item${conv.unreadCount ? ' unread' : ''}`} aria-label={`${t('messages_open_label')}: ${otherName}, ${petName}`}>
                    <span className="conv-thumb" aria-hidden="true">{conv.pet?.photoURL ? <Image src={conv.pet.photoURL} alt="" fill sizes="(max-width: 480px) 52px, 60px" className="conv-photo" /> : <span className="conv-thumb-placeholder"><Icon name="paw" size={24} /></span>}</span>
                    <span className="conv-info">
                      <span className="conv-header"><strong className="conv-name">{otherName}</strong>{conv.lastMessage && <time className="conv-time" dateTime={conv.lastMessage.createdAt}>{relativeTime(conv.lastMessage.createdAt, lang)}</time>}</span>
                      <span className="conv-subject"><span>{petName}</span>{conv.pet?.resolved && <span className="resolved-badge"><Icon name="check" size={12} />{t('messages_resolved')}</span>}</span>
                      <span className="conv-bottom"><span className="conv-preview">{conv.lastMessage?.content || t('messages_conversation_started')}</span>{conv.unreadCount > 0 && <span className="unread-count" aria-label={`${conv.unreadCount} ${t('messages_unread_label')}`}>{conv.unreadCount > 99 ? '99+' : conv.unreadCount}</span>}</span>
                    </span>
                    <Icon name="arrowRight" size={18} className="conv-arrow" />
                  </Link>
                );
              })}
            </div>
          )}

          {!authLoading && user && <aside className="privacy-note"><Icon name="shield" size={18} /><div><strong>{t('messages_private_title')}</strong><p>{t('messages_private_desc')}</p></div></aside>}
        </section>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      <style jsx>{`
        .messages-page{width:100%}.messages-heading{margin-bottom:var(--sp-4)}.hub-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:var(--sp-5);padding:4px;background:var(--surface-2);border:1px solid var(--border-subtle);border-radius:var(--r-pill)}.hub-tabs button{display:flex;align-items:center;justify-content:center;gap:var(--sp-2);min-height:var(--touch-target);padding:9px 16px;color:var(--text-secondary);background:transparent;border:0;border-radius:var(--r-pill);font:600 var(--text-sm) var(--font-body);cursor:pointer;transition:background var(--dur-fast) var(--ease-out),color var(--dur-fast) var(--ease-out),box-shadow var(--dur-fast) var(--ease-out)}.hub-tabs button:hover{color:var(--primary);background:var(--eyebrow-bg)}.hub-tabs button.active{color:var(--primary);background:var(--card);box-shadow:var(--shadow-xs)}.hub-tabs button:focus-visible{outline:2px solid var(--border-focus);outline-offset:2px}.messages-panel{display:flex;flex-direction:column;gap:var(--sp-4)}.messages-summary{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) var(--sp-4);background:var(--card);border:1px solid var(--line);border-radius:var(--r-lg)}.summary-icon{display:flex;align-items:center;justify-content:center;width:2.5rem;height:2.5rem;flex:0 0 auto;color:var(--primary);background:var(--eyebrow-bg);border-radius:var(--r-md)}.messages-summary>div{flex:1;min-width:0}.messages-summary strong{color:var(--ink);font-size:var(--text-sm)}.messages-summary p{margin:2px 0 0;color:var(--muted);font-size:var(--text-xs)}.summary-dot{width:9px;height:9px;background:var(--success);border-radius:50%}.summary-dot.active{background:var(--accent)}.state-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:var(--sp-2);margin-top:var(--sp-3)}.conv-list{display:flex;flex-direction:column;gap:var(--sp-2)}.conv-item{display:flex;align-items:center;gap:var(--sp-3);min-height:5.5rem;padding:var(--sp-3) var(--sp-4);color:var(--text-primary);background:var(--card);border:1px solid var(--border-subtle);border-radius:var(--r-lg);box-shadow:var(--shadow-xs);text-decoration:none;transition:transform var(--dur-base) var(--ease-out),box-shadow var(--dur-base) var(--ease-out),border-color var(--dur-base) var(--ease-out),background var(--dur-base) var(--ease-out)}.conv-item:hover{transform:translateY(-2px);border-color:var(--primary-light);box-shadow:var(--shadow-md)}.conv-item:active{transform:translateY(0)}.conv-item:focus-visible{outline:2px solid var(--border-focus);outline-offset:2px}.conv-item.unread{background:color-mix(in srgb,var(--accent) 7%,var(--card));border-color:color-mix(in srgb,var(--accent) 44%,var(--border-subtle))}.conv-thumb{position:relative;display:flex;align-items:center;justify-content:center;width:3.75rem;height:3.75rem;overflow:hidden;flex:0 0 auto;color:var(--primary);background:var(--thumb-bg);border-radius:var(--r-md)}.conv-thumb-placeholder{display:flex}.conv-thumb :global(.conv-photo){object-fit:cover}.conv-info{display:flex;min-width:0;flex:1;flex-direction:column;gap:3px}.conv-header,.conv-bottom,.conv-subject{display:flex;align-items:center;gap:var(--sp-2)}.conv-header{justify-content:space-between}.conv-name{overflow:hidden;color:var(--ink);font-size:var(--text-sm);text-overflow:ellipsis;white-space:nowrap;text-transform:capitalize}.conv-time{flex:0 0 auto;color:var(--text-tertiary);font-size:10px;white-space:nowrap}.conv-subject{color:var(--primary);font-size:var(--text-xs);font-weight:650}.conv-subject>span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.resolved-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 6px;color:var(--success);background:var(--success-bg);border-radius:var(--r-pill);font-size:9px;white-space:nowrap}.conv-bottom{justify-content:space-between}.conv-preview{overflow:hidden;color:var(--text-secondary);font-size:var(--text-sm);text-overflow:ellipsis;white-space:nowrap}.unread-count{display:inline-flex;align-items:center;justify-content:center;min-width:1.35rem;height:1.35rem;padding:0 6px;flex:0 0 auto;color:var(--accent-ink);background:var(--accent);border-radius:var(--r-pill);font-size:10px;font-weight:800}.conv-arrow{flex:0 0 auto;color:var(--muted);transition:transform var(--dur-fast) var(--ease-out),color var(--dur-fast) var(--ease-out)}.conv-item:hover .conv-arrow{color:var(--primary);transform:translateX(2px)}.privacy-note{display:flex;align-items:flex-start;gap:var(--sp-2);padding:var(--sp-3) var(--sp-4);color:var(--primary);background:var(--eyebrow-bg);border-radius:var(--r-md)}.privacy-note>div{min-width:0}.privacy-note strong{display:block;font-size:var(--text-xs)}.privacy-note p{margin:2px 0 0;color:var(--muted);font-size:10px;line-height:1.5}
        @media(max-width:600px){.messages-heading{margin-bottom:var(--sp-3)}.hub-tabs{margin-bottom:var(--sp-4)}.hub-tabs button{padding-inline:8px;font-size:var(--text-xs)}.conv-item{min-height:5rem;padding:var(--sp-3);border-radius:var(--r-md)}.conv-thumb{width:3.25rem;height:3.25rem}.conv-arrow{display:none}.messages-summary{border-radius:var(--r-md)}}@media(max-width:380px){.conv-time{display:none}.resolved-badge{display:none}.privacy-note{padding:var(--sp-3)}}@media(prefers-reduced-motion:reduce){.conv-item,.conv-arrow{transition:none}.conv-item:hover{transform:none}}
      `}</style>
    </div>
  );
}

function ConversationSkeleton({ label }: { label: string }) {
  return <div className="conversation-skeleton" aria-busy="true" aria-label={label}><span className="sr-only">{label}</span>{[0, 1, 2, 3].map((item) => <div key={item}><span className="skeleton-avatar" /><span className="skeleton-copy"><span /><span /><span /></span></div>)}<style jsx>{`.conversation-skeleton{display:flex;flex-direction:column;gap:var(--sp-2)}.conversation-skeleton>div{display:flex;align-items:center;gap:var(--sp-3);min-height:5.5rem;padding:var(--sp-3) var(--sp-4);background:var(--card);border:1px solid var(--line);border-radius:var(--r-lg)}.skeleton-avatar{width:3.75rem;height:3.75rem;flex:0 0 auto;background:var(--surface-3);border-radius:var(--r-md)}.skeleton-copy{display:flex;width:100%;flex-direction:column;gap:var(--sp-2)}.skeleton-copy>span{height:9px;background:var(--surface-3);border-radius:var(--r-pill)}.skeleton-copy>span:first-child{width:38%;height:13px}.skeleton-copy>span:nth-child(2){width:54%}.skeleton-copy>span:last-child{width:78%}@media(max-width:600px){.conversation-skeleton>div{min-height:5rem;padding:var(--sp-3);border-radius:var(--r-md)}.skeleton-avatar{width:3.25rem;height:3.25rem}}`}</style></div>;
}
