// ขั้นตอนการสั่งซื้อ 4 ขั้น ที่แสดงในหน้าร้าน
export const ORDER_STEPS = [
  {
    step: '01',
    title: 'เลือกโปรแกรมที่เปิดใช้งานจริง',
    desc: 'ตรวจรายละเอียด ทดลองใช้งาน และอ่านคู่มือของโปรแกรมที่ผ่านการตรวจสอบแล้ว',
    badgeBg: 'bg-blue-600 text-white',
    cardBg: 'bg-gradient-to-br from-blue-50/90 to-white border-blue-200',
  },
  {
    step: '02',
    title: 'สแกน QR พร้อมเพย์',
    desc: 'สแกนชำระเงินผ่านแอปธนาคาร ยอดเงินตรงตามรายการและแนบสลิปยืนยันในหน้าเว็บ',
    badgeBg: 'bg-indigo-600 text-white',
    cardBg: 'bg-gradient-to-br from-indigo-50/90 to-white border-indigo-200',
  },
  {
    step: '03',
    title: 'ตรวจสอบและอนุมัติสิทธิ์',
    desc: 'ผู้ดูแลตรวจสอบรายการและบันทึกสิทธิ์โปรแกรมไว้ในบัญชีของคุณ',
    badgeBg: 'bg-purple-600 text-white',
    cardBg: 'bg-gradient-to-br from-purple-50/90 to-white border-purple-200',
  },
  {
    step: '04',
    title: 'รับแจ้งเมื่อระบบพร้อม',
    desc: 'Krunest จะแจ้งให้ทราบเมื่อโปรแกรมออนไลน์พร้อมเปิดให้ทดลองหรือใช้งานจริง',
    badgeBg: 'bg-emerald-600 text-white',
    cardBg: 'bg-gradient-to-br from-emerald-50/90 to-white border-emerald-200',
  },
];
