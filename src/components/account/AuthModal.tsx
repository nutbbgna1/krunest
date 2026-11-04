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

function GoogleLogo() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
    <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.39 13.87A6 6 0 0 1 6.07 12c0-.65.11-1.28.32-1.87V7.51H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.49l3.35-2.62Z" />
    <path fill="#EA4335" d="M12 6c1.47 0 2.79.51 3.82 1.5l2.88-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.62C7.18 7.76 9.39 6 12 6Z" />
  </svg>;
}

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
        {mode==='login'&&<>
          <div className="flex items-center gap-3 py-0.5" aria-hidden="true">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-medium text-slate-400">หรือ</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <button
            type="button"
            onClick={()=>window.location.assign('/api/auth/google')}
            className="group relative flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 active:translate-y-0 active:shadow-sm"
          >
            <span className="absolute left-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-100 transition-transform duration-200 group-hover:scale-105">
              <GoogleLogo />
            </span>
            <span>เข้าสู่ระบบด้วย Google</span>
          </button>
        </>}
        <div className="flex justify-between text-xs font-semibold text-blue-700">
          <button type="button" onClick={()=>{setMode(mode==='register'?'login':'register');setError('');setMessage('')}}>{mode==='register'?'มีบัญชีแล้ว':'ยังไม่มีบัญชี? สมัครฟรี'}</button>
          <button type="button" onClick={()=>{setMode(mode==='forgot'?'login':'forgot');setError('');setMessage('')}}>{mode==='forgot'?'กลับไปเข้าสู่ระบบ':'ลืมรหัสผ่าน'}</button>
        </div>
      </form>
    </div>
  </div>;
}
