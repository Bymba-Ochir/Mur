import { test, expect } from './fixtures';
import { loadEnvConfig } from '@next/env';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createAdminClient } from '../../lib/supabaseAdmin';
import { createPublicClient } from '../../lib/supabaseClient';

test.beforeEach(async ({ baseURL }) => {
  loadEnvConfig(resolve(__dirname, '../..'), true);
  const target = new URL(baseURL ?? 'http://localhost:3000');
  if (target.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(target.hostname)
    || process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://127.0.0.1:54321') throw new Error('Security acceptance tests require local app and Supabase');
});

test('anonymous and forged credentials cannot enter privileged mutation routes', async ({ request }) => {
  const id = randomUUID();
  for (const [method, route, body] of [
    ['DELETE', '/api/account/delete', { confirmation: 'УСТГАХ' }],
    ['DELETE', `/api/content/pets/${id}`, undefined],
    ['POST', `/api/pets/${id}/image-processing`, {}],
    ['POST', '/api/reports', { petId: id, reason: 'Спам' }],
    ['POST', '/api/assistant', { message: 'Hello', locale: 'mn' }],
  ] as const) {
    const response = await request.fetch(route, { method, ...(body ? { data: body } : {}) });
    expect(response.status(), route).toBe(401);
  }
  const forged = await request.delete('/api/account/delete', {
    headers: { Authorization: 'Bearer invalid-local-test-token' }, data: { confirmation: 'УСТГАХ', userId: id },
  });
  expect(forged.status()).toBe(401);
  for (const route of ['/api/background-jobs', '/api/vaccine-reminders', '/api/qpay/callback']) {
    const response = await request.get(route, { headers: { Authorization: 'Bearer invalid-local-test-secret' } });
    expect([401, 503], route).toContain(response.status());
  }
});

test('server ignores spoofed identity and blocks cross-user delete, export and private RPC access', async ({ request }) => {
  const admin = createAdminClient();
  const users: string[] = [];
  const petId = randomUUID();
  const phone = '88776655';
  try {
    const clients = [];
    for (let index = 0; index < 2; index++) {
      const email = `security-${randomUUID()}@example.com`, password = `Local-${randomUUID()}-A1!`;
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (created.error || !created.data.user) throw new Error('Local security account creation failed');
      users.push(created.data.user.id);
      const client = createPublicClient();
      const signed = await client.auth.signInWithPassword({ email, password });
      if (signed.error || !signed.data.session) throw new Error('Local security sign-in failed');
      clients.push({ client, token: signed.data.session.access_token });
    }
    const [owner, other] = clients;
    const inserted = await owner.client.from('pets').insert({
      id: petId, created_by: users[0], status: 'lost', type: 'Муур', name: 'Security fixture', phone, phone_hidden: true,
    });
    if (inserted.error) throw new Error('Local security fixture creation failed');
    const ownPhone = await owner.client.rpc('get_own_listing_phone', { target_kind: 'pet', target_id: petId });
    expect(ownPhone.error).toBeNull();
    expect(ownPhone.data).toBe(phone);
    for (const client of [createPublicClient(), other.client]) {
      const visible = await client.from('pets').select('id,phone,phone_hidden').eq('id', petId).single();
      expect(visible.error).toBeNull();
      expect(visible.data?.phone).not.toBe(phone);
      expect(visible.data?.phone_hidden).toBe(true);
    }
    const hidden = await other.client.rpc('get_own_listing_phone', { target_kind: 'pet', target_id: petId });
    expect(hidden.data).not.toBe(phone);
    const privateRows = await other.client.schema('mur_private').from('hidden_listing_phones').select('*');
    expect(privateRows.error).not.toBeNull();
    expect(privateRows.data).toBeNull();

    const spoofed = { Authorization: `Bearer ${other.token}`, 'x-user-id': users[0] };
    const deletion = await request.delete(`/api/content/pets/${petId}?userId=${users[0]}`, { headers: spoofed });
    expect(deletion.status()).toBe(403);
    const stillExists = await owner.client.from('pets').select('id').eq('id', petId).single();
    expect(stillExists.data?.id).toBe(petId);
    const exported = await request.get(`/api/account/export?userId=${users[0]}`, { headers: spoofed });
    expect(exported.status()).toBe(200);
    const payload = await exported.json();
    expect(payload.account.id).toBe(users[1]);
    expect(payload.pets.some((pet: { id: string }) => pet.id === petId)).toBe(false);
    expect(JSON.stringify(payload)).not.toContain(phone);
    const jobClaim = await other.client.rpc('claim_background_job');
    expect(jobClaim.error).not.toBeNull();
    const escalation = await other.client.from('admins').insert({ user_id: users[1] });
    expect(escalation.error).not.toBeNull();
  } finally {
    const deleted = await admin.from('pets').delete().eq('id', petId);
    if (deleted.error) throw new Error('Security pet cleanup failed');
    for (const id of users) {
      const removed = await admin.auth.admin.deleteUser(id);
      if (removed.error) throw new Error('Security account cleanup failed');
      await admin.from('background_jobs').delete().eq('dedupe_key', `avatar:${id}`);
    }
  }
});
