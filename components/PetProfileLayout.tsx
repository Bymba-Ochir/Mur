'use client';
import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { useSyncExternalStore } from 'react';
import { useLanguage } from '../lib/i18n';
import { relativeTime } from '../lib/relativeTime';
import { maskPhone, formatPhone } from '../lib/utils';
import { vaccineStatus } from '../lib/vaccineService';
import PetIcon from './PetIcon';
import Button from './ui/Button';
import ShareButtons from './ShareButtons';
import type { PetProfileData } from '../lib/types';
import { Phone } from 'lucide-react';

function subscribeLocation(cb: () => void) {
  window.addEventListener('popstate', cb);
  window.addEventListener('hashchange', cb);
  return () => { window.removeEventListener('popstate', cb); window.removeEventListener('hashchange', cb); };
}

const VAX_STATUS: Record<string, { text: string; color: string }> = {
  overdue: { text: 'Хугацаа хэтэрсэн', color: 'var(--alert)' },
  soon: { text: 'Удахгүй болно', color: 'var(--accent)' },
  ok: { text: 'Хэвийн', color: 'var(--success)' },
  none: { text: 'Огноо тохируулаагүй', color: 'var(--muted)' },
};

export default function PetProfileLayout({
  data, healthSection,
}: {
  data: PetProfileData;
  healthSection?: ReactNode;
}) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<'photo' | 'history' | 'health'>('photo');
  const [phoneRevealed, setPhoneRevealed] = useState(false);

  const url = useSyncExternalStore(subscribeLocation, () => typeof window !== 'undefined' ? window.location.href : '');

  const typeLabel = data.type === 'Муур' ? t('type_cat') : data.type === 'Нохой' ? t('type_dog') : t('type_other');
  const shareTitle = (data.kind === 'adoption' ? 'Үрчлүүлэх ' : '') + typeLabel + (data.name ? ' — ' + data.name : '');
  const tabs: Array<{ key: 'photo' | 'history' | 'health'; label: string }> = [
    { key: 'photo', label: t('profiles_tab_photo') },
    { key: 'history', label: t('profiles_tab_history') },
  ];
  if (healthSection) {
    tabs.push({ key: 'health', label: t('profiles_tab_health') });
  }

  const vaxStatus = data.nextVaccineDate ? vaccineStatus(data.nextVaccineDate) : null;
  const vaxLabel = vaxStatus ? VAX_STATUS[vaxStatus] : null;

  return (
    <div className="mx-auto max-w-[640px]">
      {/* Header */}
      <div className="pt-[var(--sp-5)] pb-[var(--sp-4)] text-center">
        <div className="relative mx-auto mb-[var(--sp-3)] size-32 overflow-hidden rounded-full border-[3px] border-[var(--glass-border)] bg-[var(--thumb-bg)]">
          {data.photoUrl ? (
            <Image
              src={data.photoUrl}
              alt={data.name || typeLabel}
              fill
              sizes="128px"
              className="rounded-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center rounded-full bg-[var(--glass-bg)] text-[var(--primary)]">
              <PetIcon type={data.type} size={72} />
            </span>
          )}
        </div>
        <h1 className="mb-1 font-[family-name:var(--font-display)] text-[22px] font-bold text-[var(--primary)]">{data.name || typeLabel}</h1>
        <p className="mb-[var(--sp-2)] text-sm text-[var(--muted)]">{typeLabel}</p>

        <div className="flex flex-wrap justify-center gap-1.5">
          {data.breed && <span className="inline-block rounded-[var(--r-pill)] bg-[var(--surface-3)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">{data.breed}</span>}
          {data.age && <span className="inline-block rounded-[var(--r-pill)] bg-[var(--surface-3)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">{data.age}</span>}
          {data.gender && data.gender !== 'Тодорхойгүй' && (
            <span className="inline-block rounded-[var(--r-pill)] bg-[var(--surface-3)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">{data.gender}</span>
          )}
          {data.weight != null && <span className="inline-block rounded-[var(--r-pill)] bg-[var(--surface-3)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">{data.weight} {t('profiles_weight_chip')}</span>}
        </div>

        {vaxStatus && vaxLabel && (
          <div className="mt-[var(--sp-2)] font-[family-name:var(--font-mono)] text-xs font-semibold" style={{ color: vaxLabel.color }}>
            {vaxLabel.text}
            {data.nextVaccineName && <span className="font-normal text-[var(--muted)]"> · {data.nextVaccineName}</span>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-[var(--sp-4)] flex gap-0.5 rounded-[var(--r-pill)] bg-[var(--eyebrow-bg)] p-[3px]" role="tablist">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            role="tab"
            aria-selected={tab === tabItem.key}
            className={`flex-1 cursor-pointer rounded-[var(--r-pill)] border-0 px-3 py-2 font-[family-name:var(--font-body)] text-[13px] font-semibold transition-all hover:text-[var(--primary)] ${tab === tabItem.key ? 'bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]' : 'bg-transparent text-[var(--muted)]'}`}
            onClick={() => setTab(tabItem.key)}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mb-[var(--sp-4)]">
        {tab === 'photo' && (
          <div>
            {data.photoUrl ? (
              <div className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-[var(--r-lg)] bg-[var(--thumb-bg)]">
                <Image
                  src={data.photoUrl}
                  alt={data.name || typeLabel}
                  fill
                  sizes="(max-width: 640px) 100vw, 520px"
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-[var(--r-lg)] bg-[var(--thumb-bg)] text-[var(--primary)]">
                <PetIcon type={data.type} size={80} />
              </div>
            )}
            {data.description && (
              <p className="mt-[var(--sp-3)] whitespace-pre-wrap text-sm leading-[1.6] text-[var(--muted)]">{data.description}</p>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div className="rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--card)] p-[var(--sp-4)]">
            <p className="mb-1 text-sm">
              <strong>{data.kind === 'adoption' ? t('profiles_history_adoption') : t('profiles_history_registered')}</strong>
            </p>
            <p className="text-[13px] text-[var(--muted)]">{new Date(data.createdAt).toLocaleDateString('mn-MN')} · {relativeTime(data.createdAt)}</p>
          </div>
        )}

        {tab === 'health' && healthSection && (
          <div>{healthSection}</div>
        )}
      </div>

      {/* Contact (adoption only) */}
      {data.kind === 'adoption' && (data.phone || data.district || data.place) && (
        <div className="mb-[var(--sp-4)] rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--card)] p-[var(--sp-4)] [&_p]:my-1 [&_p]:text-[13px]">
          <h3 className="mb-[var(--sp-2)] text-sm font-semibold text-[var(--primary)]">{t('profiles_contact_title')}</h3>
          {data.district && <p><strong>{t('detail_district')}</strong> {data.district}</p>}
          {data.place && <p><strong>{t('detail_place')}</strong> {data.place}</p>}
          {data.phone && (
            <div className="mt-[var(--sp-2)]">
              {phoneRevealed ? (
                <a href={`tel:${data.phone}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)] no-underline"><Phone size={14} aria-hidden="true" /> {formatPhone(data.phone)}</a>
              ) : (
                <Button variant="ghost" onClick={() => setPhoneRevealed(true)} className="min-h-9 text-[13px]">
                  <Phone size={14} aria-hidden="true" /> {maskPhone(data.phone)} · {t('detail_show_phone')}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Share */}
      <div className="my-[var(--sp-4)] text-center">
        <ShareButtons url={url} title={shareTitle} />
        <p className="mt-[var(--sp-2)] text-xs text-[var(--muted)]">{t('detail_share_hint')}</p>
      </div>

      {data.kind === 'mypet' && (
        <p className="mt-[var(--sp-4)] text-center text-xs text-[var(--muted)]">{t('profiles_owner_only')}</p>
      )}
    </div>
  );
}
