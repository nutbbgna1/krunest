import React, { useEffect, useState } from 'react';
import { Bell, Building2, CheckCircle2, Clock3, CreditCard, KeyRound, LayoutDashboard, ReceiptText, ShieldCheck, Sparkles, Users, UserRound } from 'lucide-react';
import { api } from '../lib/api';
import { MemberSession } from '../types';

interface Props { session: MemberSession; onRefresh: () => Promise<void>; }
type Tab = 'overview' | 'orders' | 'team' | 'profile' | 'security';

export function MemberCenter({ session, onRefresh }: Props) {
  const [tab,setTab]=useState<Tab>('overview');
  const [orders,setOrders]=useState<any[]>([]); const [teams,setTeams]=useState<any[]>([]); const [notifications,setNotifications]=useState<any[]>([]);
  const [notice,setNotice]=useState(''); const [error,setError]=useState('');
  const [twoFactorSetup,setTwoFactorSetup]=useState<{secret:string;otpauth:string}|null>(null);
  const load=async()=>{try{const [o,t,n]=await Promise.all([api<any[]>('/orders'),api<any[]>('/teams'),api<any[]>('/me/notifications')]);setOrders(o);setTeams(t);setNotifications(n);}catch(e){setError((e as Error).message)}};
  useEffect(()=>{load()},[]);
  const act=async(task:()=>Promise<unknown>,message:string)=>{setError('');try{await task();setNotice(message);await Promise.all([load(),onRefresh()])}catch(e){setError((e as Error).message)}};
  const changePassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    act(() => api('/me/password', { method: 'POST', body: { currentPassword: data.get('current'), newPassword: data.get('next') } }), 'เปลี่ยนรหัสผ่านแล้ว');
  };
  const startTwoFactor = async () => {
    try { setTwoFactorSetup(await api('/me/2fa/setup', { method: 'POST', body: {} })); }
    catch (caught) { setError((caught as Error).message); }
  };
  const enableTwoFactor = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    act(() => api('/me/2fa/enable', { method: 'POST', body: { otp: data.get('otp') } }), 'เปิดยืนยันตัวตน 2 ขั้นตอนแล้ว');
  };
  const nav=[['overview','ภาพรวม',LayoutDashboard],['orders','คำสั่งซื้อ',ReceiptText],['team','ทีมงาน',Users],['profile','ข้อมูลบัญชี',UserRound],['security','ความปลอดภัย',ShieldCheck]] as const;
  return <main className="flex-1 bg-portal-mesh min-h-[calc(100vh-4rem)] py-8 px-4 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <div className="rounded-[28px] p-6 lg:p-8 bg-gradient-to-r from-blue-800 via-indigo-800 to-sky-700 text-white shadow-xl overflow-hidden relative">
        <div className="absolute -right-20 -top-28 w-80 h-80 rounded-full border-[40px] border-white/5"/><div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-5"><div><div className="text-blue-200 text-sm font-bold mb-2">ศูนย์สมาชิก KRUNEST</div><h1 className="text-3xl lg:text-4xl font-extrabold">สวัสดี {session.user.name}</h1><p className="text-blue-100 mt-2">{session.user.organization || 'บัญชีส่วนบุคคล'} · จัดการระบบ สิทธิ์ ทีม และเอกสารได้จากที่เดียว</p></div><div className="flex gap-3"><Stat value={session.entitlements.length} label="ระบบที่ใช้ได้"/><Stat value={teams.length} label="ทีมของฉัน"/><Stat value={notifications.length} label="การแจ้งเตือน"/></div></div>
      </div>
      <div className="grid lg:grid-cols-[230px_1fr] gap-6 mt-6">
        <aside className="portal-card p-3 h-fit lg:sticky lg:top-24">{nav.map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${tab===id?'bg-blue-600 text-white shadow-md':'text-slate-600 hover:bg-blue-50 hover:text-blue-700'}`}><Icon className="w-4 h-4"/>{label}</button>)}</aside>
        <section className="space-y-5">
          {notice&&<Alert color="emerald">{notice}</Alert>}{error&&<Alert color="rose">{error}</Alert>}
          {tab==='overview'&&<>
            <div className="grid md:grid-cols-3 gap-4"><InfoCard icon={Sparkles} title="แพ็กเกจปัจจุบัน" value={session.subscription?.plan_name||'Free'} note={session.subscription?.ends_at?`ถึง ${date(session.subscription.ends_at)}`:'ใช้งานพื้นฐานฟรี'}/><InfoCard icon={CheckCircle2} title="สิทธิ์ใช้งาน" value={`${session.entitlements.length} โปรแกรม`} note="รวมสิทธิ์ซื้อขาด ทดลอง และสมาชิก"/><InfoCard icon={Bell} title="แจ้งเตือน" value={`${notifications.length} รายการ`} note={notifications[0]?.title||'ยังไม่มีรายการใหม่'}/></div>
            <Panel title="โปรแกรมของฉัน" subtitle="สิทธิ์ทั้งหมดที่ผูกกับบัญชีนี้"><div className="grid md:grid-cols-2 gap-3">{session.entitlements.map(e=><div key={e.program_id} className="p-4 border border-blue-100 bg-blue-50/40 rounded-2xl flex items-center gap-4"><div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">{e.name[0]}</div><div className="min-w-0 flex-1"><div className="font-bold text-slate-900">{e.name}</div><div className="text-xs text-slate-500 truncate">{e.thai_name}</div></div><span className="text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">{e.source==='trial'?'ทดลองใช้':'พร้อมใช้'}</span></div>)}</div></Panel>
          </>}
          {tab==='orders'&&<Panel title="คำสั่งซื้อและใบเสร็จ" subtitle="ติดตามหลักฐาน การอนุมัติ และเอกสารย้อนหลัง"><Table headers={['เลขอ้างอิง','รายการ','ยอดเงิน','สถานะ','วันที่']} rows={orders.map(o=>[o.reference,o.target_id,`฿${o.amount.toLocaleString()}`,<Status value={o.status}/>,date(o.created_at)])}/></Panel>}
          {tab==='team'&&<><Panel title="ทีมและที่นั่งผู้ใช้งาน" subtitle="สร้างทีมสำหรับโรงเรียนหรือหน่วยงาน"><form onSubmit={e=>{e.preventDefault();const fd=new FormData(e.currentTarget);act(()=>api('/teams',{method:'POST',body:{name:fd.get('name'),seatLimit:Number(fd.get('seats'))}}),'สร้างทีมเรียบร้อย');e.currentTarget.reset()}} className="grid sm:grid-cols-[1fr_120px_auto] gap-3"><input name="name" required className="form-field mt-0" placeholder="ชื่อทีม / ฝ่ายงาน"/><input name="seats" type="number" min="2" max="100" defaultValue="5" className="form-field mt-0"/><button className="primary-button">สร้างทีม</button></form></Panel><div className="grid md:grid-cols-2 gap-4">{teams.map(t=><div className="portal-card p-5" key={t.id}><div className="flex justify-between"><div><div className="font-extrabold text-lg">{t.name}</div><div className="text-xs text-slate-500 mt-1">{t.member_count}/{t.seat_limit} ที่นั่ง · {t.team_role}</div></div><Users className="text-blue-600"/></div><button onClick={()=>act(async()=>{const r=await api<{inviteUrl:string}>(`/teams/${t.id}/invites`,{method:'POST',body:{}});await navigator.clipboard?.writeText(location.origin+r.inviteUrl)},'คัดลอกลิงก์เชิญแล้ว')} className="secondary-button mt-5 w-full">สร้างและคัดลอกลิงก์เชิญ</button></div>)}</div></>}
          {tab==='profile'&&<Panel title="ข้อมูลบัญชี" subtitle="ข้อมูลสำหรับใบเสร็จและการติดต่อ"><form onSubmit={e=>{e.preventDefault();const fd=new FormData(e.currentTarget);act(()=>api('/me',{method:'PATCH',body:{name:fd.get('name'),organization:fd.get('organization'),notification_email:fd.get('notify')==='on'}}),'บันทึกข้อมูลแล้ว')}} className="space-y-4 max-w-xl"><label className="field-label">ชื่อ-นามสกุล<input name="name" defaultValue={session.user.name} className="form-field"/></label><label className="field-label">โรงเรียน / หน่วยงาน<input name="organization" defaultValue={session.user.organization} className="form-field"/></label><label className="flex gap-3 text-sm font-semibold"><input name="notify" type="checkbox" defaultChecked={Boolean(session.user.notification_email)}/>รับอีเมลแจ้งเตือนการชำระเงินและสิทธิ์ใกล้หมดอายุ</label><button className="primary-button">บันทึกข้อมูล</button></form></Panel>}
          {tab==='security'&&<div className="grid md:grid-cols-2 gap-5">
            <Panel title="เปลี่ยนรหัสผ่าน" subtitle="ใช้รหัสอย่างน้อย 10 ตัว">
              <form onSubmit={changePassword} className="space-y-3">
                <input name="current" type="password" className="form-field mt-0" placeholder="รหัสผ่านปัจจุบัน"/>
                <input name="next" type="password" className="form-field mt-0" placeholder="รหัสผ่านใหม่"/>
                <button className="primary-button">เปลี่ยนรหัสผ่าน</button>
              </form>
            </Panel>
            <Panel title="ยืนยันตัวตน 2 ขั้นตอน" subtitle="เพิ่มความปลอดภัยด้วยรหัส TOTP">
              <KeyRound className="w-10 h-10 text-blue-600 mb-3"/>
              <p className="text-sm text-slate-600">สถานะ: <strong>{session.user.two_factor_enabled?'เปิดใช้งานแล้ว':'ยังไม่เปิดใช้งาน'}</strong></p>
              {!twoFactorSetup ? <button onClick={startTwoFactor} className="secondary-button mt-4">เริ่มตั้งค่า 2FA</button> :
                <form onSubmit={enableTwoFactor} className="mt-4 space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border break-all"><div className="text-[11px] text-slate-500">Secret key</div><code className="text-xs font-bold">{twoFactorSetup.secret}</code></div>
                  <input name="otp" required maxLength={6} className="form-field mt-0 font-mono tracking-[.3em]" placeholder="รหัส OTP 6 หลัก"/>
                  <button className="primary-button">ยืนยันและเปิด 2FA</button>
                </form>}
            </Panel>
          </div>}
        </section>
      </div>
    </div>
  </main>;
}

const date=(v:string)=>new Intl.DateTimeFormat('th-TH',{dateStyle:'medium'}).format(new Date(v));
function Stat({value,label}:{value:number;label:string}){return <div className="min-w-24 rounded-2xl bg-white/10 border border-white/10 px-4 py-3 text-center"><div className="text-2xl font-black">{value}</div><div className="text-[11px] text-blue-100">{label}</div></div>}
function Panel({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}){return <div className="portal-card p-5 lg:p-6"><div className="mb-5"><h2 className="text-lg font-extrabold text-slate-900">{title}</h2><p className="text-xs text-slate-500 mt-1">{subtitle}</p></div>{children}</div>}
function InfoCard({icon:Icon,title,value,note}:{icon:any;title:string;value:string;note:string}){return <div className="portal-card p-5"><div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4"><Icon className="w-5 h-5"/></div><div className="text-xs font-bold text-slate-500">{title}</div><div className="text-2xl font-black text-slate-900 mt-1">{value}</div><div className="text-xs text-slate-500 mt-2">{note}</div></div>}
function Alert({color,children}:{color:'emerald'|'rose';children:React.ReactNode}){return <div className={`p-3 rounded-xl border text-sm font-semibold ${color==='emerald'?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-rose-50 border-rose-200 text-rose-700'}`}>{children}</div>}
function Status({value}:{value:string}){const label:any={pending:'รอชำระ',reviewing:'รอตรวจ',approved:'อนุมัติแล้ว',rejected:'ไม่ผ่าน',expired:'หมดอายุ'};return <span className={`inline-flex px-2 py-1 rounded-full text-[11px] font-bold ${value==='approved'?'bg-emerald-100 text-emerald-700':value==='rejected'?'bg-rose-100 text-rose-700':'bg-amber-100 text-amber-700'}`}>{label[value]||value}</span>}
function Table({headers,rows}:{headers:string[];rows:React.ReactNode[][]}){return <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-slate-500 bg-slate-50">{headers.map(h=><th key={h} className="px-3 py-3">{h}</th>)}</tr></thead><tbody>{rows.length?rows.map((r,i)=><tr key={i} className="border-t border-slate-100">{r.map((c,j)=><td key={j} className="px-3 py-3 whitespace-nowrap">{c}</td>)}</tr>):<tr><td colSpan={headers.length} className="text-center py-12 text-slate-400">ยังไม่มีข้อมูล</td></tr>}</tbody></table></div>}
