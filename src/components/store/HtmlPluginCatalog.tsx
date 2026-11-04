import React, { useEffect, useState } from 'react';
import { BookOpen, Check, Code2, Download, FileSpreadsheet, Globe, LayoutGrid, Package, Search, Server, ExternalLink, FileText, FlaskConical, Play, Puzzle, X } from 'lucide-react';
import { api } from '../../lib/api';
import { ACCESS_LABELS, HtmlPlugin, PluginAccess, PluginCategory, PluginTech, PriceTier, TECH_LABELS } from '../../types';
import { OrderTarget } from '../modals/QuickOrderModal';

interface Props {
  unlockedProgramIds: string[];
  onOrder: (target: OrderTarget) => void;
}

export function HtmlPluginCatalog({ unlockedProgramIds, onOrder }: Props) {
  const [plugins, setPlugins] = useState<HtmlPlugin[]>([]);
  const [selected, setSelected] = useState<HtmlPlugin | null>(null);
  const [categories, setCategories] = useState<PluginCategory[]>([]);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [access, setAccess] = useState<'all' | PluginAccess>('all');
  const [sort, setSort] = useState<'featured' | 'newest' | 'popular' | 'name' | 'priceAsc' | 'priceDesc'>('featured');
  const [tech, setTech] = useState<'all' | PluginTech>('all');

  useEffect(() => { api<HtmlPlugin[]>('/plugins').then(setPlugins).catch(() => setPlugins([])); api<PluginCategory[]>('/categories').then(setCategories).catch(() => setCategories([])); }, []);
  if (!plugins.length) return <section id="html-plugins" className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
    <div className="rounded-[28px] border border-blue-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Puzzle className="h-8 w-8" /></div>
      <h2 className="mt-5 text-2xl font-black text-slate-900">กำลังเตรียมโปรแกรมจริง</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">ขณะนี้ยังไม่มีโปรแกรมที่ผ่านการตรวจสอบและเปิดเผยแพร่ เมื่อผู้ดูแลติดตั้งและเปิดใช้งานปลั๊กอินแล้ว รายการจะปรากฏที่หน้านี้โดยอัตโนมัติ</p>
    </div>
  </section>;

  const open = (url: string | null) => { if (url) window.open(url, '_blank', 'noopener,noreferrer'); };
  const order = (plugin: HtmlPlugin, tier?: PriceTier) => {
    if (!plugin.program) return;
    const explicit = plugin.priceTiers.length > 1 || (tier && tier.id !== 'standard');
    onOrder({
      type: 'single_program', id: plugin.program.id, tierId: tier?.id,
      title: explicit && tier ? `${plugin.program.thaiName} · ${tier.name}` : plugin.program.thaiName,
      subtitle: tier?.description || 'HTML Standalone พร้อมเปิดใช้งานบนเว็บและดาวน์โหลดคู่มือ',
      price: tier?.price ?? plugin.program.price, unlockProgramIds: [plugin.program.id],
      badgeLabel: tier?.durationDays ? `ใช้งานได้ ${tier.durationDays} วัน` : 'ซื้อขาด · ใช้งานได้ตลอดชีพ',
    });
  };
  const buy = (plugin: HtmlPlugin) => (plugin.priceTiers.length > 1 ? setSelected(plugin) : order(plugin, plugin.priceTiers[0]));
  const q = query.trim().toLowerCase();
  const matching = plugins.filter((p) => (category === 'all' || p.categoryId === category) && (access === 'all' || p.access === access)
    && (!q || `${p.name} ${p.description} ${p.category} ${p.highlights.join(' ')}`.toLowerCase().includes(q)));
  const techCount = (t: 'all' | PluginTech) => (t === 'all' ? matching.length : matching.filter((p) => p.tech === t).length);
  const price = (p: HtmlPlugin) => p.program?.price ?? 0;
  const visible = matching.filter((p) => tech === 'all' || p.tech === tech).sort((a, b) => ({
    featured: 0, newest: String(b.installedAt || '').localeCompare(String(a.installedAt || '')), popular: b.popularity - a.popularity,
    name: a.name.localeCompare(b.name, 'th'), priceAsc: price(a) - price(b), priceDesc: price(b) - price(a),
  })[sort]);
  const TECH_ICON: Record<PluginTech, React.ComponentType<{ className?: string }>> = { html: Code2, gas: Globe, php: Server, excel: FileSpreadsheet, other: Package };
  const selectCls = 'h-12 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500';

  return <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-12" id="html-plugins">
    <div className="rounded-[28px] bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-800 p-6 lg:p-8 text-white overflow-hidden relative">
      <div className="absolute -right-16 -top-20 w-72 h-72 rounded-full bg-sky-400/10 blur-2xl" />
      <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div><div className="text-xs font-bold text-sky-300 tracking-widest">HTML STANDALONE PLUGINS</div><h2 className="text-2xl lg:text-3xl font-black mt-2">โปรแกรมสำหรับครู พร้อมทดลองใช้งานจริง</h2><p className="text-sm text-blue-100 mt-2">เปิดทดลองด้วยข้อมูลตัวอย่างได้ทันที พร้อมคู่มือ PDF และแยกข้อมูลจริงออกจากโหมดทดลอง</p></div>
        <div className="px-4 py-2 rounded-full bg-white/10 border border-white/15 text-sm font-bold">{plugins.length} โปรแกรมพร้อมใช้</div>
      </div>
      <form role="search" onSubmit={(e) => { e.preventDefault(); setQuery(draft); }} className="relative mb-5 rounded-3xl bg-white p-4 text-slate-900 shadow-xl">
        <div className="grid gap-3 lg:grid-cols-[1fr_200px_220px_190px_auto]">
          <label className="relative"><Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400"/><input value={draft} onChange={(e) => { setDraft(e.target.value); if (!e.target.value) setQuery(''); }} placeholder="ค้นหาระบบงาน เช่น ตารางสอน, ลงเวลา, คะแนน..." aria-label="ค้นหาระบบงาน" className="h-12 w-full rounded-2xl border border-blue-100 bg-white pl-12 pr-4 text-sm outline-none focus:border-blue-500"/></label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="หมวดหมู่" className={selectCls}><option value="all">ทุกหมวดหมู่</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
          <select value={access} onChange={(e) => setAccess(e.target.value as 'all' | PluginAccess)} aria-label="ประเภทสิทธิ์" className={selectCls}><option value="all">ทุกประเภทสิทธิ์</option>{(Object.keys(ACCESS_LABELS) as PluginAccess[]).map((a) => <option key={a} value={a}>{ACCESS_LABELS[a]}</option>)}</select>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="เรียงลำดับ" className={selectCls}><option value="featured">เรียง: แนะนำ</option><option value="newest">เรียง: ใหม่ล่าสุด</option><option value="popular">เรียง: ยอดนิยม</option><option value="name">เรียง: ชื่อ ก-ฮ</option><option value="priceAsc">เรียง: ราคาต่ำ-สูง</option><option value="priceDesc">เรียง: ราคาสูง-ต่ำ</option></select>
          <button className="primary-button flex h-12 items-center justify-center gap-2 px-6"><Search className="h-4 w-4"/>ค้นหา</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">{(['all', 'html', 'gas', 'php', 'excel', 'other'] as const).map((t) => {
          const Icon = t === 'all' ? LayoutGrid : TECH_ICON[t]; const active = tech === t;
          return <button type="button" key={t} onClick={() => setTech(t)} aria-pressed={active} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${active ? 'border-orange-400 bg-orange-50 text-slate-900 ring-2 ring-orange-200' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'}`}><Icon className="h-4 w-4"/>{t === 'all' ? 'ทั้งหมด' : TECH_LABELS[t]}<span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'}`}>{techCount(t)}</span></button>;
        })}</div>
      </form>
      {visible.length === 0 && <div className="relative rounded-2xl bg-white/10 p-8 text-center text-sm text-blue-100">ไม่พบระบบงานที่ตรงกับตัวกรอง ลองเปลี่ยนคำค้นหรือหมวดหมู่</div>}
      <div className="relative grid md:grid-cols-2 xl:grid-cols-3 gap-5">{visible.map((plugin) => {
        const unlocked = unlockedProgramIds.includes(plugin.programId);
        return <article key={plugin.slug} className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-xl border border-white/20">
          <button type="button" onClick={()=>setSelected(plugin)} className="block w-full text-left">
            <div className="aspect-[16/9] bg-slate-100 overflow-hidden">{plugin.screenshots[0] ? <img src={plugin.screenshots[0]} alt={`ภาพตัวอย่าง ${plugin.name}`} className="w-full h-full object-cover"/> : <div className="h-full grid place-items-center text-blue-600"><Puzzle className="w-14 h-14"/></div>}</div>
            <div className="p-5"><div className="text-[11px] font-bold text-blue-600">{plugin.category} · v{plugin.version}</div><h3 className="font-extrabold text-lg mt-1 leading-snug">{plugin.name}</h3><p className="text-xs text-slate-500 mt-2 line-clamp-3">{plugin.description}</p></div>
          </button>
          <div className="px-5 pb-5 grid grid-cols-2 gap-2">
            {plugin.demoUrl && <button onClick={()=>open(plugin.demoUrl)} className="py-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center justify-center gap-2"><FlaskConical className="w-4 h-4"/>ทดลองใช้</button>}
            {unlocked ? <>
              {plugin.appUrl && <button onClick={()=>open(plugin.appUrl)} className="py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2"><Play className="w-4 h-4"/>เปิดโปรแกรม</button>}
              {plugin.downloadUrl && <a href={plugin.downloadUrl} className="py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2"><Download className="w-4 h-4"/>ดาวน์โหลดตัวติดตั้ง</a>}
            </> : <button onClick={()=>buy(plugin)} className="py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold">{plugin.priceTiers.length > 1 ? 'เลือกระดับ เริ่ม ' : 'ซื้อ '}฿{plugin.program?.price.toLocaleString()}</button>}
          </div>
        </article>;
      })}</div>
    </div>

    {selected && <div className="fixed inset-0 z-[70] bg-slate-950/65 backdrop-blur-sm p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="max-w-5xl mx-auto my-4 bg-white rounded-[28px] overflow-hidden shadow-2xl">
        <div className="relative bg-gradient-to-r from-blue-900 to-indigo-800 text-white p-6"><button onClick={()=>setSelected(null)} aria-label="ปิด" className="absolute right-4 top-4 p-2 rounded-full bg-white/10"><X/></button><div className="text-xs text-blue-200 font-bold">{selected.badge}</div><h2 className="text-2xl lg:text-3xl font-black mt-2 pr-12">{selected.name}</h2><p className="text-blue-100 text-sm mt-2 max-w-3xl">{selected.description}</p></div>
        <div className="p-6 grid lg:grid-cols-[1.2fr_.8fr] gap-6">
          <div><div className="grid grid-cols-2 gap-3">{selected.screenshots.slice(0,4).map((src,i)=><img key={src} src={src} alt={`ภาพตัวอย่าง ${i+1}`} className="w-full aspect-video object-cover rounded-xl border border-slate-200"/>)}</div><h3 className="font-extrabold text-lg mt-6 flex items-center gap-2"><BookOpen className="text-blue-600"/>ขั้นตอนใช้งาน</h3><ol className="mt-3 space-y-2">{selected.steps.map((step,i)=><li key={step} className="flex gap-3 text-sm"><span className="w-6 h-6 shrink-0 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-xs font-black">{i+1}</span><span>{step}</span></li>)}</ol></div>
          <aside className="rounded-2xl bg-slate-50 border border-slate-200 p-5 h-fit"><h3 className="font-extrabold">ความสามารถหลัก</h3><ul className="mt-3 space-y-3">{selected.highlights.map(item=><li key={item} className="flex gap-2 text-sm text-slate-700"><Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0"/>{item}</li>)}</ul>{!unlockedProgramIds.includes(selected.programId) && selected.priceTiers.length > 0 && <div className="mt-6"><h3 className="font-extrabold">เลือกระดับราคา</h3><div className="mt-3 space-y-2">{selected.priceTiers.map((tier) => <button key={tier.id} onClick={() => { order(selected, tier); setSelected(null); }} className="w-full rounded-xl border border-blue-200 bg-white p-3 text-left hover:border-blue-500"><div className="flex items-center justify-between gap-3"><span className="font-bold">{tier.name}</span><span className="font-black text-blue-700">฿{tier.price.toLocaleString()}</span></div><div className="mt-1 text-xs text-slate-500">{[tier.description, tier.offline ? 'รวมไฟล์ติดตั้งเอง' : '', tier.durationDays ? `ใช้ได้ ${tier.durationDays} วัน` : 'ใช้ได้ตลอดชีพ'].filter(Boolean).join(' · ')}</div></button>)}</div></div>}<div className="grid gap-2 mt-6"><button onClick={()=>open(selected.demoUrl)} className="primary-button flex items-center justify-center gap-2"><FlaskConical className="w-4 h-4"/>เปิดระบบทดลองทันที <ExternalLink className="w-4 h-4"/></button>{selected.manualUrl&&<button onClick={()=>open(selected.manualUrl)} className="secondary-button flex items-center justify-center gap-2"><FileText className="w-4 h-4"/>อ่านคู่มือ PDF</button>}{unlockedProgramIds.includes(selected.programId)?<button onClick={()=>open(selected.appUrl)} className="py-3 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2"><Play className="w-4 h-4"/>เข้าใช้งานโปรแกรม</button>:<button onClick={()=>order(selected)} className="py-3 rounded-xl bg-amber-500 text-slate-950 font-bold">ซื้อระบบ ฿{selected.program?.price.toLocaleString()}</button>}</div></aside>
        </div>
      </div>
    </div>}
  </section>;
}
