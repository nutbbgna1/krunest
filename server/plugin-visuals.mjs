const entries = {
  'vs-random-picker': ['game', 'วงล้อ A • B • C'],
  'vs-sports-day': ['game', 'กีฬาสี • ตารางคะแนน'],
  'vs-spelling-bee': ['game', 'SPELL • ผึ้งคำศัพท์'],
  'vs-buzzer': ['game', 'BUZZ! • ตอบเร็ว'],
  'vs-crossword-maker': ['game', 'C R O S S W O R D'],
  'vs-word-search': ['game', 'W O R D • ค้นหาคำ'],
  'vs-morning-assembly': ['school', 'ข่าววันนี้ • หน้าเสาธง'],
  'vs-classroom-timer': ['game', '05:00 • START'],
  'vs-millionaire-quiz': ['game', '1,000,000 • QUIZ'],
  'vs-bingo-maker': ['game', 'B I N G O • 5×5'],
  'vs-snake-ladder-quiz': ['game', 'บันไดงู • 1—100'],
  'vs-picture-puzzle': ['game', 'ภาพปริศนา • ?'],
  'vs-word-guess': ['game', 'T _ A _ • ทายคำ'],
  'vs-team-quiz': ['game', 'TEAM A  8 : 7  TEAM B'],
  'vs-memory-game': ['game', 'จับคู่ • A A • B B'],
  'vs-mental-math': ['game', '48 × 25 = ?'],
  'vs-jeopardy': ['game', '100 • 200 • 300'],
  'vs-chinese-worksheet': ['worksheet', '中文 • 你好 • nǐ hǎo'],
  'vs-class-points': ['school', 'ดาวพฤติกรรม • +10'],
  'vs-loan-clearing': ['document', 'สัญญายืมเงิน • ล้างหนี้'],
  'vs-field-trip': ['transport', 'ทัศนศึกษา • รายชื่อนักเรียน'],
  'vs-welfare-claim': ['document', 'ค่าการศึกษา • ค่ารักษา'],
  'vs-subsidy-5': ['document', 'เรียนฟรี 15 ปี • 5 รายการ'],
  'vs-housing-allowance': ['document', 'ค่าเช่าบ้าน • 6005/6006'],
  'vs-service-contract': ['document', 'สัญญาจ้าง • รายเดือน'],
  'vs-procure-specific': ['document', 'จัดซื้อจัดจ้าง • เฉพาะเจาะจง'],
  'vs-procure-selection': ['document', 'จัดซื้อจัดจ้าง • วิธีคัดเลือก'],
  'vs-official-trip': ['transport', 'ไปราชการ • รายงานผล'],
  'vs-asset-disposal': ['document', 'พัสดุชำรุด • จำหน่าย'],
  'vs-student-cert': ['card', 'หนังสือรับรอง • TH / EN'],
  'vs-doc-register': ['document', 'รับ 0124 • ส่ง 0088'],
  'vs-procure-plan': ['chart', 'แผนจัดซื้อ • สขร.1'],
  'vs-overtime-claim': ['document', 'OT • ชั่วโมง × อัตรา'],
  'vs-asset-audit': ['chart', 'ทะเบียนพัสดุ • ตรวจนับ'],
  'vs-price-tor': ['document', 'ราคากลาง • TOR'],
  'vs-memo-writer': ['document', 'บันทึกข้อความ • หนังสือราชการ'],
  'vs-order-maker': ['document', 'คำสั่งโรงเรียน • คณะกรรมการ'],
  'vs-envelope-print': ['card', 'ซองจดหมาย • เรียน ผู้อำนวยการ'],
  'vs-ceremony-kit': ['card', 'บัตรเชิญ • กำหนดการ'],
  'vs-scout': ['transport', 'ลูกเสือ • เข้าค่าย • ประเมิน'],
  'vs-school-finance-html': ['chart', 'รายรับ • รายจ่าย • คงเหลือ'],
  'vs-project-report': ['chart', 'CIPP • ประเมินโครงการ'],
  'vs-best-practice': ['book', 'นวัตกรรม • Best Practice'],
  'vs-project-writer': ['document', 'หลักการ • เป้าหมาย • งบประมาณ'],
  'vs-facility-rental': ['school', 'อาคาร • ห้องประชุม • อนุมัติ'],
  'vs-income-ledger': ['chart', 'เงินรายได้ • ทะเบียนคุม'],
  'vs-committee-pay': ['chart', 'กรรมการ × วัน × อัตรา'],
  'vs-school-nurse': ['health', 'ห้องพยาบาล • อาการ • การรักษา'],
  'vs-bedridden-visit': ['health', 'ADL • เยี่ยมบ้าน • เส้นทาง'],
  'vs-medical-cert': ['health', 'ใบรับรองแพทย์ • รพ.สต.'],
  'vs-appointment-card': ['health', 'บัตรนัด • ใบส่งต่อ'],
  'vs-drug-label': ['health', 'ฉลากยา • เช้า กลางวัน เย็น'],
  'vs-cv-risk': ['health', 'Thai CV Risk • หัวใจ'],
  'vs-refer-form': ['health', 'ใบส่งต่อ • HN 012345'],
  'vs-dental-check': ['health', 'ตรวจฟัน • 18 / 20 ซี่'],
  'vs-school-vaccine': ['health', 'วัคซีน • เข็มที่ 1 • ยินยอม'],
  'vs-anc-calc': ['health', 'อายุครรภ์ 24 สัปดาห์'],
  'vs-elderly-assess': ['health', 'ประเมินผู้สูงอายุ • ADL'],
  'vs-ckd-screen': ['health', 'eGFR • CKD • ไต'],
  'vs-depression-screen': ['health', '2Q • 9Q • 8Q'],
  'vs-growth-chart': ['chart', 'ส่วนสูง • น้ำหนัก • อายุ'],
  'vs-med-equipment': ['health', 'เครื่องมือแพทย์ • PM 2569'],
  'vs-lesson-plan': ['book', 'แผนการเรียนรู้ • จุดประสงค์'],
  'vs-reading-log': ['book', 'สมุดรักการอ่าน • 12 เล่ม'],
  'vs-reading-screen': ['worksheet', 'อ่านออก • เขียนได้ • ป.1–ป.3'],
  'vs-vocab-flashcard': ['card', 'APPLE • แอปเปิล • A'],
  'vs-social-worksheet': ['worksheet', 'สังคม • ประวัติศาสตร์ • พลเมือง'],
  'vs-science-worksheet': ['worksheet', 'ทดลอง • สมมติฐาน • ผลลัพธ์'],
  'vs-unplugged-ws': ['worksheet', 'ลำดับคำสั่ง → → ↑ ↓'],
  'vs-english-worksheet': ['worksheet', 'A B C • English Worksheet'],
  'vs-thai-worksheet': ['worksheet', 'ก ข ค • ใบงานภาษาไทย'],
  'vs-ec-worksheet': ['worksheet', 'ลากเส้น • ระบายสี • 1 2 3'],
  'vs-math-worksheet': ['worksheet', '12 + 8 = □ • 6 × 4 = □'],
  'vs-handwriting-sheet': ['worksheet', 'ก  ก  ก • ฝึกคัดลายมือ'],
  'vs-ec-sar': ['chart', 'SAR ปฐมวัย • 3 มาตรฐาน'],
  'vs-sar-writer': ['chart', 'SAR สถานศึกษา • ผลประเมิน'],
  'vs-school-calendar': ['calendar', 'ปฏิทินวิชาการ • 2569'],
  'vs-handbook-maker': ['book', 'คู่มือนักเรียน • ผู้ปกครอง'],
  'vs-school-curriculum': ['book', 'หลักสูตร • โครงสร้างเวลาเรียน'],
  'vs-edu-standard': ['chart', 'มาตรฐาน • ค่าเป้าหมาย'],
  'vs-strategic-plan': ['chart', 'SWOT • แผน 3–5 ปี'],
  'vs-action-plan': ['calendar', 'แผนปฏิบัติการ • ประจำปี'],
  'vs-iep': ['document', 'IEP • เป้าหมายรายบุคคล'],
  'vs-course-syllabus': ['book', 'คำอธิบายรายวิชา • หน่วยเรียน'],
  'vs-learner-analysis': ['chart', 'ผู้เรียนรายบุคคล • จุดแข็ง'],
  'vs-student-assess': ['chart', 'อ่าน • คิด • เขียน • สมรรถนะ'],
  'vs-exam-generator': ['exam', 'ข้อสอบชุด A • 1 2 3 4'],
  'vs-offline-quiz': ['exam', 'QUIZ • 10 ข้อ • ออฟไลน์'],
  'vs-rubric-scorer': ['exam', 'รูบริก • 4 3 2 1'],
  'vs-research-stats': ['chart', 'IOC • E1/E2 • t-test'],
  'vs-national-test': ['chart', 'O-NET • NT • RT'],
  'vs-item-analysis': ['chart', 'ความยาก • อำนาจจำแนก'],
  'vs-curriculum-eval': ['chart', 'ประเมินหลักสูตร • 4.65'],
  'vs-teacher-portfolio': ['book', 'TEACHER PORTFOLIO • ผลงานครู'],
  'vs-student-portfolio': ['book', 'STUDENT PORTFOLIO • ผลงานเด่น'],
  'vs-report-card': ['exam', 'เกรด A • ปพ.6'],
  'vs-omr-checker': ['exam', 'OMR • ● ○ ● ○ • 40/50'],
  'vs-gpax-checker': ['chart', 'GPAX 3.72 • ผ่านเกณฑ์'],
  'vs-training-expense': ['document', 'อบรม • ค่าใช้จ่าย • จัดงาน'],
  'vs-homeroom': ['school', 'โฮมรูม • ครูที่ปรึกษา'],
  'vs-plc-log': ['people', 'PLC • แลกเปลี่ยน • พัฒนา'],
  'vs-class-observe': ['school', 'นิเทศชั้นเรียน • สังเกตการสอน'],
  'vs-duty-schedule': ['calendar', 'ตารางเวรครู • จ–ศ'],
  'vs-substitute-teacher': ['calendar', 'ครูสอนแทน • คาบ 1–8'],
  'vs-flashcard-maker': ['card', 'บัตรคำ • บัตรภาพ • A B C'],
  'vs-pa-report': ['chart', 'PA ปลายปี • ผลการพัฒนา'],
  'vs-teacher-sar': ['chart', 'SAR ครู • ผลการปฏิบัติงาน'],
  'vs-org-chart': ['people', 'ผู้อำนวยการ → 4 ฝ่าย'],
  'vs-post-teaching': ['book', 'บันทึกหลังสอน • ผลการเรียนรู้'],
  'vs-remedial-log': ['people', 'ซ่อมเสริม • รายบุคคล'],
  'vs-pa-agreement': ['document', 'วPA • ข้อตกลงพัฒนางาน'],
  'vs-graduation-kit': ['card', 'ปัจฉิมนิเทศ • ประกาศนียบัตร'],
  'vs-teaching-load': ['chart', '18 คาบ • 21 ชั่วโมง'],
  'vs-pension-calc': ['chart', 'บำเหน็จ • บำนาญ • ประมาณการ'],
  'vs-salary-raise': ['chart', 'เงินเดือน • 3.25% • ขั้นใหม่'],
  'vs-classroom-research': ['book', 'วิจัยในชั้นเรียน • บทที่ 1–5'],
  'vs-training-report': ['book', 'อบรม • ศึกษาดูงาน • รายงานผล'],
  'vs-certificate-maker': ['card', 'เกียรติบัตร • CERTIFICATE'],
  'vs-student-election': ['school', 'เลือกตั้ง • หมายเลข 1 2 3'],
  'vs-queue-caller': ['school', 'A-025 • ช่องบริการ 03'],
  'vs-student-card': ['card', 'บัตรนักเรียน • ID 2569'],
  'vs-qr-attendance': ['card', 'QR • เช็กชื่อ • 08:05'],
  'vs-exam-room': ['school', 'ห้องสอบ 301 • เลขที่นั่ง'],
  'vs-seating-plan': ['school', 'ผังที่นั่ง • A1–F6'],
  'vs-bus-seating': ['transport', 'รถรับส่ง • ที่นั่ง 1–32'],
  'vs-trip-badge': ['card', 'บัตรทัศนศึกษา • กลุ่มสีฟ้า'],
  'vs-class-meeting': ['people', 'ประชุมผู้ปกครอง • ห้อง 3/1'],
  'vs-yearbook': ['book', 'YEARBOOK 2569 • รุ่นของเรา'],
  'vs-name-sign': ['card', 'ป้ายชื่อ • ป้ายห้อง • โต๊ะ'],
  'vs-exam-admin': ['calendar', 'ตารางสอบ • ห้อง • กรรมการ'],
};

