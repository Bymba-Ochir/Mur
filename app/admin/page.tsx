'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';
import { useToast } from '../../components/Toast';
import Button from '../../components/ui/Button';
import { relativeTime } from '../../lib/relativeTime';
import { getErrorMessage } from '../../lib/utils';
import {
  isAdmin, fetchAdminStats, fetchReports, resolveReport, fetchAdminListings,
  moderateListing, fetchAdminUsers, moderateUser, fetchAdminAppointments,
  updateAppointmentStatus, fetchAdminDonations, fetchAdminClinics, saveClinic,
  deleteClinic, fetchSystemHealth, fetchAuditLogs,
  fetchChatReports, resolveChatReport,
  type AdminTab, type AdminStats, type AdminListing, type AdminUser,
  type AdminAppointment, type AdminDonation, type AuditLog, type SystemHealth, type ChatReport,
} from '../../lib/adminService';
import type { Report, VetClinic, VetService } from '../../lib/types';

const TABS: {id:AdminTab;label:string}[]=[
  {id:'dashboard',label:'Тойм'},{id:'reports',label:'Зарын report'},{id:'chatReports',label:'Чатын report'},{id:'listings',label:'Алдсан/Олдсон'},
  {id:'adoptions',label:'Үрчлүүлэлт'},{id:'sitting',label:'Асрах'},{id:'users',label:'Хэрэглэгч'},
  {id:'clinics',label:'Эмнэлэг'},{id:'appointments',label:'Цаг захиалга'},
  {id:'donations',label:'Хандив'},{id:'system',label:'Систем'},{id:'audit',label:'Audit'},
];
const EMPTY_CLINIC:VetClinic={id:'',name:'',district:'',address:'',phone:'',hours:'',lat:47.918,lng:106.917,services:['Үзлэг']};

