import React from "react";
import {
  AlertTriangle,
  CalendarDays,
  Copy,
  ClipboardCheck,
  FileWarning,
  MapPinned,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  FileText,
  MessageCircle,
  Phone,
  UserRound,
} from "lucide-react";

type Staff = {
  id: string;
  name: string;
  code?: string;
  branch?: string;
  phone?: string;
  active: boolean;
  licenseStatus?: "licensed" | "unlicensed";
  licenseExpiry?: string;
};

type PatrolPlan = { id: string; date: string; branch: string; checkpoint: string; staffId?: string; shift: string; notes?: string };
type WorkLocation = { id: string; staffId: string; location: string; fromDate: string; toDate?: string };

type Props = {
  staff: Staff[];
  patrolPlans: PatrolPlan[];
  workLocations: WorkLocation[];
  patrolQuery: string;
  onPatrolQueryChange: (value: string) => void;
  onSharePatrol: () => void;
  onOpenStaff: (staff: Staff) => void;
  onAddStaff: () => void;
  onBulkImport?: () => void;
  onAddPatrol: () => void;
  onAddPlan: () => void;
  onImportPlan: () => void;
};

const today = () => new Date().toISOString().slice(0, 10);
const dateLabel = (value: string) => {
  if (!value) return "غير محدد";
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
};
const shiftLabel = (shift: string) => (shift === "morning" ? "صباحي" : shift === "evening" ? "مسائي" : shift === "night" ? "ليلي" : shift || "غير محدد");
const LOCATIONS = ["فرع مطوبس", "فرع المرشد", "فرع برمبال", "فرع الجزيرة", "فرع القومسيون", "شونة القومسيون", "فرع فوه", "قرية فوه", "فرع قبريط", "فرع ابودراز", "شونة ابودراز", "شونة السالمية"];
const normalized = (value?: string) => (value || "").trim().replaceAll("أ", "ا").replaceAll("إ", "ا").replaceAll("آ", "ا").replaceAll("ة", "ه").toLocaleLowerCase("ar");
const phoneDigits = (value?: string) => (value || "").replace(/\D/g, "");
const egyptianPhone = (value?: string) => {
  const digits = phoneDigits(value);
  if (!digits) return "";
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return digits;
};

