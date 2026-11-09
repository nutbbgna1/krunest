import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BadgeDollarSign, BookOpen, Boxes, Landmark, CheckCircle2, CreditCard, Database, Eye, FolderTree, LayoutDashboard, Mail, Megaphone, PackageCheck, Plug, RefreshCw, RotateCcw, Search, ShieldCheck, Trash2, UploadCloud, Users } from 'lucide-react';
import { api } from '../lib/api';
import { SlipViewer } from '../components/common/SlipViewer';
import { PaymentAccounts } from '../components/admin/PaymentAccounts';
import { OfflineInstaller } from '../components/admin/OfflineInstaller';
import { CategoryManager, PluginMeta, UploadForm } from '../components/admin/PluginPricing';
import { PluginRecords } from '../components/admin/PluginRecords';
import { MembershipSettings } from '../components/admin/MembershipSettings';
import { CustomerPriceTiers } from '../components/admin/CustomerPriceTiers';
import { CustomerPriceTier, PluginCategory } from '../types';

type Tab='dashboard'|'payments'|'accounts'|'users'|'systems'|'customer-tiers'|'membership'|'announcements'|'emails'|'logs'|'system';
const ADMIN_TABS: Tab[] = ['dashboard','payments','accounts','users','systems','customer-tiers','membership','announcements','emails','logs','system'];
const savedAdminTab = (): Tab => {
  const urlTab = new URLSearchParams(window.location.search).get('admin') as Tab | null;
  if (urlTab && ADMIN_TABS.includes(urlTab)) return urlTab;
  try {
    const value = window.localStorage.getItem('krunest:admin-tab') as Tab | null;
    return value && ADMIN_TABS.includes(value) ? value : 'dashboard';
  } catch { return 'dashboard'; }
};

