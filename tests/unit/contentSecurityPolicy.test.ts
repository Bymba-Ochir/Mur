import { expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { contentSecurityPolicy } from '../../lib/contentSecurityPolicy';
import { proxy } from '../../proxy';

it('restricts production scripts to nonce-authorized code without JavaScript eval', () => {
  const policy = contentSecurityPolicy('generated', false, false);
  const script = policy.split('; ').find(part => part.startsWith('script-src '));
  expect(script).toContain("'nonce-generated'");
  expect(script).toContain("'strict-dynamic'");
  expect(script).toContain("'wasm-unsafe-eval'");
  expect(script).not.toContain("'unsafe-eval'");
  expect(script).not.toContain("'unsafe-inline'");
  expect(policy).not.toContain('*.supabase.co');
  expect(policy).toContain("style-src-attr 'unsafe-inline'");
});

it('replaces forged nonce/CSP even on prefetch requests and prevents shared caching', () => {
  const request = new NextRequest('http://localhost/pets', { headers: { 'x-nonce': 'forged', 'Content-Security-Policy': "script-src * 'unsafe-inline'", 'next-router-prefetch': '1' } });
  const first = proxy(request), second = proxy(request);
  const policy = first.headers.get('Content-Security-Policy');
  expect(policy).not.toContain('forged');
  expect(policy).not.toBe(second.headers.get('Content-Security-Policy'));
  expect(first.headers.get('x-middleware-request-content-security-policy')).toBe(policy);
  expect(first.headers.get('Cache-Control')).toBe('private, no-store');
});
