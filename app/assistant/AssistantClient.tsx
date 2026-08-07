'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../lib/i18n';
import { getAssistantReply, SUGGESTED_QUESTIONS } from '../../lib/assistant/engine';
import { relativeTime } from '../../lib/relativeTime';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  severity?: 'info' | 'caution' | 'emergency';
  timestamp: Date;
}

export default function AssistantClient() {
  const { t } = useLanguage();
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgIdRef = useRef(0);

  // Шинэ мессеж ирэхэд доод хэсэг рүү скролл
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      const reply = await getAssistantReply(msg);
      msgIdRef.current += 1;
      const botMsg: Message = {
        id: `bot-${msgIdRef.current}`,
        role: 'assistant',
        text: reply.text,
        severity: reply.severity,
        timestamp: new Date(),
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
    <div className="assistant-page">
      {/* Толгой */}
      <div className="assistant-header">
        <Link href="/" className="back-link" aria-label={t('assistant_back')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="header-info">
          <h1 className="header-title">{t('assistant_title')}</h1>
          <p className="header-desc">{t('assistant_desc')}</p>
        </div>
      </div>

      {/* Мессежүүд */}
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`bubble ${msg.role === 'user' ? 'own' : 'other'}`}>
            {msg.role === 'assistant' && (
              <span className="bot-avatar" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 48 48" fill="currentColor" focusable="false">
                  <ellipse cx="24" cy="30" rx="11" ry="9" /><circle cx="10" cy="18" r="5.5" /><circle cx="38" cy="18" r="5.5" /><circle cx="17" cy="8" r="5" /><circle cx="31" cy="8" r="5" />
                </svg>
              </span>
            )}
            <div className={`bubble-content ${msg.severity === 'emergency' ? 'emergency' : msg.severity === 'caution' ? 'caution' : ''}`}>
              <p className="bubble-text">{msg.text}</p>
              <span className="bubble-time">{relativeTime(msg.timestamp.toISOString())}</span>
            </div>
          </div>
        ))}

        {thinking && (
          <div className="bubble other">
            <span className="bot-avatar" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 48 48" fill="currentColor" focusable="false">
                <ellipse cx="24" cy="30" rx="11" ry="9" /><circle cx="10" cy="18" r="5.5" /><circle cx="38" cy="18" r="5.5" /><circle cx="17" cy="8" r="5" /><circle cx="31" cy="8" r="5" />
              </svg>
            </span>
            <div className="bubble-content">
              <p className="bubble-text typing">{t('assistant_typing')}</p>
            </div>
          </div>
        )}

        {/* Санал болгосон асуултууд */}
        {messages.length <= 1 && !thinking && (
          <div className="chips">
            {SUGGESTED_QUESTIONS.map((q: string) => (
              <button key={q} className="chip" onClick={() => handleChipClick(q)}>
                {q}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Бичих хэсэг */}
      <div className="composer">
        <p className="disclaimer">{t('assistant_disclaimer')}</p>
        <div className="composer-row">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('assistant_input_placeholder')}
            disabled={thinking}
            aria-label={t('assistant_input_placeholder')}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || thinking}
            className="send-btn"
            aria-label={t('assistant_send')}
          >
            {thinking ? (
              <svg className="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
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

      <style jsx>{`
        .assistant-page {
          display: flex; flex-direction: column;
          height: calc(100dvh - var(--nav-h) - var(--sp-6) - var(--sp-8) - var(--safe-bottom));
          max-width: 640px; margin: 0 auto; width: 100%;
        }
        @media (max-width: 1024px) {
          .assistant-page { height: calc(100dvh - var(--nav-h) - var(--sp-5) - var(--sp-7) - var(--safe-bottom)); }
        }
        @media (max-width: 640px) {
          .assistant-page { height: calc(100dvh - var(--nav-h) - var(--sp-4) - var(--sp-6) - var(--safe-bottom)); }
        }
        @media (max-width: 400px) {
          .assistant-page { height: calc(100dvh - var(--nav-h) - var(--sp-3) - var(--sp-5) - var(--safe-bottom)); }
        }

        .assistant-header {
          display: flex; align-items: center; gap: var(--sp-3);
          padding: var(--sp-3) var(--sp-4);
          background: var(--glass-bg); -webkit-backdrop-filter: var(--glass-blur);
          backdrop-filter: var(--glass-blur); border-bottom: 1px solid var(--glass-border);
          flex-shrink: 0;
        }
        .back-link {
          color: var(--primary); text-decoration: none; border-radius: var(--r-sm);
          min-width: var(--touch-target); min-height: var(--touch-target);
          display: flex; align-items: center; justify-content: center;
        }
        .back-link:focus-visible { outline: 2.5px solid var(--accent); outline-offset: 2px; }
        .header-info { flex: 1; min-width: 0; }
        .header-title { font-family: var(--font-display); font-size: 16px; font-weight: 600; color: var(--primary); }
        .header-desc { font-size: 12px; color: var(--muted); }

        .messages {
          flex: 1; overflow-y: auto; padding: var(--sp-4);
          display: flex; flex-direction: column; gap: var(--sp-3);
        }

        .bubble {
          display: flex; gap: var(--sp-2); max-width: 85%;
        }
        .bubble.own { align-self: flex-end; flex-direction: row-reverse; }
        .bubble.other { align-self: flex-start; }

        .bot-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--eyebrow-bg); color: var(--primary);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .bubble-content {
          padding: var(--sp-3) var(--sp-4);
          border-radius: var(--r-lg); font-size: 14px; line-height: 1.6;
        }
        .bubble.own .bubble-content {
          background: var(--accent); color: var(--accent-ink);
          border-bottom-right-radius: var(--r-sm);
        }
        .bubble.other .bubble-content {
          background: var(--card); border: 1px solid var(--line); color: var(--ink);
          border-bottom-left-radius: var(--r-sm);
        }
        .bubble-content.emergency {
          border-left: 3px solid var(--alert);
        }
        .bubble-content.caution {
          border-left: 3px solid var(--accent);
        }
        .bubble-text { margin: 0; white-space: pre-wrap; word-break: break-word; }
        .bubble-time {
          display: block; font-size: 10px; margin-top: 4px; opacity: 0.7; text-align: right;
        }
        .bubble.own .bubble-time { color: var(--accent-ink); opacity: 0.75; }
        .bubble.other .bubble-time { color: var(--muted); }

        .typing::after {
          content: '...'; animation: blink 1s infinite;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        .chips {
          display: flex; flex-wrap: wrap; gap: var(--sp-2);
          padding: var(--sp-2) 0;
        }
        .chip {
          padding: 6px 14px; border: 1.5px solid var(--line);
          border-radius: var(--r-pill); background: var(--card);
          font-size: 12.5px; color: var(--primary); cursor: pointer;
          font-family: var(--font-body); font-weight: 500;
          transition: all 0.15s ease;
        }
        .chip:hover { background: var(--eyebrow-bg); border-color: var(--primary); }

        .composer {
          border-top: 1px solid var(--line); background: var(--card); flex-shrink: 0;
          padding: var(--sp-2) var(--sp-4) calc(var(--sp-3) + var(--safe-bottom));
        }
        .disclaimer {
          font-size: 10px; color: var(--muted); text-align: center; margin-bottom: var(--sp-2);
        }
        .composer-row {
          display: flex; gap: var(--sp-2);
        }
        .composer-row input {
          flex: 1; padding: 10px 14px; border: 1.5px solid var(--line);
          border-radius: var(--r-pill); font-size: 14px; font-family: var(--font-body);
          background: var(--bg); color: var(--ink); min-height: 44px;
        }
        .composer-row input:focus { outline: none; border-color: var(--accent); }
        .send-btn {
          width: 44px; height: 44px; border-radius: 50%; border: none;
          background: var(--accent); color: var(--accent-ink);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: transform 0.15s ease;
        }
        .send-btn:hover { transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .send-btn .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
