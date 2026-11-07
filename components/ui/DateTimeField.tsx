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
  const { t } = useLanguage();
  const hint = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <fieldset className="date-time-field" aria-describedby={error ? `${hint} ${errorId}` : hint}>
      <legend>{label}</legend>
      <div className="date-time-grid">
        <label htmlFor={`${id}-date`}>{t('date_time_date')}
          <input id={`${id}-date`} className="field" type="date" value={value.date} aria-invalid={Boolean(error)}
            onChange={event => onChange({ ...value, date: event.target.value })} />
        </label>
        <label htmlFor={`${id}-time`}>{t('date_time_clock')}
          <input id={`${id}-time`} className="field" type="time" value={value.time} aria-invalid={Boolean(error)}
            onChange={event => onChange({ ...value, time: event.target.value })} />
        </label>
      </div>
      <p id={hint} className="date-time-hint">{t('date_time_device_hint')}</p>
      {error && <p id={errorId} className="date-time-error" role="alert">{error}</p>}
      <style jsx>{`
        .date-time-field { min-width:0; padding:0; margin:0; border:0; }
        .date-time-field legend { padding:0; margin-bottom:var(--sp-1); color:var(--text-secondary); font-size:var(--text-xs); font-weight:650; }
        .date-time-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--sp-2); }
        .date-time-grid label { display:grid; gap:var(--sp-1); min-width:0; color:var(--text-secondary); font-size:var(--text-xs); font-weight:650; }
        .date-time-grid input { min-width:0; width:100%; box-sizing:border-box; }
        .date-time-grid input[aria-invalid=true] { border-color:var(--alert); }
        .date-time-hint, .date-time-error { margin:var(--sp-1) 0 0; color:var(--text-secondary); font-size:var(--text-xs); }
        .date-time-error { color:var(--alert); }
      `}</style>
    </fieldset>
  );
}
