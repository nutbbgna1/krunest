export type ProgramCategory = 'all' | 'erp' | 'creative' | 'crm' | 'document';

export interface WorkflowStep {
  stepNumber: string;
  title: string;
  subtitle: string;
  metricLabel: string;
  detail: string;
}

export interface SoftwareProgram {
  id: string;
  slug: string;
  name: string;
  thaiName: string;
  category: Exclude<ProgramCategory, 'all'>;
  categoryLabel: string;
  version: string;
  platforms: string;
  updatedAt: string;
  tagline: string;
  description: string;
  monthlyPrice: number;
  lifetimePrice: number;
  savedHoursPerWeek: number;
  activeUsersCount: string;
  diagramType: 'erp-flow' | 'photo-studio' | 'omnichat-crm' | 'etax-ledger' | 'pos-smart' | 'payroll-hr';
  accentColor: 'blue' | 'emerald' | 'amber' | 'indigo';
  workflowSteps: WorkflowStep[];
  highlights: string[];
  deliverables: string[];
  hasLiveCloudApp: boolean;
}

export interface SubscriptionPlan {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  thaiTitle: string;
  audience: string;
  monthlyPrice: number;
  annualPricePerMonth: number;
  maxSeats: number;
  cloudStorageGb: number;
  includedProgramIds: string[];
  features: {
    label: string;
    value: string;
  }[];
}

