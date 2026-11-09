import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Check, Download, FileText, Play, Puzzle } from 'lucide-react';
import { api } from '../lib/api';
import { HtmlPlugin } from '../types';
import { OrderTarget } from '../components/modals/QuickOrderModal';
import { CoverImage } from '../components/common/CoverImage';

interface Props {
  slug: string;
  unlockedProgramIds: string[];
  isAdmin: boolean;
  onOrder: (target: OrderTarget) => void;
  onLogin: () => void;
  loggedIn: boolean;
}

export function HtmlPluginDetail({ slug, unlockedProgramIds, isAdmin, onOrder, onLogin, loggedIn }: Props) {
  const [plugin, setPlugin] = useState<HtmlPlugin | null>(null);
  const [error, setError] = useState('');
  const [image, setImage] = useState(0);
  const [related, setRelated] = useState<HtmlPlugin[]>([]);
  useEffect(() => {
    let live = true;
    api<HtmlPlugin>(`/plugins/${encodeURIComponent(slug)}`).then((result) => {
      if (live) { setPlugin(result); document.title = `${result.name} | Krunest`; }
    }).catch((cause) => { if (live) setError((cause as Error).message); });
    api<HtmlPlugin[]>('/plugins').then((rows) => { if (live) setRelated(rows); }).catch(() => {});
    return () => { live = false; document.title = 'Krunest'; };
  }, [slug]);
  const back = <a href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4"/>ระบบงานทั้งหมด</a>;
  if (error) return <main className="mx-auto max-w-5xl flex-1 p-8">{back}<p className="mt-8 text-rose-700">{error}</p></main>;
  if (!plugin) return <main className="mx-auto max-w-5xl flex-1 p-8">{back}<p className="mt-8 text-slate-500">กำลังโหลดรายละเอียดโปรแกรม…</p></main>;
  const unlocked = isAdmin || unlockedProgramIds.includes(plugin.programId);
  const order = () => {
    if (!plugin.program) return;
    const tier = plugin.priceTiers[0];
    onOrder({ type: 'single_program', id: plugin.program.id, tierId: tier?.id, title: plugin.program.thaiName,
      subtitle: 'HTML Standalone พร้อมคู่มือ', price: tier?.price ?? plugin.program.price,
      unlockProgramIds: [plugin.program.id], badgeLabel: 'เข้าใช้งานระบบงาน' });
  };
  return <main className="flex-1 bg-slate-50 px-4 py-8 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <nav className="mb-5 flex items-center gap-2 text-sm">{back}<span className="text-slate-300">/</span><span className="text-slate-500">{plugin.category}</span></nav>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {plugin.screenshots.length ? <><CoverImage src={plugin.screenshots[image]} alt={`ภาพตัวอย่าง ${plugin.name} ภาพที่ ${image + 1}`} className="aspect-video w-full object-contain bg-slate-100" eager/><div className="flex gap-2 overflow-x-auto p-3">{plugin.screenshots.map((src, index) => <button key={src} onClick={() => setImage(index)} aria-label={`ดูภาพที่ ${index + 1}`} aria-pressed={image === index} className={`shrink-0 overflow-hidden rounded-lg border-2 ${image === index ? 'border-slate-700' : 'border-transparent'}`}><CoverImage src={src} alt="" className="h-14 w-24 object-cover"/></button>)}</div></> : <div className="grid aspect-video place-items-center bg-slate-100 text-slate-400"><Puzzle className="h-16 w-16"/></div>}
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold text-slate-500">{plugin.category} · HTML Standalone · v{plugin.version}</p><h1 className="mt-2 text-2xl font-black text-slate-900 lg:text-3xl">{plugin.name}</h1><p className="mt-3 leading-7 text-slate-600">{plugin.description || 'รายละเอียดโปรแกรมและวิธีใช้งานดูได้จากคู่มือ'}</p></section>
          {plugin.highlights.length > 0 && <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black">จุดเด่นของระบบ</h2><ul className="mt-4 grid gap-3 sm:grid-cols-2">{plugin.highlights.map((item) => <li key={item} className="flex gap-2 text-sm text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-700"/>{item}</li>)}</ul></section>}
          {plugin.steps.length > 0 && <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black">ขั้นตอนการใช้งาน</h2><ol className="mt-4 space-y-3">{plugin.steps.map((step, index) => <li key={`${index}-${step}`} className="flex gap-3 text-sm text-slate-700"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-200 font-bold">{index + 1}</span>{step}</li>)}</ol></section>}
        </div>
        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24"><p className="text-xs font-bold text-slate-500">{plugin.badge}</p><h2 className="mt-2 text-xl font-black">{plugin.name}</h2><p className="mt-2 text-sm text-slate-500">{plugin.access === 'free' ? 'สำหรับสมาชิก' : `เริ่มต้น ฿${plugin.program?.price.toLocaleString() ?? '0'}`}</p><div className="mt-6 grid gap-3">
          {unlocked && plugin.appUrl ? <a href={plugin.appUrl} className="primary-button flex items-center justify-center gap-2"><Play className="h-4 w-4"/>เข้าใช้งานโปรแกรม</a> : loggedIn ? <button onClick={order} className="primary-button">ดูสิทธิ์ / สั่งซื้อ</button> : <button onClick={onLogin} className="primary-button">เข้าสู่ระบบเพื่อใช้งาน</button>}
          {plugin.manualUrl && <a href={plugin.manualUrl} target="_blank" rel="noreferrer" className="secondary-button flex items-center justify-center gap-2"><FileText className="h-4 w-4"/>อ่านคู่มือ PDF</a>}
          {plugin.demoUrl && <a href={plugin.demoUrl} target="_blank" rel="noreferrer" className="secondary-button flex items-center justify-center gap-2"><BookOpen className="h-4 w-4"/>ทดลองใช้งาน</a>}
          {unlocked && plugin.downloadUrl && <a href={plugin.downloadUrl} className="secondary-button flex items-center justify-center gap-2"><Download className="h-4 w-4"/>ดาวน์โหลด ZIP</a>}
        </div><div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500">เวอร์ชัน {plugin.version}{plugin.installedAt ? ` · เพิ่มเมื่อ ${new Date(plugin.installedAt).toLocaleDateString('th-TH')}` : ''}</div></aside>
      </div>
      {related.some((item) => item.slug !== plugin.slug && item.categoryId === plugin.categoryId) && <section className="mt-10"><h2 className="text-xl font-black text-slate-900">ระบบงานที่เกี่ยวข้อง</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{related.filter((item) => item.slug !== plugin.slug && item.categoryId === plugin.categoryId).slice(0, 3).map((item) => <a key={item.slug} href={`/?system=${encodeURIComponent(item.slug)}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-slate-400"><div className="aspect-video bg-slate-100">{item.screenshots[0] ? <CoverImage src={item.screenshots[0]} alt={`ภาพตัวอย่าง ${item.name}`} className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-slate-400"><Puzzle className="h-9 w-9"/></div>}</div><div className="p-4"><p className="text-xs text-slate-500">{item.category}</p><h3 className="mt-1 font-bold text-slate-900">{item.name}</h3></div></a>)}</div></section>}
    </div>
  </main>;
}
