'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/icons';
import { useAuth } from '../../../lib/useAuth';
import { useLanguage } from '../../../lib/i18n';
import { fetchConversationById, fetchMessages, sendMessage, subscribeToMessages, otherParticipant, markConversationRead } from '../../../lib/chatService';
import { getErrorMessage } from '../../../lib/utils';
import type { Conversation, Message, PetType } from '../../../lib/types';

function participantName(email: string) {
  const name = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
  return name || email;
}

function sameCalendarDay(a: string, b: string) {
  const first = new Date(a); const second = new Date(b);
  return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
}

export default function MessageThreadClient({ id }: { id: string }) {
  const { user } = useAuth();
  return <MessageThreadContent key={JSON.stringify([user?.id, id])} id={id} />;
}

function MessageThreadContent({ id }: { id: string }) {
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useLanguage();
  const [conv, setConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState('');
  const [failedMessage, setFailedMessage] = useState('');
  const [nearBottom, setNearBottom] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const seenIds = useRef(new Set<string>());
  const active = useRef(false);
  const sendPending = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  function retryLoad() {
    setLoading(true); setError(null); setReloadKey((value) => value + 1);
  }

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    async function load() {
      try {
        const [conversation, loadedMessages] = await Promise.all([fetchConversationById(id), fetchMessages(id)]);
        if (cancelled) return;
        if (!conversation) { setError(t('chat_not_found')); return; }
        seenIds.current = new Set(loadedMessages.map((message) => message.id));
        setConv(conversation); setMessages(loadedMessages); setError(null);
        void markConversationRead(id).catch(() => undefined);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err) || t('thread_load_error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [id, user, authLoading, reloadKey, t]);

  useEffect(() => {
    if (!conv) return;
    let subscribed = true;
    const unsubscribe = subscribeToMessages(conv.id, (message) => {
      if (!subscribed) return;
      if (!seenIds.current.has(message.id)) {
        seenIds.current.add(message.id);
        setMessages((current) => [...current, message]);
      }
      if (user && message.senderId !== user.id) void markConversationRead(conv.id).catch(() => undefined);
    });
    return () => { subscribed = false; unsubscribe(); };
  }, [conv, user]);

  useEffect(() => {
    const latest = messages.at(-1);
    if (nearBottom || latest?.senderId === user?.id) scrollToBottom(messages.length <= 1 ? 'auto' : 'smooth');
  }, [messages, nearBottom, scrollToBottom, user?.id]);

  async function handleSend(text?: string) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || trimmed.length > 2000 || sendPending.current || !conv || !active.current) return;
    sendPending.current = true;
    setSending(true); setInput(''); setSendError(''); setFailedMessage('');
    try {
      const message = await sendMessage(conv.id, trimmed);
      if (!active.current) return;
      if (!seenIds.current.has(message.id)) {
        seenIds.current.add(message.id);
        setMessages((current) => [...current, message]);
      }
      inputRef.current?.focus();
    } catch (err) {
      if (active.current) { setInput(trimmed); setFailedMessage(trimmed); setSendError(getErrorMessage(err) || t('thread_send_error')); }
    } finally {
      sendPending.current = false;
      if (active.current) setSending(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleSend(); }
  }

  function handleMessageScroll() {
    const node = messagesRef.current;
    if (!node) return;
    setNearBottom(node.scrollHeight - node.scrollTop - node.clientHeight < 96);
  }

  const locale = lang === 'mn' ? 'mn-MN' : 'en-US';
  const formatTime = (value: string) => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  const formatDay = (value: string) => {
    const date = new Date(value); const today = new Date(); const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    if (sameCalendarDay(value, today.toISOString())) return t('thread_today');
    if (sameCalendarDay(value, yesterday.toISOString())) return t('thread_yesterday');
    return new Intl.DateTimeFormat(locale, { year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric', month: 'long', day: 'numeric' }).format(date);
  };
  const petTypeLabel = (type: PetType) => type === 'Нохой' ? t('type_dog') : type === 'Муур' ? t('type_cat') : t('type_other');

  if (authLoading || (user && loading)) return <ThreadSkeleton label={t('detail_loading')} />;
  if (!user) return <div className="page-shell page-shell--narrow"><div className="state-panel"><span className="state-panel__icon"><Icon name="lock" size={28} /></span><h2>{t('thread_login_title')}</h2><p>{t('thread_login_desc')}</p><Button as="link" href="/messages" variant="secondary"><Icon name="arrowLeft" size={17} />{t('thread_back')}</Button></div></div>;
  if (error) return <div className="page-shell page-shell--narrow"><div className="state-panel state-panel--error" role="alert"><span className="state-panel__icon"><Icon name="alert" size={28} /></span><h2>{t('thread_load_error')}</h2><p>{error}</p><div className="thread-error-actions"><Button variant="secondary" onClick={retryLoad}>{t('thread_retry')}</Button><Button as="link" href="/messages" variant="ghost">{t('thread_back')}</Button></div></div><style jsx>{`.thread-error-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:var(--sp-2);margin-top:var(--sp-3)}`}</style></div>;
  if (!conv) return null;

  const petName = conv.pet ? `${petTypeLabel(conv.pet.type)}${conv.pet.name ? ` — ${conv.pet.name}` : ''}` : t('chat_deleted_pet');
  const other = participantName(otherParticipant(conv, user.id));
  const initial = other.charAt(0).toUpperCase();

  return (
    <div className="chat-page page-shell page-shell--narrow">
      <header className="chat-header" aria-label={t('thread_header_label')}>
        <Link href="/messages" className="chat-back" aria-label={t('thread_back')}><Icon name="arrowLeft" size={20} /></Link>
        <span className="participant-avatar" aria-hidden="true">{initial}</span>
        <div className="chat-header-info"><strong className="chat-other">{other}</strong>{conv.pet ? <Link href={`/pets/${conv.petId}`} className="chat-pet-link"><span className="chat-pet-thumb">{conv.pet.photoURL ? <Image src={conv.pet.photoURL} alt="" fill sizes="36px" className="chat-pet-photo" /> : <Icon name="paw" size={18} />}</span><span><small>{t('thread_listing_label')}</small><span className="chat-pet-name">{petName}</span></span></Link> : <span className="removed-listing"><Icon name="info" size={14} />{t('chat_deleted_pet')}</span>}</div>
        {conv.pet?.resolved && <span className="header-status"><Icon name="check" size={13} />{t('messages_resolved')}</span>}
      </header>

      {!conv.pet && <aside className="removed-notice"><Icon name="info" size={17} /><p>{t('thread_removed_notice')}</p></aside>}

      <div className="chat-body">
        <div ref={messagesRef} className="chat-messages" role="log" aria-live="polite" aria-relevant="additions" aria-label={t('thread_messages_label')} onScroll={handleMessageScroll}>
          {messages.length === 0 && <div className="chat-empty"><span aria-hidden="true"><Icon name="message" size={28} /></span><h2>{t('thread_empty_title')}</h2><p>{t('thread_empty_desc')}</p></div>}
          {messages.map((message, index) => {
            const own = message.senderId === user.id;
            const showDay = index === 0 || !sameCalendarDay(messages[index - 1].createdAt, message.createdAt);
            return <div key={message.id} className="message-row">{showDay && <div className="day-divider" role="separator"><span>{formatDay(message.createdAt)}</span></div>}<article className={`bubble ${own ? 'own' : 'other'}`} aria-label={own ? t('thread_sent') : other}><p>{message.content}</p><footer><time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>{own && <span className={message.readAt ? 'read' : ''}><Icon name="check" size={12} />{message.readAt ? t('thread_read') : t('thread_sent')}</span>}</footer></article></div>;
          })}
          <div ref={messagesEndRef} />
        </div>
        {!nearBottom && <button type="button" className="jump-latest" onClick={() => { scrollToBottom(); setNearBottom(true); }}><Icon name="arrowRight" size={16} />{t('thread_new_messages')}</button>}
      </div>

      <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); void handleSend(); }}>
        {sendError && <div className="send-error" role="alert"><Icon name="alert" size={18} /><div><strong>{t('thread_send_error')}</strong><p>{sendError}</p></div>{failedMessage && <Button size="sm" variant="ghost" onClick={() => void handleSend(failedMessage)}>{t('thread_retry_send')}</Button>}</div>}
        <label htmlFor="chat-message" className="composer-label">{t('thread_input_label')}</label>
        <div className="composer-row"><textarea ref={inputRef} id="chat-message" value={input} onChange={(event) => { setInput(event.target.value); if (sendError) setSendError(''); }} onKeyDown={handleKeyDown} placeholder={t('chat_input_placeholder')} maxLength={2000} rows={2} disabled={sending} aria-describedby="chat-input-hint" /><button type="submit" disabled={!input.trim() || sending} className="chat-send-btn" aria-label={sending ? t('chat_sending') : t('chat_submit')} aria-busy={sending}>{sending ? <Icon name="sparkles" size={20} className="spin" /> : <Icon name="arrowRight" size={20} />}</button></div>
        <div className="composer-meta"><span id="chat-input-hint">{t('thread_input_hint')}</span><span>{input.length}/2000</span></div>
        <p className="private-note"><Icon name="shield" size={13} />{t('thread_private_note')}</p>
      </form>

      <style jsx>{`
        .chat-page{display:flex;position:relative;width:100%;max-width:48rem;height:calc(100dvh - var(--nav-h) - var(--sp-6) - var(--safe-bottom));margin:0 auto;overflow:hidden;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl);box-shadow:var(--shadow-md)}.chat-header{display:flex;align-items:center;gap:var(--sp-3);min-height:5rem;padding:var(--sp-3) var(--sp-4);flex:0 0 auto;background:var(--glass-bg);border-bottom:1px solid var(--glass-border);backdrop-filter:var(--glass-blur)}.chat-back{display:flex;align-items:center;justify-content:center;min-width:var(--touch-target);min-height:var(--touch-target);color:var(--primary);background:var(--eyebrow-bg);border-radius:var(--r-md);text-decoration:none}.chat-back:focus-visible,.chat-pet-link:focus-visible,.jump-latest:focus-visible,.chat-send-btn:focus-visible{outline:2px solid var(--border-focus);outline-offset:2px}.participant-avatar{display:flex;align-items:center;justify-content:center;width:2.75rem;height:2.75rem;flex:0 0 auto;color:var(--text-on-accent);background:var(--grad-brand);border-radius:50%;font-weight:800}.chat-header-info{display:flex;min-width:0;flex:1;flex-direction:column;gap:3px}.chat-other{overflow:hidden;color:var(--ink);font-size:var(--text-sm);text-overflow:ellipsis;text-transform:capitalize;white-space:nowrap}.chat-pet-link{display:flex;align-items:center;gap:var(--sp-2);width:max-content;max-width:100%;color:var(--primary);text-decoration:none}.chat-pet-thumb{position:relative;display:flex;align-items:center;justify-content:center;width:2.25rem;height:2.25rem;overflow:hidden;flex:0 0 auto;background:var(--thumb-bg);border-radius:var(--r-sm)}.chat-pet-thumb :global(.chat-pet-photo){object-fit:cover}.chat-pet-link>span:last-child{display:flex;min-width:0;flex-direction:column}.chat-pet-link small{color:var(--muted);font-size:9px}.chat-pet-name{overflow:hidden;font-size:var(--text-xs);font-weight:650;text-overflow:ellipsis;white-space:nowrap}.removed-listing{display:inline-flex;align-items:center;gap:var(--sp-1);color:var(--muted);font-size:var(--text-xs)}.header-status{display:inline-flex;align-items:center;gap:var(--sp-1);padding:5px 8px;color:var(--success);background:var(--success-bg);border-radius:var(--r-pill);font-size:10px;font-weight:800;white-space:nowrap}.removed-notice{display:flex;align-items:flex-start;gap:var(--sp-2);padding:var(--sp-2) var(--sp-4);color:var(--ink);background:color-mix(in srgb,var(--warning) 22%,var(--card));font-size:var(--text-xs)}.removed-notice p{margin:0}.chat-body{position:relative;display:flex;min-height:0;flex:1}.chat-messages{display:flex;width:100%;overflow-y:auto;flex-direction:column;gap:var(--sp-2);padding:var(--sp-5);scrollbar-gutter:stable;background:linear-gradient(180deg,var(--surface-2),var(--bg));overscroll-behavior:contain}.message-row{display:contents}.day-divider{display:flex;align-items:center;gap:var(--sp-3);margin:var(--sp-2) 0;color:var(--muted);font-size:10px}.day-divider::before,.day-divider::after{height:1px;flex:1;background:var(--line);content:''}.day-divider span{padding:4px 8px;background:var(--card);border:1px solid var(--line);border-radius:var(--r-pill);white-space:nowrap}.bubble{width:max-content;max-width:min(82%,34rem);padding:var(--sp-3) var(--sp-4);color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:var(--r-lg);border-bottom-left-radius:var(--r-sm);box-shadow:var(--shadow-xs)}.bubble.own{align-self:flex-end;color:var(--accent-ink);background:var(--accent);border-color:transparent;border-bottom-right-radius:var(--r-sm);border-bottom-left-radius:var(--r-lg)}.bubble.other{align-self:flex-start}.bubble p{margin:0;overflow-wrap:anywhere;font-size:var(--text-sm);line-height:1.65;white-space:pre-wrap}.bubble footer{display:flex;align-items:center;justify-content:flex-end;gap:var(--sp-2);margin-top:var(--sp-1);font-size:9px;opacity:.76}.bubble footer span{display:inline-flex;align-items:center;gap:2px}.bubble.own footer span.read{font-weight:750;opacity:1}.jump-latest{position:absolute;right:50%;bottom:var(--sp-3);display:flex;align-items:center;gap:var(--sp-1);min-height:2.25rem;padding:var(--sp-2) var(--sp-3);color:var(--primary);background:var(--card);border:1px solid var(--line);border-radius:var(--r-pill);box-shadow:var(--shadow-md);font:700 var(--text-xs) var(--font-body);cursor:pointer;transform:translateX(50%)}.jump-latest :global(svg){transform:rotate(90deg)}.chat-empty{margin:auto;padding:var(--sp-6);color:var(--muted);text-align:center}.chat-empty>span{display:flex;align-items:center;justify-content:center;width:4rem;height:4rem;margin:0 auto var(--sp-3);color:var(--primary);background:var(--eyebrow-bg);border-radius:50%}.chat-empty h2{margin:0 0 var(--sp-2);color:var(--ink);font-size:var(--text-lg)}.chat-empty p{max-width:24rem;margin:0;font-size:var(--text-sm);line-height:1.6}.chat-composer{flex:0 0 auto;padding:var(--sp-3) var(--sp-4) calc(var(--sp-3) + var(--safe-bottom));background:var(--card);border-top:1px solid var(--line)}.composer-label{display:block;margin-bottom:var(--sp-1);color:var(--ink);font-size:var(--text-xs);font-weight:700}.composer-row{display:flex;align-items:flex-end;gap:var(--sp-2);padding:var(--sp-2);background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-lg)}.composer-row:focus-within{outline:2px solid var(--border-focus);outline-offset:1px}.composer-row textarea{width:100%;min-height:2.75rem;max-height:8rem;padding:var(--sp-2);color:var(--ink);background:transparent;border:0;outline:0;resize:vertical;font:var(--text-sm) var(--font-body);line-height:1.5}.chat-send-btn{display:flex;align-items:center;justify-content:center;width:var(--touch-target);height:var(--touch-target);flex:0 0 auto;color:var(--accent-ink);background:var(--accent);border:0;border-radius:50%;cursor:pointer;transition:transform var(--dur-fast) var(--ease-out),opacity var(--dur-fast) var(--ease-out)}.chat-send-btn:hover:not(:disabled){transform:translateY(-1px)}.chat-send-btn:disabled{opacity:.48;cursor:not-allowed}.composer-meta{display:flex;justify-content:space-between;gap:var(--sp-3);margin-top:var(--sp-1);color:var(--muted);font-size:9px}.private-note{display:flex;align-items:center;justify-content:center;gap:var(--sp-1);margin:var(--sp-2) 0 0;color:var(--muted);font-size:9px}.send-error{display:flex;align-items:flex-start;gap:var(--sp-2);margin-bottom:var(--sp-2);padding:var(--sp-3);color:var(--alert);background:var(--alert-bg);border-radius:var(--r-md)}.send-error>div{min-width:0;flex:1}.send-error strong,.send-error p{display:block;margin:0}.send-error p{margin-top:2px;font-size:var(--text-xs)}.spin{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:700px){.chat-page{height:calc(100dvh - var(--nav-h) - var(--sp-4) - var(--safe-bottom));border-right:0;border-left:0;border-radius:0}.chat-header{min-height:4.5rem;padding:var(--sp-2) var(--sp-3)}.participant-avatar{width:2.5rem;height:2.5rem}.chat-messages{padding:var(--sp-4)}.bubble{max-width:90%;padding:var(--sp-3)}.chat-composer{padding:var(--sp-3) var(--sp-3) calc(var(--sp-3) + var(--safe-bottom))}.header-status{font-size:0}.header-status :global(svg){width:15px;height:15px}}@media(max-width:430px){.participant-avatar{display:none}.chat-pet-thumb{display:none}.composer-meta>span:first-child{max-width:75%}.private-note{display:none}.send-error{align-items:stretch;flex-direction:column}.send-error :global(.btn-base){width:100%}}@media(prefers-reduced-motion:reduce){.chat-send-btn{transition:none}.spin{animation:none}.jump-latest{scroll-behavior:auto}}
      `}</style>
    </div>
  );
}

function ThreadSkeleton({ label }: { label: string }) {
  return <div className="thread-skeleton page-shell page-shell--narrow" aria-busy="true" aria-label={label}><span className="sr-only">{label}</span><div className="skeleton-header"><span /><div><span /><span /></div></div><div className="skeleton-messages"><span className="other" /><span className="own" /><span className="other short" /><span className="own short" /></div><div className="skeleton-composer" /><style jsx>{`.thread-skeleton{display:flex;height:calc(100dvh - var(--nav-h) - var(--sp-6) - var(--safe-bottom));overflow:hidden;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl)}.skeleton-header{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-4);border-bottom:1px solid var(--line)}.skeleton-header>span{width:2.75rem;height:2.75rem;background:var(--surface-3);border-radius:50%}.skeleton-header>div{display:flex;width:45%;flex-direction:column;gap:var(--sp-2)}.skeleton-header>div span{height:10px;background:var(--surface-3);border-radius:var(--r-pill)}.skeleton-header>div span:last-child{width:70%}.skeleton-messages{display:flex;flex:1;flex-direction:column;gap:var(--sp-4);padding:var(--sp-5);background:var(--surface-2)}.skeleton-messages span{width:56%;height:4rem;background:var(--surface-3);border-radius:var(--r-lg)}.skeleton-messages .own{align-self:flex-end}.skeleton-messages .short{width:38%;height:3rem}.skeleton-composer{height:7rem;margin:var(--sp-3);background:var(--surface-3);border-radius:var(--r-lg)}@media(max-width:700px){.thread-skeleton{height:calc(100dvh - var(--nav-h) - var(--sp-4) - var(--safe-bottom));border-right:0;border-left:0;border-radius:0}.skeleton-messages{padding:var(--sp-4)}}`}</style></div>;
}
