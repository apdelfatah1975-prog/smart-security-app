import React from "react";
import { ArrowRight, CalendarDays, ClipboardCheck, Download, Edit3, FileText, MapPin, Phone, Plus, ShieldCheck, Smartphone, Trash2, UserRound, X } from "lucide-react";

type Staff = {
  id: string;
  code?: string;
  name: string;
  phone: string;
  nationalId?: string;
  birthDate?: string;
  branch: string;
  workStartDate?: string;
  atm: string;
  hireDate: string;
  rate: number;
  active: boolean;
  shift?: string;
  emergencyPhone?: string;
  image?: string;
  notes?: string;
  licenseStatus?: "licensed" | "unlicensed";
  weaponNumber?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  retirementDate?: string;
};

type WorkLocation = { id: string; staffId: string; location: string; fromDate: string; toDate?: string; reason?: string; notes?: string };
type Attendance = { id: string; staffId: string; date: string; shift: string; status: string; hours: number };
type Patrol = { id: string; staffId: string; branch: string; date: string; checkpoint: string; notes: string; photo?: string };

type Event = {
  id: string;
  kind: "location" | "attendance" | "patrol";
  date: string;
  title: string;
  subtitle: string;
  detail?: string;
  color: string;
  original: WorkLocation | Attendance | Patrol;
};

type Props = {
  staff: Staff;
  locations: WorkLocation[];
  attendance: Attendance[];
  patrols: Patrol[];
  onClose: () => void;
  onEditStaff: () => void;
  onAddLocation?: () => void;
  onAddAttendance?: () => void;
  onAddPatrol?: () => void;
  onEditRecord?: (kind: Event["kind"], record: Event["original"]) => void;
  onDeleteRecord?: (kind: Event["kind"], record: Event["original"]) => void;
  onPrint?: () => void;
};

const dateText = (value?: string) => {
  if (!value) return "غير محدد";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("ar-EG");
};
const shiftText = (value?: string) => ({ morning: "صباحي", evening: "مسائي", night: "ليلي", off: "راحة", leave: "إجازة" }[value || ""] || value || "غير محدد");
const statusText = (value?: string) => ({ present: "حاضر", absent: "غائب", excused: "مأذون" }[value || ""] || value || "غير محدد");
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("") || "ف";