const escapeXml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&apos;');

export function describePluginVisual(manifest = {}) {
  const [kind, sample] = entries[manifest.slug] || [];
  return { kind: kind || 'unmapped', sample: sample || '', mapped: Boolean(kind) };
}

const textBlock = (sample, color = '#172033') => `<foreignObject x="150" y="365" width="770" height="100"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:-apple-system,BlinkMacSystemFont,'Noto Sans Thai','Noto Sans SC',Tahoma,sans-serif;color:${color};font-size:34px;font-weight:900;line-height:1.25;text-align:center;overflow:hidden;">${escapeXml(sample)}</div></foreignObject>`;

const worksheet = (sample, accent) => `<g transform="translate(115 38) rotate(-3 380 250)">
  <rect x="120" y="52" width="650" height="430" rx="24" fill="#e2e8f0" opacity=".5" transform="translate(22 22)"/>
  <rect x="120" y="52" width="650" height="430" rx="24" fill="#fff"/>
  <rect x="120" y="52" width="650" height="72" rx="24" fill="${accent}"/><rect x="120" y="100" width="650" height="24" fill="${accent}"/>
  <text x="160" y="98" font-family="Arial,sans-serif" font-size="24" font-weight="900" fill="#172033">WORKSHEET</text>
  <foreignObject x="175" y="150" width="520" height="82"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:-apple-system,BlinkMacSystemFont,'Noto Sans Thai','Noto Sans SC',Tahoma,sans-serif;color:#172033;font-size:38px;font-weight:900;line-height:1.15;text-align:center;overflow:hidden;">${escapeXml(sample)}</div></foreignObject>
  <g stroke="#cbd5e1" stroke-width="3">${[0,1].map((r) => [0,1,2,3,4].map((c) => `<rect x="${175 + c * 105}" y="${258 + r * 82}" width="86" height="62" rx="10" fill="#f8fafc"/>`).join('')).join('')}</g>
  <circle cx="705" cy="92" r="18" fill="#fff" opacity=".85"/><path d="M695 92l7 7 15-18" fill="none" stroke="#0f766e" stroke-width="6" stroke-linecap="round"/>
  </g>`;

