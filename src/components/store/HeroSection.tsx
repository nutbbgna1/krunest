// แบนเนอร์หลักด้านบน (หัวข้อ, ป้ายเทคโนโลยี, ปุ่ม CTA, กล่องสถิติ 4 กล่อง)
import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Layers, Code2, Database, Globe, FileCode2, ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="bg-hero-mesh border-b border-blue-200/60 relative overflow-hidden py-12 lg:py-16">
      {/* Ambient decorative color glow spheres */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-sky-300/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-500/20"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-200" />
            <span>คลังระบบงานและโปรแกรมสำเร็จรูป พร้อมใช้งานทันที</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight"
          >
            ศูนย์รวมระบบงานออนไลน์{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 whitespace-nowrap">
              สั่งซื้อครั้งเดียว
            </span>{' '}
            <span className="whitespace-nowrap">กดเปิดใช้งานบนเว็บได้ทันที</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base text-slate-700 max-w-2xl mx-auto leading-relaxed"
          >
            รวบรวมโปรแกรมและระบบงานสำเร็จรูปพร้อมภาพจำลองการทำงานจริง เลือกซื้อแยกเฉพาะระบบ หรือสมัครแพ็กเกจสมาชิกตลอดชีพ (Free / Go / Pro / Max) เมื่อสั่งซื้อแล้วจะมีปุ่ม{' '}
            <strong className="text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-md">
              “เข้าใช้งานบนเว็บทันที”
            </strong>{' '}
            ให้กดใช้งานผ่านเบราว์เซอร์ได้เลย
          </motion.p>

          {/* Tech Stack Chips with distinct lively pastel colors */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-2 flex flex-wrap items-center justify-center gap-2.5 text-xs font-semibold"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100/80 border border-blue-300/80 text-blue-900 shadow-2xs hover:scale-105 transition-transform">
              <FileCode2 className="w-3.5 h-3.5 text-blue-600" />
              <span>HTML Standalone</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-100/80 border border-indigo-300/80 text-indigo-900 shadow-2xs hover:scale-105 transition-transform">
              <Code2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Google Apps Script</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100/80 border border-emerald-300/80 text-emerald-900 shadow-2xs hover:scale-105 transition-transform">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>PHP + MySQL</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/80 border border-amber-300/80 text-amber-900 shadow-2xs hover:scale-105 transition-transform">
              <Globe className="w-3.5 h-3.5 text-amber-600" />
              <span>Cloud Web App พร้อมใช้</span>
            </span>
          </motion.div>

          {/* Primary Hero CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="pt-3 flex flex-wrap items-center justify-center gap-3.5"
          >
            <a
              href="#catalog"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md shadow-blue-500/25 hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>เลือกดูคลังระบบงานทั้งหมด</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#packages"
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-indigo-200 text-sm font-bold shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>ดูแพ็กเกจสมาชิกตลอดชีพ (เริ่ม ฿299)</span>
            </a>
          </motion.div>
        </div>

        {/* 4 Stat Highlights with Vibrant Pastel Gradients */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-100/90 via-white to-blue-50/50 p-4 rounded-2xl border border-blue-200 shadow-sm hover:shadow-md transition-all flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold font-mono text-base shrink-0 shadow-sm">
              06
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900">ระบบงานพร้อมใช้</div>
              <div className="text-xs text-blue-700 font-medium">มีภาพตัวอย่างทุกโปรแกรม</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-100/90 via-white to-emerald-50/50 p-4 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-all flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold font-mono text-base shrink-0 shadow-sm">
              ฿299
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900">แพ็กเกจเริ่มต้น</div>
              <div className="text-xs text-emerald-700 font-medium">จ่ายครั้งเดียวใช้ได้ตลอดชีพ</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-100/90 via-white to-indigo-50/50 p-4 rounded-2xl border border-purple-200 shadow-sm hover:shadow-md transition-all flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold font-mono text-base shrink-0 shadow-sm">
              QR
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900">สแกนจ่ายอนุมัติไว</div>
              <div className="text-xs text-purple-700 font-medium">ปลดล็อกสิทธิ์อัตโนมัติ</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-100/90 via-white to-orange-50/50 p-4 rounded-2xl border border-amber-200 shadow-sm hover:shadow-md transition-all flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold font-mono text-base shrink-0 shadow-sm">
              WEB
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900">เปิดใช้บนเว็บทันที</div>
              <div className="text-xs text-amber-800 font-medium">ไม่ต้องเสียเวลาติดตั้งเอง</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
