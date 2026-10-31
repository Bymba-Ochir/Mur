import { afterEach, describe, expect, it, vi } from 'vitest';
import { getClientIp } from '../../lib/rateLimit';
afterEach(() => vi.unstubAllEnvs());

function request(headers: Record<string, string>) { return new Request('https://mur.test', { headers }); }

describe('trusted IP quota identities', () => {
  it('ignores spoofed forwarding headers outside Vercel', () => {
    vi.stubEnv('VERCEL', '');
    expect(getClientIp(request({ 'x-forwarded-for': '203.0.113.1', 'x-real-ip': '203.0.113.2', 'x-vercel-forwarded-for': '203.0.113.3' }))).toBe('unknown');
  });
  it('prefers the platform-owned forwarded header on Vercel', () => {
    vi.stubEnv('VERCEL', '1');
    expect(getClientIp(request({ 'x-vercel-forwarded-for': '203.0.113.1', 'x-forwarded-for': '203.0.113.2', 'x-real-ip': '203.0.113.3' }))).toBe('203.0.113.1');
    expect(getClientIp(request({ 'x-forwarded-for': '203.0.113.2' }))).toBe('203.0.113.2');
  });
  it('canonicalizes equivalent IPv6 spellings and groups a /64', () => {
    vi.stubEnv('VERCEL', '1');
    for (const ip of ['2001:db8::1', '2001:0db8:0000:0000::2', '2001:db8::abcd']) {
      expect(getClientIp(request({ 'x-vercel-forwarded-for': ip }))).toBe('2001:db8:0:0::/64');
    }
    expect(getClientIp(request({ 'x-vercel-forwarded-for': '::ffff:203.0.113.1' }))).toBe('203.0.113.1');
  });
  it('uses a shared fallback for malformed or missing platform IPs', () => {
    vi.stubEnv('VERCEL', '1');
    for (const value of ['', 'random-browser-value', '203.0.113.1, 203.0.113.2']) {
      expect(getClientIp(request({ 'x-vercel-forwarded-for': value }))).toBe('unknown');
    }
  });
});
