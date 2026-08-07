'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../lib/useAuth';
import { useLanguage } from '../../lib/i18n';
import { fetchConversationList } from '../../lib/chatService';
import { relativeTime } from '../../lib/relativeTime';
import type { ConversationPreview } from '../../lib/types';

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;
    async function load() {
      try {
        const data = await fetchConversationList();
        if (!cancelled) setConversations(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { cancelled = true; window.removeEventListener('focus', onFocus); };
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <p>{t('detail_loading')}</p>;
  }

  if (!user) {
    return (
      <div>
        <div className="page-header">
          <div className="eyebrow">{t('chat_list_eyebrow')}</div>
          <h1>{t('chat_list_title')}</h1>
        </div>
        <p style={{ color: 'var(--muted)' }}>{t('chat_login_required')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">{t('chat_list_eyebrow')}</div>
        <h1>{t('chat_list_title')}</h1>
        <p>{t('chat_list_desc')}</p>
      </div>

      {conversations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--sp-6) 0' }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>
            {t('chat_none')}
          </p>
          <p style={{ color: 'var(--muted)' }}>{t('chat_none_desc')}</p>
        </div>
      ) : (
        <div className="conv-list">
          {conversations.map((conv) => {
            const otherEmail = conv.initiatorId === user.id ? conv.ownerEmail : conv.initiatorEmail;
            const otherName = otherEmail.split('@')[0];
            return (
              <Link key={conv.id} href={`/messages/${conv.id}`} className="conv-item">
                <div className="conv-thumb">
                  {conv.pet?.photoURL ? (
                    <Image src={conv.pet.photoURL} alt="" fill sizes="48px" style={{ objectFit: 'cover', borderRadius: 'var(--r-md)' }} />
                  ) : (
                    <span className="conv-thumb-placeholder">🐾</span>
                  )}
                </div>
                <div className="conv-info">
                  <div className="conv-header">
                    <span className="conv-name">{otherName}</span>
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
      `}</style>
    </div>
  );
}
