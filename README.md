# Krunest / LuminaSys Hub

หน้าร้านระบบงานพร้อมศูนย์สมาชิกและศูนย์ผู้ดูแล ใช้ React + Express + SQLite และทำงานในเครื่องได้โดยไม่ต้องติดตั้งฐานข้อมูลเพิ่ม

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
3. Open `http://localhost:3000/`

### บัญชีผู้ดูแลเริ่มต้น (เฉพาะเครื่องพัฒนา)

- Email: `me.patiphan1@gmail.com`
- Password: `Admin@12345`

ควรกำหนด `KRUNEST_ADMIN_EMAIL` และ `KRUNEST_ADMIN_PASSWORD` ก่อนเปิดใช้งานจริง

### ตรวจสอบระบบ

- `npm run test:server` — ทดสอบครบ 7 เฟส
- `npm run lint` — ตรวจ TypeScript
- `npm run build` — สร้างไฟล์ใช้งานจริง
- `npm run cron` — ประมวลผลสิทธิ์หมดอายุและคิวอีเมล

ข้อมูลอยู่ที่ `data/krunest.sqlite` และอีเมลจำลองจะออกไปที่ `data/mail-outbox`

## โครงสร้างโค้ด (src/)

| อยากแก้อะไร | ไปที่ไฟล์ |
|---|---|
| ข้อมูลโปรแกรม (ชื่อ, รายละเอียด, ขั้นตอน) | `data/programs.ts` |
| ราคาซื้อแยก / ป้ายเทคโนโลยี / สีการ์ด | `data/programMeta.ts` |
| แพ็กเกจ Free / Go / Pro / Max | `data/packages.ts` |
| ปุ่มกรองหมวดหมู่ / แพ็กเกจ | `data/catalogFilters.ts` |
| ข้อความ 4 ขั้นตอนการสั่งซื้อ | `data/orderSteps.ts` |
| เมนูบน / ส่วนท้าย | `components/layout/Header.tsx`, `Footer.tsx` |
| แต่ละ section ในหน้าร้าน | `components/store/*` (เรียงลำดับ section ที่ `views/StoreView.tsx`) |
| การ์ดโปรแกรม / การ์ดแพ็กเกจ | `components/store/ProgramCard.tsx`, `PackageCard.tsx` |
| แอปจำลองในพื้นที่ใช้งาน (ERP, POS, ...) | `components/workspace/apps/*` (ลงทะเบียนที่ `apps/index.ts`) |
| Modal / ตะกร้า | `components/modals/*` |
| Logic ตะกร้า | `hooks/useCart.ts` |
| State หลักของแอป | `App.tsx` |
| API / ความปลอดภัย / คำสั่งซื้อ | `server/app.mjs` |
| โครงสร้างฐานข้อมูล | `server/db.mjs` |
| ชุดทดสอบทุกเฟส | `server/tests/flows.test.mjs` |