export const SOFTWARE_PROGRAMS: SoftwareProgram[] = [
  {
    id: 'flowsync-erp',
    slug: 'flowsync-erp',
    name: 'FlowSync ERP & Stock',
    thaiName: 'ระบบจัดการคลังสินค้าและตัดสต็อกอัตโนมัติ',
    category: 'erp',
    categoryLabel: 'จัดการสต็อกและบัญชี',
    version: 'v4.8 Stable',
    platforms: 'Cloud Web · Windows · macOS',
    updatedAt: 'อัปเดต ต.ค. 2026',
    tagline: 'ซิงค์สต็อกจากทุกช่องทางขาย ตัดคลังสินค้าแบบเรียลไทม์ พร้อมออกใบแจ้งหนี้อัตโนมัติ',
    description:
      'ออกแบบมาสำหรับธุรกิจค้าปลีกและค้าส่งที่มีหลายช่องทางขาย เชื่อมต่อยอดคำสั่งซื้อเข้ากับคลังสินค้ากลาง คำนวณจุดสั่งซื้อใหม่ (Reorder Point) และสร้างเอกสารใบเสนอราคาหรือใบแจ้งหนี้ได้ในคลิกเดียว',
    monthlyPrice: 890,
    lifetimePrice: 6900,
    savedHoursPerWeek: 14,
    activeUsersCount: '4,280 กิจการ',
    diagramType: 'erp-flow',
    accentColor: 'blue',
    workflowSteps: [
      {
        stepNumber: '01',
        title: 'รับออร์เดอร์และสแกนบาร์โค้ด',
        subtitle: 'Order & Barcode Intake',
        metricLabel: 'ซิงค์ข้อมูลภายใน 0.4 วินาที',
        detail: 'ดึงรายการสั่งซื้อจากหน้าเว็บ พนักงานขาย หรือเครื่องยิงบาร์โค้ดเข้าสู่ฐานข้อมูลกลางทันที'
      },
      {
        stepNumber: '02',
        title: 'ตัดสต็อกและเช็คจุดสั่งซื้อ (Min-Max)',
        subtitle: 'Real-Time Stock Allocation',
        metricLabel: 'ความแม่นยำสต็อก 99.9%',
        detail: 'จองสินค้าในคลังอัตโนมัติ แจ้งเตือนทันทีเมื่อสินค้าต่ำกว่าเกณฑ์ขั้นต่ำที่กำหนดไว้'
      },
      {
        stepNumber: '03',
        title: 'ออกใบแจ้งหนี้และสรุปต้นทุน FIFO',
        subtitle: 'Automated Invoice & Ledger',
        metricLabel: 'ลดเวลาทำบัญชี 75%',
        detail: 'คำนวณภาษีมูลค่าเพิ่ม 7% และต้นทุนสินค้าแบบเข้าก่อน-ออกก่อน พร้อมส่งออกไฟล์บัญชีทันที'
      }
    ],
    highlights: [
      'รองรับหลายคลังสินค้าและโอนย้ายสินค้าระหว่างสาขา',
      'คำนวณต้นทุนจริงและกำไรขั้นต้นรายชิ้นแบบเรียลไทม์',
      'พิมพ์ใบปะหน้าพัสดุและใบเสร็จรับเงินผ่านเว็บได้ทันที'
    ],
    deliverables: [
      'เข้าใช้งานผ่านเว็บคลาวด์ทันที (ไม่ต้องติดตั้ง)',
      'ตัวติดตั้งสำหรับ Windows / macOS พร้อมฐานข้อมูลออฟไลน์',
      'คู่มือเชื่อมต่อเครื่องสแกนบาร์โค้ดและเครื่องพิมพ์ความร้อน'
    ],
    hasLiveCloudApp: true
  },
  {
    id: 'pixelcraft-studio',
    slug: 'pixelcraft-studio',
    name: 'PixelCraft Batch Studio',
    thaiName: 'โปรแกรมไดคัทและแต่งภาพสินค้ายกเซ็ต',
    category: 'creative',
    categoryLabel: 'แต่งภาพและสื่อการค้า',
    version: 'v3.4 Studio',
    platforms: 'Cloud Web · macOS · Windows',
    updatedAt: 'อัปเดต ต.ค. 2026',
    tagline: 'ลบพื้นหลัง ปรับแสงสตูดิโอ ใส่กรอบโปรโมชัน และย่อขนาดภาพสินค้าครั้งละ 500 รูป',
    description:
      'เปลี่ยนภาพถ่ายสินค้าจากมือถือให้กลายเป็นภาพสตูดิโอระดับมืออาชีพ รองรับการประมวลผลแบบกลุ่ม (Batch Pipeline) ตั้งค่าเงาสะท้อน ขอบขาวมาตรฐานมาร์เก็ตเพลส และลายน้ำแบรนด์ได้ในหน้าเดียว',
    monthlyPrice: 650,
    lifetimePrice: 4800,
    savedHoursPerWeek: 18,
    activeUsersCount: '6,150 ร้านค้า',
    diagramType: 'photo-studio',
    accentColor: 'indigo',
    workflowSteps: [
      {
        stepNumber: '01',
        title: 'นำเข้าภาพถ่ายสินค้าดิบยกโฟลเดอร์',
        subtitle: 'Batch Raw Import',
        metricLabel: 'รองรับสูงสุด 500 ภาพ/ชุด',
        detail: 'ลากไฟล์ภาพ JPG, PNG หรือ WEBP เข้าสู่คิวงานพร้อมกันโดยไม่ต้องเปิดทีละไฟล์'
      },
      {
        stepNumber: '02',
        title: 'แยกฉากหลังและจำลองไฟสตูดิโอ',
        subtitle: 'Clean Cutout & Daylight Rig',
        metricLabel: 'ประมวลผล 1.2 วินาที/ภาพ',
        detail: 'ตรวจจับขอบสินค้าคมชัดระดับเส้นผม พร้อมเติมเงาตกกระทบและฉากหลังสีมาตรฐาน'
      },
      {
        stepNumber: '03',
        title: 'ส่งออกครบทุกขนาดมาร์เก็ตเพลส',
        subtitle: 'Multi-Channel Preset Export',
        metricLabel: '1:1 · 4:3 · 9:16 พร้อมใช้',
        detail: 'บันทึกไฟล์ความละเอียดสูงแยกตามโฟลเดอร์สำหรับเว็บไซต์ โซเชียล และแคมเปญโฆษณา'
      }
    ],
    highlights: [
      'เทมเพลตฉากหลังสีหินอ่อน ไม้โอ๊ค และขาวสตูดิโอพร้อมใช้งาน',
      'ระบบจัดกึ่งกลางสินค้าและเว้นระยะขอบ (Padding) อัตโนมัติ',
      'ฝังรหัสสีแบรนด์และป้ายราคาลงบนภาพยกชุดได้ทันที'
    ],
    deliverables: [
      'สตูดิโอแต่งภาพออนไลน์บน Cloud Workspace',
      'ชุด Presets แสงสตูดิโอและฉากหลังสินค้า 60 แบบ',
      'ไลเซนส์ใช้งานเชิงพาณิชย์ไม่จำกัดจำนวนภาพ'
    ],
    hasLiveCloudApp: true
  },
  {
    id: 'pulsecrm-chat',
    slug: 'pulsecrm-chat',
    name: 'PulseCRM & OmniChat',
    thaiName: 'ระบบรวมแชทลูกค้าและติดตามงานขาย',
    category: 'crm',
    categoryLabel: 'แชทและบริหารลูกค้า',
    version: 'v5.1 Enterprise',
    platforms: 'Cloud Web · iOS · Android',
    updatedAt: 'อัปเดต ต.ค. 2026',
    tagline: 'รวมทุกข้อความลูกค้าไว้ในหน้าจอเดียว ติดแท็กสถานะอัตโนมัติ และเปิดบิลจากหน้าแชททันที',
    description:
      'หมดปัญหาแชทตกหล่นหรือแอดมินตอบซ้ำซ้อน ระบบกระจายแชทอัตโนมัติพร้อมการ์ดประวัติการซื้อของลูกค้ารายบุคคล ช่วยให้ทีมขายปิดการขายไวขึ้นและวัดผลอัตราการซื้อซ้ำได้อย่างชัดเจน',
    monthlyPrice: 990,
    lifetimePrice: 7900,
    savedHoursPerWeek: 16,
    activeUsersCount: '3,410 ทีมขาย',
    diagramType: 'omnichat-crm',
    accentColor: 'emerald',
    workflowSteps: [
      {
        stepNumber: '01',
        title: 'รวบรวมข้อความจากทุกช่องทางแชท',
        subtitle: 'Unified Inbox Routing',
        metricLabel: 'ตอบกลับไวขึ้น 3.2 เท่า',
        detail: 'รวมข้อความจากหน้าเว็บ โซเชียลมีเดีย และอีเมลเข้าสู่กล่องข้อความกลางพร้อมแบ่งคิวแอดมิน'
      },
      {
        stepNumber: '02',
        title: 'วิเคราะห์ความต้องการและติดป้ายกำกับ',
        subtitle: 'Smart Lead Tagging & Profile',
        metricLabel: 'แสดงประวัติสั่งซื้อทันที',
        detail: 'แสดงยอดซื้อสะสม แท็กความสนใจ และโน้ตสำคัญของลูกค้าด้านข้างหน้าต่างสนทนา'
      },
      {
        stepNumber: '03',
        title: 'สร้างบิลในแชทและอัปเดตไปป์ไลน์',
        subtitle: 'In-Chat Order & Pipeline Sync',
        metricLabel: 'เพิ่มอัตราปิดการขาย +28%',
        detail: 'ส่งลิงก์ชำระเงินในห้องแชท เมื่อลูกค้าโอนชำระ ระบบจะย้ายการ์ดเข้าสู่สถานะจัดส่งทันที'
      }
    ],
    highlights: [
      'บอร์ด Kanban ติดตามสถานะลูกค้ามุ่งหวัง (Lead Pipeline)',
      'คลังข้อความตอบกลับด่วนพร้อมแนบแคตตาล็อกสินค้า',
      'รายงานเวลาตอบกลับเฉลี่ยและยอดขายรายบุคคลของแอดมิน'
    ],
    deliverables: [
      'ระบบเว็บคลาวด์พร้อมใช้งานสำหรับทีมแอดมิน',
      'โมดูลสร้างลิงก์สรุปคำสั่งซื้อส่งผ่านห้องแชท',
      'แดชบอร์ดวัดผล Conversion และอัตราการกลับมาซื้อซ้ำ'
    ],
    hasLiveCloudApp: true
  },
  {
    id: 'docuflow-tax',
    slug: 'docuflow-tax',
    name: 'DocuFlow e-Tax & Sign',
    thaiName: 'โปรแกรมใบกำกับภาษีและเซ็นเอกสารดิจิทัล',
    category: 'document',
    categoryLabel: 'เอกสารและภาษีอิเล็กทรอนิกส์',
    version: 'v2.9 Compliant',
    platforms: 'Cloud Web · Windows',
    updatedAt: 'อัปเดต ก.ย. 2026',
    tagline: 'สร้างใบเสนอราคา ใบกำกับภาษี และหนังสือรับรองหัก ณ ที่จ่าย พร้อมประทับตราดิจิทัล',
    description:
      'ลดขั้นตอนเอกสารกระดาษด้วยระบบสร้างและลงนามเอกสารทางธุรกิจออนไลน์ คำนวณภาษีมูลค่าเพิ่ม 7% และภาษีหัก ณ ที่จ่าย (1%, 2%, 3%, 5%) อย่างแม่นยำ พร้อมสมุดทะเบียนคุมเลขที่เอกสารอัตโนมัติ',
    monthlyPrice: 590,
    lifetimePrice: 4200,
    savedHoursPerWeek: 11,
    activeUsersCount: '5,090 บริษัท',
    diagramType: 'etax-ledger',
    accentColor: 'amber',
    workflowSteps: [
      {
        stepNumber: '01',
        title: 'เลือกประเภทเอกสารและดึงข้อมูลคู่ค้า',
        subtitle: 'Template & Tax ID Lookup',
        metricLabel: 'กรอกข้อมูลไวใน 15 วินาที',
        detail: 'ดึงชื่อบริษัท ที่อยู่ และเลขประจำตัวผู้เสียภาษี 13 หลัก พร้อมกำหนดเงื่อนไขเครดิตเทอม'
      },
      {
        stepNumber: '02',
        title: 'คำนวณภาษี VAT และหัก ณ ที่จ่าย',
        subtitle: 'Precision Tax Calculation',
        metricLabel: 'ไร้ข้อผิดพลาดทางตัวเลข',
        detail: 'คำนวณยอดก่อนภาษี ภาษีมูลค่าเพิ่ม 7% และยอดหัก ณ ที่จ่ายสุทธิแบบทศนิยมมาตรฐานบัญชี'
      },
      {
        stepNumber: '03',
        title: 'ลงลายมือชื่อดิจิทัลและบันทึกทะเบียน',
        subtitle: 'Digital Seal & Audit Ledger',
        metricLabel: 'ตรวจสอบย้อนหลังได้ 100%',
        detail: 'ประทับรับรองเอกสารพร้อมรหัสอ้างอิง ส่งลิงก์ดาวน์โหลด PDF ให้ลูกค้าได้ทันที'
      }
    ],
    highlights: [
      'รันเลขที่เอกสารอัตโนมัติแยกตามหมวดหมู่และปีภาษี',
      'แปลงใบเสนอราคาเป็นใบวางบิลและใบเสร็จรับเงินในคลิกเดียว',
      'สรุปรายงานภาษีซื้อ-ภาษีขายประจำเดือนพร้อมยื่นแบบ'
    ],
    deliverables: [
      'ระบบสร้างและเซ็นเอกสารออนไลน์บน Cloud Workspace',
      'แบบฟอร์มมาตรฐานภาษาไทยและอังกฤษ 12 รูปแบบ',
      'ระบบส่งออกรายงานภาษีประจำเดือนรูปแบบ CSV และ PDF'
    ],
    hasLiveCloudApp: true
  },
  {
    id: 'veloce-pos',
    slug: 'veloce-pos',
    name: 'Veloce POS Terminal',
    thaiName: 'โปรแกรมขายหน้าร้านและระบบสมาชิก',
    category: 'erp',
    categoryLabel: 'จัดการสต็อกและบัญชี',
    version: 'v4.0 Retail',
    platforms: 'Cloud Web · Tablet · Windows',
    updatedAt: 'อัปเดต ก.ย. 2026',
    tagline: 'คิดเงินหน้าร้านรวดเร็ว รองรับสแกน QR พร้อมสะสมแต้มสมาชิกเบอร์โทรศัพท์',
    description:
      'เปลี่ยนแท็บเล็ตหรือคอมพิวเตอร์หน้าร้านให้เป็นจุดชำระเงินที่เสถียรและใช้งานง่าย พนักงานใหม่เรียนรู้ได้ภายใน 10 นาที รองรับการพักบิล แยกจ่ายหลายช่องทาง และสรุปยอดกะการทำงานแบบเรียลไทม์',
    monthlyPrice: 750,
    lifetimePrice: 5500,
    savedHoursPerWeek: 12,
    activeUsersCount: '2,890 สาขา',
    diagramType: 'pos-smart',
    accentColor: 'blue',
    workflowSteps: [
      {
        stepNumber: '01',
        title: 'เลือกสินค้าหรือสแกนบาร์โค้ดหน้าร้าน',
        subtitle: 'Fast Touch & Scan',
        metricLabel: 'คิดเงินจบใน 5 วินาที',
        detail: 'หน้าจอปุ่มกดขนาดใหญ่จัดหมวดหมู่ชัดเจน พร้อมค้นหาชื่อหรือรหัสสินค้าได้ทันที'
      },
      {
        stepNumber: '02',
        title: 'คำนวณส่วนลดโปรโมชันและแต้มสมาชิก',
        subtitle: 'Loyalty & Promo Engine',
        metricLabel: 'ผูกเบอร์โทรสะสมแต้ม',
        detail: 'คำนวณโปรโมชันซื้อคู่ถูกกว่า หรือแลกคะแนนสะสมเป็นส่วนลดท้ายบิลโดยอัตโนมัติ'
      },
      {
        stepNumber: '03',
        title: 'รับชำระเงินและปิดกะยอดขายรายวัน',
        subtitle: 'Shift Settlement & Sync',
        metricLabel: 'สรุปเงินสดและเงินโอนตรงเป๊ะ',
        detail: 'พิมพ์ใบเสร็จย่อและส่งยอดขายเข้าสู่ระบบคลังสินค้า FlowSync ERP โดยไม่ต้องคีย์ซ้ำ'
      }
    ],
    highlights: [
      'ทำงานต่อได้แม้สัญญาณอินเทอร์เน็ตขัดข้องชั่วคราว (Offline Queue)',
      'ระบบสะสมแต้มสมาชิกด้วยเบอร์โทรศัพท์ ไม่ต้องพกบัตร',
      'รายงานสินค้าขายดีตามช่วงเวลาและสรุปยอดปิดกะ'
    ],
    deliverables: [
      'หน้าจอขายหน้าร้านผ่านเว็บและโปรแกรมติดตั้งลงเครื่อง',
      'โมดูลหน้าจอแสดงผลฝั่งลูกค้า (Customer Display)',
      'คู่มือเชื่อมต่อลิ้นชักเก็บเงินและเครื่องพิมพ์ใบเสร็จ 58mm/80mm'
    ],
    hasLiveCloudApp: true
  },
  {
    id: 'shiftpulse-hr',
    slug: 'shiftpulse-hr',
    name: 'ShiftPulse Payroll & Time',
    thaiName: 'โปรแกรมจัดตารางกะและคำนวณเงินเดือน',
    category: 'document',
    categoryLabel: 'เอกสารและภาษีอิเล็กทรอนิกส์',
    version: 'v3.2 HR',
    platforms: 'Cloud Web · Windows · macOS',
    updatedAt: 'อัปเดต ต.ค. 2026',
    tagline: 'ลงเวลาเข้างาน จัดตารางกะพนักงาน คำนวณค่าล่วงเวลา OT และออกสลิปเงินเดือนดิจิทัล',
    description:
      'ลดความซับซ้อนของการทำเงินเดือนพนักงานรายเดือนและรายวัน คำนวณค่าล่วงเวลา (OT 1.5x / 2x / 3x) ประกันสังคม และภาษีหัก ณ ที่จ่ายตามโครงสร้างกฎหมายแรงงานไทย พร้อมส่งสลิปเงินเดือนออนไลน์',
    monthlyPrice: 690,
    lifetimePrice: 4900,
    savedHoursPerWeek: 10,
    activeUsersCount: '1,940 องค์กร',
    diagramType: 'payroll-hr',
    accentColor: 'emerald',
    workflowSteps: [
      {
        stepNumber: '01',
        title: 'บันทึกเวลาเข้างานและตารางกะ',
        subtitle: 'Shift & Attendance Log',
        metricLabel: 'รองรับกะหมุนเวียนและรายวัน',
        detail: 'ตรวจสอบเวลาเข้า-ออกงาน วันลาพักร้อน และชั่วโมงทำงานล่วงเวลาในตารางเดียว'
      },
      {
        stepNumber: '02',
        title: 'คำนวณเงินเดือน OT และประกันสังคม',
        subtitle: 'Automated Payroll Formula',
        metricLabel: 'คำนวณครบ 100 คนใน 3 วินาที',
        detail: 'คำนวณรายได้สุทธิ หักประกันสังคม 5% และภาษีเงินได้บุคคลธรรมดาโดยอัตโนมัติ'
      },
      {
        stepNumber: '03',
        title: 'สร้างไฟล์โอนเงินธนาคารและสลิปออนไลน์',
        subtitle: 'Bank Batch & e-Payslip',
        metricLabel: 'พร้อมยื่น ภ.ง.ด.1 และ สปส.',
        detail: 'ส่งออกไฟล์โอนเงินเดือนและสร้างสลิปเงินเดือนดิจิทัลที่มีรหัสผ่านให้พนักงานแต่ละคน'
      }
    ],
    highlights: [
      'กำหนดสูตรคำนวณเบี้ยขยัน ค่าคอมมิชชัน และค่ากะได้อิสระ',
      'สรุปยอดเงินสมทบประกันสังคมและภาษีหัก ณ ที่จ่ายรายเดือน',
      'ประวัติการปรับฐานเงินเดือนและวันลาคงเหลือรายบุคคล'
    ],
    deliverables: [
      'ระบบคำนวณเงินเดือนออนไลน์บน Cloud Workspace',
      'เทมเพลตสลิปเงินเดือนมาตรฐานสองภาษา (TH/EN)',
      'ไฟล์ส่งออกสำหรับระบบโอนเงินเดือนธนาคารชั้นนำ'
    ],
    hasLiveCloudApp: true
  }
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Cloud Starter',
    thaiTitle: 'สำหรับผู้ประกอบการเริ่มต้นและร้านค้าเดี่ยว',
    audience: 'เลือกใช้งานออนไลน์ได้ 1 โปรแกรมหลัก',
    monthlyPrice: 690,
    annualPricePerMonth: 550,
    maxSeats: 2,
    cloudStorageGb: 25,
    includedProgramIds: ['flowsync-erp', 'docuflow-tax'],
    features: [
      { label: 'จำนวนโปรแกรมออนไลน์ที่เปิดใช้ได้', value: 'เลือกได้ 2 โปรแกรมหลัก' },
      { label: 'จำนวนผู้ใช้งาน (User Seats)', value: 'สูงสุด 2 บัญชีผู้ใช้' },
      { label: 'พื้นที่เก็บข้อมูลคลาวด์ส่วนตัว', value: '25 GB SSD Cloud' },
      { label: 'การสำรองข้อมูลอัตโนมัติ', value: 'ทุก 24 ชั่วโมง' },
      { label: 'การอัปเดตเวอร์ชันใหม่', value: 'อัปเดตฟรีตลอดอายุสมาชิก' }
    ]
  },
  {
    id: 'pro',
    name: 'All-Apps Cloud Suite',
    thaiTitle: 'สำหรับธุรกิจที่ต้องการใช้งานครบทุกโปรแกรม',
    audience: 'เปิดใช้งานได้ครบทั้ง 6 โปรแกรมบนเว็บทันที',
    monthlyPrice: 1490,
    annualPricePerMonth: 1190,
    maxSeats: 10,
    cloudStorageGb: 200,
    includedProgramIds: [
      'flowsync-erp',
      'pixelcraft-studio',
      'pulsecrm-chat',
      'docuflow-tax',
      'veloce-pos',
      'shiftpulse-hr'
    ],
    features: [
      { label: 'จำนวนโปรแกรมออนไลน์ที่เปิดใช้ได้', value: 'ครบทั้ง 6 โปรแกรมไม่จำกัด' },
      { label: 'จำนวนผู้ใช้งาน (User Seats)', value: 'สูงสุด 10 บัญชีผู้ใช้' },
      { label: 'พื้นที่เก็บข้อมูลคลาวด์ส่วนตัว', value: '200 GB NVMe Cloud' },
      { label: 'การสำรองข้อมูลอัตโนมัติ', value: 'เรียลไทม์ทุก 1 ชั่วโมง' },
      { label: 'การอัปเดตเวอร์ชันใหม่', value: 'อัปเดตทันที + สิทธิ์ดาวน์โหลดลงเครื่อง' }
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Dedicated',
    thaiTitle: 'สำหรับองค์กรหลายสาขาและทีมขนาดใหญ่',
    audience: 'ครบทุกโปรแกรม + เซิร์ฟเวอร์แยกเฉพาะองค์กร',
    monthlyPrice: 3290,
    annualPricePerMonth: 2690,
    maxSeats: 50,
    cloudStorageGb: 1000,
    includedProgramIds: [
      'flowsync-erp',
      'pixelcraft-studio',
      'pulsecrm-chat',
      'docuflow-tax',
      'veloce-pos',
      'shiftpulse-hr'
    ],
    features: [
      { label: 'จำนวนโปรแกรมออนไลน์ที่เปิดใช้ได้', value: 'ครบทั้ง 6 โปรแกรม + API เชื่อมต่อ' },
      { label: 'จำนวนผู้ใช้งาน (User Seats)', value: 'สูงสุด 50 บัญชีผู้ใช้' },
      { label: 'พื้นที่เก็บข้อมูลคลาวด์ส่วนตัว', value: '1,000 GB Dedicated Cloud' },
      { label: 'การสำรองข้อมูลอัตโนมัติ', value: 'Real-Time Mirroring แยกโซน' },
      { label: 'การอัปเดตเวอร์ชันใหม่', value: 'ทีมวิศวกรดูแลส่วนตัว + SLA 99.95%' }
    ]
  }
];
