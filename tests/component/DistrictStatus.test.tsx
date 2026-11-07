import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
const mocks = vi.hoisted(() => ({
  user: null as { id: string } | null, status: vi.fn(), subscribe: vi.fn(), count: vi.fn(), member: vi.fn(), join: vi.fn(), leave: vi.fn(), toast: vi.fn(),
}));
vi.mock('../../lib/useAuth', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('../../lib/i18n', () => ({ useLanguage: () => ({ lang: 'en', t: (key: string) => key }) }));
vi.mock('../../lib/push', () => ({ isPushSupported: () => true, isSubscribed: mocks.status, subscribeToNearbyAlerts: mocks.subscribe, PUSH_SUBSCRIPTION_EVENT: 'mur:push-subscription-changed' }));
vi.mock('../../lib/volunteerService', () => ({ fetchVolunteerCount: mocks.count, isVolunteer: mocks.member, joinAsVolunteer: mocks.join, leaveAsVolunteer: mocks.leave }));
vi.mock('../../components/Toast', () => ({ useToast: () => mocks.toast }));
import NotifySubscribe from '../../components/NotifySubscribe';
import VolunteerBadge from '../../components/VolunteerBadge';

beforeEach(() => {
  vi.resetAllMocks(); mocks.user = null;
  mocks.status.mockResolvedValue(false); mocks.subscribe.mockResolvedValue(undefined);
  mocks.count.mockResolvedValue(7); mocks.member.mockResolvedValue(false);
});
it('offers registration when the server has no record, even with a browser subscription', async () => {
  render(<NotifySubscribe district="Баянзүрх" />);
  await screen.findByRole('button', { name: /Баянзүрх/ });
  expect(screen.queryByText(/listings_notify_subscribed/)).toBeNull();
  expect(mocks.status).toHaveBeenCalledWith('Баянзүрх');
});
it('does not present an old district response as the new district subscription', async () => {
  let finish!: (value: boolean) => void;
  mocks.status.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValue(false);
  const { rerender } = render(<NotifySubscribe district="Баянзүрх" />);
  await act(async () => {});
  rerender(<NotifySubscribe district="Хан-Уул" />);
  await screen.findByRole('button', { name: /Хан-Уул/ });
  await act(async () => finish(true));
  expect(screen.queryByText(/listings_notify_subscribed/)).toBeNull();
});
it('does not show an old account status after logout', async () => {
  mocks.user = { id: 'alice' };
  let finish!: (value: boolean) => void;
  mocks.status.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValue(false);
  const { rerender } = render(<NotifySubscribe district="Баянзүрх" />);
  await act(async () => {});
  mocks.user = null; rerender(<NotifySubscribe district="Баянзүрх" />);
  await screen.findByRole('button', { name: /Баянзүрх/ });
  await act(async () => finish(true));
  expect(screen.queryByText(/listings_notify_subscribed/)).toBeNull();
});
it('shows a retry after status failure instead of claiming active or inactive', async () => {
  mocks.status.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(false);
  render(<NotifySubscribe district="Баянзүрх" />);
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'err_retry' }));
  await screen.findByRole('button', { name: /Баянзүрх/ });
  expect(screen.queryByRole('alert')).toBeNull();
});
it('re-checks the server after subscribe rather than assuming the write stayed active', async () => {
  render(<NotifySubscribe district="Баянзүрх" />);
  fireEvent.click(await screen.findByRole('button', { name: /Баянзүрх/ }));
  await act(async () => {});
  expect(mocks.subscribe).toHaveBeenCalledWith('Баянзүрх');
  expect(mocks.status).toHaveBeenCalledTimes(2);
  expect(screen.queryByText(/listings_notify_subscribed/)).toBeNull();
});
it('refreshes server registration when the window regains focus', async () => {
  mocks.status.mockResolvedValueOnce(true).mockResolvedValue(false);
  render(<NotifySubscribe district="Баянзүрх" />);
  await screen.findByText(/listings_notify_subscribed/);
  act(() => window.dispatchEvent(new Event('focus')));
  await screen.findByRole('button', { name: /Баянзүрх/ });
});
it('uses a missing count state and retry instead of reporting zero after an RPC failure', async () => {
  mocks.count.mockRejectedValueOnce(new Error('migration missing')).mockResolvedValue(1502);
  render(<VolunteerBadge district="Баянзүрх" />);
  await screen.findByRole('alert');
  expect(screen.getByText('—')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'err_retry' }));
  await screen.findByText('1502');
});
it('ignores an old district count after a district switch', async () => {
  let finish!: (value: number) => void;
  mocks.count.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValue(3);
  const { rerender } = render(<VolunteerBadge district="Баянзүрх" />);
  rerender(<VolunteerBadge district="Хан-Уул" />);
  await screen.findByText('3');
  await act(async () => finish(999));
  expect(screen.queryByText('999')).toBeNull();
});
it('reloads the authoritative aggregate after membership changes instead of decrementing locally', async () => {
  mocks.user = { id: 'alice' }; mocks.member.mockResolvedValueOnce(true).mockResolvedValue(false);
  mocks.count.mockResolvedValueOnce(10).mockResolvedValue(25);
  mocks.leave.mockResolvedValue(undefined);
  render(<VolunteerBadge district="Баянзүрх" />);
  fireEvent.click(await screen.findByRole('button', { name: 'listings_volunteer_leave' }));
  await screen.findByText('25');
  expect(mocks.leave).toHaveBeenCalledWith('Баянзүрх');
  expect(mocks.count).toHaveBeenCalledTimes(2);
});