const game = (sample, accent) => `<g transform="translate(120 42)">
  <circle cx="350" cy="265" r="205" fill="#fff" opacity=".98"/><circle cx="350" cy="265" r="168" fill="none" stroke="${accent}" stroke-width="66" stroke-dasharray="92 44"/>
  <circle cx="350" cy="265" r="72" fill="#172033"/><circle cx="350" cy="265" r="25" fill="${accent}"/>
  <path d="M350 20l-24 55h48z" fill="#fff" stroke="#172033" stroke-width="8"/>
  <rect x="600" y="92" width="330" height="320" rx="34" fill="#fff" opacity=".96"/>
  <g fill="${accent}">${[0,1,2].map((i) => `<rect x="640" y="${138+i*78}" width="250" height="54" rx="15" opacity="${1-i*.18}"/>`).join('')}</g>
  ${textBlock(sample)}
  </g>`;

const document = (sample, accent) => `<g transform="translate(105 34)">
  <rect x="145" y="62" width="590" height="430" rx="28" fill="#cbd5e1" opacity=".35" transform="translate(28 24) rotate(3 440 275)"/>
  <rect x="145" y="62" width="590" height="430" rx="28" fill="#fff"/>
  <rect x="190" y="118" width="210" height="26" rx="13" fill="${accent}"/><rect x="190" y="170" width="450" height="14" rx="7" fill="#cbd5e1"/>
  <rect x="190" y="207" width="360" height="14" rx="7" fill="#e2e8f0"/><rect x="190" y="244" width="420" height="14" rx="7" fill="#e2e8f0"/>
  <rect x="190" y="291" width="450" height="92" rx="18" fill="#f1f5f9"/>
  <circle cx="665" cy="410" r="55" fill="none" stroke="${accent}" stroke-width="12"/><path d="M635 410l22 22 42-54" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round"/>
  ${textBlock(sample)}
  </g>`;