export default function AdminPage(){
  const {user,loading}=useAuth(); const toast=useToast();
  const [allowed,setAllowed]=useState<boolean|null>(null); const [tab,setTab]=useState<AdminTab>('dashboard');
  const [busy,setBusy]=useState(false); const [stats,setStats]=useState<AdminStats|null>(null);
  const [reports,setReports]=useState<Report[]>([]); const [items,setItems]=useState<AdminListing[]>([]);
  const [users,setUsers]=useState<AdminUser[]>([]); const [search,setSearch]=useState('');
  const [appointments,setAppointments]=useState<AdminAppointment[]>([]); const [donations,setDonations]=useState<AdminDonation[]>([]);
  const [clinics,setClinics]=useState<VetClinic[]>([]); const [clinicForm,setClinicForm]=useState<VetClinic|null>(null);
  const [health,setHealth]=useState<SystemHealth|null>(null); const [logs,setLogs]=useState<AuditLog[]>([]);
  const [chatReports,setChatReports]=useState<ChatReport[]>([]);

  const loadTab=useCallback(async(current:AdminTab)=>{setBusy(true);try{
    if(current==='dashboard')setStats(await fetchAdminStats());
    if(current==='reports')setReports(await fetchReports());
    if(current==='chatReports')setChatReports(await fetchChatReports());
    if(current==='listings')setItems(await fetchAdminListings('pet'));
    if(current==='adoptions')setItems(await fetchAdminListings('adoption'));
    if(current==='sitting')setItems(await fetchAdminListings('sitting'));
    if(current==='users')setUsers(await fetchAdminUsers(search));
    if(current==='appointments')setAppointments(await fetchAdminAppointments());
    if(current==='donations')setDonations(await fetchAdminDonations());
    if(current==='clinics')setClinics(await fetchAdminClinics());
    if(current==='system')setHealth(await fetchSystemHealth());
    if(current==='audit')setLogs(await fetchAuditLogs());
  }catch(e){toast(getErrorMessage(e),'error')}finally{setBusy(false)}},[search,toast]);

  useEffect(()=>{
    let cancelled=false;
    if(!loading&&user)isAdmin().then(value=>{if(!cancelled)setAllowed(value)});
    return()=>{cancelled=true};
  },[loading,user]);
  useEffect(()=>{
    if(!allowed)return;
    void Promise.resolve().then(()=>loadTab(tab));
  },[allowed,tab,loadTab]);
  async function act(task:()=>Promise<unknown>,message:string){setBusy(true);try{await task();toast(message,'success');await loadTab(tab)}catch(e){toast(getErrorMessage(e),'error')}finally{setBusy(false)}}
  const money=(n:number)=>new Intl.NumberFormat('mn-MN').format(n)+'₮';
  const statCards=useMemo(()=>stats?[['Хэрэглэгч',stats.users],['Идэвхтэй зар',stats.activePets],['Олдсон',stats.resolvedPets],['Өнөөдөр',stats.todayListings],['Нээлттэй report',stats.openReports],['Үрчлүүлэлт',stats.adoptions],['Асрах зар',stats.sitting],['Хүлээгдэж буй цаг',stats.pendingAppointments],['Төлөгдсөн хандив',money(stats.paidDonations)],['Push бүртгэл',stats.pushSubscriptions]]:[],[stats]);

  if(loading)return <p className="admin-state">Шалгаж байна…</p>;
  if(!user)return <p className="admin-state">Admin хэсэгт нэвтэрч орно уу.</p>;
  if(allowed===null)return <p className="admin-state">Admin эрх шалгаж байна…</p>;
  if(!allowed)return <div className="page-header"><div className="eyebrow">Хязгаарлагдсан</div><h1>Admin эрхгүй байна</h1></div>;
  return <div className="admin-center">
    <div className="admin-head"><div><div className="eyebrow">МӨР удирдлага</div><h1>Admin Center</h1><p>Модераци, хэрэглэгч, үйлчилгээ болон системийн хяналт</p></div><Button variant="ghost" onClick={()=>loadTab(tab)} disabled={busy}>Шинэчлэх</Button></div>
    <nav className="admin-tabs" aria-label="Admin цэс">{TABS.map(x=><button key={x.id} className={tab===x.id?'active':''} onClick={()=>setTab(x.id)}>{x.label}</button>)}</nav>
    {busy&&<div className="admin-progress" role="status">Уншиж байна…</div>}

    {tab==='dashboard'&&<section><h2>Ерөнхий үзүүлэлт</h2><div className="stat-grid">{statCards.map(([k,v])=><article className="stat" key={String(k)}><span>{k}</span><strong>{v}</strong></article>)}</div></section>}

    {tab==='reports'&&<section><SectionTitle title="Мэдээлэгдсэн зар" count={reports.length}/><div className="admin-list">{reports.map(r=><article className="admin-row" key={r.id}><div><strong>{r.reason}</strong><p>{r.pet?<><Link href={`/pets/${r.pet.id}`}>{r.pet.name||r.pet.type}</Link> · {r.pet.district}</>:'Зар устсан'}</p><small>{relativeTime(r.createdAt)}</small></div><div className="actions"><Button size="sm" variant="ghost" disabled={busy} onClick={()=>act(()=>resolveReport(r.id,'dismissed'),'Report хаагдлаа')}>Үл хэрэгсэх</Button><Button size="sm" variant="primary" disabled={busy} onClick={()=>act(()=>resolveReport(r.id,'resolved'),'Шийдвэрлэгдлээ')}>Шийдвэрлэх</Button></div></article>)}</div></section>}

    {tab==='chatReports'&&<section><SectionTitle title="Мэдээлэгдсэн чат" count={chatReports.length}/><div className="admin-list">{chatReports.map(r=><article className="admin-row" key={r.id}><div><strong>{r.reason}</strong><p>Conversation: {r.conversation_id} · User: {r.reported_user_id}</p><small>{relativeTime(r.created_at)}</small></div><div className="actions"><Button size="sm" variant="ghost" onClick={()=>act(()=>resolveChatReport(r.id,'dismissed'),'Report хаагдлаа')}>Үл хэрэгсэх</Button><Button size="sm" onClick={()=>act(()=>resolveChatReport(r.id,'resolved'),'Шийдвэрлэгдлээ')}>Шийдвэрлэх</Button></div></article>)}</div></section>}

    {(['listings','adoptions','sitting'] as AdminTab[]).includes(tab)&&<section><SectionTitle title={tab==='listings'?'Алдсан/олдсон зар':tab==='adoptions'?'Үрчлүүлэх зар':'Асрах үйлчилгээ'} count={items.length}/><div className="admin-list">{items.map(x=><article className="admin-row" key={x.id}><div><strong>{x.title}</strong><p>{x.subtitle} · <Status value={x.status}/></p><small>{relativeTime(x.createdAt)}</small></div><div className="actions">{x.kind==='pet'&&<Button size="sm" variant="ghost" onClick={()=>act(()=>moderateListing(x,'resolve'),'Олдсон гэж тэмдэглэлээ')}>Олдлоо</Button>}<Button size="sm" variant={x.hidden?'primary':'ghost'} onClick={()=>act(()=>moderateListing(x,x.hidden?'show':'hide'),x.hidden?'Нээлээ':'Нуув')}>{x.hidden?'Нээх':'Нуух'}</Button>{x.kind!=='pet'&&<Button size="sm" variant="primary" onClick={()=>act(()=>moderateListing(x,'approve'),'Баталлаа')}>Батлах</Button>}<Button size="sm" variant="danger" onClick={()=>act(()=>moderateListing(x,'reject','Admin татгалзав'),'Татгалзлаа')}>Татгалзах</Button></div></article>)}</div></section>}

    {tab==='users'&&<section><div className="section-tools"><SectionTitle title="Хэрэглэгчид" count={users.length}/><form onSubmit={e=>{e.preventDefault();loadTab('users')}}><input className="field" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Имэйлээр хайх"/><Button size="sm">Хайх</Button></form></div><div className="admin-list">{users.map(x=>{const banned=!!x.banned_until&&new Date(x.banned_until)>new Date();return <article className="admin-row" key={x.user_id}><div><strong>{x.email}</strong><p>{x.pet_count} зар · {x.adoption_count} үрчлүүлэлт · {x.warning_count} анхааруулга</p><small>Бүртгүүлсэн: {new Date(x.created_at).toLocaleDateString('mn-MN')}</small></div><div className="actions"><Button size="sm" variant="ghost" onClick={()=>{const reason=prompt('Анхааруулгын шалтгаан')||'';if(reason)act(()=>moderateUser(x.user_id,'warn',reason),'Анхаарууллаа')}}>Сануулах</Button><Button size="sm" variant={banned?'primary':'danger'} onClick={()=>banned?act(()=>moderateUser(x.user_id,'unban'),'Ban цуцлагдлаа'):(()=>{const reason=prompt('Ban шалтгаан')||'';if(reason)act(()=>moderateUser(x.user_id,'ban',reason,7),'7 хоног ban хийлээ')})()}>{banned?'Unban':'7 хоног ban'}</Button></div></article>})}</div></section>}

    {tab==='appointments'&&<section><SectionTitle title="Цаг захиалга" count={appointments.length}/><div className="admin-list">{appointments.map(x=><article className="admin-row" key={x.id}><div><strong>{x.clinic_id} · {x.service}</strong><p>{x.date} {x.time_slot}</p><Status value={x.status}/></div><select className="compact-select" value={x.status} onChange={e=>act(()=>updateAppointmentStatus(x.id,e.target.value),'Төлөв шинэчлэгдлээ')}><option value="pending">Хүлээгдэж буй</option><option value="confirmed">Баталсан</option><option value="completed">Дууссан</option><option value="cancelled">Цуцалсан</option></select></article>)}</div></section>}

    {tab==='donations'&&<section><SectionTitle title="Хандив" count={donations.length}/><div className="admin-list">{donations.map(x=><article className="admin-row" key={x.id}><div><strong>{money(x.amount)} · {x.is_anonymous?'Нэргүй':x.supporter_name||'Нэргүй'}</strong><p>Invoice: {x.invoice_id||'—'}</p><small>{relativeTime(x.created_at)}</small></div><Status value={x.status}/></article>)}</div></section>}

    {tab==='clinics'&&<section><div className="section-tools"><SectionTitle title="Мал эмнэлэг" count={clinics.length}/><Button size="sm" onClick={()=>setClinicForm({...EMPTY_CLINIC,id:`clinic-${Date.now()}`})}>+ Нэмэх</Button></div>{clinicForm&&<ClinicEditor value={clinicForm} onChange={setClinicForm} onCancel={()=>setClinicForm(null)} onSave={()=>act(async()=>{await saveClinic(clinicForm);setClinicForm(null)},'Эмнэлэг хадгалагдлаа')}/>}<div className="admin-list">{clinics.map(x=><article className="admin-row" key={x.id}><div><strong>{x.name}</strong><p>{x.district} · {x.address}</p><small>{x.phone} · {x.hours}</small></div><div className="actions"><Button size="sm" variant="ghost" onClick={()=>setClinicForm(x)}>Засах</Button><Button size="sm" variant="danger" onClick={()=>confirm('Эмнэлгийг устгах уу?')&&act(()=>deleteClinic(x.id),'Устгалаа')}>Устгах</Button></div></article>)}</div></section>}

    {tab==='system'&&<section><h2>Системийн төлөв</h2>{health&&<div className="stat-grid"><Health label="Database" value={`${(health.databaseSize/1024/1024).toFixed(1)} MB`}/><Health label="Storage зураг" value={health.petPhotos}/><Health label="Failed payment" value={health.failedDonations}/><Health label="24ц pending payment" value={health.stalePendingDonations}/><Health label="Хоцорсон цаг" value={health.overdueAppointments}/><Health label="Сүүлийн admin action" value={health.lastAuditAt?relativeTime(health.lastAuditAt):'Байхгүй'}/></div>}<div className="notice">Sentry алдаа, Vercel deployment болон backup-ийн төлөвийг тус тусын dashboard-аас шалгана. Secret түлхүүрүүд admin UI-д харагдахгүй.</div></section>}

    {tab==='audit'&&<section><SectionTitle title="Admin audit log" count={logs.length}/><div className="admin-list">{logs.map(x=><article className="admin-row" key={x.id}><div><strong>{x.action}</strong><p>{x.target_type} · {x.target_id||'—'}{x.reason?' · '+x.reason:''}</p><small>{new Date(x.created_at).toLocaleString('mn-MN')}</small></div></article>)}</div></section>}
    <style jsx>{styles}</style>
  </div>
}

function SectionTitle({title,count}:{title:string;count:number}){return <h2>{title} <span className="count">{count}</span></h2>}
function Status({value}:{value:string}){return <span className={`status status-${value}`}>{value}</span>}
function Health({label,value}:{label:string;value:string|number}){return <article className="stat"><span>{label}</span><strong>{value}</strong></article>}
function ClinicEditor({value,onChange,onCancel,onSave}:{value:VetClinic;onChange:(x:VetClinic)=>void;onCancel:()=>void;onSave:()=>void}){
  const set=(k:keyof VetClinic,v:unknown)=>onChange({...value,[k]:v});
  const services:VetService[]=['Үзлэг','Вакцин','Мэс засал','Шүд арчилгаа'];
  return <div className="editor"><div className="editor-grid"><input className="field" value={value.name} onChange={e=>set('name',e.target.value)} placeholder="Нэр"/><input className="field" value={value.district} onChange={e=>set('district',e.target.value)} placeholder="Дүүрэг"/><input className="field" value={value.address} onChange={e=>set('address',e.target.value)} placeholder="Хаяг"/><input className="field" value={value.phone} onChange={e=>set('phone',e.target.value)} placeholder="Утас"/><input className="field" value={value.hours} onChange={e=>set('hours',e.target.value)} placeholder="Ажиллах цаг"/><input className="field" type="number" value={value.lat} onChange={e=>set('lat',Number(e.target.value))} placeholder="Latitude"/><input className="field" type="number" value={value.lng} onChange={e=>set('lng',Number(e.target.value))} placeholder="Longitude"/></div><div className="service-checks">{services.map(s=><label key={s}><input type="checkbox" checked={value.services.includes(s)} onChange={e=>set('services',e.target.checked?[...value.services,s]:value.services.filter(x=>x!==s))}/>{s}</label>)}</div><div className="actions"><Button size="sm" variant="ghost" onClick={onCancel}>Болих</Button><Button size="sm" onClick={onSave} disabled={!value.name||!value.address}>Хадгалах</Button></div></div>
}

const styles=`
.admin-center{max-width:1240px;margin:0 auto}.admin-state{color:var(--muted);padding:40px 0}.admin-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:24px}.admin-head h1{margin:0 0 6px}.admin-head p{color:var(--text-secondary)}.admin-tabs{display:flex;gap:7px;overflow-x:auto;padding:5px;margin-bottom:28px;background:var(--surface-2);border:1px solid var(--border-subtle);border-radius:var(--r-lg)}.admin-tabs button{border:0;background:transparent;color:var(--text-secondary);padding:10px 14px;border-radius:var(--r-md);white-space:nowrap;font-weight:600;cursor:pointer}.admin-tabs button.active{background:var(--grad-brand);color:#fff}.admin-progress{position:fixed;right:20px;bottom:20px;z-index:30;background:var(--ink);color:var(--surface-1);padding:10px 16px;border-radius:var(--r-pill)}section h2{font-size:20px;margin-bottom:16px}.count{font:600 12px var(--font-body);padding:4px 8px;border-radius:99px;background:var(--surface-3);color:var(--primary)}.stat-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}.stat{padding:18px;background:var(--surface-2);border:1px solid var(--border-subtle);border-radius:var(--r-lg);box-shadow:var(--shadow-sm)}.stat span{display:block;color:var(--text-secondary);font-size:12px}.stat strong{display:block;margin-top:8px;color:var(--primary);font:700 24px var(--font-display)}.admin-list{display:flex;flex-direction:column;gap:10px}.admin-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;background:var(--surface-2);border:1px solid var(--border-subtle);border-radius:var(--r-md);box-shadow:var(--shadow-xs)}.admin-row>div:first-child{min-width:0}.admin-row strong{color:var(--text-primary)}.admin-row p{margin:4px 0;color:var(--text-secondary);font-size:13px}.admin-row small{color:var(--text-tertiary)}.admin-row a{color:var(--primary)}.actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.status{display:inline-flex;padding:4px 9px;border-radius:99px;background:var(--surface-3);color:var(--text-secondary);font-size:11px;font-weight:700}.status-paid,.status-approved,.status-completed,.status-confirmed,.status-active{color:var(--success-text);background:var(--success-bg)}.status-failed,.status-rejected,.status-cancelled,.status-hidden{color:var(--alert);background:color-mix(in srgb,var(--alert) 10%,transparent)}.status-pending,.status-open{color:#8a6410;background:color-mix(in srgb,var(--warning) 25%,transparent)}.section-tools{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}.section-tools h2{margin:0}.section-tools form{display:flex;gap:8px;max-width:380px}.compact-select{padding:9px 12px;border:1px solid var(--border-subtle);border-radius:var(--r-sm);background:var(--surface-2);color:var(--text-primary)}.editor{margin-bottom:18px;padding:18px;background:var(--surface-2);border:1px solid var(--primary-light);border-radius:var(--r-lg)}.editor-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.service-checks{display:flex;gap:14px;flex-wrap:wrap;margin:14px 0;color:var(--text-secondary);font-size:13px}.service-checks label{display:flex;gap:6px;align-items:center}.notice{margin-top:18px;padding:16px;border-left:4px solid var(--warning);background:var(--surface-2);border-radius:var(--r-md);color:var(--text-secondary)}
@media(max-width:1000px){.stat-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:700px){.admin-head{align-items:flex-start}.stat-grid{grid-template-columns:repeat(2,1fr)}.admin-row{align-items:flex-start;flex-direction:column}.actions{width:100%;justify-content:flex-start}.section-tools{align-items:flex-start;flex-direction:column}.section-tools form{width:100%;max-width:none}.editor-grid{grid-template-columns:1fr}}@media(max-width:420px){.stat-grid{grid-template-columns:1fr}.admin-tabs{margin-left:-8px;margin-right:-8px}.admin-head{flex-direction:column}.admin-head :global(.btn-base){width:100%}}
`;
