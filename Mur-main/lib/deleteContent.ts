'use client';
import { supabase } from './supabase';

export type DeletableContentKind = 'pet' | 'adoption' | 'sitting';

export async function deleteContent(kind: DeletableContentKind, id: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Эхлээд нэвтэрнэ үү');
  const response = await fetch(`/api/content/${kind}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || 'Зарыг устгаж чадсангүй');
  }
}
