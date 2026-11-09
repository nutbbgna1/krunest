const PALETTES = {
  'games-activities': { from: '#4c1d95', to: '#db2777', accent: '#fbbf24', soft: '#fce7f3' },
  'เกมและกิจกรรม': { from: '#4c1d95', to: '#db2777', accent: '#fbbf24', soft: '#fce7f3' },
  'general-school': { from: '#123c8c', to: '#0891b2', accent: '#67e8f9', soft: '#cffafe' },
  'งานโรงเรียนทั่วไป': { from: '#123c8c', to: '#0891b2', accent: '#67e8f9', soft: '#cffafe' },
  'admin-finance': { from: '#26394f', to: '#0f766e', accent: '#f59e0b', soft: '#fef3c7' },
  'เอกสารธุรการและการเงิน': { from: '#26394f', to: '#0f766e', accent: '#f59e0b', soft: '#fef3c7' },
  assessment: { from: '#312e81', to: '#7c3aed', accent: '#c4b5fd', soft: '#ede9fe' },
  'วัดผลและประเมินผล': { from: '#312e81', to: '#7c3aed', accent: '#c4b5fd', soft: '#ede9fe' },
  'academic-curriculum': { from: '#164e63', to: '#2563eb', accent: '#22d3ee', soft: '#cffafe' },
  'วิชาการและหลักสูตร': { from: '#164e63', to: '#2563eb', accent: '#22d3ee', soft: '#cffafe' },
  'personnel-teacher': { from: '#7c2d12', to: '#be123c', accent: '#fdba74', soft: '#ffedd5' },
  'บุคลากรและงานครู': { from: '#7c2d12', to: '#be123c', accent: '#fdba74', soft: '#ffedd5' },
  'public-health': { from: '#064e3b', to: '#0d9488', accent: '#5eead4', soft: '#ccfbf1' },
  'สาธารณสุขและ รพ.สต.': { from: '#064e3b', to: '#0d9488', accent: '#5eead4', soft: '#ccfbf1' },
};

const ACCESS = { free: 'FREE', go: 'STARTER', pro: 'BUSINESS', max: 'ULTIMATE', paid: 'PREMIUM' };
const fallbackPalette = { from: '#172554', to: '#4338ca', accent: '#38bdf8', soft: '#e0f2fe' };

const escapeXml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&apos;');

const featureText = (value, index) => {
  const text = String(value || '');
  if (/คู่มือ|PDF/i.test(text)) return ['คู่มือพร้อม', 'PDF ใช้งานง่าย'];
  if (/บัญชี|ส่วนตัว|ข้อมูล/i.test(text)) return ['ข้อมูลส่วนตัว', 'แยกตามบัญชีผู้ใช้'];
  if (/เว็บ|ออนไลน์|ทันที/i.test(text)) return ['เปิดใช้ทันที', 'ทำงานผ่านเว็บ'];
  return [text.slice(0, 22) || `จุดเด่น ${index + 1}`, index === 0 ? 'ออกแบบเพื่อใช้งานจริง' : 'พร้อมสำหรับงานประจำวัน'];
};

export function extractCoverScreenshot(sourceSvg) {
  const match = String(sourceSvg || '').match(/<image\s+href="(data:image\/(?:png|jpeg|webp);base64,[^"]+)"/i);
  return match?.[1] || null;
}

