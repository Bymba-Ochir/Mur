'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../lib/useAuth';
import { useToast } from '../../../components/Toast';
import { useLanguage } from '../../../lib/i18n';
import {
  fetchConversationById,
  fetchMessages,
  sendMessage,
  subscribeToMessages,
  otherParticipant,
} from '../../../lib/chatService';
import { relativeTime } from '../../../lib/relativeTime';
import { getErrorMessage } from '../../../lib/utils';
import type { Conversation, Message } from '../../../lib/types';

export default function MessageThreadClient({ id }: { id: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const showToast = useToast();
  const { t } = useLanguage();

  const [conv, setConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seenIds = useRef(new Set<string>());

  // Анхны ачааллалт
  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;
    async function load() {
      try {
        const [conversation, msgs] = await Promise.all([
          fetchConversationById(id),
          fetchMessages(id),
        ]);
        if (cancelled) return;
        if (!conversation) {
          setError(t('chat_not_found'));
          return;
        }
        setConv(conversation);
        setMessages(msgs);
        msgs.forEach((m) => seenIds.current.add(m.id));
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err) || 'Алдаа');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, user, authLoading, t]);

  // Realtime мессеж хүлээн авах
  useEffect(() => {
    if (!conv) return;

    const unsubscribe = subscribeToMessages(conv.id, (msg) => {
      // Давхардалгүйгээр нэмэх
      if (!seenIds.current.has(msg.id)) {
        seenIds.current.add(msg.id);
        setMessages((prev) => [...prev, msg]);
      }
    });

    return unsubscribe;
  }, [conv]);

  // Шинэ мессеж ирэхэд доод хэсэг рүү скролл хийх
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Мессеж илгээх
  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending || !conv) return;

    setSending(true);
    setInput('');
    try {
      const msg = await sendMessage(conv.id, trimmed);
      // Орон нутгийн cache-д нэмэх (realtime-аас өмнө)
      if (!seenIds.current.has(msg.id)) {
        seenIds.current.add(msg.id);
        setMessages((prev) => [...prev, msg]);
      }
      inputRef.current?.focus();
    } catch (err) {
      setInput(trimmed); // Алдаа гарвал буцаан оруулах
      showToast(getErrorMessage(err) || 'Алдаа', 'error');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (authLoading || loading) {
    return <p className="p-[var(--sp-6)]">{t('detail_loading')}</p>;
  }

  if (!user) {
    router.push('/');
    return null;
  }

  if (error) {
    return (
      <div className="p-[var(--sp-6)] text-center">
        <p className="mb-[var(--sp-3)] text-[var(--alert)]">{error}</p>
        <Button as="link" href="/messages" variant="ghost">{t('chat_list_title')}</Button>
      </div>
    );
  }

  if (!conv) return null;

  const petName = conv.pet ? `${conv.pet.type}${conv.pet.name ? ' — ' + conv.pet.name : ''}` : t('chat_deleted_pet');
  const other = otherParticipant(conv, user.id).split('@')[0];

  return (
    <div className="page-shell page-shell--narrow mx-auto flex h-[calc(100dvh-var(--nav-h)-var(--sp-6)-var(--sp-8)-var(--safe-bottom))] w-full max-w-[640px] flex-col max-[1024px]:h-[calc(100dvh-var(--nav-h)-var(--sp-5)-var(--sp-7)-var(--safe-bottom))] max-sm:h-[calc(100dvh-var(--nav-h)-var(--sp-4)-var(--sp-6)-var(--safe-bottom))] max-[400px]:h-[calc(100dvh-var(--nav-h)-var(--sp-3)-var(--sp-5)-var(--safe-bottom))]">
      {/* Толгой хэсэг */}
      <div className="flex shrink-0 items-center gap-[var(--sp-3)] border-b border-[var(--glass-border)] bg-[var(--glass-bg)] px-[var(--sp-4)] py-[var(--sp-3)] backdrop-blur-[var(--glass-blur)]">
        <Link href="/messages" className="flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center rounded-[var(--r-sm)] text-[var(--primary)] no-underline focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]" aria-label={t('chat_list_title')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/pets/${conv.petId}`} className="flex items-center gap-[var(--sp-2)] text-[var(--primary)] no-underline">
            {conv.pet?.photoURL ? (
              <span className="relative size-8 shrink-0">
                <Image src={conv.pet.photoURL} alt="" fill sizes="32px" className="rounded-[var(--r-sm)] object-cover" />
              </span>
            ) : null}
            <span className="text-sm font-semibold">{petName}</span>
          </Link>
          <span className="text-xs text-[var(--muted)]">{other}</span>
        </div>
      </div>

      {/* Мессежүүд */}
      <div className="flex flex-1 flex-col gap-[var(--sp-2)] overflow-y-auto p-[var(--sp-4)]">
        {messages.length === 0 && (
          <p className="py-[var(--sp-6)] text-center text-[var(--muted)]">{t('chat_none_desc')}</p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.senderId === user.id;
          return (
            <div key={msg.id} className={`max-w-[80%] rounded-[var(--r-lg)] px-[var(--sp-3)] py-[var(--sp-2)] text-sm leading-[1.5] ${isOwn ? 'self-end rounded-br-[var(--r-sm)] bg-[var(--accent)] text-[var(--accent-ink)]' : 'self-start rounded-bl-[var(--r-sm)] border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]'}`}>
              <p className="m-0 whitespace-pre-wrap break-words">{msg.content}</p>
              <span className={`mt-1 block text-right text-[10px] opacity-70 ${isOwn ? 'text-[var(--accent-ink)]' : 'text-[var(--muted)]'}`}>{relativeTime(msg.createdAt)}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Бичих хэсэг */}
      <div className="flex shrink-0 gap-[var(--sp-2)] border-t border-[var(--line)] bg-[var(--card)] px-[var(--sp-4)] pt-[var(--sp-3)] pb-[calc(var(--sp-3)+var(--safe-bottom))]">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat_input_placeholder')}
          maxLength={2000}
          disabled={sending}
          aria-label={t('chat_input_placeholder')}
          className="min-h-11 flex-1 rounded-[var(--r-pill)] border-[1.5px] border-[var(--line)] bg-[var(--bg)] px-3.5 py-2.5 font-[family-name:var(--font-body)] text-sm text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-[var(--accent)] text-[var(--accent-ink)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          aria-label={t('chat_submit')}
        >
          {sending ? (
            <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
            </svg>
          )}
        </button>
      </div>

    </div>
  );
}
