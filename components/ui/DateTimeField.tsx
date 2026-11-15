'use client';

import { useLanguage } from '../../lib/i18n';
import type { DateTimeInputValue } from '../../lib/dateTime';

export default function DateTimeField({ id, label, value, onChange, error }: {
  id: string;
  label: string;
  value: DateTimeInputValue;
  onChange: (value: DateTimeInputValue) => void;
  error?: string;
}) {
  const { t, lang } = useLanguage();
  const hint = `${id}-hint`;
  const errorId = `${id}-error`;
  const localized = lang === 'mn';

  return (
    <fieldset className="date-time-field" aria-describedby={error ? `${hint} ${errorId}` : hint}>
      <legend>{label}</legend>
      <div className="date-time-grid">
        <div className="date-time-part">
          <label htmlFor={`${id}-date`}>{t('date_time_date')}</label>
          <span className="native-field">
            <input id={`${id}-date`} className={`field${localized ? ' localized-preview' : ''}`} type="date" value={value.date} lang={localized ? 'mn-MN' : 'en'} aria-invalid={Boolean(error)}
              onChange={event => onChange({ ...value, date: event.target.value })} />
            {localized && <span className={`date-time-display${value.date ? '' : ' is-placeholder'}`} aria-hidden="true">
              {value.date ? value.date.replaceAll('-', '.') : t('date_time_date_placeholder')}
            </span>}
          </span>
        </div>
        <div className="date-time-part">
          <label htmlFor={`${id}-time`}>{t('date_time_clock')}</label>
          <span className="native-field">
            <input id={`${id}-time`} className={`field${localized ? ' localized-preview' : ''}`} type="time" value={value.time} lang={localized ? 'mn-MN' : 'en'} aria-invalid={Boolean(error)}
              onChange={event => onChange({ ...value, time: event.target.value })} />
            {localized && <span className={`date-time-display${value.time ? '' : ' is-placeholder'}`} aria-hidden="true">
              {value.time || t('date_time_time_placeholder')}
            </span>}
          </span>
        </div>
      </div>
      <p id={hint} className="date-time-hint">{t('date_time_device_hint')}</p>
      {error && <p id={errorId} className="date-time-error" role="alert">{error}</p>}
      <style jsx>{`
        .date-time-field { min-width:0; padding:0; margin:0; border:0; }
        .date-time-field legend { padding:0; margin-bottom:var(--sp-1); color:var(--text-secondary); font-size:var(--text-xs); font-weight:650; }
        .date-time-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--sp-2); }
        .date-time-part { display:grid; gap:var(--sp-1); min-width:0; }
        .date-time-grid label { color:var(--text-secondary); font-size:var(--text-xs); font-weight:650; }
        .native-field { display:block; position:relative; min-width:0; }
        .date-time-grid input { min-width:0; width:100%; box-sizing:border-box; }
        .date-time-grid input[aria-invalid=true] { border-color:var(--alert); }
        .date-time-grid input.localized-preview { color:transparent; }
        .date-time-grid input.localized-preview::-webkit-datetime-edit { color:transparent; }
        .date-time-grid input.localized-preview:focus,
        .date-time-grid input.localized-preview:focus::-webkit-datetime-edit { color:var(--ink); }
        .date-time-display { position:absolute; inset:0 42px 0 14px; display:flex; align-items:center; overflow:hidden; pointer-events:none; color:var(--ink); font:400 14px/1.4 var(--font-body, sans-serif); white-space:nowrap; }
        .date-time-display.is-placeholder { color:var(--muted); }
        .native-field input:focus + .date-time-display { visibility:hidden; }
        .date-time-hint, .date-time-error { margin:var(--sp-1) 0 0; color:var(--text-secondary); font-size:var(--text-xs); }
        .date-time-error { color:var(--alert); }
      `}</style>
    </fieldset>
  );
}
