import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { DateTimeInputValue } from '../../lib/dateTime';

const language = vi.hoisted(() => ({ value: 'mn' as 'mn' | 'en' }));
vi.mock('../../lib/i18n', () => ({ useLanguage: () => ({
  lang: language.value,
  t: (key: string) => ({ date_time_date: 'Огноо', date_time_clock: 'Цаг', date_time_date_placeholder: 'Жил.сар.өдөр', date_time_time_placeholder: 'Цаг:минут', date_time_device_hint: 'Төхөөрөмжийн цагаар оруулна.' } as Record<string, string>)[key],
}) }));
import DateTimeField from '../../components/ui/DateTimeField';

beforeEach(() => { language.value = 'mn'; });

it('shows Mongolian numeric dates while retaining native ISO and 24-hour values when editing', () => {
  const changed = vi.fn();
  function Form() {
    const [value, setValue] = useState<DateTimeInputValue>({ date: '2026-11-15', time: '18:40' });
    return <DateTimeField id="seen" label="Харсан цаг" value={value} onChange={next => { changed(next); setValue(next); }} />;
  }
  render(<Form />);
  const date = screen.getByLabelText('Огноо', { exact: true });
  const time = screen.getByLabelText('Цаг', { exact: true });
  expect(date).toHaveValue('2026-11-15');
  expect(time).toHaveValue('18:40');
  expect(screen.getByText('2026.11.15')).toHaveAttribute('aria-hidden', 'true');
  fireEvent.change(date, { target: { value: '2026-11-16' } });
  expect(changed).toHaveBeenLastCalledWith({ date: '2026-11-16', time: '18:40' });
  expect(screen.getByText('2026.11.16')).toBeInTheDocument();
  fireEvent.change(time, { target: { value: '' } });
  expect(changed).toHaveBeenLastCalledWith({ date: '2026-11-16', time: '' });
  expect(screen.getByText('Цаг:минут')).toBeInTheDocument();
});

it('keeps the browser-native display for English', () => {
  language.value = 'en';
  const { container } = render(<DateTimeField id="seen" label="Seen" value={{ date: '2026-11-15', time: '18:40' }} onChange={vi.fn()} />);
  expect(container.querySelector('.date-time-display')).toBeNull();
  expect(screen.getByLabelText('Огноо', { exact: true })).toHaveAttribute('type', 'date');
  expect(screen.getByLabelText('Цаг', { exact: true })).toHaveAttribute('type', 'time');
});

it('preserves accessible labels, empty values and error descriptions', () => {
  render(<DateTimeField id="seen" label="Харсан цаг" value={{ date: '', time: '' }} onChange={vi.fn()} error="Огноо дутуу" />);
  expect(screen.getByLabelText('Огноо', { exact: true })).toHaveValue('');
  expect(screen.getByLabelText('Цаг', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByRole('group', { name: 'Харсан цаг' })).toHaveAttribute('aria-describedby', 'seen-hint seen-error');
  expect(screen.getByRole('alert')).toHaveTextContent('Огноо дутуу');
});