export function AdminCenter(){
  const [tab,setTab]=useState<Tab>(savedAdminTab);
  const [data,setData]=useState<any>({summary:{},orders:[],users:[],plugins:[],announcements:[],emails:[],logs:[],supabase:null});
  const [categories,setCategories]=useState<PluginCategory[]>([]);
  const [customerTiers,setCustomerTiers]=useState<CustomerPriceTier[]>([]);
  const [viewing,setViewing]=useState<any>(null);
  const [query,setQuery]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const load=async()=>{setError('');try{const [summary,orders,users,plugins,announcements,emails,logs,supabase,nextCategories,nextCustomerTiers]=await Promise.all([api('/admin/summary'),api('/admin/orders'),api('/admin/users'),api('/admin/plugins'),api('/admin/announcements'),api('/admin/emails'),api('/admin/audit'),api('/admin/supabase'),api<PluginCategory[]>('/categories'),api<CustomerPriceTier[]>('/admin/customer-price-tiers')]);setData({summary,orders,users,plugins,announcements,emails,logs,supabase});setCategories(nextCategories);setCustomerTiers(nextCustomerTiers)}catch(x){setError((x as Error).message)}};
  useEffect(()=>{load()},[]);
  useEffect(()=>{
    try{window.localStorage.setItem('krunest:admin-tab',tab)}catch{/* storage may be unavailable */}
    const url=new URL(window.location.href);
    url.searchParams.set('view','admin');
    url.searchParams.set('admin',tab);
    window.history.replaceState({},document.title,url);
  },[tab]);
  const act=async(task:()=>Promise<unknown>,ok:string)=>{setBusy(true);setError('');setMessage('');try{await task();setMessage(ok);await load()}catch(x){setError((x as Error).message)}finally{setBusy(false)}};
  const users=useMemo(()=>data.users.filter((u:any)=>`${u.name} ${u.email} ${u.organization}`.toLowerCase().includes(query.toLowerCase())),[data.users,query]);
  const nav=[['dashboard','ภาพรวม',LayoutDashboard],['payments','การชำระเงิน',CreditCard],['accounts','บัญชีรับเงิน',Landmark],['users','ผู้ใช้งาน',Users],['customer-tiers','ระดับราคาลูกค้า',BadgeDollarSign],['systems','ระบบงาน',Plug],['membership','แพ็กเกจสมาชิก',ShieldCheck],['announcements','ประกาศ',Megaphone],['emails','อีเมลคิว',Mail],['logs','บันทึกระบบ',Activity],['system','สถานะระบบ',Database]] as const;
  const openSlip=(id:number)=>setViewing(data.orders.find((o:any)=>o.id===id)||null);
  const s=data.summary;

  return <main className="flex-1 min-h-[calc(100vh-4rem)] bg-[#edf3fb]"><div className="grid lg:grid-cols-[245px_1fr] min-h-[calc(100vh-4rem)]">
    <aside className="overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-indigo-950 p-3 text-white lg:p-5"><div className="mb-3 flex items-center gap-3 px-2 py-2 lg:mb-6 lg:px-3 lg:py-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/20 lg:h-11 lg:w-11 lg:rounded-2xl"><ShieldCheck className="text-blue-300"/></div><div><div className="font-extrabold">ศูนย์ผู้ดูแล</div><div className="text-[11px] text-blue-200">KRUNEST CONTROL</div></div></div><nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">{nav.map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} className={`flex w-auto shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition lg:w-full lg:gap-3 lg:px-4 lg:py-3 lg:text-sm ${tab===id?'bg-blue-600 shadow-lg':'text-slate-300 hover:bg-white/5'}`}><Icon className="h-4 w-4"/>{label}{id==='payments'&&s.pendingOrders>0&&<span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-[10px] text-slate-950">{s.pendingOrders}</span>}</button>)}</nav></aside>
    <section className="p-5 lg:p-8 overflow-hidden"><div className="flex flex-wrap justify-between items-center gap-4 mb-6"><div><div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Administration</div><h1 className="text-3xl font-black text-slate-900">{nav.find(x=>x[0]===tab)?.[1]}</h1></div><button disabled={busy} onClick={load} className="secondary-button flex gap-2"><RefreshCw className={`w-4 h-4 ${busy?'animate-spin':''}`}/>รีเฟรชข้อมูล</button></div>
      {message&&<Alert tone="good">{message}</Alert>}{error&&<Alert tone="bad">{error}</Alert>}

      {tab==='dashboard'&&<><div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{[['ผู้ใช้ทั้งหมด',s.users||0,Users],['รอตรวจชำระ',s.pendingOrders||0,CreditCard],['รายรับสะสม',`฿${(s.revenue||0).toLocaleString()}`,Activity],['ระบบจริงที่เปิด',s.activePrograms||0,Boxes],['สมาชิกใช้งาน',s.activeSubscriptions||0,ShieldCheck],['ปลั๊กอินเปิดใช้',s.activePlugins||0,Plug],['อีเมลรอส่ง',s.queuedEmails||0,Mail],['ฐานข้อมูล',data.supabase?.connected?'เชื่อมต่อแล้ว':'รอตรวจสอบ',Database]].map(([label,value,Icon]:any)=><div className="portal-card p-5" key={label}><Icon className="w-6 h-6 text-blue-600 mb-5"/><div className="text-2xl font-black">{value}</div><div className="text-xs text-slate-500 mt-1">{label}</div></div>)}</div><div className="grid xl:grid-cols-2 gap-5 mt-5"><Panel title="รายการชำระล่าสุด"><Table headers={['อ้างอิง','ผู้ใช้','ยอด','สถานะ']} rows={data.orders.slice(0,5).map((o:any)=>[o.reference,o.name,`฿${o.amount.toLocaleString()}`,<Status value={o.status}/>])}/></Panel><Panel title="ระบบงานจริง"><div className="grid grid-cols-2 gap-3"><Metric label="ติดตั้งทั้งหมด" value={data.plugins.length}/><Metric label="เปิดใช้งาน" value={data.plugins.filter((p:any)=>p.status==='active').length}/></div><button onClick={()=>setTab('systems')} className="secondary-button mt-4 w-full">จัดการระบบงาน</button></Panel></div></>}

      {tab==='accounts'&&<Panel title="บัญชีสำหรับรับชำระเงิน (แสดงให้ลูกค้าตอนสั่งซื้อ)"><PaymentAccounts busy={busy} act={act}/></Panel>}
      {tab==='payments'&&<Panel title="ตรวจสอบหลักฐานการชำระเงิน"><Table headers={['อ้างอิง','สมาชิก','รายการ','ยอด','สถานะ','หลักฐาน','จัดการ']} rows={data.orders.map((o:any)=>[o.reference,<div><b>{o.name}</b><div className="text-xs text-slate-400">{o.email}</div></div>,o.target_id,`฿${o.amount.toLocaleString()}`,<Status value={o.status}/>,o.file_name?<button onClick={()=>openSlip(o.id)} className="mini-button bg-blue-50 text-blue-700 inline-flex gap-1"><Eye className="w-3.5 h-3.5"/>ดูสลิป</button>:<span className="text-xs text-slate-400">ไม่มีไฟล์</span>,['reviewing','pending'].includes(o.status)?(!o.file_name&&o.amount>0)?<span className="text-xs text-amber-600">รอลูกค้าแนบสลิป</span>:<div className="flex gap-2"><button disabled={busy} onClick={()=>act(()=>api(`/admin/orders/${o.id}/review`,{method:'POST',body:{decision:'approve'}}),'อนุมัติและออกใบเสร็จแล้ว')} className="mini-button bg-emerald-600 text-white">อนุมัติ</button><button disabled={busy} onClick={()=>act(()=>api(`/admin/orders/${o.id}/review`,{method:'POST',body:{decision:'reject',reason:'หลักฐานไม่ถูกต้อง กรุณาส่งใหม่'}}),'ปฏิเสธรายการแล้ว')} className="mini-button bg-rose-50 text-rose-700">ไม่ผ่าน</button></div>:<span className="text-xs text-slate-400">ตรวจแล้ว</span>])}/></Panel>}

      {tab==='users'&&<Panel title="ผู้ใช้งานและสิทธิ์เจ้าหน้าที่"><div className="relative max-w-sm mb-4"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} className="form-field mt-0 pl-10" placeholder="ค้นหาชื่อ อีเมล หรือหน่วยงาน"/></div><Table headers={['ชื่อ','อีเมล','หน่วยงาน','ยืนยัน','บทบาท']} rows={users.map((u:any)=>[u.name,u.email,u.organization||'-',u.email_verified?'แล้ว':'ยัง',<select disabled={busy} value={u.role} onChange={e=>act(()=>api(`/admin/users/${u.id}`,{method:'PATCH',body:{role:e.target.value}}),'อัปเดตบทบาทแล้ว')} className="border rounded-lg px-2 py-1 text-xs"><option value="member">สมาชิก</option><option value="staff">เจ้าหน้าที่</option><option value="admin">ผู้ดูแล</option></select>])}/></Panel>}

      {tab==='systems'&&<SystemsWorkspace data={data} categories={categories} customerTiers={customerTiers} busy={busy} act={act} onError={setError}/>}
      {tab==='customer-tiers'&&<CustomerPriceTiers tiers={customerTiers} busy={busy} act={act}/>}
      {tab==='membership'&&<MembershipSettings/>}

      {tab==='announcements'&&<div className="grid xl:grid-cols-[.8fr_1.2fr] gap-5"><Panel title="สร้างประกาศ"><form onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const f=new FormData(form);act(()=>api('/admin/announcements',{method:'POST',body:{title:f.get('title'),message:f.get('message')}}),'เผยแพร่ประกาศแล้ว');form.reset()}} className="space-y-3"><input name="title" required className="form-field mt-0" placeholder="หัวข้อประกาศ"/><textarea name="message" required className="form-field mt-0 min-h-28" placeholder="รายละเอียด"/><button disabled={busy} className="primary-button flex gap-2"><Megaphone className="w-4 h-4"/>เผยแพร่</button></form></Panel><Panel title="ประกาศทั้งหมด"><Table headers={['หัวข้อ','วันที่','สถานะ','จัดการ']} rows={data.announcements.map((a:any)=>[<div><b>{a.title}</b><div className="max-w-md truncate text-xs text-slate-400">{a.message}</div></div>,new Date(a.created_at).toLocaleString('th-TH'),a.active?<Status value="active"/>:<Status value="inactive"/>,<button disabled={busy} onClick={()=>act(()=>api(`/admin/announcements/${a.id}`,{method:'PATCH',body:{active:!a.active}}),a.active?'ซ่อนประกาศแล้ว':'เปิดประกาศแล้ว')} className="secondary-button">{a.active?'ซ่อน':'เปิด'}</button>])}/></Panel></div>}

      {tab==='emails'&&<Panel title="คิวอีเมลและสถานะการส่ง"><Table headers={['ผู้รับ','เทมเพลต','สถานะ','ครั้งที่ลอง','เวลา','จัดการ']} rows={data.emails.map((e:any)=>[e.recipient,e.template,<Status value={e.status}/>,e.attempts,new Date(e.created_at).toLocaleString('th-TH'),e.status==='sent'?'-':<button disabled={busy} onClick={()=>act(()=>api(`/admin/emails/${e.id}/retry`,{method:'POST',body:{}}),'นำอีเมลกลับเข้าคิวแล้ว')} className="mini-button bg-blue-50 text-blue-700 inline-flex gap-1"><RotateCcw className="w-3.5 h-3.5"/>ลองใหม่</button>])}/></Panel>}
      {tab==='logs'&&<Panel title="Audit log"><Table headers={['เวลา','ผู้ดำเนินการ','การทำงาน','ประเภท','รหัส']} rows={data.logs.map((l:any)=>[new Date(l.created_at).toLocaleString('th-TH'),l.actor_email||'system',l.action,l.subject_type,l.subject_id||'-'])}/></Panel>}
      {tab==='system'&&<div className="grid lg:grid-cols-2 gap-5"><Panel title="ฐานข้อมูลหลัก"><div className="flex items-center gap-3"><div className={`w-12 h-12 rounded-2xl grid place-items-center ${data.supabase?.connected?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{data.supabase?.connected?<CheckCircle2/>:<Database/>}</div><div><div className="font-extrabold">Supabase {data.supabase?.connected?'เชื่อมต่อแล้ว':'ยังไม่พร้อม'}</div><div className="text-xs text-slate-500">{data.supabase?.configured?'ตั้งค่าการเชื่อมต่อแล้ว':'ยังไม่ได้ตั้งค่า Environment'}</div></div></div>{data.supabase?.mirror&&<div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><div>สถานะซิงก์: <b>{data.supabase.mirror.mode}</b></div><div>แหล่งข้อมูลตอนเริ่มระบบ: <b>{data.supabase.mirror.bootstrapMode}</b></div>{data.supabase.mirror.verification&&<div className={data.supabase.mirror.verification.ok?'text-emerald-700':'text-amber-700'}>ตรวจจำนวนข้อมูล: <b>{data.supabase.mirror.verification.ok?'ตรงกัน':'พบความต่าง'}</b>{!data.supabase.mirror.verification.ok&&` (${Object.keys(data.supabase.mirror.verification.differences||{}).join(', ')})`}</div>}{data.supabase.mirror.pending?.length>0&&<div>รอส่ง: {data.supabase.mirror.pending.join(', ')}</div>}{data.supabase.mirror.lastError&&<div className="mt-1 text-rose-600">ล่าสุดผิดพลาด: {data.supabase.mirror.lastError}</div>}<div>Storage ไฟล์ติดตั้ง: {data.supabase.storage?'พร้อม':'ยังไม่พร้อม'}</div></div>}<button disabled={busy||!data.supabase?.configured} onClick={()=>act(()=>api('/admin/supabase/sync',{method:'POST',body:{}}),'ซิงก์ข้อมูลไป Supabase แล้ว')} className="primary-button mt-5">ซิงก์ข้อมูลตอนนี้</button></Panel><Panel title="สถานะเนื้อหา"><div className="space-y-3"><Metric label="ระบบจริงที่เปิดเผยแพร่" value={s.activePrograms||0}/><Metric label="ปลั๊กอินที่เปิดใช้งาน" value={s.activePlugins||0}/><Metric label="ระบบตัวอย่างในหน้าร้าน" value={0}/></div></Panel></div>}
    </section>
  </div>{viewing&&<SlipViewer order={viewing} base="/admin" busy={busy} onClose={()=>setViewing(null)} onDecide={(decision,reason)=>act(async()=>{await api(`/admin/orders/${viewing.id}/review`,{method:'POST',body:{decision,reason}});setViewing(null)},decision==='approve'?'อนุมัติและออกใบเสร็จแล้ว':'ปฏิเสธรายการแล้ว')}/>}</main>;
}

function SystemsWorkspace({data,categories,customerTiers,busy,act,onError}:{data:any;categories:PluginCategory[];customerTiers:CustomerPriceTier[];busy:boolean;act:(task:()=>Promise<unknown>,ok:string)=>void;onError:(message:string)=>void}){
  const plugins=data.plugins as any[];
  const activeCount=plugins.filter((plugin)=>plugin.status==='active').length;
  const stats=[
    ['ระบบที่ติดตั้ง',plugins.length,PackageCheck,'bg-blue-50 text-blue-700'],
    ['กำลังเผยแพร่',activeCount,CheckCircle2,'bg-emerald-50 text-emerald-700'],
    ['หมวดหมู่',categories.length,FolderTree,'bg-indigo-50 text-indigo-700'],
    ['ระดับราคา',customerTiers.length,BadgeDollarSign,'bg-sky-50 text-sky-700'],
  ] as const;

  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-6 text-white shadow-xl shadow-blue-950/15 lg:p-8">
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"/>
      <div className="relative max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-blue-100"><Plug className="h-3.5 w-3.5"/>PLUGIN WORKSPACE</div>
        <h2 className="mt-4 text-2xl font-black tracking-tight lg:text-3xl">ติดตั้งและดูแลระบบงานจากที่เดียว</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">อัปโหลดไฟล์ ZIP กำหนดราคาและสิทธิ์ จัดหมวดหมู่ แล้วเปิดเผยแพร่ให้สมาชิกใช้งานได้ทันที</p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-blue-100"><span>01 ตรวจไฟล์ ZIP</span><span>02 ตั้งค่าหน้าร้าน</span><span>03 เปิดเผยแพร่</span></div>
      </div>
    </section>

    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {stats.map(([label,value,Icon,tone])=><div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm lg:p-5"><div className="flex items-center justify-between gap-3"><div><div className="text-2xl font-black text-slate-900">{value}</div><div className="mt-1 text-xs font-semibold text-slate-500">{label}</div></div><div className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon className="h-5 w-5"/></div></div></div>)}
    </section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.85fr)]">
      <div className="portal-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 lg:px-6">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><UploadCloud className="h-5 w-5"/></div><div><div className="text-[11px] font-black uppercase tracking-widest text-blue-600">ขั้นตอนที่ 1</div><h3 className="font-black text-slate-900">ติดตั้งหรืออัปเดต Plugin ZIP</h3></div></div>
          <span className="rounded-full bg-slate-200/70 px-3 py-1 text-[11px] font-bold text-slate-600">รองรับ ZIP สูงสุด 20MB</span>
        </div>
        <div className="p-5 lg:p-6"><UploadForm categories={categories} customerTiers={customerTiers} busy={busy} act={act} onError={onError}/></div>
      </div>

      <div className="portal-card overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><FolderTree className="h-5 w-5"/></div><div><div className="text-[11px] font-black uppercase tracking-widest text-indigo-600">โครงสร้างหน้าร้าน</div><h3 className="font-black text-slate-900">หมวดหมู่ระบบงาน</h3></div></div></div>
        <div className="p-5"><CategoryManager key={categories.map(c=>c.id+c.label).join()} categories={categories} busy={busy} act={act}/></div>
      </div>
    </section>

    <PluginRecords plugins={plugins}/>

    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><div className="text-[11px] font-black uppercase tracking-widest text-blue-600">ระบบที่พร้อมจัดการ</div><h3 className="mt-1 text-xl font-black text-slate-900">รายการ Plugin ที่ติดตั้ง</h3></div><span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">ทั้งหมด {plugins.length} ระบบ</span></div>
      {plugins.length?<div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{plugins.map((p:any)=><article key={p.id} className="portal-card flex flex-col overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-start justify-between gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700"><Boxes className="h-5 w-5"/></div><Status value={p.status}/></div><div className="mt-4 min-w-0"><h4 className="truncate text-base font-black text-slate-900">{p.name}</h4><div className="mt-1 truncate text-xs text-slate-500">{p.slug} · v{p.version}</div></div>{p.manifest?.type==='html-standalone'?<div className="mt-4 grid grid-cols-2 gap-2"><a href={`/plugins/${p.slug}/demo/`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"><Eye className="h-3.5 w-3.5"/>ทดลองใช้</a><a href={`/plugins/${p.slug}/manual`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"><BookOpen className="h-3.5 w-3.5"/>คู่มือ</a></div>:null}<PluginMeta plugin={p} categories={categories} customerTiers={customerTiers} busy={busy} act={act}/><OfflineInstaller plugin={p} busy={busy} act={act}/><div className="mt-auto flex gap-2 pt-4"><button disabled={busy} onClick={()=>act(()=>api(`/admin/plugins/${p.id}/toggle`,{method:'POST',body:{}}),p.status==='active'?'ปิดระบบแล้ว':'เปิดระบบจริงแล้ว')} className="secondary-button flex-1">{p.status==='active'?'ปิดเผยแพร่':'เปิดเผยแพร่'}</button><button disabled={busy} onClick={()=>{if(window.confirm(`ถอนการติดตั้ง ${p.name} หรือไม่`))act(()=>api(`/admin/plugins/${p.id}`,{method:'DELETE'}),'ถอนการติดตั้งแล้ว')}} aria-label={`ถอนการติดตั้ง ${p.name}`} className="mini-button inline-flex items-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5"/>ลบ</button></div></article>)}</div>:<div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Plug className="h-6 w-6"/></div><h4 className="mt-4 font-black text-slate-900">ยังไม่มี Plugin ที่ติดตั้ง</h4><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">เริ่มจากเลือกไฟล์ ZIP ด้านบน กำหนดระดับราคา แล้วกดตรวจสอบและติดตั้ง</p></div>}
    </section>
  </div>;
}

function Status({value}:{value:string}){const good=['active','approved','sent','completed'].includes(value);const warn=['pending','reviewing','queued','running'].includes(value);return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${good?'bg-emerald-50 text-emerald-700':warn?'bg-amber-50 text-amber-700':'bg-slate-100 text-slate-600'}`}>{value}</span>}
function Metric({label,value}:{label:string;value:React.ReactNode}){return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="text-2xl font-black text-slate-900">{value}</div><div className="mt-1 text-xs text-slate-500">{label}</div></div>}
function Alert({tone,children}:{tone:'good'|'bad';children:React.ReactNode}){return <div className={`mb-4 p-3 border rounded-xl text-sm ${tone==='good'?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-rose-50 text-rose-700 border-rose-200'}`}>{children}</div>}
function Empty({text}:{text:string}){return <div className="portal-card p-10 text-center text-sm text-slate-400 md:col-span-2 xl:col-span-3">{text}</div>}
function Panel({title,children}:{title:string;children:React.ReactNode}){return <div className="portal-card overflow-hidden"><div className="px-5 py-4 border-b border-slate-100 font-extrabold">{title}</div><div className="p-5">{children}</div></div>}
function Table({headers,rows}:{headers:string[];rows:React.ReactNode[][]}){return <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left text-xs text-slate-500">{headers.map(h=><th className="p-3 whitespace-nowrap" key={h}>{h}</th>)}</tr></thead><tbody>{rows.length?rows.map((r,i)=><tr key={i} className="border-t border-slate-100 hover:bg-blue-50/30">{r.map((c,j)=><td key={j} className="p-3 whitespace-nowrap">{c}</td>)}</tr>):<tr><td colSpan={headers.length} className="p-12 text-center text-slate-400">ยังไม่มีข้อมูล</td></tr>}</tbody></table></div>}
