'use client';

import { useLanguage } from '../lib/i18n';
import type { DateTimeInputValue } from '../lib/dateTime';
import DateTimeField from './ui/DateTimeField';
import FieldHint from './ui/FieldHint';

export interface SittingCareValues {
  experience: string;
  isBeginner: boolean;
  availability: string;
  availableTime: DateTimeInputValue;
}

export default function SittingCareFields({ id, value, onChange, timeError }: {
  id: string;
  value: SittingCareValues;
  onChange: (value: Partial<SittingCareValues>) => void;
  timeError?: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="care-fields">
      <label htmlFor={`${id}-exp`}>{t('sitting_experience_label')}</label>
      <FieldHint mn="Хэдэн жил, ямар төрлийн амьтан асарч байснаа бичнэ. Заавал биш." en="Describe your pet-care experience. Optional." />
      <input id={`${id}-exp`} className="field" value={value.experience} maxLength={500}
        placeholder={t('sitting_experience_placeholder')}
        onChange={event => onChange({ experience: event.target.value })} />
      <label className="beginner-choice">
        <input type="checkbox" checked={value.isBeginner}
          onChange={event => onChange({ isBeginner: event.target.checked })} />
        {t('sitting_beginner')}
      </label>
      <label htmlFor={`${id}-avail`}>{t('sitting_availability_label')}</label>
      <input id={`${id}-avail`} className="field" value={value.availability} maxLength={500}
        placeholder={t('sitting_availability_placeholder')}
        onChange={event => onChange({ availability: event.target.value })} />
      <DateTimeField id={`${id}-available`} label={`${t('sitting_available_from')} ${t('map_optional')}`}
        value={value.availableTime} error={timeError}
        onChange={availableTime => onChange({ availableTime })} />
      <style jsx>{`
        .care-fields { display:grid; gap:var(--sp-2); }
        .care-fields > label { color:var(--primary); font-size:var(--text-sm); font-weight:700; }
        .care-fields > .beginner-choice { display:flex; align-items:center; gap:var(--sp-2); min-height:var(--touch-target); color:var(--ink); cursor:pointer; }
        .beginner-choice input { width:20px; height:20px; margin:0; accent-color:var(--primary); }
        .beginner-choice input:focus-visible { outline:2px solid var(--border-focus); outline-offset:2px; }
      `}</style>
    </div>
  );
}
