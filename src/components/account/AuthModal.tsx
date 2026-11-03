import React, { useState } from 'react';
import { X, LogIn, UserPlus, MailCheck, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { api, setCsrfToken } from '../../lib/api';
import { AuthUser } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (user: AuthUser) => void;
}

type Mode = 'login' | 'register' | 'forgot';

export function AuthModal({ open, onClose, onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [takeover, setTakeover] = useState(false);
  const [needsOtp, setNeedsOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  if (!open) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError(''); setMessage('');
    try {
      if (mode === 'forgot') {
        const result = await api<{ message: string }>('/auth/forgot', { method: 'POST', body: { email } });
        setMessage(result.message); return;
      }
      if (mode === 'register') {
        const result = await api<{ message: string; devToken?: string }>('/auth/register', { method: 'POST', body: { name, organization, email, password } });
        if (result.devToken) await api('/auth/verify', { method: 'POST', body: { token: result.devToken } });
        setMessage('สร้างบัญชีและยืนยันอีเมลสำหรับระบบทดสอบแล้ว กรุณาเข้าสู่ระบบ'); setMode('login'); return;
      }
      const result = await api<{ user: AuthUser; csrfToken: string; requiresTwoFactor?: boolean }>('/auth/login', { method: 'POST', body: { email, password, otp, takeover } });
      if (result.requiresTwoFactor) { setNeedsOtp(true); setMessage('กรอกรหัส 6 หลักจากแอปยืนยันตัวตน'); return; }
      setCsrfToken(result.csrfToken); onAuthenticated(result.user); onClose();
    } catch (caught) {
      const issue = caught as Error & { status?: number; data?: { reason?: string } };
      if (issue.status === 409 && issue.data?.reason === 'takeover') { setTakeover(true); setError('บัญชีนี้เปิดอยู่ในอุปกรณ์อื่น กดเข้าสู่ระบบอีกครั้งเพื่อย้ายมาเครื่องนี้'); }
      else setError(issue.message);
    } finally { setLoading(false); }
  };

  return <div className="fixed inset-0 z-[70] bg-slate-950/55 backdrop-blur-sm p-4 flex items-center justify-center" role="dialog" aria-modal="true">
    <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl border border-blue-100">
      <div className="relative p-7 text-white bg-gradient-to-br from-blue-700 via-indigo-700 to-sky-600">
        <button onClick={onClose} className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/15" aria-label="ปิด"><X className="w-5 h-5" /></button>
        <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-4"><ShieldCheck /></div>
        <h2 className="text-2xl font-extrabold">{mode === 'login' ? 'ยินดีต้อนรับกลับ' : mode === 'register' ? 'สร้างบัญชีสมาชิก' : 'ตั้งรหัสผ่านใหม่'}</h2>
        <p className="text-sm text-blue-100 mt-1">บัญชีเดียว ใช้ระบบงาน ทีม และเอกสารทั้งหมด</p>
      </div>
      <form onSubmit={submit} className="p-7 space-y-4">
        {mode === 'register' && <>
          <label className="block text-sm font-bold text-slate-700">ชื่อ-นามสกุล<input required value={name} onChange={e=>setName(e.target.value)} className="form-field" placeholder="เช่น ครูสมชาย ใจดี" /></label>
          <label className="block text-sm font-bold text-slate-700">โรงเรียน / หน่วยงาน<input value={organization} onChange={e=>setOrganization(e.target.value)} className="form-field" placeholder="ชื่อหน่วยงาน" /></label>
        </>}
        <label className="block text-sm font-bold text-slate-700">อีเมล<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="form-field" placeholder="name@school.ac.th" /></label>
        {mode !== 'forgot' && <label className="block text-sm font-bold text-slate-700">รหัสผ่าน<div className="relative"><input required type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} className="form-field pr-11" placeholder="อย่างน้อย 10 ตัว มี A-z และ 0-9" /><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-5 text-slate-400">{showPassword?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div></label>}
        {needsOtp && <label className="block text-sm font-bold text-slate-700">รหัสยืนยัน 6 หลัก<input required value={otp} onChange={e=>setOtp(e.target.value)} className="form-field font-mono tracking-[.4em]" maxLength={6}/></label>}
        {error && <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3">{error}</div>}
        {message && <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 flex gap-2"><MailCheck className="w-4 h-4 shrink-0" />{message}</div>}
        <button disabled={loading} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200">{mode==='login'?<LogIn className="w-4 h-4"/>:<UserPlus className="w-4 h-4"/>}{loading?'กำลังดำเนินการ...':mode==='login'?(takeover?'ย้ายการใช้งานมาเครื่องนี้':'เข้าสู่ระบบ'):mode==='register'?'สมัครสมาชิก':'ส่งวิธีตั้งรหัสผ่าน'}</button>
        {mode==='login'&&<button type="button" disabled className="w-full h-11 rounded-xl border border-slate-200 text-slate-400 text-xs font-bold">Google Workspace — พร้อมเชื่อมต่อเมื่อใส่ OAuth Key</button>}
        <div className="flex justify-between text-xs font-semibold text-blue-700">
          <button type="button" onClick={()=>{setMode(mode==='register'?'login':'register');setError('');setMessage('')}}>{mode==='register'?'มีบัญชีแล้ว':'ยังไม่มีบัญชี? สมัครฟรี'}</button>
          <button type="button" onClick={()=>{setMode(mode==='forgot'?'login':'forgot');setError('');setMessage('')}}>{mode==='forgot'?'กลับไปเข้าสู่ระบบ':'ลืมรหัสผ่าน'}</button>
        </div>
      </form>
    </div>
  </div>;
}
