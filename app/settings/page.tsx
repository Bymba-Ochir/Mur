'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../../components/ui/Button';
import { useAuth } from '../../lib/useAuth';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function SettingsPage(){
  const {user,loading,logout}=useAuth();
  const router=useRouter(); const toast=useToast();
  const [confirmText,setConfirmText]=useState(''); const [deleting,setDeleting]=useState(false);

  async function deleteAccount(){
    if(confirmText!=='УСТГАХ')return;
    setDeleting(true);
    try{
      const {data}=await supabase.auth.getSession();
      const token=data.session?.access_token;
      if(!token)throw new Error('Session олдсонгүй');
      const res=await fetch('/api/account/delete',{method:'DELETE',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({confirmation:confirmText})});
      const result=await res.json();
      if(!res.ok)throw new Error(result.error||'Устгаж чадсангүй');
      await logout(); router.replace('/'); router.refresh();
    }catch(e){toast(e instanceof Error?e.message:'Алдаа гарлаа','error');setDeleting(false)}
  }

  if(loading)return <p className="settings-state">Уншиж байна…</p>;
  if(!user)return <div className="page-header"><h1>Тохиргоо</h1><p>Энэ хэсгийг ашиглахын тулд нэвтэрнэ үү.</p></div>;
  return <div className="settings-page">
    <div className="eyebrow">Миний бүртгэл</div><h1>Тохиргоо</h1>
    <section><h2>Бүртгэлийн мэдээлэл</h2><p className="muted">Имэйл: {user.email}</p><p className="verified">✓ Имэйлээр баталгаажсан нэвтрэлт</p></section>
    <section className="danger-zone"><h2>Бүртгэл устгах</h2><p>Таны зар, чат, эрүүл мэндийн мэдээлэл болон захиалга database-ийн холбоосоор бүрмөсөн устна. Энэ үйлдлийг буцаах боломжгүй.</p><label htmlFor="delete-confirm">Баталгаажуулахын тулд <strong>УСТГАХ</strong> гэж бичнэ үү</label><input id="delete-confirm" className="field" value={confirmText} onChange={e=>setConfirmText(e.target.value)} autoComplete="off"/><Button variant="danger" disabled={confirmText!=='УСТГАХ'||deleting} onClick={deleteAccount}>{deleting?'Устгаж байна…':'Бүртгэлээ бүрмөсөн устгах'}</Button></section>
    <style jsx>{`.settings-page{max-width:720px;margin:0 auto}.settings-page>h1{margin:6px 0 24px}.settings-page section{padding:22px;background:var(--surface-2);border:1px solid var(--border-subtle);border-radius:var(--r-lg);margin-bottom:18px}.settings-page h2{font-size:19px;margin-bottom:10px}.muted,.danger-zone p{color:var(--text-secondary);line-height:1.6}.verified{color:var(--success-text);font-weight:600}.danger-zone{border-color:color-mix(in srgb,var(--alert) 35%,var(--border-subtle))!important}.danger-zone label{display:block;margin:16px 0 8px;color:var(--text-primary)}.danger-zone .field{display:block;width:100%;margin-bottom:14px}.settings-state{padding:40px 0;color:var(--text-secondary)}`}</style>
  </div>
}
