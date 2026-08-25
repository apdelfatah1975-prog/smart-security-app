import React from "react";
import { ClipboardPaste, Save, X } from "lucide-react";
import { toast } from "sonner";
import { BulkStaffRow, parseBulkStaff } from "@/lib/bulkStaffImport";

type Props = { onSave: (rows: BulkStaffRow[]) => Promise<void>; close: () => void };

export function BulkStaffImportPanel({ onSave, close }: Props) {
  const [text, setText] = React.useState("");
  const [rows, setRows] = React.useState<BulkStaffRow[]>([]);
  const preview = React.useMemo(() => parseBulkStaff(text), [text]);
  const handlePreview = () => {
    setRows(preview);
    if (!preview.length) toast.error("ألصق أسطراً تحتوي على الاسم والرقم القومي والهاتف والفرع");
  };
  const handleSave = async () => {
    if (!rows.length) return handlePreview();
    await onSave(rows);
    toast.success(`تم حفظ ${rows.length} فرد أمن دفعة واحدة`);
    close();
  };
  return <div className="space-y-4" dir="rtl">
    <p className="text-sm font-bold text-slate-700">ألصق كل فرد في سطر. افصل البيانات بعلامة تبويب أو فاصلة أو شرطة، بالترتيب: الاسم - الرقم القومي - الهاتف - الفرع.</p>
    <textarea value={text} onChange={event => { setText(event.target.value); setRows([]); }} rows={9} className="w-full rounded-2xl border-2 border-slate-200 bg-white p-4 text-base font-bold text-black outline-none focus:border-emerald-500" placeholder="أحمد محمد علي - 29501011234567 - 01012345678 - فرع مطوبس\nمحمد حسن - 29815021234567 - 01112345678 - شونة السالمية" />
    <div className="flex flex-wrap gap-2"><button type="button" onClick={handlePreview} className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 font-black text-white"><ClipboardPaste className="h-5 w-5"/>معاينة البيانات ({preview.length})</button><button type="button" onClick={handleSave} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white"><Save className="h-5 w-5"/>حفظ الدفعة</button><button type="button" onClick={close} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-800"><X className="h-5 w-5"/>إلغاء</button></div>
    {rows.length > 0 && <div className="max-h-64 overflow-auto rounded-2xl border border-slate-200"><table className="w-full text-right text-sm"><thead className="bg-slate-100 font-black"><tr><th className="p-2">الاسم</th><th className="p-2">الرقم القومي</th><th className="p-2">الميلاد</th><th className="p-2">المحافظة</th><th className="p-2">الفرع</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-t"><td className="p-2 font-bold">{row.name}</td><td className="p-2">{row.nationalId || "—"}</td><td className="p-2">{row.birthDate || "—"}</td><td className="p-2">{row.governorate || "—"}</td><td className="p-2">{row.branch || "—"}</td></tr>)}</tbody></table></div>}
  </div>;
}
