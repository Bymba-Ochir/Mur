'use client';
import { useState } from 'react';
import { useLanguage } from '../lib/i18n';
import { formatPhone, maskPhone } from '../lib/utils';
import type { ContactListing } from '../lib/listingContact';
import MessageButton from './MessageButton';
import Icon from './ui/icons';

export default function ListingContact({ listing, phone, hidden }: { listing: ContactListing; phone: string; hidden?: boolean }) {
  const { t } = useLanguage();
  const [revealedPhone, setRevealedPhone] = useState('');
  return <div className="listing-contact">
    {hidden ? <p className="private-contact"><Icon name="lock" size={16} aria-hidden="true" />{t('contact_chat_only')}</p>
      : phone && (revealedPhone === phone
        ? <a className="phone-action" href={`tel:${phone}`}><Icon name="phone" size={17} aria-hidden="true" />{formatPhone(phone)}</a>
        : <button type="button" className="phone-action" onClick={() => setRevealedPhone(phone)}><Icon name="phone" size={17} aria-hidden="true" />{maskPhone(phone)} · {t('detail_show_phone')}</button>)}
    <MessageButton listing={listing} />
    <style jsx>{`
      .listing-contact{display:grid;gap:var(--sp-2)}.phone-action{display:flex;align-items:center;justify-content:center;gap:var(--sp-2);width:100%;min-height:var(--touch-target);padding:var(--sp-2) var(--sp-3);color:var(--primary);background:var(--eyebrow-bg);border:1px solid var(--line);border-radius:var(--r-md);font:inherit;font-weight:700;text-decoration:none;cursor:pointer}.phone-action:focus-visible{outline:2px solid var(--border-focus);outline-offset:2px}.private-contact{display:flex;align-items:center;gap:var(--sp-2);margin:0;color:var(--muted);font-size:var(--text-sm);line-height:1.5}
    `}</style>
  </div>;
}