const health = (sample, accent) => `<g transform="translate(110 40)">
  <rect x="120" y="55" width="720" height="430" rx="38" fill="#fff" opacity=".97"/>
  <rect x="165" y="100" width="270" height="160" rx="28" fill="${accent}" opacity=".18"/>
  <rect x="273" y="125" width="54" height="110" rx="12" fill="${accent}"/><rect x="245" y="153" width="110" height="54" rx="12" fill="${accent}"/>
  <path d="M480 205h55l30-65 45 145 35-80h150" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  <g fill="#e2e8f0">${[0,1,2].map((i) => `<rect x="165" y="${305+i*48}" width="590" height="22" rx="11"/>`).join('')}</g>
  ${textBlock(sample)}
  </g>`;

const chart = (sample, accent) => `<g transform="translate(110 40)">
  <rect x="120" y="55" width="720" height="430" rx="38" fill="#fff" opacity=".97"/>
  <g fill="${accent}">${[115,205,285,365,250].map((h,i) => `<rect x="${185+i*95}" y="${390-h}" width="62" height="${h}" rx="18" opacity="${.55+i*.09}"/>`).join('')}</g>
  <circle cx="710" cy="185" r="92" fill="none" stroke="#e2e8f0" stroke-width="34"/><path d="M710 93a92 92 0 0 1 83 132" fill="none" stroke="${accent}" stroke-width="34" stroke-linecap="round"/>
  ${textBlock(sample)}
  </g>`;

