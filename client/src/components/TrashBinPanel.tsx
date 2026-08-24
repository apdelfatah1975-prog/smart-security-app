import React from "react";
import { ArchiveRestore, Search, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { emptyTrash, filterTrashItems, permanentlyDeleteFromTrash, restoreFromTrash, type TrashItem } from "@/lib/trashBin";

const typeLabels: Record<TrashItem["entityType"], string> = {
  "technician-settings": "إعدادات الفنيين",
  customer: "عميل",
  visit: "زيارة",
  cash: "حركة مالية",
  inventory: "مخزون",
  reminder: "تذكير",
  staff: "فرد أمن",
  location: "انتقال وظيفي",
  attendance: "حضور ووردية",
  patrol: "مرور وتفتيش",
  entry: "حركة مالية",
  debt: "دين",
  child: "فرد أسرة",
  teacher: "مدرس",
  lesson: "حصة",
  vehicle: "مركبة",
  "vehicle-visit": "معاملة مركبة",
};

const formatDeletedAt = (value: string) => new Date(value).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });

export default function TrashBinPanel({ items, onChange, onRestore }: { items: TrashItem[]; onChange: () => void; onRestore?: (item: TrashItem) => Promise<boolean> | boolean }) {
  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState<"all" | TrashItem["entityType"]>("all");
  const filtered = filterTrashItems(items, query, type);

  const restore = async (item: TrashItem) => {
    const restored = restoreFromTrash(item.id);
    if (!restored) return;
    const ok = onRestore ? await onRestore(restored) : true;
    if (!ok) return;
    onChange();
  };

  const permanentlyDelete = (item: TrashItem) => {
    if (!window.confirm(`حذف ${item.entityLabel} نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    permanentlyDeleteFromTrash(item.id);
    onChange();
  };

  return (
    <section className="soft-card overflow-hidden" aria-labelledby="trash-bin-title">
      <div className="border-b border-slate-100 bg-gradient-to-l from-rose-50 to-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-800"><Trash2 className="h-4 w-4" /> حماية البيانات</div>
            <h2 id="trash-bin-title" className="text-xl font-black text-slate-950">سلة المحذوفات</h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-7 text-slate-600">تحتفظ السلة بنسخة مؤقتة من السجلات المحذوفة حتى تتمكن من استعادتها. الحذف النهائي يحتاج تأكيداً صريحاً.</p>
          </div>
          <div className="flex items-center gap-2"><div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm"><b className="block text-2xl font-black text-rose-700">{items.length}</b><span className="text-xs font-bold text-slate-500">عنصر محفوظ</span></div>{items.length > 0 && <Button type="button" variant="outline" className="rounded-xl border-rose-300 text-rose-800 hover:bg-rose-50" onClick={() => { if (window.confirm("إفراغ السلة نهائياً؟ لا يمكن استعادة هذه السجلات بعد ذلك.")) { emptyTrash(); onChange(); } }}><Trash2 className="ml-1 h-4 w-4" />إفراغ السلة</Button>}</div>
        </div>
      </div>
      <div className="grid gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-[1fr_13rem_auto]">
        <label className="relative block"><span className="sr-only">البحث في سلة المحذوفات</span><Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} className="field-input pr-10" placeholder="ابحث بالاسم أو الوصف" /></label>
        <select aria-label="نوع السجل المحذوف" value={type} onChange={event => setType(event.target.value as typeof type)} className="field-input"><option value="all">كل أنواع السجلات</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => { setQuery(""); setType("all"); }} disabled={!query && type === "all"}>مسح الفلاتر</Button>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        {filtered.length ? filtered.map(item => <article key={item.id} className="flex flex-col gap-3 rounded-2xl border border-rose-100 bg-white p-4 shadow-[0_6px_18px_rgba(136,19,55,.045)] sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-800">{typeLabels[item.entityType] || item.entityType}</span><h3 className="truncate font-black text-slate-950">{item.entityLabel}</h3></div><p className="mt-2 text-xs font-semibold leading-6 text-slate-500">حُذف بواسطة {item.deletedBy || "مستخدم سابق"} في {formatDeletedAt(item.deletedAt)}</p></div>
          <div className="flex shrink-0 flex-wrap gap-2"><Button type="button" size="sm" className="rounded-xl bg-emerald-700 hover:bg-emerald-800" onClick={() => restore(item)}><Undo2 className="ml-1 h-4 w-4" />استعادة</Button><Button type="button" size="sm" variant="outline" className="rounded-xl border-rose-300 text-rose-800 hover:bg-rose-50" onClick={() => permanentlyDelete(item)}><Trash2 className="ml-1 h-4 w-4" />حذف نهائي</Button></div>
        </article>) : <div className="rounded-2xl bg-slate-50 p-8 text-center"><ArchiveRestore className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 font-black text-slate-700">{items.length ? "لا توجد عناصر تطابق البحث الحالي." : "سلة المحذوفات فارغة حالياً."}</p><p className="mt-1 text-sm font-semibold text-slate-500">ستظهر هنا السجلات بعد حذفها من التطبيق.</p></div>}
      </div>
    </section>
  );
}
