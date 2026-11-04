'use client';
import { useLanguage } from '../lib/i18n';
import { formatPhone, normalizePhone } from '../lib/utils';

export default function PhonePrivacyField({ id, phone, hidden, onPhoneChange, onHiddenChange, error }: {
  id: string; phone: string; hidden: boolean;
  onPhoneChange: (value: string) => void; onHiddenChange: (value: boolean) => void; error?: string;
}) {
  const { t } = useLanguage();
  return <fieldset className="phone-privacy">
    <legend>{t('contact_phone_label')}</legend>
    <label className="privacy-choice" htmlFor={`${id}-hidden`}>
      <input id={`${id}-hidden`} type="checkbox" checked={hidden} onChange={event => onHiddenChange(event.target.checked)} aria-describedby={`${id}-hint`} />
      <span>{t('contact_hide_phone')}</span>
    </label>
    <p id={`${id}-hint`}>{t(hidden ? 'contact_hidden_hint' : 'contact_public_hint')}</p>
    {!hidden && <><label className="sr-only" htmlFor={id}>{t('contact_phone_label')}</label>
      <input id={id} name="phone" value={formatPhone(phone)} onChange={event => onPhoneChange(normalizePhone(event.target.value))}
        placeholder={t('phone_placeholder')} required inputMode="tel" autoComplete="tel" maxLength={14}
        aria-invalid={Boolean(error)} aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`} /></>}
    {!hidden && error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
    <style jsx>{`
      .phone-privacy{display:grid;gap:var(--sp-2);min-width:0;margin:var(--sp-2) 0;padding:var(--sp-3);border:1px solid var(--line);border-radius:var(--r-md)}legend{padding:0 var(--sp-1);color:var(--ink);font-weight:700;font-size:var(--text-sm)}.privacy-choice{display:flex;align-items:center;gap:var(--sp-2);min-height:var(--touch-target);color:var(--ink);font-size:var(--text-sm);cursor:pointer}.privacy-choice input{flex:0 0 auto;width:20px;height:20px;accent-color:var(--primary)}p{margin:0;color:var(--muted);font-size:var(--text-xs);line-height:1.5}input:not([type=checkbox]){box-sizing:border-box;width:100%;min-height:var(--touch-target);padding:var(--sp-2) var(--sp-3);font:inherit;font-size:16px;color:var(--ink);background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-sm)}input:focus-visible{outline:2px solid var(--border-focus);outline-offset:2px}.field-error{color:var(--alert)}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
    `}</style>
  </fieldset>;
}
