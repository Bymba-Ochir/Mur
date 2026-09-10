import { expect, it } from 'vitest';
import { isAllowedPushEndpoint } from '../../lib/pushEndpoint';
it('accepts known HTTPS push services', () => {
  expect(isAllowedPushEndpoint('https://fcm.googleapis.com/fcm/send/token')).toBe(true);
  expect(isAllowedPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/token')).toBe(true);
});
it('rejects local destinations, credentials and deceptive hosts', () => {
  for (const url of ['https://127.0.0.1/push', 'https://169.254.169.254/', 'https://fcm.googleapis.com.evil.example/', 'https://user@fcm.googleapis.com/', 'http://fcm.googleapis.com/', 'https://fcm.googleapis.com:8443/']) expect(isAllowedPushEndpoint(url)).toBe(false);
});