export function SecurityCommandCenter({
  staff,
  patrolPlans,
  workLocations,
  patrolQuery,
  onPatrolQueryChange,
  onSharePatrol,
  onOpenStaff,
  onAddStaff,
  onBulkImport,
  onAddPatrol,
  onAddPlan,
  onImportPlan,
}: Props) {
  const currentDay = today();
  const [selectedLocation, setSelectedLocation] = React.useState("all");
  const [copiedStaffId, setCopiedStaffId] = React.useState<string | null>(null);
  const copyStaff = async (item: Staff) => {
    const text = [`الاسم: ${item.name || "غير مسجل"}`, `الكود: ${item.code || "غير مسجل"}`, `مكان العمل: ${item.branch || "غير مسجل"}`, `الهاتف: ${item.phone || "غير مسجل"}`].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStaffId(item.id);
      window.setTimeout(() => setCopiedStaffId((current) => current === item.id ? null : current), 1600);
    } catch {
      setCopiedStaffId(null);
    }
  };
  const activeStaff = staff.filter((item) => item.active);
  const siteStaff = selectedLocation === "all" ? staff : staff.filter((item) => normalized(item.branch) === normalized(selectedLocation) || workLocations.some((location) => location.staffId === item.id && normalized(location.location) === normalized(selectedLocation) && !location.toDate));
  const selectLocation = (location: string) => {
    setSelectedLocation(location);
    window.setTimeout(() => document.getElementById("security-location-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };
  const todayPlans = patrolPlans.filter((item) => item.date === currentDay);
  const search = patrolQuery.trim().toLocaleLowerCase("ar");
  const matchingPlans = patrolPlans
    .filter((item) => !search || `${item.date} ${item.branch} ${item.checkpoint} ${item.notes || ""}`.toLocaleLowerCase("ar").includes(search))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
  const expiryAlerts = staff.filter((item) => {
    if (item.licenseStatus !== "licensed" || !item.licenseExpiry) return false;
    const expiry = new Date(`${item.licenseExpiry}T12:00:00`).getTime();
    const horizon = Date.now() + 60 * 24 * 60 * 60 * 1000;
    return expiry >= Date.now() - 24 * 60 * 60 * 1000 && expiry <= horizon;
  });
  const recentStaff = activeStaff.slice(0, 4);

  const kpis = [
    { label: "أفراد نشطون", value: activeStaff.length, hint: `من أصل ${staff.length}`, tone: "bg-emerald-50 text-emerald-900", icon: ShieldCheck },
    { label: "مرور اليوم", value: todayPlans.length, hint: "خطة محفوظة لليوم", tone: "bg-amber-50 text-amber-950", icon: MapPinned },
    { label: "تنبيهات الرخص", value: expiryAlerts.length, hint: "خلال الشهرين القادمين", tone: expiryAlerts.length ? "bg-rose-50 text-rose-900" : "bg-slate-50 text-slate-800", icon: FileWarning },
  ];

  return (
    <section className="space-y-4" aria-label="لوحة تشغيل الأمن">
      <div className="soft-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-bold text-teal-700">إدارة الأمن</p>
          <h2 className="mt-1 text-lg font-bold text-slate-800 sm:text-xl">الحراس والأفراد</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button type="button" onClick={onAddStaff} className="touch-action inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition active:scale-[.98]">
            <Plus className="h-4 w-4" />فرد جديد
          </button>
          <button type="button" onClick={() => onBulkImport?.()} className="touch-action inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition active:scale-[.98]">
            <ClipboardCheck className="h-4 w-4 text-teal-700" />استيراد مجمع
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(({ label, value, hint, tone, icon: Icon }) => (
          <div key={label} className={`rounded-3xl p-4 shadow-sm ring-1 ring-black/[.03] ${tone}`}>
            <div className="flex items-center justify-between gap-2"><span className="text-xs font-black opacity-75">{label}</span><Icon className="h-5 w-5 opacity-70" /></div>
            <p className="mt-3 text-3xl font-black tabular-nums">{value.toLocaleString("ar-EG")}</p>
            <p className="mt-1 text-[11px] font-bold opacity-70">{hint}</p>
          </div>
        ))}
      </div>

      <div className="soft-card p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black text-teal-700">دليل المواقع</p><h3 className="mt-1 text-xl font-black text-slate-950">الحراس والأفراد حسب مكان العمل</h3><p className="mt-1 text-sm font-bold text-slate-500">اضغط على «كل الأفراد» أو أي موقع لعرض العاملين المسجلين به.</p></div><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-800">{siteStaff.length.toLocaleString("ar-EG")} فرد معروض</span></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7"><button type="button" onClick={() => selectLocation("all")}
 className={`rounded-2xl p-3 text-right transition active:scale-[.98] ${selectedLocation === "all" ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-800"}`}><ShieldCheck className="mb-2 h-5 w-5" /><b className="block text-sm">كل الحراس والأفراد</b><small className="mt-1 block text-xs font-bold opacity-75">{staff.length} سجل</small></button>{LOCATIONS.map(location => { const count = staff.filter(item => normalized(item.branch) === normalized(location) || workLocations.some(row => row.staffId === item.id && normalized(row.location) === normalized(location) && !row.toDate)).length; return <button type="button" key={location} data-testid={`location-card-${location}`} onClick={() => selectLocation(location)}
 className={`rounded-2xl p-3 text-right transition active:scale-[.98] ${selectedLocation === location ? "bg-amber-400 text-amber-950" : "bg-slate-100 text-slate-800"}`}><MapPinned className="mb-2 h-5 w-5" /><b className="block text-sm leading-5">{location}</b><small className="mt-1 block text-xs font-bold opacity-75">{count} فرد</small></button>; })}</div><div id="security-location-results" className="mt-4 scroll-mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite"><div className="sm:col-span-2 lg:col-span-3 mb-1 text-sm font-bold text-slate-700">الأفراد المسجلون في {selectedLocation === "all" ? "كل الفروع والشون" : selectedLocation}</div>{siteStaff.map(item => { const phone = egyptianPhone(item.phone); return <div key={item.id} className="flex min-w-0 flex-col rounded-xl border border-slate-100 bg-white p-4 text-right shadow-sm"><div className="flex min-w-0 items-start justify-between gap-3"><button type="button" onClick={() => onOpenStaff(item)} className="flex min-w-0 flex-1 items-center gap-3 text-right"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><UserRound className="h-5 w-5" /></span><span className="min-w-0"><b className="block truncate text-base font-bold text-slate-800">{item.name}</b><small className="mt-0.5 block truncate text-xs font-normal text-slate-500">{item.branch || "بدون موقع"} · {item.code || "بدون كود"}</small></span></button><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${item.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.active ? "نشط" : "متوقف"}</span></div><div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3"><a href={item.phone ? `tel:${item.phone}` : undefined} aria-label={`اتصال بـ ${item.name}`} className={`inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-bold ${item.phone ? "bg-slate-50 text-slate-700" : "pointer-events-none bg-slate-50 text-slate-300"}`}><Phone className="h-4 w-4" />اتصال</a><a href={phone ? `https://wa.me/${phone}` : undefined} target="_blank" rel="noreferrer" aria-label={`واتساب ${item.name}`} className={`inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-bold ${phone ? "bg-emerald-50 text-emerald-700" : "pointer-events-none bg-slate-50 text-slate-300"}`}><MessageCircle className="h-4 w-4" />واتساب</a><button type="button" onClick={() => onOpenStaff(item)} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-teal-50 px-2 py-2 text-xs font-bold text-teal-700"><FileText className="h-4 w-4" />الملف</button><button type="button" aria-label={`نسخ بيانات ${item.name}`} onClick={() => void copyStaff(item)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-600" title="نسخ البيانات"><Copy className="h-4 w-4" /></button></div>{copiedStaffId === item.id && <p className="mt-2 text-center text-xs font-bold text-emerald-700">تم نسخ البيانات</p>}</div>; })}{!siteStaff.length && <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-500 sm:col-span-2 lg:col-span-3">لا يوجد أفراد مسجلون بهذا الموقع حالياً. يمكنك إضافة فرد جديد وتحديد مكان عمله.</p>}</div></div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <div className="soft-card p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs font-black text-teal-700">استعلام سريع</p><h3 className="mt-1 text-xl font-black text-slate-950">هنمر فين النهارده؟</h3><p className="mt-1 text-sm font-bold text-slate-500">ابحث بالفرع أو نقطة المرور أو التاريخ، ثم شارك النتيجة.</p></div>
            <button type="button" onClick={onSharePatrol} className="touch-action rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-800 transition active:scale-[.98]"><Share2 className="ml-1 inline h-4 w-4" />مشاركة</button>
          </div>
          <label className="relative mt-4 block"><Search className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-slate-400" /><input value={patrolQuery} onChange={(event) => onPatrolQueryChange(event.target.value)} placeholder="مثال: النهارده، فرع النخيل، البوابة" className="field pr-10" aria-label="البحث في خطة المرور" /></label>
          <div className="mt-3 space-y-2">
            {matchingPlans.map((plan) => <div key={plan.id} className={`rounded-2xl p-3 text-sm ${plan.date === currentDay ? "bg-teal-50 text-teal-950" : "bg-slate-50 text-slate-800"}`}><div className="flex flex-wrap items-center justify-between gap-2"><b>{plan.branch || "فرع غير محدد"} · {plan.checkpoint || "نقطة غير محددة"}</b><span className="text-xs font-black text-slate-500">{plan.date === currentDay ? "اليوم" : dateLabel(plan.date)} · {shiftLabel(plan.shift)}</span></div>{plan.staffId && <p className="mt-1 text-xs font-bold text-slate-500">{staff.find((item) => item.id === plan.staffId)?.name || "فرد غير موجود"}</p>}</div>)}
            {!matchingPlans.length && <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">لا توجد خطة مطابقة. أضف خطة جديدة أو الصق كشف الشهر.</p>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={onAddPlan} className="touch-action rounded-2xl bg-teal-700 px-3 py-2 text-xs font-black text-white transition active:scale-[.98]"><Plus className="ml-1 inline h-4 w-4" />إضافة خطة</button><button type="button" onClick={onImportPlan} className="touch-action rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-800 transition active:scale-[.98]"><ClipboardCheck className="ml-1 inline h-4 w-4" />لصق كشف الشهر</button><button type="button" onClick={onAddPatrol} className="touch-action rounded-2xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-950 transition active:scale-[.98]"><MapPinned className="ml-1 inline h-4 w-4" />تسجيل مرور</button></div>
        </div>

        <div className="soft-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black text-rose-700">متابعة قبل التأخير</p><h3 className="mt-1 text-xl font-black text-slate-950">تنبيهات تحتاج إجراء</h3></div><AlertTriangle className="h-6 w-6 text-amber-500" /></div>
          {expiryAlerts.length ? <div className="mt-4 space-y-2">{expiryAlerts.slice(0, 4).map((item) => <button type="button" key={item.id} onClick={() => onOpenStaff(item)} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-rose-50 px-3 py-3 text-right text-sm text-rose-950 transition active:scale-[.99]"><span><b className="block">{item.name}</b><small className="font-bold text-rose-700">الرخصة تنتهي {dateLabel(item.licenseExpiry || "")}</small></span><FileWarning className="h-5 w-5 shrink-0 text-rose-600" /></button>)}</div> : <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-900">لا توجد رخص مستحقة خلال الشهرين القادمين. ستظهر هنا تلقائياً عند اقتراب الموعد.</p>}
          <div className="mt-4 border-t border-slate-100 pt-4"><p className="text-xs font-black text-slate-500">آخر أفراد نشطين</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{recentStaff.map((item) => <button type="button" key={item.id} onClick={() => onOpenStaff(item)} className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-right transition active:scale-[.99]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-teal-700 shadow-sm"><UserRound className="h-4 w-4" /></span><span className="min-w-0"><b className="block truncate text-sm text-slate-900">{item.name}</b><small className="block truncate text-xs font-bold text-slate-500">{item.branch || "بدون فرع"} · {item.code || "بدون كود"}</small></span></button>)}{!recentStaff.length && <p className="text-sm font-bold text-slate-500">لا يوجد أفراد نشطون بعد.</p>}</div></div>
        </div>
      </div>

      {workLocations.length > 0 && <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-xs font-bold text-slate-600"><CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />تم حفظ {workLocations.length.toLocaleString("ar-EG")} حركة انتقال وظيفي في السجل الزمني للأفراد.</div>}
    </section>
  );
}
