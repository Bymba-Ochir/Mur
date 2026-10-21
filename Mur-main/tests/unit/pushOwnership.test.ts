import { expect, it } from 'vitest';
import { canUpdatePushSubscription as allowed } from '../../lib/pushOwnership';
const keys = { p256dh: 'public-key', auth: 'browser-secret' };
it('rejects guest and other-account changes to an owned subscription', () => {
  expect(allowed({ user_id: 'alice', keys }, null, keys)).toBe(false);
  expect(allowed({ user_id: 'alice', keys }, 'bob', keys)).toBe(false);
  expect(allowed({ user_id: 'alice', keys }, 'alice', keys)).toBe(true);
});
it('requires the existing browser keys to update or claim a guest subscription', () => {
  expect(allowed({ user_id: null, keys }, 'alice', { ...keys, auth: 'different' })).toBe(false);
  expect(allowed({ user_id: null, keys }, 'alice', keys)).toBe(true);
  expect(allowed({ user_id: null, keys }, null, keys)).toBe(true);
});