const calendar = (sample, accent) => `<g transform="translate(110 40)">
  <rect x="120" y="55" width="720" height="430" rx="38" fill="#fff" opacity=".97"/>
  <rect x="120" y="55" width="720" height="88" rx="38" fill="${accent}"/><rect x="120" y="112" width="720" height="31" fill="${accent}"/>
  <g fill="#e2e8f0">${[0,1,2,3].map((r)=>[0,1,2,3,4,5,6].map((c)=>`<rect x="${160+c*92}" y="${175+r*64}" width="62" height="42" rx="9"/>`).join('')).join('')}</g>
  <rect x="436" y="239" width="62" height="42" rx="9" fill="${accent}"/>
  ${textBlock(sample)}
  </g>`;

const card = (sample, accent) => `<g transform="translate(105 40)">
  <rect x="120" y="85" width="720" height="390" rx="42" fill="#fff" opacity=".98" transform="rotate(-3 480 280)"/>
  <rect x="120" y="85" width="720" height="88" rx="42" fill="${accent}" transform="rotate(-3 480 280)"/>
  <circle cx="260" cy="275" r="82" fill="${accent}" opacity=".2"/><circle cx="260" cy="248" r="33" fill="${accent}"/><path d="M195 355c18-72 112-72 130 0" fill="${accent}"/>
  <rect x="385" y="220" width="350" height="22" rx="11" fill="#cbd5e1"/><rect x="385" y="272" width="270" height="18" rx="9" fill="#e2e8f0"/><rect x="385" y="318" width="310" height="18" rx="9" fill="#e2e8f0"/>
  ${textBlock(sample)}
  </g>`;

const book = (sample, accent) => `<g transform="translate(105 38)">
  <path d="M110 105q190-75 360 28v360q-170-105-360-25z" fill="#fff"/><path d="M470 133q170-103 360-28v363q-190-80-360 25z" fill="#f8fafc"/>
  <path d="M470 133v360" stroke="${accent}" stroke-width="10"/>
  <g stroke="#cbd5e1" stroke-width="12" stroke-linecap="round">${[0,1,2,3].map(i=>`<path d="M160 ${190+i*55}h230M550 ${190+i*55}h220"/>`).join('')}</g>
  <circle cx="690" cy="380" r="55" fill="${accent}"/><path d="M665 380l18 18 34-45" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round"/>
  ${textBlock(sample)}
  </g>`;

