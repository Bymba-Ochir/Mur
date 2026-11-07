export interface DateTimeInputValue {
  date: string;
  time: string;
}

export const EMPTY_DATE_TIME: DateTimeInputValue = { date: '', time: '' };

/** Interpret the two native inputs in the user's device time zone. */
export function parseDateTimeInput({ date, time }: DateTimeInputValue): Date | null {
  if (!date && !time) return null;
  return new Date(`${date}T${time}`);
}

export function dateTimeInputFromIso(value: string | null): DateTimeInputValue {
  if (!value) return EMPTY_DATE_TIME;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return EMPTY_DATE_TIME;
  const twoDigits = (part: number) => String(part).padStart(2, '0');
  return {
    date: `${String(date.getFullYear()).padStart(4, '0')}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`,
    time: `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`,
  };
}

export function dateTimeFormat(lang: 'mn' | 'en') {
  const formatter = new Intl.DateTimeFormat(lang === 'mn' ? 'en-GB' : 'en', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  if (lang === 'en') return formatter;

  // Numeric Mongolian dates stay consistent even when the browser lacks mn-MN.
  return {
    format(date: Date) {
      const parts = Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, part.value]));
      return `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`;
    },
  };
}
