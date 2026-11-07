import { beforeEach, expect, it, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import { subscribeToNotifications } from '../../lib/workflowService';

vi.mock('../../lib/supabase', () => ({ supabase: { channel: vi.fn(), removeChannel: vi.fn() } }));
vi.mock('../../lib/errorTracking', () => ({ reportError: vi.fn() }));

function channelFixture() {
  let listener: (() => void) | undefined;
  let joined: ((status: string) => void) | undefined;
  const channel = {
    on: vi.fn((_event: string, _filter: unknown, callback: () => void) => {
      if (joined) throw new Error('Cannot add postgres_changes after subscribe()');
      listener = callback;
      return channel;
    }),
    subscribe: vi.fn((callback: (status: string) => void) => {
      joined = callback;
      return channel;
    }),
    notify: () => listener?.(),
    reconnect: () => joined?.('SUBSCRIBED'),
  };
  return channel;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(supabase.removeChannel).mockResolvedValue('ok');
});

it('shares changes across the navbar and inbox until the last listener leaves', () => {
  const channel = channelFixture();
  vi.mocked(supabase.channel).mockReturnValue(channel as unknown as ReturnType<typeof supabase.channel>);
  const navbar = vi.fn(), inbox = vi.fn();
  const stopNavbar = subscribeToNotifications('same-account', navbar);
  const stopInbox = subscribeToNotifications('same-account', inbox);

  expect(supabase.channel).toHaveBeenCalledOnce();
  expect(channel.on).toHaveBeenCalledWith('postgres_changes', expect.objectContaining({ filter: 'user_id=eq.same-account' }), expect.any(Function));
  channel.notify();
  expect(navbar).toHaveBeenCalledOnce();
  expect(inbox).toHaveBeenCalledOnce();

  stopInbox();
  channel.reconnect();
  expect(navbar).toHaveBeenCalledTimes(2);
  expect(inbox).toHaveBeenCalledOnce();
  expect(supabase.removeChannel).not.toHaveBeenCalled();

  stopNavbar();
  stopNavbar();
  expect(supabase.removeChannel).toHaveBeenCalledExactlyOnceWith(channel);
});

it('can reopen the inbox before a previous channel finishes closing', () => {
  const closing = channelFixture(), reopened = channelFixture();
  const channels = vi.mocked(supabase.channel);
  channels.mockReturnValueOnce(closing as unknown as ReturnType<typeof supabase.channel>)
    .mockReturnValueOnce(reopened as unknown as ReturnType<typeof supabase.channel>);
  const oldListener = vi.fn(), currentListener = vi.fn();
  const stopOld = subscribeToNotifications('reopened-account', oldListener);
  stopOld();
  const stopNew = subscribeToNotifications('reopened-account', currentListener);

  expect(channels.mock.calls[0][0]).not.toBe(channels.mock.calls[1][0]);
  closing.notify();
  reopened.notify();
  expect(oldListener).not.toHaveBeenCalled();
  expect(currentListener).toHaveBeenCalledOnce();
  stopNew();
});
