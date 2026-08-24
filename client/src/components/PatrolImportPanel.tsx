import * as React from "react";
import { Check, ClipboardPaste, FileText, RotateCcw, Save, X } from "lucide-react";
import { toast } from "sonner";
import { parsePatrolClipboard, type PatrolImportIssue, type PatrolImportRow } from "@/lib/patrolImport";

type PatrolImportPanelProps = {
  staff: Array<{ id: string; name: string; code?: string }>;
  onSave: (rows: PatrolImportRow[]) => Promise<{ saved: number; skipped: number }>;
  close: () => void;
};

const shiftLabels: Record<PatrolImportRow["shift"], string> = { morning: "صباحي", evening: "مسائي", night: "ليلي", off: "راحة" };

const sample = [
  "التاريخ\tكود الحارس\tاسم الحارس\tالفرع\tنقطة المرور\tالوردية\tملاحظات",
  "١/٩/٢٠٢٦\tح-٠٠٧\tأحمد حسن\tفرع المعادي\tالبوابة الرئيسية\tصباحي\tالتأكد من السجل",
  "٢/٩/٢٠٢٦\tح-٠٠٨\tمحمود علي\tفرع أكتوبر\tالمخزن\tمسائي\t",
].join("\n");

export function PatrolImportPanel({ staff, onSave, close }: PatrolImportPanelProps) {
  const [text, setText] = React.useState("");
  const [rows, setRows] = React.useState<PatrolImportRow[]>([]);
  const [issues, setIssues] = React.useState<PatrolImportIssue[]>([]);
  const [hasHeader, setHasHeader] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const parse = () => {
    const result = parsePatrolClipboard(text);
    setRows(result.rows);
    setIssues(result.issues);
    setHasHeader(result.hasHeader);
    if (!result.rows.length) toast.error(result.issues[0]?.reason || "لم أجد صفوف مرور قابلة للمعاينة");
    else toast.success(`تم تحليل ${result.rows.length} صفاً؛ راجع المعاينة قبل الحفظ`);
  };

  const updateRow = (index: number, patch: Partial<PatrolImportRow>) => setRows(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));

  const chooseStaff = (index: number, staffId: string) => {
    const selected = staff.find(item => item.id === staffId);
    if (!selected) return;
    updateRow(index, { staffName: selected.name, staffCode: selected.code || "" });
  };

  const save = async () => {
    if (!rows.length) {
      toast.error("حلل النص أولاً ثم راجع الصفوف");
      return;
    }
    setSaving(true);
    try {
      const result = await onSave(rows);
      if (result.saved) toast.success(`تم حفظ ${result.saved} موعد مرور${result.skipped ? `، وتجاوز ${result.skipped} صفاً ناقصاً` : ""}`);
      else toast.error("لم يتم حفظ أي صف؛ أكمل التاريخ والفرع ونقطة المرور");
      if (result.saved) close();
    } catch (error) {
      console.error("[Patrol import]", error);
      toast.error("تعذر حفظ كشف المرور؛ بقيت المعاينة كما هي");
    } finally {
      setSaving(false);
    }
  };

  return <div className="space-y-4">
    <div className="rounded-2xl bg-teal-50 p-4 text-sm font-bold leading-7 text-teal-950">
      <p className="font-black">الصق كشف الشهر من واتساب أو Excel</p>
      <p className="mt-1 text-xs text-teal-800">يفضل استخدام أعمدة: التاريخ، اسم/كود الحارس، الفرع أو المقر، نقطة المرور، الوردية، الملاحظات. يمكن أيضاً لصق سطر بدون عناوين مفصولاً بعلامة | أو شرطة.</p>
    </div>
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => setText(sample)} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-teal-200 bg-white px-3 text-sm font-black text-teal-800 hover:bg-teal-50"><FileText className="h-4 w-4"/>إدراج مثال</button>
      <button type="button" onClick={() => { setText(""); setRows([]); setIssues([]); setHasHeader(false); }} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-slate-50"><RotateCcw className="h-4 w-4"/>مسح</button>
    </div>
    <textarea aria-label="نص كشف المرور الشهري" value={text} onChange={event => setText(event.target.value)} placeholder={sample} className="min-h-44 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold leading-7 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" />
    <button type="button" onClick={parse} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-teal-700 px-4 text-sm font-black text-white shadow-lg shadow-teal-900/10 hover:bg-teal-800"><ClipboardPaste className="h-5 w-5"/>تحليل الكشف ومعاينته</button>
    {rows.length > 0 && <>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-black text-slate-700">
        <span>{hasHeader ? "تم التعرف على صف العناوين" : "تم تحليل سطور بدون عناوين"}</span>
        <span className="text-teal-700">{rows.length} صف جاهز للمراجعة · {issues.length} ملاحظة</span>
      </div>
      {issues.length > 0 && <div role="alert" className="space-y-1 rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-6 text-amber-950">{issues.slice(0, 8).map((issue, index) => <p key={`${issue.rowNumber}-${index}`}>صف {issue.rowNumber}: {issue.reason}</p>)}{issues.length > 8 && <p>وملاحظات أخرى عددها {issues.length - 8}.</p>}</div>}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[930px] text-right text-xs">
          <thead className="bg-slate-900 text-white"><tr><th className="p-3">#</th><th className="p-3">التاريخ</th><th className="p-3">الحارس / الكود</th><th className="p-3">الفرع أو المقر</th><th className="p-3">نقطة المرور</th><th className="p-3">الوردية</th><th className="p-3">ملاحظات</th><th className="p-3">الحالة</th></tr></thead>
          <tbody>{rows.map((row, index) => <tr key={`${row.rowNumber}-${index}`} className="border-t border-slate-100 align-top">
            <td className="p-2 font-black text-slate-500">{row.rowNumber}</td>
            <td className="p-2"><input aria-label={`تاريخ الصف ${row.rowNumber}`} type="date" value={row.date} onChange={event => updateRow(index, { date: event.target.value })} className="h-9 rounded-xl border border-slate-200 px-2 font-bold" /></td>
            <td className="space-y-1 p-2"><input aria-label={`اسم الحارس للصف ${row.rowNumber}`} value={row.staffName} placeholder="اسم الحارس" onChange={event => updateRow(index, { staffName: event.target.value })} className="h-9 w-44 rounded-xl border border-slate-200 px-2 font-bold" /><input aria-label={`كود الحارس للصف ${row.rowNumber}`} value={row.staffCode} placeholder="الكود" onChange={event => updateRow(index, { staffCode: event.target.value })} className="h-9 w-44 rounded-xl border border-slate-200 px-2 font-bold" />{staff.length > 0 && <select aria-label={`اختيار الحارس للصف ${row.rowNumber}`} value={staff.find(item => item.name === row.staffName && (item.code || "") === row.staffCode)?.id || ""} onChange={event => chooseStaff(index, event.target.value)} className="h-9 w-44 rounded-xl border border-slate-200 bg-white px-2 font-bold"><option value="">اختيار من السجل</option>{staff.map(item => <option key={item.id} value={item.id}>{item.name} · {item.code || "بدون كود"}</option>)}</select>}</td>
            <td className="p-2"><input aria-label={`فرع الصف ${row.rowNumber}`} value={row.branch} onChange={event => updateRow(index, { branch: event.target.value })} className="h-9 w-44 rounded-xl border border-slate-200 px-2 font-bold" /></td>
            <td className="p-2"><input aria-label={`نقطة الصف ${row.rowNumber}`} value={row.checkpoint} onChange={event => updateRow(index, { checkpoint: event.target.value })} className="h-9 w-44 rounded-xl border border-slate-200 px-2 font-bold" /></td>
            <td className="p-2"><select aria-label={`وردية الصف ${row.rowNumber}`} value={row.shift} onChange={event => updateRow(index, { shift: event.target.value as PatrolImportRow["shift"] })} className="h-9 rounded-xl border border-slate-200 bg-white px-2 font-bold">{Object.entries(shiftLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td>
            <td className="p-2"><input aria-label={`ملاحظات الصف ${row.rowNumber}`} value={row.notes} onChange={event => updateRow(index, { notes: event.target.value })} className="h-9 w-44 rounded-xl border border-slate-200 px-2 font-bold" /></td>
            <td className="p-2 font-black">{row.date && row.branch && row.checkpoint ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-emerald-800"><Check className="h-3.5 w-3.5"/>جاهز</span> : <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-amber-800"><X className="h-3.5 w-3.5"/>ناقص</span>}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <button type="button" disabled={saving} onClick={save} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 text-sm font-black text-amber-950 shadow-lg shadow-amber-900/10 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"><Save className="h-5 w-5"/>{saving ? "جارٍ حفظ الكشف…" : `حفظ ${rows.length} صف بعد المراجعة`}</button>
    </>}
    <button type="button" onClick={close} className="h-10 w-full rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-600 hover:bg-slate-50">إلغاء</button>
  </div>;
}
