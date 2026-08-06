'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
    return <p style={{ padding: 'var(--sp-6)' }}>{t('detail_loading')}</p>;
  }

  if (!user) {
    router.push('/');
    return null;
  }

  if (error) {
    return (
      <div style={{ padding: 'var(--sp-6)', textAlign: 'center' }}>
        <p style={{ color: 'var(--alert)', marginBottom: 'var(--sp-3)' }}>{error}</p>
        <Link href="/messages" className="btn btn-ghost">{t('chat_list_title')}</Link>
      </div>
    );
  }

  if (!conv) return null;

  const petName = conv.pet ? `${conv.pet.type}${conv.pet.name ? ' — ' + conv.pet.name : ''}` : t('chat_deleted_pet');
  const other = otherParticipant(conv, user.id).split('@')[0];

  return (
    <div className="chat-page">
      {/* Толгой хэсэг */}
      <div className="chat-header">
        <Link href="/messages" className="chat-back" aria-label={t('chat_list_title')}>
          ←
        </Link>
        <div className="chat-header-info">
          <Link href={`/pets/${conv.petId}`} className="chat-pet-link">
            {conv.pet?.photoURL ? (
              <span className="chat-pet-thumb">
                <Image src={conv.pet.photoURL} alt="" fill sizes="32px" style={{ objectFit: 'cover', borderRadius: 'var(--r-sm)' }} />
              </span>
            ) : null}
            <span className="chat-pet-name">{petName}</span>
          </Link>
          <span className="chat-other">{other}</span>
        </div>
      </div>

      {/* Мессежүүд */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-empty">{t('chat_none_desc')}</p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.senderId === user.id;
          return (
            <div key={msg.id} className={`bubble ${isOwn ? 'own' : 'other'}`}>
              <p className="bubble-text">{msg.content}</p>
              <span className="bubble-time">{relativeTime(msg.createdAt)}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Бичих хэсэг */}
      <div className="chat-composer">
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
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="chat-send-btn"
          aria-label={t('chat_submit')}
        >
          {sending ? '⏳' : '➤'}
        </button>
      </div>

      <style jsx>{`
        .chat-page {
          display: flex; flex-direction: column;
          height: calc(100dvh - 60px);
          max-width: 640px; margin: 0 auto; width: 100%;
        }
        @media (min-width: 769px) {
          .chat-page { height: calc(100dvh - 70px); }
        }
        .chat-header {
          display: flex; align-items: center; gap: var(--sp-3);
          padding: var(--sp-3) var(--sp-4);
          background: var(--glass-bg); -webkit-backdrop-filter: var(--glass-blur);
          backdrop-filter: var(--glass-blur); border-bottom: 1px solid var(--glass-border);
          flex-shrink: 0;
        }
        .chat-back {
          font-size: 20px; color: var(--primary); text-decoration: none;
          min-width: 36px; min-height: 36px; display: flex; align-items: center; justify-content: center;
        }
        .chat-header-info { flex: 1; min-width: 0; }
        .chat-pet-link {
          display: flex; align-items: center; gap: var(--sp-2);
          text-decoration: none; color: var(--primary);
        }
        .chat-pet-thumb { width: 32px; height: 32px; position: relative; flex-shrink: 0; }
        .chat-pet-name { font-weight: 600; font-size: 14px; }
        .chat-other { font-size: 12px; color: var(--muted); }

        .chat-messages {
          flex: 1; overflow-y: auto; padding: var(--sp-4);
          display: flex; flex-direction: column; gap: var(--sp-2);
        }
        .chat-empty { text-align: center; color: var(--muted); padding: var(--sp-6) 0; }

        .bubble {
          max-width: 80%; padding: var(--sp-2) var(--sp-3);
          border-radius: var(--r-lg); font-size: 14px; line-height: 1.5;
        }
        .bubble.own {
          align-self: flex-end;
          background: var(--accent); color: #fff;
          border-bottom-right-radius: var(--r-sm);
        }
        .bubble.other {
          align-self: flex-start;
          background: var(--card); border: 1px solid var(--line); color: var(--ink);
          border-bottom-left-radius: var(--r-sm);
        }
        .bubble-text { margin: 0; white-space: pre-wrap; word-break: break-word; }
        .bubble-time {
          display: block; font-size: 10px; margin-top: 4px;
          opacity: 0.7; text-align: right;
        }
        .bubble.own .bubble-time { color: rgba(255,255,255,0.8); }
        .bubble.other .bubble-time { color: var(--muted); }

        .chat-composer {
          display: flex; gap: var(--sp-2); padding: var(--sp-3) var(--sp-4);
          border-top: 1px solid var(--line); background: var(--card); flex-shrink: 0;
          padding-bottom: calc(var(--sp-3) + var(--safe-bottom));
        }
        .chat-composer input {
          flex: 1; padding: 10px 14px; border: 1.5px solid var(--line);
          border-radius: var(--r-pill); font-size: 14px; font-family: var(--font-body);
          background: var(--bg); color: var(--ink); min-height: 44px;
        }
        .chat-composer input:focus { outline: none; border-color: var(--accent); }
        .chat-send-btn {
          width: 44px; height: 44px; border-radius: 50%; border: none;
          background: var(--accent); color: #fff; font-size: 18px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: transform 0.15s ease;
        }
        .chat-send-btn:hover { transform: scale(1.05); }
        .chat-send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      `}</style>
    </div>
  );
}
