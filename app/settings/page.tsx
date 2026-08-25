'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../../components/ui/Button';
import { useAuth } from '../../lib/useAuth';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function deleteAccount() {
    if (confirmText !== 'УСТГАХ') return;
    setDeleting(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Session олдсонгүй');
      const res = await fetch('/api/account/delete', { method: 'DELETE', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ confirmation: confirmText }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Устгаж чадсангүй');
      await logout();
      router.replace('/');
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Алдаа гарлаа', 'error');
      setDeleting(false);
    }
  }

  if (loading) return <p className="py-10 text-[var(--text-secondary)]">Уншиж байна…</p>;
  if (!user) return <div className="page-header"><h1>Тохиргоо</h1><p>Энэ хэсгийг ашиглахын тулд нэвтэрнэ үү.</p></div>;

  const section = 'mb-[18px] rounded-[var(--r-lg)] border bg-[var(--surface-2)] p-[22px]';
  return <div className="mx-auto max-w-[720px]">
    <div className="eyebrow">Миний бүртгэл</div>
    <h1 className="mb-6 mt-1.5">Тохиргоо</h1>
    <section className={`${section} border-[var(--border-subtle)]`}>
      <h2 className="mb-2.5 text-[19px]">Бүртгэлийн мэдээлэл</h2>
      <p className="leading-[1.6] text-[var(--text-secondary)]">Имэйл: {user.email}</p>
      <p className="font-semibold text-[var(--success-text)]">✓ Имэйлээр баталгаажсан нэвтрэлт</p>
    </section>
    <section className={`${section} border-[color-mix(in_srgb,var(--alert)_35%,var(--border-subtle))]`}>
      <h2 className="mb-2.5 text-[19px]">Бүртгэл устгах</h2>
      <p className="leading-[1.6] text-[var(--text-secondary)]">Таны зар, чат, эрүүл мэндийн мэдээлэл болон захиалга database-ийн холбоосоор бүрмөсөн устна. Энэ үйлдлийг буцаах боломжгүй.</p>
      <label className="mb-2 mt-4 block text-[var(--text-primary)]" htmlFor="delete-confirm">Баталгаажуулахын тулд <strong>УСТГАХ</strong> гэж бичнэ үү</label>
      <input id="delete-confirm" className="field mb-3.5 block w-full" value={confirmText} onChange={(event) => setConfirmText(event.target.value)} autoComplete="off" />
      <Button variant="danger" disabled={confirmText !== 'УСТГАХ' || deleting} onClick={deleteAccount}>{deleting ? 'Устгаж байна…' : 'Бүртгэлээ бүрмөсөн устгах'}</Button>
    </section>
  </div>;
}