export function StaffProfilePanel({ staff, locations, attendance, patrols, onClose, onEditStaff, onAddLocation, onAddAttendance, onAddPatrol, onEditRecord, onDeleteRecord, onPrint }: Props) {
  const [filter, setFilter] = React.useState<"all" | Event["kind"]>("all");
  const events = React.useMemo<Event[]>(() => {
    const locationEvents: Event[] = locations.filter(item => item.staffId === staff.id).map(item => ({ id: item.id, kind: "location", date: item.fromDate, title: `انتقال إلى ${item.location || "موقع غير محدد"}`, subtitle: item.toDate ? `${dateText(item.fromDate)} إلى ${dateText(item.toDate)}` : `منذ ${dateText(item.fromDate)} · الموقع الحالي`, detail: [item.reason, item.notes].filter(Boolean).join(" · "), color: "bg-amber-500", original: item }));
    const attendanceEvents: Event[] = attendance.filter(item => item.staffId === staff.id).map(item => ({ id: item.id, kind: "attendance", date: item.date, title: `${statusText(item.status)} · ${shiftText(item.shift)}`, subtitle: `${dateText(item.date)} · ${item.hours || 0} ساعة`, detail: item.status === "present" ? "تم تسجيل الحضور" : "سجل حالة وظيفية تحتاج متابعة", color: item.status === "present" ? "bg-emerald-500" : "bg-rose-500", original: item }));
    const patrolEvents: Event[] = patrols.filter(item => item.staffId === staff.id).map(item => ({ id: item.id, kind: "patrol", date: item.date, title: `مرور وتفتيش · ${item.branch || "فرع غير محدد"}`, subtitle: `${dateText(item.date)} · ${item.checkpoint || "نقطة غير محددة"}`, detail: item.notes, color: "bg-sky-500", original: item }));
    return [...locationEvents, ...attendanceEvents, ...patrolEvents].sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, locations, patrols, staff.id]);
  const visibleEvents = filter === "all" ? events : events.filter(event => event.kind === filter);
  const latestLocation = locations.filter(item => item.staffId === staff.id).sort((a, b) => b.fromDate.localeCompare(a.fromDate))[0];
  const callNumber = staff.phone.replace(/\D/g, "");
  const wa = callNumber ? `https://wa.me/${callNumber}` : "#";

  return <div dir="rtl" className="space-y-5 text-slate-900">
    <div className="flex items-center justify-between gap-3">
      <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700"><ArrowRight className="h-4 w-4" />العودة للأفراد</button>
      <div className="flex gap-2"><button type="button" onClick={onPrint} className="inline-flex items-center gap-2 rounded-2xl bg-teal-700 px-4 py-2 text-sm font-black text-white"><FileText className="h-4 w-4" />طباعة الملف</button><button type="button" aria-label="إغلاق ملف الفرد" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-500"><X className="h-5 w-5" /></button></div>
    </div>

    <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#064e4a_0%,#0f766e_60%,#2dd4bf_135%)] p-5 text-white shadow-[0_24px_60px_rgba(15,118,110,.2)] sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {staff.image ? <img src={staff.image} alt={`صورة ${staff.name}`} className="h-24 w-24 shrink-0 rounded-[1.6rem] object-cover ring-4 ring-white/20" /> : <div className="grid h-24 w-24 shrink-0 place-items-center rounded-[1.6rem] bg-white/15 text-3xl font-black ring-4 ring-white/20">{initials(staff.name)}</div>}
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">ملف فرد الأمن</span><span className={`rounded-full px-3 py-1 text-xs font-black ${staff.active ? "bg-emerald-300/25 text-emerald-50" : "bg-rose-300/25 text-rose-50"}`}>{staff.active ? "نشط" : "موقوف"}</span></div><h2 className="mt-2 text-2xl font-black sm:text-3xl">{staff.name || "فرد أمن بدون اسم"}</h2><p className="mt-1 text-sm font-bold text-teal-50/85">{staff.branch || "مكان عمل غير محدد"} · {staff.code || "بدون كود"}</p><div className="mt-4 flex flex-wrap gap-2"><a href={staff.phone ? `tel:${staff.phone}` : undefined} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-teal-800"><Phone className="h-4 w-4" />اتصال</a><a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-200 px-3 py-2 text-xs font-black text-emerald-950"><Smartphone className="h-4 w-4" />واتساب</a><button type="button" onClick={onEditStaff} className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-black text-white"><Edit3 className="h-4 w-4" />تعديل البيانات</button></div></div>
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-4"><div className="rounded-2xl bg-white/10 p-3"><span className="text-xs font-bold text-teal-100">مكان العمل</span><b className="mt-1 block text-sm">{latestLocation?.location || staff.branch || "غير محدد"}</b></div><div className="rounded-2xl bg-white/10 p-3"><span className="text-xs font-bold text-teal-100">الوردية الأساسية</span><b className="mt-1 block text-sm">{shiftText(staff.shift)}</b></div><div className="rounded-2xl bg-white/10 p-3"><span className="text-xs font-bold text-teal-100">بداية العمل الحالي</span><b className="mt-1 block text-sm">{dateText(staff.workStartDate || staff.hireDate)}</b></div><div className="rounded-2xl bg-white/10 p-3"><span className="text-xs font-bold text-teal-100">عدد الأحداث</span><b className="mt-1 block text-sm">{events.length.toLocaleString("ar-EG")} سجل</b></div></div>
    </section>

    <section className="grid gap-4 lg:grid-cols-[1fr_.85fr]">
      <div className="soft-card p-5"><div className="flex items-center justify-between gap-3"><div><h3 className="text-lg font-black text-teal-950">البيانات الأساسية</h3><p className="mt-1 text-sm font-bold text-slate-500">ملخص سريع قابل للمراجعة والتعديل</p></div><ShieldCheck className="h-6 w-6 text-teal-600" /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Info label="الرقم القومي" value={staff.nationalId} /><Info label="الهاتف" value={staff.phone} /><Info label="تاريخ الميلاد" value={dateText(staff.birthDate)} /><Info label="تاريخ التعيين" value={dateText(staff.hireDate)} /><Info label="موقع ATM" value={staff.atm} /><Info label="هاتف الطوارئ" value={staff.emergencyPhone} /><Info label="الترخيص" value={staff.licenseStatus === "licensed" ? `مرخص${staff.licenseNumber ? ` · ${staff.licenseNumber}` : ""}` : "غير مرخص"} /><Info label="انتهاء الرخصة" value={dateText(staff.licenseExpiry)} /><Info label="المعاش المحسوب" value={dateText(staff.retirementDate)} /><Info label="رقم السلاح" value={staff.weaponNumber} /></div>{staff.notes&&<p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-bold leading-7 text-amber-950"><b>ملاحظات:</b> {staff.notes}</p>}</div>
      <div className="soft-card p-5"><div className="flex items-center justify-between gap-3"><div><h3 className="text-lg font-black text-teal-950">إجراءات السجل</h3><p className="mt-1 text-sm font-bold text-slate-500">أضف أي حالة أو حركة فور حدوثها</p></div><CalendarDays className="h-6 w-6 text-teal-600" /></div><div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1"><ActionButton icon={<MapPin className="h-4 w-4" />} text="إضافة انتقال أو موقع" onClick={onAddLocation} /><ActionButton icon={<ClipboardCheck className="h-4 w-4" />} text="تسجيل حضور أو إجازة" onClick={onAddAttendance} /><ActionButton icon={<ShieldCheck className="h-4 w-4" />} text="تسجيل مرور وتفتيش" onClick={onAddPatrol} /></div></div>
    </section>

    <section className="soft-card p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="text-xl font-black text-teal-950">السجل الزمني للفرد</h3><p className="mt-1 text-sm font-bold text-slate-500">التنقلات والحضور والمرور مرتبة من الأحدث إلى الأقدم</p></div><div className="flex flex-wrap gap-2">{([["all", "الكل"], ["location", "التنقلات"], ["attendance", "الحضور والحالات"], ["patrol", "المرور"]] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-xl px-3 py-2 text-xs font-black ${filter === value ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}>{label}</button>)}</div></div><div className="mt-5">{visibleEvents.length ? <div className="relative space-y-4 before:absolute before:right-[1.05rem] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-slate-200">{visibleEvents.map(event => <article key={`${event.kind}-${event.id}`} className="relative flex gap-3"><span className={`relative z-10 mt-4 h-3 w-3 shrink-0 rounded-full ring-4 ring-white ${event.color}`} /><div className="min-w-0 flex-1 rounded-2xl bg-slate-50 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h4 className="font-black text-slate-900">{event.title}</h4><p className="mt-1 text-xs font-bold text-slate-500">{event.subtitle}</p>{event.detail&&<p className="mt-2 text-sm font-bold leading-6 text-slate-600">{event.detail}</p>}</div><div className="flex shrink-0 gap-2"><button type="button" aria-label={`تعديل ${event.title}`} onClick={() => onEditRecord?.(event.kind, event.original)} className="rounded-xl bg-white p-2 text-teal-700"><Edit3 className="h-4 w-4" /></button><button type="button" aria-label={`حذف ${event.title}`} onClick={() => onDeleteRecord?.(event.kind, event.original)} className="rounded-xl bg-white p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button></div></div></div></article>)}</div> : <div className="rounded-2xl bg-slate-50 p-7 text-center"><UserRound className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-2 text-sm font-black text-slate-500">لا توجد أحداث مسجلة لهذا الفرد بعد</p><p className="mt-1 text-xs font-bold text-slate-400">ابدأ بإضافة انتقال أو حضور أو مرور من الأزرار أعلاه</p></div>}</div></section>
  </div>;
}

function Info({ label, value }: { label: string; value?: string }) { return <div className="rounded-2xl bg-slate-50 p-3"><span className="block text-xs font-bold text-slate-500">{label}</span><b className="mt-1 block break-words text-sm text-slate-800">{value || "غير مسجل"}</b></div>; }
function ActionButton({ icon, text, onClick }: { icon: React.ReactNode; text: string; onClick?: () => void }) { return <button type="button" onClick={onClick} disabled={!onClick} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-50 px-4 py-3 text-sm font-black text-teal-800 disabled:cursor-not-allowed disabled:opacity-50">{icon}{text}<Plus className="h-4 w-4" /></button>; }
