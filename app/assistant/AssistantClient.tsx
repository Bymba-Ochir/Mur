'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../lib/i18n';
import { getAssistantReply, SUGGESTED_QUESTIONS } from '../../lib/assistant/engine';
import { relativeTime } from '../../lib/relativeTime';
import type { AssistantSource } from '../../lib/assistant/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  severity?: 'info' | 'caution' | 'emergency';
  timestamp: Date;
  sources?: AssistantSource[];
  confidence?: 'high' | 'medium' | 'low';
}

export default function AssistantClient({ embedded = false }: { embedded?: boolean }) {
  const { t, lang } = useLanguage();
  const greetingText = t('assistant_greeting');
  const [messages, setMessages] = useState<Message[]>(() => [{
    id: 'greeting',
    role: 'assistant',
    text: greetingText,
    severity: 'info',
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [petType, setPetType] = useState<'Нохой' | 'Муур' | ''>('');
  const [petTypeOpen, setPetTypeOpen] = useState(false);
  const [petAge, setPetAge] = useState('');
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const petTypeRef = useRef<HTMLDivElement>(null);
  const msgIdRef = useRef(0);

  // Шинэ мессеж ирэхэд доод хэсэг рүү скролл
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    function closePetType(event: PointerEvent) {
      if (!petTypeRef.current?.contains(event.target as Node)) setPetTypeOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setPetTypeOpen(false);
    }
    document.addEventListener('pointerdown', closePetType);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closePetType);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  async function handleSend(text?: string) {
    const msg = text || input.trim();
    if (!msg || thinking) return;

    // Хэрэглэгчийн мессеж
    msgIdRef.current += 1;
    const userMsg: Message = {
      id: `user-${msgIdRef.current}`,
      role: 'user',
      text: msg,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    try {
      const reply = await getAssistantReply(msg, lang, { type: petType, age: petAge.trim() });
      msgIdRef.current += 1;
      const botMsg: Message = {
        id: `bot-${msgIdRef.current}`,
        role: 'assistant',
        text: reply.text,
        severity: reply.severity,
        timestamp: new Date(),
        sources: reply.sources,
        confidence: reply.confidence,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      msgIdRef.current += 1;
      setMessages((prev) => [...prev, {
        id: `bot-${msgIdRef.current}`,
        role: 'assistant',
        text: t('assistant_fallback'),
        severity: 'info',
        timestamp: new Date(),
      }]);
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleChipClick(question: string) {
    handleSend(question);
  }

  return (
    <div className={`mx-auto flex w-full max-w-[640px] flex-col ${embedded ? 'm-0 h-[min(72vh,720px)] max-w-none rounded-[var(--r-lg)] max-sm:h-[calc(100dvh-220px)] max-sm:min-h-[520px] max-sm:rounded-[var(--r-md)]' : 'page-shell page-shell--narrow h-[calc(100dvh-var(--nav-h)-var(--sp-6)-var(--sp-8)-var(--safe-bottom))] max-[1024px]:h-[calc(100dvh-var(--nav-h)-var(--sp-5)-var(--sp-7)-var(--safe-bottom))] max-sm:h-[calc(100dvh-var(--nav-h)-var(--sp-4)-var(--sp-6)-var(--safe-bottom))] max-[400px]:h-[calc(100dvh-var(--nav-h)-var(--sp-3)-var(--sp-5)-var(--safe-bottom))]'}`}>
      {/* Толгой */}
      {!embedded && <div className="flex shrink-0 items-center gap-[var(--sp-3)] border-b border-[var(--glass-border)] bg-[var(--glass-bg)] px-[var(--sp-4)] py-[var(--sp-3)] backdrop-blur-[var(--glass-blur)]">
        <Link href="/" className="flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center rounded-[var(--r-sm)] text-[var(--primary)] no-underline focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]" aria-label={t('assistant_back')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--primary)]">{t('assistant_title')}</h1>
          <p className="text-xs text-[var(--muted)]">{t('assistant_desc')}</p>
        </div>
      </div>}

      {/* Мессежүүд */}
      <div className="flex flex-1 flex-col gap-[var(--sp-3)] overflow-y-auto p-[var(--sp-4)]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex max-w-[85%] gap-[var(--sp-2)] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
            {msg.role === 'assistant' && (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--eyebrow-bg)] text-[var(--primary)]" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 48 48" fill="currentColor" focusable="false">
                  <ellipse cx="24" cy="30" rx="11" ry="9" /><circle cx="10" cy="18" r="5.5" /><circle cx="38" cy="18" r="5.5" /><circle cx="17" cy="8" r="5" /><circle cx="31" cy="8" r="5" />
                </svg>
              </span>
            )}
            <div className={`rounded-[var(--r-lg)] px-[var(--sp-4)] py-[var(--sp-3)] text-sm leading-[1.6] ${msg.role === 'user' ? 'rounded-br-[var(--r-sm)] bg-[var(--accent)] text-[var(--accent-ink)]' : 'rounded-bl-[var(--r-sm)] border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]'} ${msg.severity === 'emergency' ? 'border-l-[3px] border-l-[var(--alert)]' : msg.severity === 'caution' ? 'border-l-[3px] border-l-[var(--accent)]' : ''}`}>
              <p className="m-0 whitespace-pre-wrap break-words">{msg.text}</p>
              {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 flex flex-col gap-[3px] border-t border-[var(--line)] pt-2 text-[10.5px] text-[var(--muted)] [&_a]:text-[var(--primary)] [&_a]:underline [&_a]:underline-offset-2">
                  <span>{t('assistant_sources')}</span>
                  {msg.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}
                </div>
              )}
              {msg.role === 'assistant' && msg.id !== 'greeting' && (
                <div className="mt-[7px] flex items-center gap-[5px] text-[10px] text-[var(--muted)]" aria-label={t('assistant_feedback')}>
                  <button className={`cursor-pointer border-0 bg-transparent p-[3px] ${feedback[msg.id] === 'up' ? 'scale-110 opacity-100' : 'opacity-55'}`} onClick={() => setFeedback((prev) => ({ ...prev, [msg.id]: 'up' }))} aria-label={t('assistant_helpful')}>👍</button>
                  <button className={`cursor-pointer border-0 bg-transparent p-[3px] ${feedback[msg.id] === 'down' ? 'scale-110 opacity-100' : 'opacity-55'}`} onClick={() => setFeedback((prev) => ({ ...prev, [msg.id]: 'down' }))} aria-label={t('assistant_not_helpful')}>👎</button>
                  {msg.confidence && <span>{t(`assistant_confidence_${msg.confidence}`)}</span>}
                </div>
              )}
              <span className={`mt-1 block text-right text-[10px] opacity-70 ${msg.role === 'user' ? 'text-[var(--accent-ink)]' : 'text-[var(--muted)]'}`}>{relativeTime(msg.timestamp.toISOString())}</span>
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex max-w-[85%] self-start gap-[var(--sp-2)]">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--eyebrow-bg)] text-[var(--primary)]" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 48 48" fill="currentColor" focusable="false">
                <ellipse cx="24" cy="30" rx="11" ry="9" /><circle cx="10" cy="18" r="5.5" /><circle cx="38" cy="18" r="5.5" /><circle cx="17" cy="8" r="5" /><circle cx="31" cy="8" r="5" />
              </svg>
            </span>
            <div className="rounded-[var(--r-lg)] rounded-bl-[var(--r-sm)] border border-[var(--line)] bg-[var(--card)] px-[var(--sp-4)] py-[var(--sp-3)] text-sm leading-[1.6] text-[var(--ink)]">
              <p className="m-0 whitespace-pre-wrap break-words after:animate-pulse after:content-['...']">{t('assistant_typing')}</p>
            </div>
          </div>
        )}

        {/* Санал болгосон асуултууд */}
        {messages.length <= 1 && !thinking && (
          <div className="flex flex-wrap gap-[var(--sp-2)] py-[var(--sp-2)]">
            {SUGGESTED_QUESTIONS.map((q: string) => (
              <button key={q} className="cursor-pointer rounded-[var(--r-pill)] border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3.5 py-1.5 font-[family-name:var(--font-body)] text-[12.5px] font-medium text-[var(--primary)] transition-all hover:border-[var(--primary)] hover:bg-[var(--eyebrow-bg)]" onClick={() => handleChipClick(q)}>
                {q}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Бичих хэсэг */}
      <div className="shrink-0 border-t border-[var(--line)] bg-[var(--card)] px-[var(--sp-4)] pt-[var(--sp-2)] pb-[calc(var(--sp-3)+var(--safe-bottom))] max-[420px]:px-[var(--sp-3)]">
        <p className="mb-[var(--sp-2)] text-center text-[10px] text-[var(--muted)]">{t('assistant_disclaimer')}</p>
        <div className="relative mb-2 grid grid-cols-2 gap-2 max-[420px]:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
          <div className="relative min-w-0" ref={petTypeRef}>
            <button
              type="button"
              className="flex min-h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--bg)] px-[11px] py-[7px] text-left font-[family-name:inherit] text-xs text-[var(--ink)] focus-visible:border-[var(--primary)] focus-visible:outline-2 focus-visible:outline-[color-mix(in_srgb,var(--primary)_45%,transparent)] [&_svg]:shrink-0 [&_svg]:transition-transform"
              aria-label={t('assistant_pet_type')}
              aria-haspopup="listbox"
              aria-expanded={petTypeOpen}
              onClick={() => setPetTypeOpen((open) => !open)}
            >
              <span>{petType === 'Нохой' ? t('type_dog') : petType === 'Муур' ? t('type_cat') : t('assistant_pet_type')}</span>
              <svg className={petTypeOpen ? 'rotate-180' : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {petTypeOpen && (
              <div className="absolute inset-x-0 bottom-[calc(100%+6px)] z-30 overflow-hidden rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--card)] p-[5px] shadow-[var(--shadow-lg)]" role="listbox" aria-label={t('assistant_pet_type')}>
                {(['', 'Нохой', 'Муур'] as const).map((type) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={petType === type}
                    className={`flex min-h-10 w-full cursor-pointer items-center justify-between rounded-[var(--r-sm)] border-0 px-2.5 py-2 text-left font-[family-name:inherit] text-xs hover:bg-[var(--eyebrow-bg)] hover:text-[var(--primary)] ${petType === type ? 'bg-[var(--eyebrow-bg)] text-[var(--primary)]' : 'bg-transparent text-[var(--ink)]'}`}
                    key={type || 'none'}
                    onClick={() => { setPetType(type); setPetTypeOpen(false); }}
                  >
                    <span>{type === 'Нохой' ? t('type_dog') : type === 'Муур' ? t('type_cat') : t('assistant_pet_type')}</span>
                    {petType === type && <span aria-hidden="true">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex min-h-10 min-w-0 items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--bg)] px-[11px] py-[7px] text-xs text-[var(--ink)] focus-within:border-[var(--primary)] focus-within:outline-2 focus-within:outline-[color-mix(in_srgb,var(--primary)_45%,transparent)] [&_input]:min-w-0 [&_input]:w-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:font-[family-name:inherit] [&_input]:text-xs [&_input]:text-[var(--ink)] [&_input]:outline-0 [&>span]:shrink-0 [&>span]:text-[11px] [&>span]:text-[var(--muted)]">
            <input
              type="number"
              min="0"
              max="40"
              step="0.1"
              inputMode="decimal"
              value={petAge}
              onChange={(e) => setPetAge(e.target.value)}
              placeholder={t('assistant_pet_age')}
              aria-label={t('assistant_pet_age')}
            />
            <span>{t('assistant_age_unit')}</span>
          </div>
        </div>
        <p className="mx-0.5 mt-0 mb-2 text-[11px] leading-[1.45] text-[var(--muted)]">Амьтны төрөл, насыг зөв оруулбал зөвлөгөө илүү тохиромжтой болно. Насны нэгжийг талбарын баруун талаас шалгана уу.</p>
        <div className="flex gap-[var(--sp-2)]">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('assistant_input_placeholder')}
            disabled={thinking}
            aria-label={t('assistant_input_placeholder')}
            className="min-h-11 flex-1 rounded-[var(--r-pill)] border-[1.5px] border-[var(--line)] bg-[var(--bg)] px-3.5 py-2.5 font-[family-name:var(--font-body)] text-sm text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || thinking}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-[var(--accent)] text-[var(--accent-ink)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            aria-label={t('assistant_send')}
          >
            {thinking ? (
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
    </div>
  );
}