const school = (sample, accent) => `<g transform="translate(105 35)">
  <rect x="115" y="65" width="730" height="420" rx="36" fill="#fff" opacity=".97"/>
  <rect x="160" y="110" width="640" height="170" rx="24" fill="#172033"/><rect x="205" y="150" width="340" height="25" rx="12" fill="${accent}"/>
  <g fill="${accent}" opacity=".8">${[0,1,2].map(r=>[0,1,2,3].map(c=>`<rect x="${190+c*150}" y="${330+r*48}" width="112" height="27" rx="10"/>`).join('')).join('')}</g>
  ${textBlock(sample, '#fff')}
  </g>`;

const people = (sample, accent) => `<g transform="translate(105 38)">
  <rect x="120" y="55" width="720" height="430" rx="38" fill="#fff" opacity=".97"/>
  <path d="M480 190v85M250 275h460M250 275v65M480 275v65M710 275v65" stroke="${accent}" stroke-width="12" stroke-linecap="round"/>
  ${[[480,135],[250,390],[480,390],[710,390]].map(([x,y],i)=>`<g><circle cx="${x}" cy="${y}" r="55" fill="${accent}" opacity="${.95-i*.12}"/><circle cx="${x}" cy="${y-10}" r="17" fill="#fff"/><path d="M${x-30} ${y+28}q30-38 60 0" fill="#fff"/></g>`).join('')}
  ${textBlock(sample)}
  </g>`;

const exam = (sample, accent) => `<g transform="translate(105 35)">
  <rect x="140" y="55" width="600" height="440" rx="30" fill="#fff"/>
  <rect x="190" y="105" width="300" height="25" rx="12" fill="${accent}"/>
  ${[0,1,2,3,4].map((r)=>`<text x="195" y="${190+r*50}" font-family="Arial" font-size="23" font-weight="900" fill="#64748b">${r+1}</text>${[0,1,2,3].map(c=>`<circle cx="${270+c*75}" cy="${182+r*50}" r="17" fill="${(r+c)%4===0?accent:'#fff'}" stroke="#94a3b8" stroke-width="4"/>`).join('')}`).join('')}
  <circle cx="735" cy="365" r="110" fill="${accent}"/><text x="735" y="388" text-anchor="middle" font-family="Arial" font-size="70" font-weight="900" fill="#172033">A+</text>
  ${textBlock(sample)}
  </g>`;

const transport = (sample, accent) => `<g transform="translate(105 38)">
  <path d="M150 365C280 150 510 100 780 170" fill="none" stroke="#fff" stroke-width="58" stroke-linecap="round" opacity=".95"/>
  <path d="M150 365C280 150 510 100 780 170" fill="none" stroke="${accent}" stroke-width="9" stroke-dasharray="24 22" stroke-linecap="round"/>
  <g transform="translate(430 180) rotate(-12)"><rect width="310" height="170" rx="35" fill="#fff"/><rect x="35" y="30" width="240" height="68" rx="15" fill="${accent}" opacity=".35"/><circle cx="75" cy="170" r="34" fill="#172033"/><circle cx="240" cy="170" r="34" fill="#172033"/></g>
  <circle cx="150" cy="365" r="32" fill="${accent}"/><circle cx="780" cy="170" r="32" fill="${accent}"/>
  ${textBlock(sample)}
  </g>`;

const renderers = { worksheet, game, document, health, chart, calendar, card, book, school, people, exam, transport };

export function renderPluginVisual(manifest, accent = '#fbbf24') {
  const spec = describePluginVisual(manifest);
  const renderer = renderers[spec.kind];
  if (!renderer) return null;
  return `<g data-visual-kind="${spec.kind}">${renderer(spec.sample, accent)}</g>`;
}

export const mappedVisualSlugs = Object.freeze(Object.keys(entries));
