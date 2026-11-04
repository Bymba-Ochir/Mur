import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
vi.mock('../../lib/i18n', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock('../../components/MessageButton', () => ({ default: () => <button>Chat</button> }));
import ListingContact from '../../components/ListingContact';
import PhonePrivacyField from '../../components/PhonePrivacyField';
import { cleanup } from '@testing-library/react';
beforeEach(() => cleanup());

it('never renders a hidden number or tel link even when a caller passes the original number', () => {
  const { container } = render(<ListingContact listing={{ kind: 'adoption', id: 'listing', ownerId: 'owner' }} phone="88112233" hidden />);
  expect(screen.getByText('contact_chat_only')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Chat' })).toBeVisible();
  expect(container.innerHTML).not.toContain('88112233'); expect(container.querySelector('a[href^="tel:"]')).toBeNull();
  expect(screen.queryByRole('button', { name: /detail_show_phone/ })).toBeNull();
});
it('requires an explicit click for public numbers and masks a changed number again', () => {
  const listing = { kind: 'pet' as const, id: 'listing', ownerId: 'owner' };
  const { rerender, container } = render(<ListingContact listing={listing} phone="88112233" />);
  expect(container.querySelector('a[href^="tel:"]')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /detail_show_phone/ }));
  expect(container.querySelector('a[href="tel:88112233"]')).not.toBeNull();
  rerender(<ListingContact listing={listing} phone="99112233" />);
  expect(container.querySelector('a[href^="tel:"]')).toBeNull();
});
it('offers chat-only contact without asking for a phone number', () => {
  const hidden = vi.fn(), changed = vi.fn();
  const { rerender } = render(<PhonePrivacyField id="phone" phone="" hidden={false} onPhoneChange={changed} onHiddenChange={hidden} />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '88 11 22 33' } }); expect(changed).toHaveBeenCalledWith('88112233');
  fireEvent.click(screen.getByRole('checkbox')); expect(hidden).toHaveBeenCalledWith(true);
  rerender(<PhonePrivacyField id="phone" phone="88112233" hidden onPhoneChange={changed} onHiddenChange={hidden} />);
  expect(screen.queryByRole('textbox')).toBeNull(); expect(screen.getByText('contact_hidden_hint')).toBeVisible();
});

it('associates a phone validation error with its input', () => {
  render(<PhonePrivacyField id="phone" phone="123" hidden={false} onPhoneChange={() => {}} onHiddenChange={() => {}} error="Invalid number" />);
  expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'phone-hint phone-error');
  expect(screen.getByRole('alert')).toHaveTextContent('Invalid number');
});