export function buildPluginCover(manifest, sourceSvg, categoryLabel = '') {
  const screenshot = extractCoverScreenshot(sourceSvg);
  if (!screenshot) return null;
  const category = categoryLabel || manifest.category || 'HTML Standalone';
  const palette = PALETTES[manifest.category] || PALETTES[category] || fallbackPalette;
  const title = manifest.program?.thaiName || manifest.name || 'โปรแกรม Krunest';
  const plan = ACCESS[manifest.access] || 'READY';
  const highlights = Array.isArray(manifest.highlights) ? manifest.highlights.slice(0, 3) : [];
  while (highlights.length < 3) highlights.push(['เปิดใช้งานผ่านเว็บได้ทันที', 'ข้อมูลแยกตามบัญชีผู้ใช้', 'มีคู่มือการใช้งาน PDF'][highlights.length]);
  const features = highlights.map(featureText);

  const cards = features.map(([heading, detail], index) => {
    const y = 414 + index * 128;
    return `<g transform="translate(0 ${y})">
      <rect x="1240" width="300" height="106" rx="24" fill="#fff" fill-opacity=".96"/>
      <circle cx="1282" cy="53" r="25" fill="${palette.soft}"/>
      <path d="M1271 53l7 7 15-17" fill="none" stroke="${palette.to}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <foreignObject x="1322" y="20" width="195" height="72"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:-apple-system,BlinkMacSystemFont,'Noto Sans Thai',Tahoma,sans-serif;color:#152238;font-size:20px;font-weight:850;line-height:1.15;overflow:hidden;">${escapeXml(heading)}<div style="color:#64748b;font-size:14px;font-weight:600;margin-top:7px;">${escapeXml(detail)}</div></div></foreignObject>
    </g>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette.from}"/><stop offset=".58" stop-color="${palette.to}"/><stop offset="1" stop-color="#07111f"/></linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="glow"><stop stop-color="${palette.accent}" stop-opacity=".42"/><stop offset="1" stop-color="${palette.accent}" stop-opacity="0"/></radialGradient>
    <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="#fff" opacity=".12"/></pattern>
    <clipPath id="screen"><rect x="72" y="318" width="1080" height="494" rx="25"/></clipPath>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#020617" flood-opacity=".48"/></filter>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)"/>
  <rect width="1600" height="900" fill="url(#dots)"/>
  <circle cx="1460" cy="-20" r="420" fill="url(#glow)"/>
  <circle cx="80" cy="900" r="360" fill="url(#glow)" opacity=".7"/>
  <path d="M1010 0h590v210L1340 90z" fill="url(#shine)" opacity=".5"/>
  <path d="M0 760c290-110 490-60 710 140H0z" fill="#fff" opacity=".06"/>

  <g transform="translate(58 42)">
    <rect width="390" height="58" rx="29" fill="#fff" fill-opacity=".96"/>
    <circle cx="32" cy="29" r="8" fill="${palette.accent}"/>
    <text x="215" y="38" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" font-weight="800" fill="#172033">HTML STANDALONE  •  ${escapeXml(plan)}</text>
  </g>
  <g transform="translate(1330 42)"><rect width="212" height="58" rx="29" fill="#fff" fill-opacity=".16" stroke="#fff" stroke-opacity=".34"/><text x="106" y="38" text-anchor="middle" font-family="Arial,sans-serif" font-size="23" font-weight="900" fill="#fff">KRUNEST</text></g>

  <foreignObject x="60" y="122" width="1090" height="146"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:-apple-system,BlinkMacSystemFont,'Noto Sans Thai',Tahoma,sans-serif;font-size:50px;font-weight:900;line-height:1.1;color:#fff;letter-spacing:-1px;max-height:142px;overflow:hidden;text-shadow:0 5px 22px rgba(0,0,0,.25);">${escapeXml(title)}</div></foreignObject>
  <g transform="translate(1210 150)"><rect width="332" height="60" rx="20" fill="#07111f" fill-opacity=".38" stroke="#fff" stroke-opacity=".25"/><circle cx="30" cy="30" r="9" fill="${palette.accent}"/><foreignObject x="52" y="10" width="260" height="42"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:-apple-system,BlinkMacSystemFont,'Noto Sans Thai',Tahoma,sans-serif;color:#fff;font-size:20px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeXml(category)}</div></foreignObject></g>
  <text x="1538" y="242" text-anchor="end" font-family="Arial,sans-serif" font-size="17" font-weight="700" fill="#fff" opacity=".8">WEB APP  •  PRIVATE DATA  •  PDF GUIDE</text>

  <g filter="url(#shadow)">
    <rect x="58" y="282" width="1110" height="558" rx="36" fill="#07111f" fill-opacity=".84" stroke="#fff" stroke-opacity=".75" stroke-width="4"/>
    <rect x="72" y="296" width="1080" height="40" rx="20" fill="#0f172a"/>
    <circle cx="100" cy="316" r="7" fill="#fb7185"/><circle cx="124" cy="316" r="7" fill="#fbbf24"/><circle cx="148" cy="316" r="7" fill="#34d399"/>
    <rect x="180" y="307" width="230" height="18" rx="9" fill="#fff" opacity=".12"/>
    <g transform="translate(985 303)"><rect width="148" height="27" rx="13.5" fill="${palette.accent}"/><circle cx="18" cy="13.5" r="5" fill="#fff"/><text x="86" y="19" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="900" fill="#172033">LIVE PREVIEW</text></g>
    <image href="${screenshot}" x="72" y="318" width="1080" height="494" preserveAspectRatio="xMidYMin slice" clip-path="url(#screen)"/>
    <rect x="72" y="318" width="1080" height="494" rx="25" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2"/>
  </g>

  <rect x="1206" y="282" width="336" height="558" rx="34" fill="#07111f" fill-opacity=".68" stroke="#fff" stroke-opacity=".3" stroke-width="2" filter="url(#shadow)"/>
  <rect x="1238" y="316" width="54" height="8" rx="4" fill="${palette.accent}"/>
  <foreignObject x="1238" y="340" width="270" height="54"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:-apple-system,BlinkMacSystemFont,'Noto Sans Thai',Tahoma,sans-serif;color:#fff;font-size:30px;font-weight:900;">จุดเด่น</div></foreignObject>
  ${cards}
  <g transform="translate(1240 806)"><circle cx="10" cy="10" r="10" fill="#34d399"/><path d="M5 10l3 3 7-8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="30" y="16" font-family="Arial,sans-serif" font-size="15" font-weight="800" fill="#dbeafe">READY TO USE • SECURE • RESPONSIVE</text></g>
</svg>`;
}
