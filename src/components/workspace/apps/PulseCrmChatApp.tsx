// ระบบรวมแชทและ CRM PulseCRM (แอปจำลองในพื้นที่ใช้งานบนเว็บ)
import React, { useState } from 'react';
import { Check, Send } from 'lucide-react';

interface ChatLead {
  id: string;
  customerName: string;
  channel: string;
  tag: string;
  stage: 'new' | 'quoted' | 'won';
  orderAmount: number;
  messages: { sender: 'customer' | 'agent'; text: string; time: string }[];
}

export function PulseCrmChatApp() {
  const [leads, setLeads] = useState<ChatLead[]>([
    {
      id: 'lead-1',
      customerName: 'คุณพิมพ์ชนก (ร้าน Brew House)',
      channel: 'LINE OA',
      tag: 'ลูกค้าประจำ VIP',
      stage: 'quoted',
      orderAmount: 6500,
      messages: [
        {
          sender: 'customer',
          text: 'สวัสดีค่ะ สั่งเมล็ดกาแฟคั่วกลาง 10 กก. ขอใบเสนอราคาด่วนนะคะ',
          time: '10:14',
        },
        {
          sender: 'agent',
          text: 'รับทราบครับคุณพิมพ์ชนก จัดทำใบเสนอราคา #QT-409 ยอด ฿6,500 เรียบร้อยครับ',
          time: '10:15',
        },
      ],
    },
    {
      id: 'lead-2',
      customerName: 'คุณวรเมธ (ฝ่ายจัดซื้อโรงแรม)',
      channel: 'Web Chat',
      tag: 'องค์กร B2B',
      stage: 'new',
      orderAmount: 19500,
      messages: [
        {
          sender: 'customer',
          text: 'สนใจสั่งแก้วเก็บความเย็นสกรีนโลโก้ 50 ใบ มีราคาส่งไหมครับ',
          time: '11:02',
        },
      ],
    },
  ]);
  const [activeLeadId, setActiveLeadId] = useState<string>('lead-1');
  const [chatReplyText, setChatReplyText] = useState<string>('');
  const activeLead = leads.find((l) => l.id === activeLeadId) || leads[0];

  const handleSendChatReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatReplyText.trim()) return;
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === activeLead.id
          ? {
              ...lead,
              messages: [
                ...lead.messages,
                { sender: 'agent', text: chatReplyText.trim(), time: 'เมื่อสักครู่' },
              ],
            }
          : lead
      )
    );
    setChatReplyText('');
  };

  const handleMarkLeadWon = (leadId: string) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, stage: 'won' } : lead))
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Lead List (4 cols) */}
      <div className="lg:col-span-4 bg-white border border-stone-200 rounded-xl p-4 space-y-3">
        <div className="text-xs font-semibold text-slate-500 px-1">
          กล่องข้อความลูกค้าทั้งหมด ({leads.length})
        </div>
        {leads.map((lead) => (
          <button
            key={lead.id}
            type="button"
            onClick={() => setActiveLeadId(lead.id)}
            className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
              lead.id === activeLead.id
                ? 'border-blue-600 bg-blue-50/40'
                : 'border-stone-200 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>{lead.channel}</span>
              <span className="font-mono font-semibold text-emerald-700">
                ฿{lead.orderAmount.toLocaleString()}
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-900">{lead.customerName}</div>
            <div className="text-xs text-slate-500 mt-1">
              สถานะ:{' '}
              {lead.stage === 'won'
                ? 'ปิดการขายสำเร็จ'
                : lead.stage === 'quoted'
                ? 'ส่งใบเสนอราคาแล้ว'
                : 'สอบถามใหม่'}
            </div>
          </button>
        ))}
      </div>

      {/* Active Conversation & Quick Order Action (8 cols) */}
      <div className="lg:col-span-8 bg-white border border-stone-200 rounded-xl p-6 flex flex-col justify-between space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-stone-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">{activeLead.customerName}</h2>
            <p className="text-xs text-slate-500">
              ช่องทาง {activeLead.channel} · {activeLead.tag}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleMarkLeadWon(activeLead.id)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>
              {activeLead.stage === 'won'
                ? 'ปิดการขายเรียบร้อยแล้ว'
                : 'ยืนยันรับยอดโอนและปิดการขาย'}
            </span>
          </button>
        </div>

        <div className="space-y-3 py-2 max-h-64 overflow-y-auto">
          {activeLead.messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl text-xs max-w-md ${
                msg.sender === 'agent'
                  ? 'ml-auto bg-blue-600 text-white'
                  : 'bg-[#FAF9F5] border border-stone-200 text-slate-800'
              }`}
            >
              <div>{msg.text}</div>
              <div
                className={`text-[10px] mt-1 ${
                  msg.sender === 'agent' ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                {msg.time}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendChatReply} className="flex gap-2 pt-3 border-t border-stone-200">
          <input
            type="text"
            value={chatReplyText}
            onChange={(e) => setChatReplyText(e.target.value)}
            placeholder="พิมพ์ข้อความตอบกลับลูกค้า หรือส่งลิงก์ชำระเงิน..."
            className="flex-1 px-3.5 py-2.5 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-blue-600"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>ส่งข้อความ</span>
          </button>
        </form>
      </div>
    </div>
  );
}
