'use client';
import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { useSyncExternalStore } from 'react';
import { useLanguage } from '../lib/i18n';
import { relativeTime } from '../lib/relativeTime';
import { maskPhone, formatPhone } from '../lib/utils';
import { vaccineStatus } from '../lib/vaccineService';
import PetIcon from './PetIcon';
import ShareButtons from './ShareButtons';
import type { PetProfileData } from '../lib/types';

function subscribeLocation(cb: () => void) {
  window.addEventListener('popstate', cb);
  window.addEventListener('hashchange', cb);
  return () => { window.removeEventListener('popstate', cb); window.removeEventListener('hashchange', cb); };
}

const VAX_STATUS: Record<string, { text: string; color: string }> = {
  overdue: { text: '⚠️ Хугацаа хэтэрсэн', color: 'var(--alert)' },
  soon: { text: '🔔 Удахгүй болно', color: 'var(--accent)' },
  ok: { text: '✅ Хэвийн', color: 'var(--success)' },
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
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="avatar">
          {data.photoUrl ? (
            <Image
              src={data.photoUrl}
              alt={data.name || typeLabel}
              fill
              sizes="128px"
              style={{ objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            <span className="avatar-placeholder">
              <PetIcon type={data.type} size={72} />
            </span>
          )}
        </div>
        <h1 className="profile-name">{data.name || typeLabel}</h1>
        <p className="profile-type">{typeLabel}</p>

        <div className="chips">
          {data.breed && <span className="chip">{data.breed}</span>}
          {data.age && <span className="chip">{data.age}</span>}
          {data.gender && data.gender !== 'Тодорхойгүй' && (
            <span className="chip">{data.gender === 'Эрэгтэй' ? '♂' : '♀'} {data.gender}</span>
          )}
          {data.weight != null && <span className="chip">{data.weight} {t('profiles_weight_chip')}</span>}
        </div>

        {vaxStatus && vaxLabel && (
          <div style={{ marginTop: 'var(--sp-2)', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: vaxLabel.color }}>
            {vaxLabel.text}
            {data.nextVaccineName && <span style={{ fontWeight: 400, color: 'var(--muted)' }}> · {data.nextVaccineName}</span>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-bar" role="tablist">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            role="tab"
            aria-selected={tab === tabItem.key}
            className={`tab ${tab === tabItem.key ? 'active' : ''}`}
            onClick={() => setTab(tabItem.key)}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {tab === 'photo' && (
          <div>
            {data.photoUrl ? (
              <div className="photo-box">
                <Image
                  src={data.photoUrl}
                  alt={data.name || typeLabel}
                  fill
                  sizes="(max-width: 640px) 100vw, 520px"
                  style={{ objectFit: 'cover' }}
                  priority
                />
              </div>
            ) : (
              <div className="photo-box placeholder">
                <PetIcon type={data.type} size={80} />
              </div>
            )}
            {data.description && (
              <p className="description">{data.description}</p>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div className="history-card">
            <p className="history-item">
              <strong>{data.kind === 'adoption' ? t('profiles_history_adoption') : t('profiles_history_registered')}</strong>
            </p>
            <p className="history-date">{new Date(data.createdAt).toLocaleDateString('mn-MN')} · {relativeTime(data.createdAt)}</p>
          </div>
        )}

        {tab === 'health' && healthSection && (
          <div>{healthSection}</div>
        )}
      </div>

      {/* Contact (adoption only) */}
      {data.kind === 'adoption' && (data.phone || data.district || data.place) && (
        <div className="contact-card">
          <h3 className="section-title">{t('profiles_contact_title')}</h3>
          {data.district && <p><strong>{t('detail_district')}</strong> {data.district}</p>}
          {data.place && <p><strong>{t('detail_place')}</strong> {data.place}</p>}
          {data.phone && (
            <div style={{ marginTop: 'var(--sp-2)' }}>
              {phoneRevealed ? (
                <a href={`tel:${data.phone}`} className="phone-link">☎ {formatPhone(data.phone)}</a>
              ) : (
                <button className="btn btn-ghost" onClick={() => setPhoneRevealed(true)} style={{ fontSize: 13, minHeight: 36 }}>
                  ☎ {maskPhone(data.phone)} · {t('detail_show_phone')}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Share */}
      <div className="share-section">
        <ShareButtons url={url} title={shareTitle} />
        <p className="share-hint">{t('detail_share_hint')}</p>
      </div>

      {data.kind === 'mypet' && (
        <p className="owner-notice">{t('profiles_owner_only')}</p>
      )}

      <style jsx>{`
        .profile-page { max-width: 640px; margin: 0 auto; }

        .profile-header {
          text-align: center; padding: var(--sp-5) 0 var(--sp-4);
        }
        .avatar {
          width: 128px; height: 128px; border-radius: 50%; overflow: hidden;
          background: var(--thumb-bg); position: relative; margin: 0 auto var(--sp-3);
          border: 3px solid var(--glass-border);
        }
        .avatar-placeholder {
          width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
          color: var(--primary); background: var(--glass-bg); border-radius: 50%;
        }
        .profile-name {
          font-family: var(--font-display); font-size: 22px; font-weight: 700;
          color: var(--primary); margin-bottom: 4px;
        }
        .profile-type { font-size: 14px; color: var(--muted); margin-bottom: var(--sp-2); }
        .chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
        .chip {
          display: inline-block; font-size: 12px; padding: 4px 12px;
          background: var(--eyebrow-bg); border-radius: var(--r-pill);
          color: var(--muted); font-weight: 500;
        }

        .tab-bar {
          display: flex; gap: 2px; margin-bottom: var(--sp-4);
          background: var(--eyebrow-bg); border-radius: var(--r-pill); padding: 3px;
        }
        .tab {
          flex: 1; padding: 8px 12px; border: none; border-radius: var(--r-pill);
          background: transparent; font-family: var(--font-body); font-size: 13px;
          font-weight: 600; color: var(--muted); cursor: pointer;
          transition: all 0.15s ease;
        }
        .tab.active { background: var(--card); color: var(--primary); box-shadow: var(--shadow-sm); }
        .tab:hover:not(.active) { color: var(--primary); }

        .tab-content { margin-bottom: var(--sp-4); }
        .photo-box {
          width: 100%; aspect-ratio: 4/3; background: var(--thumb-bg);
          border-radius: var(--r-lg); overflow: hidden; position: relative;
          display: flex; align-items: center; justify-content: center;
        }
        .photo-box.placeholder { color: var(--primary); }
        .description { margin-top: var(--sp-3); font-size: 14px; color: var(--muted); line-height: 1.6; white-space: pre-wrap; }

        .history-card {
          padding: var(--sp-4); background: var(--card); border: 1px solid var(--line);
          border-radius: var(--r-lg);
        }
        .history-item { font-size: 14px; margin-bottom: 4px; }
        .history-date { font-size: 13px; color: var(--muted); }

        .contact-card {
          padding: var(--sp-4); background: var(--card); border: 1px solid var(--line);
          border-radius: var(--r-lg); margin-bottom: var(--sp-4);
        }
        .section-title { font-size: 14px; font-weight: 600; color: var(--primary); margin-bottom: var(--sp-2); }
        .contact-card p { font-size: 13px; margin: 4px 0; }
        .phone-link { font-size: 14px; font-weight: 600; color: var(--primary); text-decoration: none; }

        .share-section { text-align: center; margin: var(--sp-4) 0; }
        .share-hint { font-size: 12px; color: var(--muted); margin-top: var(--sp-2); }

        .owner-notice { text-align: center; font-size: 12px; color: var(--muted); margin-top: var(--sp-4); }
      `}</style>
    </div>
  );
}
