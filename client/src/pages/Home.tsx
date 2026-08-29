import React from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpenCheck,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ClipboardCheck,
  ClipboardPaste,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  GraduationCap,
  Phone,
  Plus,
  Printer,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getLicenseAlertLevel } from "@/lib/smartSecurity";
import { PatrolImportPanel } from "@/components/PatrolImportPanel";
import { BulkStaffImportPanel } from "@/components/BulkStaffImportPanel";
import type { BulkStaffRow } from "@/lib/bulkStaffImport";
import {
  filterPatrolPlans,
  normalizePatrolText,
  type PatrolImportRow,
} from "@/lib/patrolImport";
import { parseEgyptianNationalId } from "@/lib/egyptianNationalId";
import { normalizeEgyptianWhatsAppPhone } from "@/lib/filterUi";
import { buildDebtReceiptText, buildWhatsAppShareUrl } from "@/lib/debtReceipt";
import { StaffProfilePanel } from "@/components/StaffProfilePanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecurityCommandCenter } from "@/components/SecurityCommandCenter";
import TrashBinPanel from "@/components/TrashBinPanel";
import {
  getTrashItems,
  moveToTrash,
  type TrashEntityType,
  type TrashItem,
} from "@/lib/trashBin";

type Staff = {
  id: string;
  code?: string;
  name: string;
  phone: string;
  nationalId?: string;
  birthDate?: string;
  branch: string;
  workStartDate?: string;
  hireDate: string;
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
type WorkLocation = {
  id: string;
  staffId: string;
  location: string;
  fromDate: string;
  toDate?: string;
  reason?: string;
  notes?: string;
};
type Patrol = {
  id: string;
  staffId: string;
  branch: string;
  date: string;
  checkpoint: string;
  notes: string;
  photo?: string;
};
type PatrolPlan = {
  id: string;
  date: string;
  branch: string;
  checkpoint: string;
  staffId?: string;
  shift: string;
  notes?: string;
};
type Entry = {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  date: string;
  notes: string;
};
type Debt = {
  id: string;
  name: string;
  direction: "receivable" | "payable";
  total: number;
  paid: number;
  due: string;
  notes: string;
};
type Child = {
  id: string;
  name: string;
  relation?: string;
  nationalId?: string;
  birthDate?: string;
  grade: string;
  school: string;
  phone: string;
  bloodType?: string;
  healthNotes?: string;
  notes?: string;
};
type Teacher = {
  id: string;
  name: string;
  subject: string;
  phone: string;
  whatsapp?: string;
  cost: number;
  availability?: string;
  notes?: string;
};
type Lesson = {
  id: string;
  childId: string;
  teacherId: string;
  subject: string;
  date: string;
  weekDay?: string;
  durationMinutes?: number;
  cost: number;
  paidAmount?: number;
  status: "scheduled" | "completed" | "cancelled";
};
type Vehicle = {
  id: string;
  type: "car" | "motorcycle" | "tuk_tuk" | "other";
  customType?: string;
  make?: string;
  model?: string;
  color?: string;
  plate?: string;
  vin?: string;
  purchaseDate?: string;
  saleDate?: string;
  ownership: "owned" | "sold" | "leased";
  licenseStatus: "valid" | "expired" | "withdrawn" | "unlicensed";
  licenseNumber?: string;
  licenseExpiry?: string;
  licenseWithdrawnDate?: string;
  licenseWithdrawalReason?: string;
  notes?: string;
};
type VehicleVisit = {
  id: string;
  vehicleId: string;
  date: string;
  kind: "inspection" | "renewal" | "license" | "withdrawal" | "other";
  result?: string;
  nextDue?: string;
  fees: number;
  notes?: string;
};
type State = {
  staff: Staff[];
  workLocations: WorkLocation[];
  patrols: Patrol[];
  patrolPlans: PatrolPlan[];
  entries: Entry[];
  debts: Debt[];
  children: Child[];
  teachers: Teacher[];
  lessons: Lesson[];
  vehicles: Vehicle[];
  vehicleVisits: VehicleVisit[];
  settings: { name: string; branch: string };
};
const empty: State = {
  staff: [],
  workLocations: [],
  patrols: [],
  patrolPlans: [],
  entries: [],
  debts: [],
  children: [],
  teachers: [],
  lessons: [],
  vehicles: [],
  vehicleVisits: [],
  settings: { name: "丕賱廿丿丕乇丞 丕賱匕賰賷丞", branch: "賰賱 丕賱賮乇賵毓" },
};
const key = "smart-security-life-v1";
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const vehicleType = (v: Vehicle["type"], custom?: string) =>
  v === "car"
    ? "爻賷丕乇丞"
    : v === "motorcycle"
      ? "賲賵鬲賵爻賷賰賱"
      : v === "tuk_tuk"
        ? "鬲賵賰 鬲賵賰"
        : custom || "賲乇賰亘丞 兀禺乇賶";
const vehicleVisitKind = (v: VehicleVisit["kind"]) =>
  v === "inspection"
    ? "賮丨氐"
    : v === "renewal"
      ? "鬲噩丿賷丿 乇禺氐丞"
      : v === "license"
        ? "丕爻鬲禺乇丕噩 乇禺氐丞"
        : v === "withdrawal"
          ? "爻丨亘 乇禺氐丞"
          : "兀禺乇賶";
const day = () => new Date().toISOString().slice(0, 10);
const month = (v: string) => v.slice(0, 7);
const cash = (v: number) =>
  `${Math.round(v || 0).toLocaleString("ar-EG")} 噩賳賷賴`;
function dueWithinTwoMonths(value?: string) {
  return getLicenseAlertLevel(value) === "soon";
}
function dateText(value?: string) {
  return value
    ? new Date(`${value}T12:00:00`).toLocaleDateString("ar-EG")
    : "睾賷乇 賲丨丿丿";
}
async function shareText(text: string) {
  try {
    if (navigator.share) {
      await navigator.share({ title: "噩丿賵賱 丕賱賲乇賵乇 - 丕賱廿丿丕乇丞 丕賱匕賰賷丞", text });
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success("鬲賲 賳爻禺 噩丿賵賱 丕賱賲乇賵乇 賱賱賲卮丕乇賰丞");
  } catch {
    toast.error("鬲毓匕乇 丕賱賲卮丕乇賰丞貨 賷賲賰賳賰 賳爻禺 丕賱賳氐 賷丿賵賷丕賸");
  }
}
function load(): State {
  try {
    const p = JSON.parse(
      localStorage.getItem(key) || "null"
    ) as Partial<State> | null;
    return {
      ...empty,
      ...p,
      staff: Array.isArray(p?.staff) ? p!.staff : [],
      workLocations: Array.isArray(p?.workLocations) ? p!.workLocations : [],
      patrols: Array.isArray(p?.patrols) ? p!.patrols : [],
      patrolPlans: Array.isArray(p?.patrolPlans) ? p!.patrolPlans : [],
      entries: Array.isArray(p?.entries) ? p!.entries : [],
      debts: Array.isArray(p?.debts) ? p!.debts : [],
      children: Array.isArray(p?.children) ? p!.children : [],
      teachers: Array.isArray(p?.teachers) ? p!.teachers : [],
      lessons: Array.isArray(p?.lessons) ? p!.lessons : [],
      vehicles: Array.isArray(p?.vehicles) ? p!.vehicles : [],
      vehicleVisits: Array.isArray(p?.vehicleVisits) ? p!.vehicleVisits : [],
      settings: { ...empty.settings, ...(p?.settings || {}) },
    };
  } catch {
    return empty;
  }
}
type CloudRow = Record<string, any>;
const rows = (value: unknown) =>
  Array.isArray(value) ? (value as CloudRow[]) : [];
function dateOnly(value: unknown) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}
function cloudState(snapshot: unknown, settings: State["settings"]): State {
  const data = (
    snapshot && typeof snapshot === "object" ? snapshot : {}
  ) as Record<string, unknown>;
  return {
    settings,
    staff: rows(data.staff).map(x => ({
      id: `staff-${x.id}`,
      code: x.staffCode || "",
      name: x.fullName || "",
      phone: x.phone || "",
      nationalId: x.nationalId || "",
      branch: x.branch || "",
      workStartDate: dateOnly(x.workStartDate),
      hireDate: dateOnly(x.hireDate),
      active: x.isActive !== false,
      shift: x.shift || "morning",
      emergencyPhone: x.emergencyPhone || "",
      image: x.photoUrl || "",
      notes: x.notes || "",
      licenseStatus: x.licenseStatus || "unlicensed",
      weaponNumber: x.weaponNumber || "",
      licenseNumber: x.licenseNumber || "",
      licenseExpiry: dateOnly(x.licenseExpiry),
      retirementDate: dateOnly(x.retirementDate),
    })),
    workLocations: rows(data.workLocations).map(x => ({
      id: `location-${x.id}`,
      staffId: x.staffId ? `staff-${x.staffId}` : "",
      location: x.locationName || "",
      fromDate: dateOnly(x.fromDate),
      toDate: dateOnly(x.toDate),
      reason: x.transferReason || "",
      notes: x.notes || "",
    })),
    patrols: rows(data.patrols).map(x => ({
      id: `patrol-${x.id}`,
      staffId: x.staffId ? `staff-${x.staffId}` : "",
      branch: x.branch || "",
      date: dateOnly(x.patrolDate),
      checkpoint: x.checkpoint || "",
      notes: x.notes || "",
      photo: x.photoUrl || "",
    })),
    patrolPlans: rows(data.patrolPlans).map(x => ({
      id: `plan-${x.id}`,
      date: dateOnly(x.planDate),
      branch: x.branch || "",
      checkpoint: x.checkpoint || "",
      staffId: x.staffId ? `staff-${x.staffId}` : "",
      shift: x.shift || "morning",
      notes: x.notes || "",
    })),
    entries: rows(data.entries).map(x => ({
      id: `entry-${x.id}`,
      type: x.entryType === "expense" ? "expense" : "income",
      category: x.category || "",
      amount: Number(x.amount) || 0,
      date: dateOnly(x.entryDate),
      notes: x.description || "",
    })),
    debts: rows(data.debts).map(x => ({
      id: `debt-${x.id}`,
      name: x.personName || "",
      direction: x.direction === "payable" ? "payable" : "receivable",
      total: Number(x.totalAmount) || 0,
      paid: Number(x.paidAmount) || 0,
      due: dateOnly(x.dueDate),
      notes: x.notes || "",
    })),
    children: rows(data.children).map(x => ({
      id: `child-${x.id}`,
      name: x.fullName || "",
      relation: x.relation || "丕亘賳/丕亘賳丞",
      nationalId: x.nationalId || "",
      birthDate: dateOnly(x.birthDate),
      grade: x.grade || "",
      school: x.school || "",
      phone: x.phone || "",
      bloodType: x.bloodType || "",
      healthNotes: x.healthNotes || "",
      notes: x.notes || "",
    })),
    teachers: rows(data.teachers).map(x => ({
      id: `teacher-${x.id}`,
      name: x.fullName || "",
      subject: x.subject || "",
      phone: x.phone || "",
      whatsapp: x.whatsapp || "",
      cost: Number(x.monthlyCost) || 0,
      availability: x.availability || "",
      notes: x.notes || "",
    })),
    lessons: rows(data.lessons).map(x => ({
      id: `lesson-${x.id}`,
      childId: x.childId ? `child-${x.childId}` : "",
      teacherId: x.teacherId ? `teacher-${x.teacherId}` : "",
      subject: x.subject || "",
      date: dateOnly(x.lessonDate),
      weekDay: x.weekDay || "",
      durationMinutes: Number(x.durationMinutes) || 60,
      cost: Number(x.cost) || 0,
      paidAmount: Number(x.paidAmount) || 0,
      status:
        x.status === "completed"
          ? "completed"
          : x.status === "cancelled"
            ? "cancelled"
            : "scheduled",
    })),
    vehicles: rows(data.vehicles).map(x => ({
      id: `vehicle-${x.id}`,
      type: x.vehicleType || "other",
      customType: x.customType || "",
      make: x.make || "",
      model: x.model || "",
      color: x.color || "",
      plate: x.plateNumber || "",
      vin: x.vin || "",
      purchaseDate: dateOnly(x.purchaseDate),
      saleDate: dateOnly(x.saleDate),
      ownership: x.ownership || "owned",
      licenseStatus: x.licenseStatus || "unlicensed",
      licenseNumber: x.licenseNumber || "",
      licenseExpiry: dateOnly(x.licenseExpiry),
      licenseWithdrawnDate: dateOnly(x.licenseWithdrawnDate),
      licenseWithdrawalReason: x.licenseWithdrawalReason || "",
      notes: x.notes || "",
    })),
    vehicleVisits: rows(data.vehicleVisits).map(x => ({
      id: `vehicle-visit-${x.id}`,
      vehicleId: x.vehicleId ? `vehicle-${x.vehicleId}` : "",
      date: dateOnly(x.visitDate),
      kind: x.visitType || "other",
      result: x.result || "",
      nextDue: dateOnly(x.nextDueDate),
      fees: Number(x.fees) || 0,
      notes: x.notes || "",
    })),
  };
}
function csv(file: string, rows: Record<string, unknown>[]) {
  const ks = rows[0] ? Object.keys(rows[0]) : ["丕賱亘賷丕賳"];
  const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const text =
    "\uFEFF" +
    ks.join(",") +
    "\n" +
    rows.map(r => ks.map(k => esc(r[k])).join(",")).join("\n");
  const u = URL.createObjectURL(
    new Blob([text], { type: "text/csv;charset=utf-8" })
  );
  const a = document.createElement("a");
  a.href = u;
  a.download = file;
  a.click();
  URL.revokeObjectURL(u);
}
function print(title: string, rows: Record<string, unknown>[]) {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) {
    toast.error("丕爻賲丨 亘丕賱賳賵丕賮匕 丕賱賲賳亘孬賯丞 賱廿賳卮丕亍 丕賱鬲賯乇賷乇");
    return;
  }
  const ks = rows[0] ? Object.keys(rows[0]) : ["丕賱亘賷丕賳"];
  w.document.write(
    `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${title}</title><style>@page{size:A4;margin:15mm}body{font-family:Arial;color:#0f172a}.head{border-bottom:3px solid #0f766e;padding-bottom:12px;margin-bottom:20px}.head b{font-size:25px;color:#0f766e}.head span{margin-right:20px;font-size:18px;font-weight:bold}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:8px;font-size:12px;text-align:right}th{background:#0f766e;color:#fff}</style></head><body><div class="head"><b>丕賱廿丿丕乇丞 丕賱匕賰賷丞</b><span>${title}</span></div><table><thead><tr>${ks.map(k => `<th>${k}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${ks.map(k => `<td>${r[k] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table><script>onload=()=>print()</script></body></html>`
  );
  w.document.close();
}
async function image(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    const im = new Image();
    r.onload = () => {
      im.onload = () => {
        const s = Math.min(1, 1200 / Math.max(im.width, im.height));
        const c = document.createElement("canvas");
        c.width = Math.round(im.width * s);
        c.height = Math.round(im.height * s);
        c.getContext("2d")!.drawImage(im, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.78));
      };
      im.onerror = () => reject(new Error("image"));
      im.src = String(r.result);
    };
    r.onerror = () => reject(new Error("file"));
    r.readAsDataURL(file);
  });
}
const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className={`field-input ${p.className || ""}`} />
);
const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={`field-input ${p.className || ""}`} />
);
const Area = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className="field-textarea" />
);
const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="group space-y-2">
    <span className="block text-sm font-black text-slate-700 transition-colors group-focus-within:text-teal-700">
      {label}
    </span>
    {children}
  </label>
);
const Button = ({
  children,
  onClick,
  type = "button",
  light = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  light?: boolean;
}) => (
  <button
    type={type}
    onClick={onClick}
    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition duration-150 active:scale-[.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/20 ${light ? "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-teal-300 hover:bg-teal-50" : "bg-teal-700 text-white shadow-[0_8px_18px_rgba(13,109,98,.18)] hover:bg-teal-800"}`}
  >
    {children}
  </button>
);
const Title = ({
  eyebrow,
  title,
  desc,
  actions,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  actions?: React.ReactNode;
}) => (
  <div className="relative mb-2 overflow-hidden rounded-xl bg-[linear-gradient(120deg,#092e3a_0%,#07545a_58%,#0f766e_100%)] p-3 text-white shadow-[0_8px_18px_rgba(7,59,76,.12)] sm:p-3">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-10 -top-12 h-40 w-40 rounded-full border border-white/10"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-16 left-24 h-44 w-44 rounded-full border border-teal-200/10"
    />
    <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[0.65rem] font-black tracking-[.12em] text-teal-200">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-black tracking-tight sm:text-xl">
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-teal-50/85 sm:text-sm">
          {desc}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap gap-1">{actions}</div> : null}
    </div>
  </div>
);
const Stat = ({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) => (
  <div className="soft-card flex min-h-[5.5rem] items-center gap-3 p-4">
    <span
      className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone}`}
    >
      <Icon className="h-5 w-5" />
    </span>
    <div className="min-w-0">
      <p className="truncate text-xs font-black text-slate-500">{label}</p>
      <strong className="mt-1 block text-[1.35rem] font-black tracking-tight text-slate-950">
        {value}
      </strong>
    </div>
  </div>
);
const Empty = ({
  text,
  action,
  go,
}: {
  text: string;
  action: string;
  go: () => void;
}) => (
  <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-7 text-center">
    <p className="text-sm font-bold text-slate-500">{text}</p>
    <button
      onClick={go}
      className="mt-3 text-sm font-black text-teal-700 hover:underline"
    >
      {action}
    </button>
  </div>
);
function Modal({
  title,
  close,
  children,
  wide = false,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-3 backdrop-blur-sm">
      <div
        className={`max-h-[92dvh] w-full overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl sm:p-7 ${wide ? "max-w-6xl" : "max-w-xl"}`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black">{title}</h2>
          <button
            onClick={close}
            className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Form({
  children,
  save,
}: {
  children: React.ReactNode;
  save: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={save} className="space-y-4">
      {children}
      <Button type="submit">
        <Check className="h-4 w-4" />
        丨賮馗 丕賱爻噩賱
      </Button>
    </form>
  );
}
function StaffForm({
  save,
  initial,
}: {
  save: (v: Staff) => void;
  initial?: Staff;
}) {
  const [f, set] = React.useState({
    id: initial?.id || id(),
    code: initial?.code || "",
    name: initial?.name || "",
    phone: initial?.phone || "",
    nationalId: initial?.nationalId || "",
    birthDate: initial?.birthDate || "",
    branch: initial?.branch || "",
    workStartDate: initial?.workStartDate || day(),
    hireDate: initial?.hireDate || day(),
    shift: initial?.shift || "morning",
    emergencyPhone: initial?.emergencyPhone || "",
    image: initial?.image || "",
    notes: initial?.notes || "",
    licenseStatus:
      initial?.licenseStatus || ("licensed" as "licensed" | "unlicensed"),
    weaponNumber: initial?.weaponNumber || "",
    licenseNumber: initial?.licenseNumber || "",
    licenseExpiry: initial?.licenseExpiry || "",
    retirementDate: initial?.retirementDate || "",
    active: initial?.active ?? true,
  });
  const nationalIdDetails = parseEgyptianNationalId(f.nationalId);
  const updateNationalId = (value: string) => {
    const details = parseEgyptianNationalId(value);
    set({
      ...f,
      nationalId: value,
      birthDate: details?.birthDate || "",
      retirementDate: details?.retirementDate || "",
    });
  };
  return (
    <Form
      save={e => {
        e.preventDefault();
        const details = parseEgyptianNationalId(f.nationalId);
        if (!f.name || !f.branch) return toast.error("兀丿禺賱 丕賱丕爻賲 賵丕賱賮乇毓");
        if (f.nationalId && !details)
          return toast.error("丕賱乇賯賲 丕賱賯賵賲賷 賷噩亘 兀賳 賷賰賵賳 14 乇賯賲丕賸 氐丨賷丨丕賸");
        save({
          ...f,
          id: f.id,
          birthDate: details?.birthDate || f.birthDate,
          retirementDate: details?.retirementDate || f.retirementDate,
          active: f.active,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="賰賵丿 賮乇丿 丕賱兀賲賳">
          <Input
            value={f.code}
            placeholder="賲孬丕賱: 丨-001"
            onChange={e => set({ ...f, code: e.target.value })}
          />
        </Field>
        <Field label="丕賱丕爻賲 丕賱賰丕賲賱">
          <Input
            required
            value={f.name}
            onChange={e => set({ ...f, name: e.target.value })}
          />
        </Field>
        <Field label="丕賱賴丕鬲賮">
          <Input
            dir="ltr"
            value={f.phone}
            onChange={e => set({ ...f, phone: e.target.value })}
          />
        </Field>
        <Field label="丕賱乇賯賲 丕賱賯賵賲賷 (14 乇賯賲丕賸)">
          <Input
            dir="ltr"
            inputMode="numeric"
            maxLength={14}
            value={f.nationalId}
            onChange={e => updateNationalId(e.target.value)}
          />
        </Field>
        {nationalIdDetails && (
          <>
            <Field label="鬲丕乇賷禺 丕賱賲賷賱丕丿 丕賱賲丨爻賵亘">
              <Input
                type="date"
                value={nationalIdDetails.birthDate}
                readOnly
                disabled
              />
            </Field>
            <Field label="丕賱毓賲乇 丕賱丨丕賱賷">
              <Input value={`${nationalIdDetails.age} 爻賳丞`} readOnly disabled />
            </Field>
            <Field label="鬲丕乇賷禺 丕賱禺乇賵噩 毓賱賶 丕賱賲毓丕卮 丕賱賲丨爻賵亘">
              <Input
                type="date"
                value={nationalIdDetails.retirementDate}
                readOnly
                disabled
              />
            </Field>
          </>
        )}
        <Field label="賲賰丕賳 丕賱毓賲賱 丕賱丨丕賱賷">
          <Input
            required
            value={f.branch}
            onChange={e => set({ ...f, branch: e.target.value })}
          />
        </Field>
        <Field label="亘丿兀 丕賱毓賲賱 賮賷 丕賱賲賰丕賳 丕賱丨丕賱賷">
          <Input
            type="date"
            value={f.workStartDate}
            onChange={e => set({ ...f, workStartDate: e.target.value })}
          />
        </Field>
        <Field label="鬲丕乇賷禺 丕賱鬲毓賷賷賳">
          <Input
            type="date"
            value={f.hireDate}
            onChange={e => set({ ...f, hireDate: e.target.value })}
          />
        </Field>
        <Field label="丕賱賵乇丿賷丞 丕賱兀爻丕爻賷丞">
          <Select
            value={f.shift}
            onChange={e => set({ ...f, shift: e.target.value })}
          >
            <option value="morning">氐亘丕丨賷</option>
            <option value="evening">賲爻丕卅賷</option>
            <option value="night">賱賷賱賷</option>
          </Select>
        </Field>
        <Field label="賴丕鬲賮 丕賱胤賵丕乇卅">
          <Input
            dir="ltr"
            value={f.emergencyPhone}
            onChange={e => set({ ...f, emergencyPhone: e.target.value })}
          />
        </Field>
        <Field label="丨丕賱丞 丕賱鬲乇禺賷氐">
          <Select
            value={f.licenseStatus}
            onChange={e =>
              set({
                ...f,
                licenseStatus: e.target.value as "licensed" | "unlicensed",
              })
            }
          >
            <option value="licensed">賲乇禺氐</option>
            <option value="unlicensed">睾賷乇 賲乇禺氐</option>
          </Select>
        </Field>
        <Field label="乇賯賲 丕賱爻賱丕丨">
          <Input
            dir="ltr"
            value={f.weaponNumber}
            onChange={e => set({ ...f, weaponNumber: e.target.value })}
          />
        </Field>
        <Field label="乇賯賲 丕賱乇禺氐丞">
          <Input
            dir="ltr"
            value={f.licenseNumber}
            onChange={e => set({ ...f, licenseNumber: e.target.value })}
          />
        </Field>
        <Field label="丕賳鬲賴丕亍 丕賱乇禺氐丞">
          <Input
            type="date"
            value={f.licenseExpiry}
            onChange={e => set({ ...f, licenseExpiry: e.target.value })}
          />
        </Field>
        <Field label="鬲丕乇賷禺 丕賱禺乇賵噩 毓賱賶 丕賱賲毓丕卮">
          <Input type="date" value={f.retirementDate} readOnly disabled />
        </Field>
      </div>
      <Field label="氐賵乇丞 丕賱丨丕乇爻 兀賵 賮乇丿 丕賱兀賲賳">
        <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-teal-300 bg-teal-50 p-4 text-sm font-black text-teal-800">
          <Camera className="ml-2 h-5 w-5" />
          丕賱鬲賯丕胤 兀賵 丕禺鬲賷丕乇 氐賵乇丞
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={async e => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  set({ ...f, image: await image(file) });
                } catch {
                  toast.error("鬲毓匕乇 賲毓丕賱噩丞 丕賱氐賵乇丞");
                }
              }
            }}
          />
        </label>
        {f.image && (
          <img
            src={f.image}
            alt="氐賵乇丞 賮乇丿 丕賱兀賲賳"
            className="mt-3 h-40 w-full rounded-2xl object-cover"
          />
        )}
      </Field>
      <Field label="賲賱丕丨馗丕鬲 鬲卮睾賷賱賷丞">
        <Area
          value={f.notes}
          placeholder="丕賱賲賴丕賲貙 丕賱鬲毓賱賷賲丕鬲貙 兀賵 兀賷 賲賱丕丨馗丕鬲 賲賴賲丞"
          onChange={e => set({ ...f, notes: e.target.value })}
        />
      </Field>
    </Form>
  );
}
function PatrolForm({
  staff,
  save,
  initial,
}: {
  staff: Staff[];
  save: (v: Patrol) => void;
  initial?: Patrol;
}) {
  const [f, set] = React.useState({
    staffId: initial?.staffId || staff[0]?.id || "",
    branch: initial?.branch || "",
    date: initial?.date || day(),
    checkpoint: initial?.checkpoint || "",
    notes: initial?.notes || "",
    photo: initial?.photo || "",
  });
  return (
    <Form
      save={e => {
        e.preventDefault();
        if (!f.branch) return toast.error("兀丿禺賱 丕賱賮乇毓");
        save({ id: initial?.id || id(), ...f });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="丕賱賮乇丿 丕賱賲賳賮匕">
          <Select
            value={f.staffId}
            onChange={e => set({ ...f, staffId: e.target.value })}
          >
            <option value="">睾賷乇 賲丨丿丿</option>
            {staff.map(x => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="丕賱賮乇毓">
          <Input
            required
            value={f.branch}
            onChange={e => set({ ...f, branch: e.target.value })}
          />
        </Field>
        <Field label="丕賱鬲丕乇賷禺">
          <Input
            type="date"
            value={f.date}
            onChange={e => set({ ...f, date: e.target.value })}
          />
        </Field>
        <Field label="賳賯胤丞 丕賱鬲賮鬲賷卮">
          <Input
            value={f.checkpoint}
            onChange={e => set({ ...f, checkpoint: e.target.value })}
          />
        </Field>
      </div>
      <Field label="賲賱丕丨馗丕鬲">
        <Area
          value={f.notes}
          onChange={e => set({ ...f, notes: e.target.value })}
        />
      </Field>
      <Field label="氐賵乇丞 賲賳 丕賱賰丕賲賷乇丕">
        <label className="flex cursor-pointer justify-center rounded-2xl border border-dashed border-teal-300 bg-teal-50 p-4 text-sm font-black text-teal-800">
          <Camera className="ml-2 h-5 w-5" />
          丕賱鬲賯丕胤 兀賵 丕禺鬲賷丕乇 氐賵乇丞
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={async e => {
              const file = e.target.files?.[0];
              if (file) set({ ...f, photo: await image(file) });
            }}
          />
        </label>
        {f.photo && (
          <img
            src={f.photo}
            alt="氐賵乇丞 丕賱賲乇賵乇"
            className="mt-3 h-32 w-full rounded-2xl object-cover"
          />
        )}
      </Field>
    </Form>
  );
}
function PatrolPlanForm({
  staff,
  save,
}: {
  staff: Staff[];
  save: (v: PatrolPlan) => void;
}) {
  const [f, set] = React.useState({
    date: day(),
    branch: "",
    checkpoint: "",
    staffId: staff[0]?.id || "",
    shift: "morning",
    repeat: "none",
    notes: "",
  });
  return (
    <Form
      save={e => {
        e.preventDefault();
        if (!f.branch || !f.checkpoint)
          return toast.error("兀丿禺賱 丕賱賮乇毓 賵賳賯胤丞 丕賱賲乇賵乇");
        const dates =
          f.repeat === "weekly"
            ? Array.from({ length: 4 }, (_, i) => {
                const d = new Date(`${f.date}T12:00:00`);
                d.setDate(d.getDate() + i * 7);
                return d.toISOString().slice(0, 10);
              })
            : [f.date];
        dates.forEach(date =>
          save({
            id: id(),
            date,
            branch: f.branch,
            checkpoint: f.checkpoint,
            staffId: f.staffId || undefined,
            shift: f.shift,
            notes: f.notes,
          })
        );
        toast.success(
          dates.length > 1
            ? `鬲賲鬲 廿囟丕賮丞 ${dates.length} 賲賵丕毓賷丿 賲乇賵乇`
            : "鬲賲鬲 廿囟丕賮丞 賲賵毓丿 丕賱賲乇賵乇"
        );
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="丕賱鬲丕乇賷禺 丕賱兀賵賱">
          <Input
            type="date"
            value={f.date}
            onChange={e => set({ ...f, date: e.target.value })}
          />
        </Field>
        <Field label="丕賱鬲賰乇丕乇">
          <Select
            value={f.repeat}
            onChange={e => set({ ...f, repeat: e.target.value })}
          >
            <option value="none">賲乇丞 賵丕丨丿丞</option>
            <option value="weekly">兀爻亘賵毓賷丕賸 賱賲丿丞 卮賴乇</option>
          </Select>
        </Field>
        <Field label="丕賱賮乇毓 兀賵 丕賱賲賯乇">
          <Input
            required
            value={f.branch}
            placeholder="賲孬丕賱: 賮乇毓 丕賱賲乇卮丿"
            onChange={e => set({ ...f, branch: e.target.value })}
          />
        </Field>
        <Field label="賳賯胤丞 丕賱賲乇賵乇">
          <Input
            required
            value={f.checkpoint}
            placeholder="丕賱亘賵丕亘丞 丕賱乇卅賷爻賷丞"
            onChange={e => set({ ...f, checkpoint: e.target.value })}
          />
        </Field>
        <Field label="賮乇丿 丕賱兀賲賳 丕賱賲賰賱賮">
          <Select
            value={f.staffId}
            onChange={e => set({ ...f, staffId: e.target.value })}
          >
            <option value="">睾賷乇 賲丨丿丿</option>
            {staff.map(x => (
              <option key={x.id} value={x.id}>
                {x.name} 路 {x.code || "亘丿賵賳 賰賵丿"}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="丕賱賵乇丿賷丞">
          <Select
            value={f.shift}
            onChange={e => set({ ...f, shift: e.target.value })}
          >
            <option value="morning">氐亘丕丨賷</option>
            <option value="evening">賲爻丕卅賷</option>
            <option value="night">賱賷賱賷</option>
          </Select>
        </Field>
      </div>
      <Field label="賲賱丕丨馗丕鬲 丕賱禺胤丞">
        <Area
          value={f.notes}
          onChange={e => set({ ...f, notes: e.target.value })}
        />
      </Field>
    </Form>
  );
}
function WorkLocationForm({
  staff,
  save,
  initial,
}: {
  staff: Staff[];
  save: (v: WorkLocation) => void;
  initial?: WorkLocation;
}) {
  const [f, set] = React.useState({
    staffId: initial?.staffId || staff[0]?.id || "",
    location: initial?.location || "",
    fromDate: initial?.fromDate || day(),
    toDate: initial?.toDate || "",
    reason: initial?.reason || "",
    notes: initial?.notes || "",
  });
  return (
    <Form
      save={e => {
        e.preventDefault();
        if (!f.staffId || !f.location)
          return toast.error("丕禺鬲乇 丕賱賮乇丿 賵丕賰鬲亘 賲賰丕賳 丕賱毓賲賱");
        save({ id: initial?.id || id(), ...f, toDate: f.toDate || undefined });
      }}
    >
      <Field label="賮乇丿 丕賱兀賲賳">
        <Select
          value={f.staffId}
          onChange={e => set({ ...f, staffId: e.target.value })}
        >
          {staff.map(x => (
            <option key={x.id} value={x.id}>
              {x.name} 路 {x.code || "亘丿賵賳 賰賵丿"}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="賲賰丕賳 丕賱毓賲賱">
          <Input
            required
            value={f.location}
            placeholder="丕賱賮乇毓 兀賵 丕賱賲賵賯毓"
            onChange={e => set({ ...f, location: e.target.value })}
          />
        </Field>
        <Field label="鬲丕乇賷禺 亘丿亍 丕賱毓賲賱">
          <Input
            type="date"
            value={f.fromDate}
            onChange={e => set({ ...f, fromDate: e.target.value })}
          />
        </Field>
        <Field label="鬲丕乇賷禺 丕賱丕賳鬲賯丕賱 兀賵 丕賱丕賳鬲賴丕亍">
          <Input
            type="date"
            value={f.toDate}
            onChange={e => set({ ...f, toDate: e.target.value })}
          />
        </Field>
        <Field label="爻亘亘 丕賱丕賳鬲賯丕賱">
          <Input
            value={f.reason}
            placeholder="鬲賰賱賷賮貙 賳賯賱貙 鬲乇賯賷丞鈥�"
            onChange={e => set({ ...f, reason: e.target.value })}
          />
        </Field>
      </div>
      <Field label="賲賱丕丨馗丕鬲">
        <Area
          value={f.notes}
          onChange={e => set({ ...f, notes: e.target.value })}
        />
      </Field>
    </Form>
  );
}
function EntryForm({ save }: { save: (v: Entry) => void }) {
  const [f, set] = React.useState({
    type: "income" as "income" | "expense",
    category: "",
    amount: "",
    date: day(),
    notes: "",
  });
  return (
    <Form
      save={e => {
        e.preventDefault();
        if (!f.category || Number(f.amount) <= 0)
          return toast.error("兀丿禺賱 丕賱鬲氐賳賷賮 賵丕賱賲亘賱睾");
        save({ id: id(), ...f, amount: Number(f.amount) });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="賳賵毓 丕賱丨乇賰丞">
          <Select
            value={f.type}
            onChange={e =>
              set({ ...f, type: e.target.value as "income" | "expense" })
            }
          >
            <option value="income">廿賷乇丕丿</option>
            <option value="expense">賲氐乇賵賮</option>
          </Select>
        </Field>
        <Field label="丕賱鬲氐賳賷賮">
          <Input
            required
            value={f.category}
            placeholder="乇丕鬲亘貙 賲賵丕氐賱丕鬲貙 賲卮鬲乇賷丕鬲鈥�"
            onChange={e => set({ ...f, category: e.target.value })}
          />
        </Field>
        <Field label="丕賱賲亘賱睾">
          <Input
            required
            type="number"
            min="1"
            value={f.amount}
            onChange={e => set({ ...f, amount: e.target.value })}
          />
        </Field>
        <Field label="丕賱鬲丕乇賷禺">
          <Input
            type="date"
            value={f.date}
            onChange={e => set({ ...f, date: e.target.value })}
          />
        </Field>
      </div>
      <Field label="丕賱亘賷丕賳">
        <Area
          value={f.notes}
          onChange={e => set({ ...f, notes: e.target.value })}
        />
      </Field>
    </Form>
  );
}
function DebtForm({ save }: { save: (v: Debt) => void }) {
  const [f, set] = React.useState({
    name: "",
    direction: "receivable" as "receivable" | "payable",
    total: "",
    paid: "",
    due: "",
    notes: "",
  });
  return (
    <Form
      save={e => {
        e.preventDefault();
        if (!f.name || Number(f.total) <= 0)
          return toast.error("兀丿禺賱 丕賱丕爻賲 賵丕賱廿噩賲丕賱賷");
        save({
          id: id(),
          ...f,
          total: Number(f.total),
          paid: Math.min(Number(f.total), Number(f.paid) || 0),
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="丕賱丕爻賲">
          <Input
            required
            value={f.name}
            onChange={e => set({ ...f, name: e.target.value })}
          />
        </Field>
        <Field label="丕賱丕鬲噩丕賴">
          <Select
            value={f.direction}
            onChange={e =>
              set({
                ...f,
                direction: e.target.value as "receivable" | "payable",
              })
            }
          >
            <option value="receivable">賲亘賱睾 賱賷 毓賳丿 丕賱睾賷乇</option>
            <option value="payable">丿賷賳 賵丕噩亘 毓賱賷賾</option>
          </Select>
        </Field>
        <Field label="丕賱廿噩賲丕賱賷">
          <Input
            required
            type="number"
            min="1"
            value={f.total}
            onChange={e => set({ ...f, total: e.target.value })}
          />
        </Field>
        <Field label="丕賱賲丿賮賵毓 丨丕賱賷丕賸">
          <Input
            type="number"
            min="0"
            value={f.paid}
            onChange={e => set({ ...f, paid: e.target.value })}
          />
        </Field>
        <Field label="鬲丕乇賷禺 丕賱丕爻鬲丨賯丕賯">
          <Input
            type="date"
            value={f.due}
            onChange={e => set({ ...f, due: e.target.value })}
          />
        </Field>
      </div>
      <Field label="賲賱丕丨馗丕鬲">
        <Area
          value={f.notes}
          onChange={e => set({ ...f, notes: e.target.value })}
        />
      </Field>
    </Form>
  );
}
function ChildForm({ save }: { save: (v: Child) => void }) {
  const [f, set] = React.useState({
    name: "",
    relation: "丕亘賳/丕亘賳丞",
    nationalId: "",
    birthDate: "",
    grade: "",
    school: "",
    phone: "",
    bloodType: "",
    healthNotes: "",
    notes: "",
  });
  const parsed =
    f.nationalId.length === 14 ? parseEgyptianNationalId(f.nationalId) : null;
  return (
    <Form
      save={e => {
        e.preventDefault();
        if (!f.name) return toast.error("兀丿禺賱 丕賱丕爻賲");
        if (f.nationalId && !/^\\d{14}$/.test(f.nationalId))
          return toast.error("丕賱乇賯賲 丕賱賯賵賲賷 賷噩亘 兀賳 賷賰賵賳 14 乇賯賲丕賸");
        save({ id: id(), ...f, birthDate: parsed?.birthDate || f.birthDate });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="丕爻賲 丕賱丕亘賳 兀賵 丕賱丕亘賳丞">
          <Input
            required
            value={f.name}
            onChange={e => set({ ...f, name: e.target.value })}
          />
        </Field>
        <Field label="丕賱氐賮丞">
          <Select
            value={f.relation}
            onChange={e => set({ ...f, relation: e.target.value })}
          >
            <option value="丕亘賳">丕亘賳</option>
            <option value="丕亘賳丞">丕亘賳丞</option>
          </Select>
        </Field>
        <Field label="丕賱乇賯賲 丕賱賯賵賲賷">
          <Input
            dir="ltr"
            inputMode="numeric"
            maxLength={14}
            value={f.nationalId}
            onChange={e =>
              set({ ...f, nationalId: e.target.value.replace(/\\D/g, "") })
            }
          />
        </Field>
        {parsed?.birthDate && (
          <div className="rounded-xl bg-emerald-50 p-3 text-sm font-black text-emerald-800">
            丕賱賲賷賱丕丿: {parsed.birthDate} 路 丕賱毓賲乇: {parsed.age} 爻賳丞
          </div>
        )}
        <Field label="丕賱氐賮 丕賱丿乇丕爻賷">
          <Input
            value={f.grade}
            onChange={e => set({ ...f, grade: e.target.value })}
          />
        </Field>
        <Field label="丕賱賲丿乇爻丞">
          <Input
            value={f.school}
            onChange={e => set({ ...f, school: e.target.value })}
          />
        </Field>
        <Field label="丕賱賴丕鬲賮/賵丕鬲爻丕亘">
          <Input
            dir="ltr"
            value={f.phone}
            onChange={e => set({ ...f, phone: e.target.value })}
          />
        </Field>
        <Field label="賮氐賷賱丞 丕賱丿賲">
          <Input
            value={f.bloodType}
            onChange={e => set({ ...f, bloodType: e.target.value })}
          />
        </Field>
        <Field label="賲賱丕丨馗丕鬲 氐丨賷丞">
          <Input
            value={f.healthNotes}
            onChange={e => set({ ...f, healthNotes: e.target.value })}
          />
        </Field>
      </div>
    </Form>
  );
}
function TeacherForm({ save }: { save: (v: Teacher) => void }) {
  const [f, set] = React.useState({
    name: "",
    subject: "",
    phone: "",
    whatsapp: "",
    cost: "",
    availability: "",
    notes: "",
  });
  return (
    <Form
      save={e => {
        e.preventDefault();
        if (!f.name || !f.subject) return toast.error("兀丿禺賱 丕賱丕爻賲 賵丕賱賲丕丿丞");
        save({
          id: id(),
          ...f,
          whatsapp: normalizeEgyptianWhatsAppPhone(f.whatsapp) || "",
          cost: Number(f.cost) || 0,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="丕爻賲 丕賱賲丿乇爻">
          <Input
            required
            value={f.name}
            onChange={e => set({ ...f, name: e.target.value })}
          />
        </Field>
        <Field label="丕賱賲丕丿丞">
          <Input
            required
            value={f.subject}
            onChange={e => set({ ...f, subject: e.target.value })}
          />
        </Field>
        <Field label="丕賱賴丕鬲賮">
          <Input
            dir="ltr"
            value={f.phone}
            onChange={e => set({ ...f, phone: e.target.value })}
          />
        </Field>
        <Field label="賵丕鬲爻丕亘">
          <Input
            dir="ltr"
            value={f.whatsapp}
            onChange={e => set({ ...f, whatsapp: e.target.value })}
          />
        </Field>
        <Field label="丕賱鬲賰賱賮丞 丕賱卮賴乇賷丞">
          <Input
            type="number"
            min="0"
            value={f.cost}
            onChange={e => set({ ...f, cost: e.target.value })}
          />
        </Field>
        <Field label="丕賱兀賷丕賲 兀賵 丕賱賲賵丕毓賷丿 丕賱賲鬲丕丨丞">
          <Input
            value={f.availability}
            onChange={e => set({ ...f, availability: e.target.value })}
          />
        </Field>
      </div>
    </Form>
  );
}
function LessonForm({
  childrenList,
  teachers,
  save,
}: {
  childrenList: Child[];
  teachers: Teacher[];
  save: (v: Lesson) => void;
}) {
  const [f, set] = React.useState({
    childId: childrenList[0]?.id || "",
    teacherId: teachers[0]?.id || "",
    subject: teachers[0]?.subject || "",
    date: day(),
    weekDay: "",
    durationMinutes: "60",
    cost: "",
    paidAmount: "",
  });
  return (
    <Form
      save={e => {
        e.preventDefault();
        if (!f.childId || !f.subject)
          return toast.error("兀囟賮 丕亘賳丕賸 賵賲丕丿丞 兀賵賱丕賸");
        save({
          id: id(),
          ...f,
          durationMinutes: Number(f.durationMinutes) || 60,
          cost: Number(f.cost) || 0,
          paidAmount: Number(f.paidAmount) || 0,
          status: "scheduled",
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="丕賱丕亘賳">
          <Select
            value={f.childId}
            onChange={e => set({ ...f, childId: e.target.value })}
          >
            {childrenList.map(x => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="丕賱賲丿乇爻">
          <Select
            value={f.teacherId}
            onChange={e => {
              const t = teachers.find(x => x.id === e.target.value);
              set({
                ...f,
                teacherId: e.target.value,
                subject: t?.subject || f.subject,
              });
            }}
          >
            <option value="">亘丿賵賳 賲丿乇爻</option>
            {teachers.map(x => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="丕賱賲丕丿丞">
          <Input
            required
            value={f.subject}
            onChange={e => set({ ...f, subject: e.target.value })}
          />
        </Field>
        <Field label="丕賱鬲丕乇賷禺">
          <Input
            type="date"
            value={f.date}
            onChange={e => set({ ...f, date: e.target.value })}
          />
        </Field>
        <Field label="丕賱賷賵賲 丕賱兀爻亘賵毓賷">
          <Input
            placeholder="丕賱爻亘鬲 兀賵 賰賱 孬賱丕孬丕亍"
            value={f.weekDay}
            onChange={e => set({ ...f, weekDay: e.target.value })}
          />
        </Field>
        <Field label="賲丿丞 丕賱丨氐丞 亘丕賱丿賯丕卅賯">
          <Input
            type="number"
            min="1"
            value={f.durationMinutes}
            onChange={e => set({ ...f, durationMinutes: e.target.value })}
          />
        </Field>
        <Field label="丕賱鬲賰賱賮丞">
          <Input
            type="number"
            min="0"
            value={f.cost}
            onChange={e => set({ ...f, cost: e.target.value })}
          />
        </Field>
        <Field label="丕賱賲丿賮賵毓">
          <Input
            type="number"
            min="0"
            value={f.paidAmount}
            onChange={e => set({ ...f, paidAmount: e.target.value })}
          />
        </Field>
      </div>
    </Form>
  );
}

function VehicleForm({ save }: { save: (v: Vehicle) => void }) {
  const [f, set] = React.useState({
    type: "car" as Vehicle["type"],
    customType: "",
    make: "",
    model: "",
    color: "",
    plate: "",
    vin: "",
    purchaseDate: "",
    saleDate: "",
    ownership: "owned" as Vehicle["ownership"],
    licenseStatus: "valid" as Vehicle["licenseStatus"],
    licenseNumber: "",
    licenseExpiry: "",
    licenseWithdrawnDate: "",
    licenseWithdrawalReason: "",
    notes: "",
  });
  return (
    <Form
      save={e => {
        e.preventDefault();
        if (f.type === "other" && !f.customType.trim())
          return toast.error("丕賰鬲亘 賳賵毓 丕賱賲乇賰亘丞");
        save({ id: id(), ...f });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="賳賵毓 丕賱賲乇賰亘丞">
          <Select
            value={f.type}
            onChange={e =>
              set({ ...f, type: e.target.value as Vehicle["type"] })
            }
          >
            <option value="car">爻賷丕乇丞</option>
            <option value="motorcycle">賲賵鬲賵爻賷賰賱</option>
            <option value="tuk_tuk">鬲賵賰 鬲賵賰</option>
            <option value="other">兀禺乇賶</option>
          </Select>
        </Field>
        {f.type === "other" && (
          <Field label="賵氐賮 丕賱賳賵毓">
            <Input
              value={f.customType}
              onChange={e => set({ ...f, customType: e.target.value })}
            />
          </Field>
        )}
        <Field label="丕賱賲丕乇賰丞">
          <Input
            value={f.make}
            onChange={e => set({ ...f, make: e.target.value })}
          />
        </Field>
        <Field label="丕賱賲賵丿賷賱">
          <Input
            value={f.model}
            onChange={e => set({ ...f, model: e.target.value })}
          />
        </Field>
        <Field label="丕賱賱賵賳">
          <Input
            value={f.color}
            onChange={e => set({ ...f, color: e.target.value })}
          />
        </Field>
        <Field label="乇賯賲 丕賱賱賵丨丞">
          <Input
            value={f.plate}
            onChange={e => set({ ...f, plate: e.target.value })}
          />
        </Field>
        <Field label="乇賯賲 丕賱卮丕爻賷賴">
          <Input
            value={f.vin}
            onChange={e => set({ ...f, vin: e.target.value })}
          />
        </Field>
        <Field label="鬲丕乇賷禺 丕賱卮乇丕亍">
          <Input
            type="date"
            value={f.purchaseDate}
            onChange={e => set({ ...f, purchaseDate: e.target.value })}
          />
        </Field>
        <Field label="鬲丕乇賷禺 丕賱亘賷毓 廿賳 賵噩丿">
          <Input
            type="date"
            value={f.saleDate}
            onChange={e => set({ ...f, saleDate: e.target.value })}
          />
        </Field>
        <Field label="丨丕賱丞 丕賱賲賱賰賷丞">
          <Select
            value={f.ownership}
            onChange={e =>
              set({ ...f, ownership: e.target.value as Vehicle["ownership"] })
            }
          >
            <option value="owned">賲賲賱賵賰丞</option>
            <option value="leased">廿賷噩丕乇</option>
            <option value="sold">賲亘丕毓丞</option>
          </Select>
        </Field>
        <Field label="丨丕賱丞 丕賱乇禺氐丞">
          <Select
            value={f.licenseStatus}
            onChange={e =>
              set({
                ...f,
                licenseStatus: e.target.value as Vehicle["licenseStatus"],
              })
            }
          >
            <option value="valid">爻丕乇賷丞</option>
            <option value="expired">賲賳鬲賴賷丞</option>
            <option value="withdrawn">賲爻丨賵亘丞</option>
            <option value="unlicensed">亘丿賵賳 鬲乇禺賷氐</option>
          </Select>
        </Field>
        <Field label="乇賯賲 乇禺氐丞 丕賱賲乇賰亘丞">
          <Input
            value={f.licenseNumber}
            onChange={e => set({ ...f, licenseNumber: e.target.value })}
          />
        </Field>
        <Field label="鬲丕乇賷禺 丕賳鬲賴丕亍 丕賱乇禺氐丞">
          <Input
            type="date"
            value={f.licenseExpiry}
            onChange={e => set({ ...f, licenseExpiry: e.target.value })}
          />
        </Field>
        <Field label="鬲丕乇賷禺 爻丨亘 丕賱乇禺氐丞">
          <Input
            type="date"
            value={f.licenseWithdrawnDate}
            onChange={e => set({ ...f, licenseWithdrawnDate: e.target.value })}
          />
        </Field>
        <Field label="爻亘亘 丕賱爻丨亘">
          <Input
            value={f.licenseWithdrawalReason}
            onChange={e =>
              set({ ...f, licenseWithdrawalReason: e.target.value })
            }
          />
        </Field>
      </div>
      <Field label="賲賱丕丨馗丕鬲 丕賱賲乇賰亘丞">
        <Area
          value={f.notes}
          placeholder="丕賱鬲兀賲賷賳貙 丕賱氐賷丕賳丞貙 兀賵 兀賷 賲賱丕丨馗丞 賲賴賲丞"
          onChange={e => set({ ...f, notes: e.target.value })}
        />
      </Field>
    </Form>
  );
}
function VehicleVisitForm({
  vehicles,
  save,
}: {
  vehicles: Vehicle[];
  save: (v: VehicleVisit) => void;
}) {
  const [f, set] = React.useState({
    vehicleId: vehicles[0]?.id || "",
    date: day(),
    kind: "inspection" as VehicleVisit["kind"],
    result: "",
    nextDue: "",
    fees: "",
    notes: "",
  });
  return (
    <Form
      save={e => {
        e.preventDefault();
        if (!f.vehicleId) return toast.error("兀囟賮 賲乇賰亘丞 兀賵賱丕賸");
        save({ id: id(), ...f, fees: Number(f.fees) || 0 });
      }}
    >
      <Field label="丕賱賲乇賰亘丞">
        <Select
          value={f.vehicleId}
          onChange={e => set({ ...f, vehicleId: e.target.value })}
        >
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>
              {vehicleType(v.type, v.customType)} 路 {v.plate || "亘丿賵賳 賱賵丨丞"}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="鬲丕乇賷禺 丕賱匕賴丕亘 賱賱賲乇賵乇">
          <Input
            type="date"
            value={f.date}
            onChange={e => set({ ...f, date: e.target.value })}
          />
        </Field>
        <Field label="賳賵毓 丕賱賲毓丕賲賱丞">
          <Select
            value={f.kind}
            onChange={e =>
              set({ ...f, kind: e.target.value as VehicleVisit["kind"] })
            }
          >
            <option value="inspection">賮丨氐</option>
            <option value="renewal">鬲噩丿賷丿 乇禺氐丞</option>
            <option value="license">丕爻鬲禺乇丕噩 乇禺氐丞</option>
            <option value="withdrawal">爻丨亘 乇禺氐丞</option>
            <option value="other">兀禺乇賶</option>
          </Select>
        </Field>
        <Field label="丕賱賳鬲賷噩丞">
          <Input
            value={f.result}
            onChange={e => set({ ...f, result: e.target.value })}
          />
        </Field>
        <Field label="賲賵毓丿 丕賱鬲噩丿賷丿 丕賱賯丕丿賲">
          <Input
            type="date"
            value={f.nextDue}
            onChange={e => set({ ...f, nextDue: e.target.value })}
          />
        </Field>
        <Field label="丕賱乇爻賵賲">
          <Input
            type="number"
            min="0"
            value={f.fees}
            onChange={e => set({ ...f, fees: e.target.value })}
          />
        </Field>
      </div>
      <Field label="賲賱丕丨馗丕鬲 丕賱賲毓丕賲賱丞">
        <Area
          value={f.notes}
          onChange={e => set({ ...f, notes: e.target.value })}
        />
      </Field>
    </Form>
  );
}
export default function Home() {
  const auth = useAuth();
  const cloudEnabled = Boolean(auth.user?.id);
  const snapshotQuery = trpc.smartSecurity.snapshot.useQuery(undefined, {
    enabled: cloudEnabled,
    staleTime: 0,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
  const cloudConnected =
    cloudEnabled && Boolean(snapshotQuery.data) && !snapshotQuery.isError;
  const saveMutation = trpc.smartSecurity.save.useMutation();
  const updateMutation = trpc.smartSecurity.update.useMutation();
  const deleteMutation = trpc.smartSecurity.delete.useMutation();
  const uploadMutation = trpc.smartSecurity.uploadImage.useMutation();
  const [path, setPath] = useLocation();
  const [s, setS] = React.useState<State>(load);
  const [modal, setModal] = React.useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = React.useState<Staff | null>(null);
  const [editingStaff, setEditingStaff] = React.useState<Staff | null>(null);
  const [editingRecord, setEditingRecord] = React.useState<{
    kind: "location" | "patrol";
    record: WorkLocation | Patrol;
  } | null>(null);
  const [targetStaffId, setTargetStaffId] = React.useState("");
  const [trashItems, setTrashItems] = React.useState<TrashItem[]>(() =>
    getTrashItems()
  );
  const [q, setQ] = React.useState("");
  const [patrolQ, setPatrolQ] = React.useState("");
  const [m, setM] = React.useState(month(day()));
  React.useEffect(() => {
    if (cloudEnabled && snapshotQuery.data)
      setS(current => cloudState(snapshotQuery.data, current.settings));
  }, [cloudEnabled, snapshotQuery.data]);
  React.useEffect(() => localStorage.setItem(key, JSON.stringify(s)), [s]);
  React.useEffect(() => {
    const refresh = () => setTrashItems(getTrashItems());
    window.addEventListener("smart-security-life-trash-bin-changed", refresh);
    return () =>
      window.removeEventListener(
        "smart-security-life-trash-bin-changed",
        refresh
      );
  }, []);
  const patch = (p: Partial<State>) => setS(x => ({ ...x, ...p }));
  const sec = path.startsWith("/security")
    ? "security"
    : path.startsWith("/finance")
      ? "finance"
      : path.startsWith("/debts")
        ? "debts"
        : path.startsWith("/education")
          ? "education"
          : path.startsWith("/vehicles")
            ? "vehicles"
            : path.startsWith("/reports")
              ? "reports"
              : path.startsWith("/settings")
                ? "settings"
                : "home";
  const tabQuery = new URLSearchParams(
    path.includes("?")
      ? path.slice(path.indexOf("?"))
      : typeof window === "undefined"
        ? ""
        : window.location.search
  ).get("tab");
  const financeTab =
    sec === "debts" || tabQuery === "debts" ? "debts" : "treasury";
  const net = s.entries.reduce(
    (a, x) => a + (x.type === "income" ? x.amount : -x.amount),
    0
  );
  const li = s.debts
    .filter(x => x.direction === "receivable")
    .reduce((a, x) => a + x.total - x.paid, 0);
  const ali = s.debts
    .filter(x => x.direction === "payable")
    .reduce((a, x) => a + x.total - x.paid, 0);
  const lessons = s.lessons.filter(x => month(x.date) === m);
  const close = () => {
    setModal(null);
    setEditingStaff(null);
    setEditingRecord(null);
    setTargetStaffId("");
  };
  const staff = s.staff.filter(x =>
    `${x.name} ${x.code || ""} ${x.branch} ${x.phone} ${x.nationalId || ""}`
      .toLowerCase()
      .includes(q.toLowerCase())
  );
  const licenseAlerts = s.staff.filter(
    x => x.licenseStatus !== "unlicensed" && dueWithinTwoMonths(x.licenseExpiry)
  );
  const vehicleAlerts = s.vehicles.filter(
    x => x.licenseStatus !== "unlicensed" && dueWithinTwoMonths(x.licenseExpiry)
  );
  const todayPlans = s.patrolPlans.filter(x => x.date === day());
  const futurePlans = s.patrolPlans
    .filter(x => x.date >= day())
    .sort((a, b) => a.date.localeCompare(b.date));
  const planMatches = filterPatrolPlans(futurePlans, patrolQ, s.staff, day());
  const cloudEntities = [
    "staff",
    "workLocations",
    "patrols",
    "patrolPlans",
    "entries",
    "debts",
    "children",
    "teachers",
    "lessons",
    "vehicles",
    "vehicleVisits",
  ] as const;
  type CloudEntity = (typeof cloudEntities)[number];
  const isCloudEntity = (key: keyof State): key is CloudEntity =>
    cloudEntities.includes(key as CloudEntity);
  const idPrefix = (key: CloudEntity) =>
    key === "staff"
      ? "staff"
      : key === "workLocations"
        ? "location"
        : key === "patrols"
          ? "patrol"
          : key === "patrolPlans"
            ? "plan"
            : key === "entries"
              ? "entry"
              : key === "debts"
                ? "debt"
                : key === "children"
                  ? "child"
                  : key === "teachers"
                    ? "teacher"
                    : key === "lessons"
                      ? "lesson"
                      : key === "vehicles"
                        ? "vehicle"
                        : "vehicle-visit";
  const add = async (
    k: keyof State,
    v: unknown,
    options?: { close?: boolean; silent?: boolean }
  ) => {
    const localRecord = { ...(v as Record<string, unknown>) };
    setS(
      current =>
        ({
          ...current,
          [k]: [...(current[k] as unknown[]), localRecord],
        }) as State
    );
    if (options?.close !== false) close();
    if (!cloudEnabled || !isCloudEntity(k)) {
      if (!options?.silent) toast.success("鬲賲 丨賮馗 丕賱爻噩賱 毓賱賶 賴匕丕 丕賱噩賴丕夭");
      return true;
    }
    try {
      const payload = { ...localRecord };
      delete payload.id;
      if (
        k === "staff" &&
        typeof payload.image === "string" &&
        payload.image.startsWith("data:")
      ) {
        const uploaded = await uploadMutation.mutateAsync({
          dataUrl: payload.image,
          folder: "staff",
        });
        payload.image = uploaded.url;
      }
      if (
        k === "patrols" &&
        typeof payload.photo === "string" &&
        payload.photo.startsWith("data:")
      ) {
        const uploaded = await uploadMutation.mutateAsync({
          dataUrl: payload.photo,
          folder: "patrols",
        });
        payload.photo = uploaded.url;
      }
      const result = await saveMutation.mutateAsync({ entity: k, payload });
      if (result.id) {
        setS(
          current =>
            ({
              ...current,
              [k]: (current[k] as Array<Record<string, unknown>>).map(item =>
                item.id === localRecord.id
                  ? { ...item, id: `${idPrefix(k)}-${result.id}` }
                  : item
              ),
            }) as State
        );
      }
      if (!options?.silent) toast.success("鬲賲 丨賮馗 丕賱爻噩賱 賵賲夭丕賲賳鬲賴 爻丨丕亘賷丕賸");
      return true;
    } catch (error) {
      console.error("[Smart Security Cloud Save]", error);
      if (!options?.silent)
        toast.warning(
          "鬲賲 丕賱丨賮馗 賲丨賱賷丕賸貙 賵爻鬲亘賯賶 丕賱亘賷丕賳丕鬲 毓賱賶 丕賱噩賴丕夭 丨鬲賶 鬲鬲賵賮乇 丕賱賲夭丕賲賳丞 丕賱爻丨丕亘賷丞"
        );
      return true;
    }
  };
  const cloudId = (value: string) =>
    /^(staff|location|patrol|plan|entry|debt|child|teacher|lesson|vehicle|vehicle-visit)-\d+$/.test(
      value
    )
      ? Number(value.split("-").pop())
      : null;
  const updateRecord = async (
    kind: "staff" | "location" | "patrol",
    record: Staff | WorkLocation | Patrol
  ) => {
    const keyMap = {
      staff: "staff",
      location: "workLocations",
      patrol: "patrols",
    } as const;
    const entity = keyMap[kind];
    setS(
      current =>
        ({
          ...current,
          [entity]: (current[entity] as Array<{ id: string }>).map(item =>
            item.id === record.id ? record : item
          ),
        }) as State
    );
    const databaseId = cloudId(record.id);
    if (!cloudEnabled || !databaseId) {
      toast.success("鬲賲 鬲毓丿賷賱 丕賱爻噩賱 毓賱賶 賴匕丕 丕賱噩賴丕夭");
      return true;
    }
    try {
      const payload = { ...(record as Record<string, unknown>) };
      delete payload.id;
      if (
        entity === "staff" &&
        typeof payload.image === "string" &&
        payload.image.startsWith("data:")
      ) {
        const uploaded = await uploadMutation.mutateAsync({
          dataUrl: payload.image,
          folder: "staff",
        });
        payload.image = uploaded.url;
      }
      if (
        entity === "patrols" &&
        typeof payload.photo === "string" &&
        payload.photo.startsWith("data:")
      ) {
        const uploaded = await uploadMutation.mutateAsync({
          dataUrl: payload.photo,
          folder: "patrols",
        });
        payload.photo = uploaded.url;
      }
      await updateMutation.mutateAsync({ entity, id: databaseId, payload });
      toast.success("鬲賲 鬲毓丿賷賱 丕賱爻噩賱 賵賲夭丕賲賳鬲賴 爻丨丕亘賷丕賸");
      return true;
    } catch (error) {
      console.error("[Smart Security Cloud Update]", error);
      toast.warning("鬲賲 丕賱鬲毓丿賷賱 賲丨賱賷丕賸貙 賵爻鬲鬲賲 丕賱賲夭丕賲賳丞 毓賳丿 鬲賵賮乇 丕賱丕鬲氐丕賱");
      return true;
    }
  };
  const deleteRecord = async (
    kind: "location" | "patrol",
    record: WorkLocation | Patrol
  ) => {
    const keyMap = { location: "workLocations", patrol: "patrols" } as const;
    const entity = keyMap[kind];
    moveToTrash({
      entityType: kind,
      entityLabel:
        kind === "location"
          ? `丕賳鬲賯丕賱: ${(record as WorkLocation).location}`
          : `賲乇賵乇: ${(record as Patrol).date}`,
      payload: { ...record },
    });
    setTrashItems(getTrashItems());
    setS(
      current =>
        ({
          ...current,
          [entity]: (current[entity] as Array<{ id: string }>).filter(
            item => item.id !== record.id
          ),
        }) as State
    );
    const databaseId = cloudId(record.id);
    if (!cloudEnabled || !databaseId) {
      toast.success("賳購賯賱 丕賱爻噩賱 廿賱賶 爻賱丞 丕賱賲丨匕賵賮丕鬲");
      return true;
    }
    try {
      await deleteMutation.mutateAsync({ entity, id: databaseId });
      toast.success("賳購賯賱 丕賱爻噩賱 廿賱賶 丕賱爻賱丞 賵賲購夭丕賲賳鬲賴 爻丨丕亘賷丕賸");
      return true;
    } catch (error) {
      console.error("[Smart Security Cloud Delete]", error);
      toast.warning("賳購賯賱 丕賱爻噩賱 賱賱爻賱丞 賲丨賱賷丕賸貙 賵鬲毓匕乇鬲 賲夭丕賲賳丞 丕賱丨匕賮 丨丕賱賷丕賸");
      return true;
    }
  };
  const deleteEntry = async (record: Entry) => {
    moveToTrash({
      entityType: "entry",
      entityLabel: `${record.type === "income" ? "廿賷乇丕丿" : "賲氐乇賵賮"}: ${record.category || "亘丿賵賳 鬲氐賳賷賮"}`,
      payload: { ...record },
    });
    setTrashItems(getTrashItems());
    setS(current => ({
      ...current,
      entries: current.entries.filter(item => item.id !== record.id),
    }));
    const databaseId = cloudId(record.id);
    if (!cloudEnabled || !databaseId) {
      toast.success("賳購賯賱鬲 丕賱丨乇賰丞 廿賱賶 爻賱丞 丕賱賲丨匕賵賮丕鬲");
      return true;
    }
    try {
      await deleteMutation.mutateAsync({ entity: "entries", id: databaseId });
      toast.success("賳購賯賱鬲 丕賱丨乇賰丞 廿賱賶 丕賱爻賱丞 賵賲購夭丕賲賳鬲賴丕 爻丨丕亘賷丕賸");
      return true;
    } catch (error) {
      console.error("[Smart Security Cloud Delete]", error);
      toast.warning("賳購賯賱鬲 丕賱丨乇賰丞 賱賱爻賱丞 賲丨賱賷丕賸貙 賵鬲毓匕乇鬲 賲夭丕賲賳丞 丕賱丨匕賮 丨丕賱賷丕賸");
      return true;
    }
  };
  const saveStaff = async (v: Staff) => {
    if (editingStaff) {
      await updateRecord("staff", v);
      setEditingStaff(null);
      setSelectedStaff(v);
      setModal(null);
      return;
    }
    await add("staff", v);
  };
  const saveBulkStaff = async (rows: BulkStaffRow[]) => {
    for (const row of rows) {
      await add(
        "staff",
        { ...row, phone: normalizeEgyptianWhatsAppPhone(row.phone) },
        { close: false, silent: true }
      );
    }
    toast.success(`鬲賲 丨賮馗 ${rows.length} 賮乇丿 兀賲賳 丿賮毓丞 賵丕丨丿丞`);
  };
  const saveTimeline = async (
    kind: "location" | "patrol",
    value: WorkLocation | Patrol
  ) => {
    if (editingRecord) {
      await updateRecord(kind, value);
      setEditingRecord(null);
      setModal(null);
      return;
    }
    const entity = kind === "location" ? "workLocations" : "patrols";
    await add(entity, value, { close: false });
    setModal(null);
    setTargetStaffId("");
  };
  const savePatrolImport = async (importRows: PatrolImportRow[]) => {
    let saved = 0;
    let skipped = 0;
    for (const row of importRows) {
      if (!row.date || !row.branch || !row.checkpoint) {
        skipped++;
        continue;
      }
      const matchedStaff = s.staff.find(
        x =>
          (row.staffCode &&
            normalizePatrolText(x.code) ===
              normalizePatrolText(row.staffCode)) ||
          (row.staffName &&
            normalizePatrolText(x.name) === normalizePatrolText(row.staffName))
      );
      const importedStaffNote = !matchedStaff
        ? [
            row.staffName ? `丕賱丨丕乇爻: ${row.staffName}` : "",
            row.staffCode ? `丕賱賰賵丿: ${row.staffCode}` : "",
          ]
            .filter(Boolean)
            .join(" 路 ")
        : "";
      const ok = await add(
        "patrolPlans",
        {
          id: id(),
          date: row.date,
          branch: row.branch,
          checkpoint: row.checkpoint,
          staffId: matchedStaff?.id || "",
          shift: row.shift,
          notes: [row.notes, importedStaffNote].filter(Boolean).join(" 路 "),
        },
        { close: false, silent: true }
      );
      if (ok) saved++;
    }
    return { saved, skipped };
  };
  const restoreTrashItem = async (item: TrashItem) => {
    const stateKey: Partial<Record<TrashEntityType, keyof State>> = {
      staff: "staff",
      location: "workLocations",
      patrol: "patrols",
      entry: "entries",
      cash: "entries",
      debt: "debts",
      child: "children",
      teacher: "teachers",
      lesson: "lessons",
      vehicle: "vehicles",
      "vehicle-visit": "vehicleVisits",
    };
    const keyToRestore = stateKey[item.entityType];
    if (!keyToRestore) {
      toast.error("賳賵毓 丕賱爻噩賱 丕賱賯丿賷賲 睾賷乇 賲丿毓賵賲 賱賱丕爻鬲毓丕丿丞");
      return false;
    }
    if (!item.payload || typeof item.payload !== "object") {
      toast.error("賱丕 鬲賵噩丿 亘賷丕賳丕鬲 氐丕賱丨丞 賱賴匕丕 丕賱爻噩賱");
      return false;
    }
    const payload = { ...(item.payload as Record<string, unknown>) };
    const ok = await add(keyToRestore, payload, { close: false, silent: true });
    if (ok) toast.success("鬲賲鬲 丕爻鬲毓丕丿丞 丕賱爻噩賱 亘賳噩丕丨");
    return ok;
  };
  const wipe = () => {
    if (confirm("丨匕賮 賰賱 亘賷丕賳丕鬲 賴匕丕 丕賱噩賴丕夭責")) {
      setS(empty);
      toast.success("鬲賲 鬲賳馗賷賮 丕賱亘賷丕賳丕鬲");
    }
  };
  const announceLicenses = () => {
    if (!licenseAlerts.length) {
      toast.success("賱丕 鬲賵噩丿 乇禺氐 賲爻鬲丨賯丞 賱賱鬲賳亘賷賴 丨丕賱賷丕賸");
      return;
    }
    const text = `鬲賳亘賷賴: 鬲賵噩丿 ${licenseAlerts.length} 乇禺氐丞 爻鬲賳鬲賴賷 禺賱丕賱 卮賴乇賷賳. ${licenseAlerts.map(x => x.name).join("貙 ")}`;
    toast.warning(text);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  };
  React.useEffect(() => {
    if (licenseAlerts.length)
      toast.warning(`賷賵噩丿 ${licenseAlerts.length} 鬲賳亘賷賴 乇禺氐丞 賷丨鬲丕噩 賲乇丕噩毓丞`);
  }, [licenseAlerts.length]);
  const home = (
    <div className="smart-home space-y-0">
      <section
        aria-labelledby="today-patrols"
        className="soft-card overflow-hidden"
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2
                  id="today-patrols"
                  className="text-2xl font-black text-teal-950"
                >
                  賰賱 丕賱賲乇賵乇 丕賱匕賷 爻賷鬲賲 禺賱丕賱 丕賱賷賵賲
                </h2>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-base font-black text-amber-800">
                  丕賱爻亘鬲貙 29 兀睾爻胤爻 2026
                </span>
              </div>
              <p className="mt-1 text-lg font-bold text-slate-500">
                噩丿賵賱 賲賵丕毓賷丿 丕賱賲乇賵乇 丕賱賲噩丿賵賱丞 賱噩賲賷毓 丕賱賮乇賵毓 丕賱賷賵賲
              </p>
            </div>
            <span className="rounded-full bg-teal-100 px-4 py-2 text-lg font-black text-teal-800">
              {todayPlans.length} 賲乇賵乇
            </span>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          {todayPlans.length ? (
            <table className="w-full min-w-[700px] text-right border-collapse">
              <thead>
                <tr className="border-b-2 border-teal-200 bg-teal-50/50">
                  <th className="p-4 text-xl font-black text-teal-800">#</th>
                  <th className="p-4 text-xl font-black text-teal-800">
                    丕賱賮乇毓
                  </th>
                  <th className="p-4 text-xl font-black text-teal-800">
                    賳賯胤丞 丕賱賲乇賵乇
                  </th>
                  <th className="p-4 text-xl font-black text-teal-800">
                    丕賱賮乇丿 丕賱賲賰賱賮
                  </th>
                  <th className="p-4 text-xl font-black text-teal-800">
                    丕賱賵乇丿賷丞
                  </th>
                  <th className="p-4 text-xl font-black text-teal-800">
                    賲賱丕丨馗丕鬲
                  </th>
                </tr>
              </thead>
              <tbody>
                {todayPlans.map((x, i) => (
                  <tr
                    key={x.id}
                    className="border-b border-slate-100 transition-colors hover:bg-teal-50/40"
                  >
                    <td className="p-4 text-lg font-bold text-slate-400">
                      {(i + 1).toLocaleString("ar-EG")}
                    </td>
                    <td className="p-4 text-lg font-black text-slate-900">
                      {x.branch}
                    </td>
                    <td className="p-4 text-lg font-bold text-slate-700">
                      {x.checkpoint || "睾賷乇 賲丨丿丿"}
                    </td>
                    <td className="p-4 text-lg font-bold text-slate-700">
                      {x.staffId
                        ? staff.find(y => y.id === x.staffId)?.name ||
                          "賮乇丿 睾賷乇 賲賵噩賵丿"
                        : "睾賷乇 賲丨丿丿"}
                    </td>
                    <td className="p-4 text-lg font-bold text-teal-700">
                      {x.shift === "morning"
                        ? "氐亘丕丨賷"
                        : x.shift === "evening"
                          ? "賲爻丕卅賷"
                          : "賱賷賱賷"}
                    </td>
                    <td className="p-4 text-lg font-bold text-slate-500">
                      {x.notes || "鈥�"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-lg font-bold text-slate-500">
                賱丕 賷賵噩丿 賲乇賵乇 賲噩丿賵賱 賱賱賷賵賲
              </p>
              <button
                onClick={() => setModal("patrolPlan")}
                className="mt-3 text-lg font-black text-teal-700 hover:underline"
              >
                廿囟丕賮丞 禺胤丞 賲乇賵乇
              </button>
            </div>
          )}
        </div>
      </section>
      <section
        className="soft-card flex flex-col gap-3 border border-emerald-200 bg-emerald-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-sm">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <p className="font-black text-emerald-950">
              賲鬲氐賱 鈥� 亘賷丕賳丕鬲賰 賲丨賮賵馗丞 賮賷 PostgreSQL
            </p>
            <p className="mt-1 text-xs font-bold leading-5 text-emerald-700">
              鬲購丨丿賾賻孬 丕賱爻噩賱丕鬲 鬲賱賯丕卅賷丕賸 亘賷賳 兀噩賴夭鬲賰貙 賲毓 亘賯丕亍 賳爻禺丞 丕丨鬲賷丕胤賷丞 賲丨賱賷丞
              毓賳丿 丕賱丨丕噩丞.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(key, JSON.stringify(s));
            toast.success("鬲賲 丨賮馗 賳爻禺丞 丕丨鬲賷丕胤賷丞 毓賱賶 丕賱噩賴丕夭");
          }}
          className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-black text-emerald-800 shadow-sm hover:bg-emerald-100"
        >
          丨賮馗 賳爻禺丞 丕丨鬲賷丕胤賷丞
        </button>
      </section>
      <section aria-labelledby="smart-quick-actions">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2
              id="smart-quick-actions"
              className="text-xl font-black text-teal-950"
            >
              廿噩乇丕亍丕鬲 爻乇賷毓丞
            </h2>
            <p className="mt-1 text-sm font-bold text-slate-500">
              丕亘丿兀 兀賴賲 毓賲賱賷丞 賲賳 賲賰丕賳 賵丕丨丿
            </p>
          </div>
          <span className="hidden rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-700 sm:inline">
            丕禺鬲氐丕乇丕鬲 賷賵賲賷丞
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <button
            onClick={() => setModal("staff")}
            className="quick-action group border-teal-200 bg-gradient-to-l from-teal-50 to-white text-teal-950"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-900/10">
              <Plus className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-base">廿囟丕賮丞 賮乇丿 兀賲賳</b>
              <small className="mt-1 block text-xs font-bold text-teal-700">
                賮鬲丨 爻噩賱 噩丿賷丿
              </small>
            </span>
            <ChevronLeft className="h-5 w-5 text-teal-600 transition group-hover:-translate-x-1" />
          </button>
          <button
            onClick={() => setModal("entry")}
            className="quick-action group border-amber-200 bg-gradient-to-l from-amber-50 to-white text-amber-950"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-900/10">
              <CircleDollarSign className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-base">鬲爻噩賷賱 丨乇賰丞 賲丕賱賷丞</b>
              <small className="mt-1 block text-xs font-bold text-amber-700">
                廿賷乇丕丿 兀賵 賲氐乇賵賮
              </small>
            </span>
            <ChevronLeft className="h-5 w-5 text-amber-600 transition group-hover:-translate-x-1" />
          </button>
          <button
            onClick={() => setModal("lesson")}
            className="quick-action group border-violet-200 bg-gradient-to-l from-violet-50 to-white text-violet-950"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-900/10">
              <GraduationCap className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-base">噩丿賵賱丞 丨氐丞</b>
              <small className="mt-1 block text-xs font-bold text-violet-700">
                賲鬲丕亘毓丞 鬲毓賱賷賲 丕賱兀亘賳丕亍
              </small>
            </span>
            <ChevronLeft className="h-5 w-5 text-violet-600 transition group-hover:-translate-x-1" />
          </button>
        </div>
      </section>
      <section aria-labelledby="smart-overview">
        <div className="mb-3">
          <h2 id="smart-overview" className="text-xl font-black text-teal-950">
            賳馗乇丞 爻乇賷毓丞
          </h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            兀乇賯丕賲 丕賱賷賵賲 賮賷 賱賲丨丞 賵丕丨丿丞
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(
            [
              [
                "兀賮乇丕丿 兀賲賳 賳卮胤賵賳",
                s.staff.filter(x => x.active).length,
                "爻噩賱 丕賱毓丕賲賱賷賳",
                ShieldCheck,
                "bg-teal-50 text-teal-700",
                "/security",
              ],
              [
                "氐丕賮賷 丕賱禺夭賷賳丞",
                cash(net),
                "廿賷乇丕丿丕鬲 賳丕賯氐 賲氐乇賵賮丕鬲",
                CircleDollarSign,
                "bg-amber-50 text-amber-700",
                "/finance",
              ],
              [
                "丕賱賲鬲亘賯賷 賲賳 丕賱丿賷賵賳",
                cash(li + ali),
                `賱賰 ${cash(li)} 路 毓賱賷賰 ${cash(ali)}`,
                WalletCards,
                "bg-violet-50 text-violet-700",
                "/debts",
              ],
            ] as Array<
              [
                string,
                string | number,
                string,
                React.ComponentType<{ className?: string }>,
                string,
                string,
              ]
            >
          ).map(([l, v, h, I, t, p]) => (
            <button
              key={String(l)}
              onClick={() => setPath(String(p))}
              className="overview-stat group soft-card flex min-h-32 items-center gap-3 p-4 text-right"
            >
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${t}`}
              >
                <I className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-black text-slate-500">
                  {l}
                </span>
                <strong className="mt-1 block truncate text-xl font-black text-slate-950">
                  {v}
                </strong>
                <span className="mt-1 block truncate text-[11px] font-bold text-slate-400">
                  {h}
                </span>
              </span>
              <ChevronLeft className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:-translate-x-1" />
            </button>
          ))}
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="soft-card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-black text-teal-950">
              兀賴賲 賲丕 鬲丨鬲丕噩賴 丕賱賷賵賲
            </h2>
            <p className="mt-1 text-sm font-bold text-slate-500">
              丕賱賵氐賵賱 丕賱爻乇賷毓 廿賱賶 丕賱兀賯爻丕賲 丕賱兀爻丕爻賷丞
            </p>
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            <button
              onClick={() => setPath("/security")}
              className="module-link"
            >
              <ShieldCheck className="h-5 w-5 text-teal-700" />
              <span>
                <b>廿丿丕乇丞 丕賱兀賲賳</b>
                <small>
                  {s.staff.length.toLocaleString("ar-EG")} 兀賮乇丕丿 賲爻噩賱賵賳
                </small>
              </span>
              <ChevronLeft className="mr-auto h-4 w-4 text-slate-300" />
            </button>
            <button
              onClick={() => setPath("/vehicles")}
              className="module-link"
            >
              <ReceiptText className="h-5 w-5 text-cyan-700" />
              <span>
                <b>賲乇賰亘丕鬲賷</b>
                <small>
                  {s.vehicles.length.toLocaleString("ar-EG")} 賲乇賰亘丕鬲 賮賷 丕賱爻噩賱
                </small>
              </span>
              <ChevronLeft className="mr-auto h-4 w-4 text-slate-300" />
            </button>
            <button
              onClick={() => setPath("/education")}
              className="module-link"
            >
              <BookOpenCheck className="h-5 w-5 text-violet-700" />
              <span>
                <b>丕賱兀亘賳丕亍 賵丕賱丿乇賵爻</b>
                <small>
                  {s.children.length.toLocaleString("ar-EG")} 兀亘賳丕亍 路{" "}
                  {lessons.length.toLocaleString("ar-EG")} 丨氐氐 賴匕丕 丕賱卮賴乇
                </small>
              </span>
              <ChevronLeft className="mr-auto h-4 w-4 text-slate-300" />
            </button>
            <button
              onClick={() => setPath("/security")}
              className="module-link"
            >
              <CalendarDays className="h-5 w-5 text-sky-700" />
              <span>
                <b>丕賱賲乇賵乇 丕賱卮賴乇賷</b>
                <small>
                  {todayPlans.length.toLocaleString("ar-EG")} 禺胤胤 賲噩丿賵賱丞 丕賱賷賵賲
                </small>
              </span>
              <ChevronLeft className="mr-auto h-4 w-4 text-slate-300" />
            </button>
          </div>
        </section>
        <section className="soft-card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-black text-teal-950">
              鬲賳亘賷賴丕鬲 丕賱賲鬲丕亘毓丞
            </h2>
            <p className="mt-1 text-sm font-bold text-slate-500">
              賲丐卮乇丕鬲 鬲丨鬲丕噩 賳馗乇丞 爻乇賷毓丞
            </p>
          </div>
          <div className="space-y-2 p-4 text-sm font-black">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-rose-900">
              <span>丿賷賵賳 賵丕噩亘丞 丕賱爻丿丕丿</span>
              <b>{cash(ali)}</b>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-900">
              <span>賲亘丕賱睾 賲爻鬲丨賯丞 賱賰</span>
              <b>{cash(li)}</b>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
              <span>丨氐氐 賴匕丕 丕賱卮賴乇</span>
              <b>{lessons.length.toLocaleString("ar-EG")}</b>
            </div>
            <div
              className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${licenseAlerts.length ? "bg-amber-50 text-amber-900" : "bg-teal-50 text-teal-800"}`}
            >
              <span>鬲賳亘賷賴丕鬲 丕賱乇禺氐</span>
              <b>{licenseAlerts.length.toLocaleString("ar-EG")}</b>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
  const securityExtras = (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="soft-card border-r-4 border-amber-400 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-black">鬲賳亘賷賴丕鬲 丕賱乇禺氐 賵丕賱賲毓丕卮</h3>
              <p className="mt-1 text-xs font-bold text-slate-500">
                鬲賳亘賷賴 賲亘賰乇 賯亘賱 丕賳鬲賴丕亍 丕賱乇禺氐丞 亘卮賴乇賷賳
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                {licenseAlerts.length}
              </span>
              <Button light onClick={announceLicenses}>
                <span aria-hidden="true">馃攰</span>鬲賳亘賷賴 氐賵鬲賷
              </Button>
            </div>
          </div>
          {licenseAlerts.length ? (
            <div className="mt-3 space-y-2">
              {licenseAlerts.map(x => (
                <div
                  key={x.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 p-3 text-sm font-black"
                >
                  <span>
                    {x.name} 路 {x.licenseNumber || "亘丿賵賳 乇賯賲 乇禺氐丞"}
                  </span>
                  <span className="text-amber-800">
                    鬲賳鬲賴賷 {dateText(x.licenseExpiry)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
              賱丕 鬲賵噩丿 乇禺氐 賲爻鬲丨賯丞 賱賱鬲賳亘賷賴 禺賱丕賱 丕賱卮賴乇賷賳 丕賱賯丕丿賲賷賳.
            </p>
          )}
          <p className="mt-3 text-xs font-bold text-slate-500">
            毓賳丿 賵噩賵丿 鬲賳亘賷賴貙 爻賷馗賴乇 氐賵鬲 丕賱鬲賳亘賷賴 賵丕賱乇爻丕賱丞 毓賳丿 賮鬲丨 賱賵丨丞 丕賱兀賲賳 亘毓丿
            鬲賮毓賷賱 丕賱廿卮毓丕乇丕鬲.
          </p>
        </div>
        <div className="soft-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-black">丕爻鬲毓賱丕賲 丕賱賲乇賵乇</h3>
              <p className="mt-1 text-xs font-bold text-slate-500">
                丕賰鬲亘 丕賱賷賵賲 兀賵 丕賱賮乇毓 兀賵 賳賯胤丞 丕賱賲乇賵乇
              </p>
            </div>
            <Button
              light
              onClick={() =>
                shareText(
                  (planMatches.length ? planMatches : todayPlans)
                    .map(
                      x =>
                        `賲乇賵乇 ${dateText(x.date)}: ${x.branch} - ${x.checkpoint} - ${x.shift === "morning" ? "氐亘丕丨賷" : x.shift === "evening" ? "賲爻丕卅賷" : "賱賷賱賷"}`
                    )
                    .join("\n") || "賱丕 鬲賵噩丿 賲賵丕毓賷丿 賲乇賵乇 賲爻噩賱丞"
                )
              }
            >
              賲卮丕乇賰丞
            </Button>
          </div>
          <Input
            className="mt-3"
            placeholder="賲孬丕賱: 丕賱賳賴丕乇丿賴貙 丨-007貙 賮乇毓 丕賱賲乇卮丿"
            value={patrolQ}
            onChange={e => setPatrolQ(e.target.value)}
          />
          <div className="mt-3 space-y-2">
            {(patrolQ ? planMatches : todayPlans).slice(0, 5).map(x => (
              <div
                key={x.id}
                className="rounded-2xl bg-teal-50 p-3 text-sm font-black text-teal-950"
              >
                <div className="flex justify-between gap-3">
                  <span>
                    {x.branch} 路 {x.checkpoint}
                  </span>
                  <span>{x.date === day() ? "丕賱賷賵賲" : dateText(x.date)}</span>
                </div>
                <p className="mt-1 text-xs font-bold text-teal-700">
                  {x.staffId
                    ? staff.find(y => y.id === x.staffId)?.name || "賮乇丿 賲丨丿丿"
                    : "賮乇丿 睾賷乇 賲丨丿丿"}{" "}
                  路{" "}
                  {x.shift === "morning"
                    ? "氐亘丕丨賷"
                    : x.shift === "evening"
                      ? "賲爻丕卅賷"
                      : "賱賷賱賷"}
                </p>
              </div>
            ))}
            {!(patrolQ ? planMatches : todayPlans).length && (
              <p className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-500">
                賱丕 鬲賵噩丿 賲賵丕毓賷丿 賲胤丕亘賯丞. 兀囟賮 禺胤丞 賲乇賵乇 賲賳 夭乇 芦賲乇賵乇禄.
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="soft-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black">禺胤丞 丕賱賲乇賵乇 丕賱卮賴乇賷丞</h3>
            <p className="mt-1 text-xs font-bold text-slate-500">
              {futurePlans.length} 賲賵毓丿 賯丕丿賲 賲丨賮賵馗 賵賯丕亘賱 賱賱賳爻禺 賵丕賱賲卮丕乇賰丞
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setModal("patrolPlan")}>
              <Plus className="h-4 w-4" />
              廿囟丕賮丞 禺胤丞
            </Button>
            <Button light onClick={() => setModal("patrolImport")}>
              <ClipboardCheck className="h-4 w-4" />
              賱氐賯 賰卮賮 丕賱卮賴乇
            </Button>
            <Button
              light
              onClick={() =>
                shareText(
                  futurePlans
                    .map(
                      x =>
                        `${dateText(x.date)} | ${x.branch} | ${x.checkpoint} | ${x.shift === "morning" ? "氐亘丕丨賷" : x.shift === "evening" ? "賲爻丕卅賷" : "賱賷賱賷"}`
                    )
                    .join("\n") || "賱丕 鬲賵噩丿 禺胤丞 賲乇賵乇 賲丨賮賵馗丞"
                )
              }
            >
              賳爻禺 / 賲卮丕乇賰丞 丕賱卮賴乇
            </Button>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {futurePlans.slice(0, 8).map(x => (
            <div
              key={x.id}
              className="rounded-2xl bg-slate-50 p-3 text-sm font-bold"
            >
              <div className="flex justify-between gap-2">
                <span className="font-black">
                  {dateText(x.date)} 路 {x.branch}
                </span>
                <span className="text-teal-700">
                  {x.shift === "morning"
                    ? "氐亘丕丨賷"
                    : x.shift === "evening"
                      ? "賲爻丕卅賷"
                      : "賱賷賱賷"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {x.checkpoint} 路{" "}
                {x.staffId
                  ? staff.find(y => y.id === x.staffId)?.name || "賮乇丿 睾賷乇 賲賵噩賵丿"
                  : "睾賷乇 賲丨丿丿"}
              </p>
            </div>
          ))}
          {!futurePlans.length && (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
              賱賲 賷鬲賲 丨賮馗 噩丿賵賱 賲乇賵乇 卮賴乇賷 亘毓丿.
            </p>
          )}
        </div>
      </div>
      <div className="soft-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-black">丕賱爻噩賱 丕賱賵馗賷賮賷 賵丕賱鬲賳賯賱丕鬲</h3>
            <p className="mt-1 text-xs font-bold text-slate-500">
              丕丨鬲賮馗 亘賰賱 賲賵賯毓 毓賲賱 賵鬲丕乇賷禺 丕賱丕賳鬲賯丕賱 賵丕賱爻亘亘
            </p>
          </div>
          <Button light onClick={() => setModal("workLocation")}>
            <Plus className="h-4 w-4" />
            廿囟丕賮丞 丕賳鬲賯丕賱
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {s.workLocations
            .slice()
            .reverse()
            .slice(0, 6)
            .map(x => (
              <div
                key={x.id}
                className="rounded-2xl bg-slate-50 p-3 text-sm font-bold"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-black">
                    {s.staff.find(y => y.id === x.staffId)?.name ||
                      "賮乇丿 睾賷乇 賲丨丿丿"}{" "}
                    路 {x.location}
                  </span>
                  <span className="text-slate-500">
                    賲賳 {dateText(x.fromDate)}
                    {x.toDate ? ` 廿賱賶 ${dateText(x.toDate)}` : " 路 丨丕賱賷"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {x.reason || "亘丿賵賳 爻亘亘 丕賳鬲賯丕賱"}
                  {x.notes ? ` 路 ${x.notes}` : ""}
                </p>
              </div>
            ))}
          {!s.workLocations.length && (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
              賱丕 賷賵噩丿 爻噩賱 丕賳鬲賯丕賱丕鬲 亘毓丿. 賲賰丕賳 丕賱毓賲賱 丕賱丨丕賱賷 賲丨賮賵馗 丿丕禺賱 賲賱賮 丕賱賮乇丿.
            </p>
          )}
        </div>
      </div>
    </>
  );
  const security = (
    <>
      <Title
        eyebrow="兀賲賳 丕賱賲賳卮丌鬲"
        title="丕賱兀賮乇丕丿 賵丕賱賲乇賵乇"
        desc="爻噩賱 兀賮乇丕丿 丕賱兀賲賳 賵丕賱鬲賳賯賱丕鬲 賵丕賱鬲賮鬲賷卮 丕賱賲賷丿丕賳賷."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setModal("staff")}>
              <Plus className="h-4 w-4" />
              賮乇丿 噩丿賷丿
            </Button>
            <Button light onClick={() => setModal("bulkStaff")}>
              <ClipboardPaste className="h-4 w-4" />
              亘賷丕賳 賲噩賲毓
            </Button>
            <Button
              light
              onClick={() =>
                print(
                  "賰卮賮 兀賮乇丕丿 丕賱兀賲賳",
                  s.staff.map(x => ({
                    丕賱丕爻賲: x.name,
                    丕賱賮乇毓: x.branch,
                    丕賱賴丕鬲賮: x.phone,
                    丕賱鬲乇禺賷氐:
                      x.licenseStatus === "licensed" ? "賲乇禺氐" : "睾賷乇 賲乇禺氐",
                    丕賳鬲賴丕亍_丕賱乇禺氐丞: x.licenseExpiry || "",
                    賲賰丕賳_丕賱毓賲賱: x.branch,
                    亘丿亍_丕賱賲賰丕賳: x.workStartDate || "",
                  }))
                )
              }
            >
              <Printer className="h-4 w-4" />
              PDF
            </Button>
            <Button
              light
              onClick={() =>
                csv(
                  "兀賮乇丕丿-丕賱兀賲賳.csv",
                  s.staff.map(x => ({
                    丕賱丕爻賲: x.name,
                    丕賱賰賵丿: x.code || "",
                    丕賱賮乇毓: x.branch,
                    丕賱賴丕鬲賮: x.phone,
                    丕賱丨丕賱丞: x.active ? "賳卮胤" : "賲賵賯賵賮",
                    丕賱鬲乇禺賷氐:
                      x.licenseStatus === "licensed" ? "賲乇禺氐" : "睾賷乇 賲乇禺氐",
                    乇賯賲_丕賱爻賱丕丨: x.weaponNumber || "",
                    乇賯賲_丕賱乇禺氐丞: x.licenseNumber || "",
                    丕賳鬲賴丕亍_丕賱乇禺氐丞: x.licenseExpiry || "",
                    賲賰丕賳_丕賱毓賲賱: x.branch,
                    亘丿亍_丕賱賲賰丕賳: x.workStartDate || "",
                  }))
                )
              }
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </div>
        }
      />
      <SecurityCommandCenter
        staff={s.staff}
        patrolPlans={s.patrolPlans}
        workLocations={s.workLocations}
        patrolQuery={patrolQ}
        onPatrolQueryChange={setPatrolQ}
        onSharePatrol={() =>
          shareText(
            planMatches
              .map(
                x => `${x.date} - ${x.branch} - ${x.checkpoint} - ${x.shift}`
              )
              .join("\n") || "賱丕 鬲賵噩丿 禺胤丞 賲乇賵乇 賲胤丕亘賯丞"
          )
        }
        onOpenStaff={item => {
          const full = s.staff.find(x => x.id === item.id);
          if (full) setSelectedStaff(full);
        }}
        onAddStaff={() => setModal("staff")}
        onBulkImport={() => setModal("bulkStaff")}
        onAddPatrol={() => setModal("patrol")}
        onAddPlan={() => setModal("patrolPlan")}
        onImportPlan={() => setModal("patrolImport")}
      />
      <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <div className="soft-card p-4">
          <Input
            placeholder="亘丨孬 亘丕賱丕爻賲 兀賵 丕賱賮乇毓"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <div className="mt-4 space-y-3">
            {staff.length ? (
              staff.map(x => (
                <div key={x.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-100 text-teal-700">
                      <UserRound className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black">{x.name}</h3>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-black ${x.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}
                        >
                          {x.active ? "賳卮胤" : "賲賵賯賵賮"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {x.branch}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <a
                          href={`tel:${x.phone}`}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-black text-teal-700"
                        >
                          <Phone className="ml-1 inline h-3.5 w-3.5" />
                          丕鬲氐丕賱
                        </a>
                        <a
                          href={`https://wa.me/${x.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl bg-white px-3 py-2 text-xs font-black text-emerald-700"
                        >
                          <Smartphone className="ml-1 inline h-3.5 w-3.5" />
                          賵丕鬲爻丕亘
                        </a>
                        <button
                          onClick={() => setSelectedStaff(x)}
                          className="rounded-xl bg-teal-100 px-3 py-2 text-xs font-black text-teal-800"
                        >
                          賮鬲丨 丕賱賲賱賮
                        </button>
                        <button
                          onClick={() =>
                            patch({
                              staff: s.staff.map(y =>
                                y.id === x.id ? { ...y, active: !y.active } : y
                              ),
                            })
                          }
                          className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-600"
                        >
                          鬲睾賷賷乇 丕賱丨丕賱丞
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Empty
                text="賱丕 鬲賵噩丿 爻噩賱丕鬲 兀賮乇丕丿 丨鬲賶 丕賱丌賳"
                action="廿囟丕賮丞 兀賵賱 賮乇丿"
                go={() => setModal("staff")}
              />
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="soft-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black">丕賱賲乇賵乇 賵丕賱鬲賮鬲賷卮</h3>
                <p className="text-xs font-bold text-slate-500">
                  {s.patrols.length} 爻噩賱 賲賷丿丕賳賷
                </p>
              </div>
              <Button onClick={() => setModal("patrol")}>
                <Plus className="h-4 w-4" />
                賲乇賵乇
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {s.patrols
                .slice(-4)
                .reverse()
                .map(x => (
                  <div
                    key={x.id}
                    className="rounded-xl bg-slate-50 p-3 text-xs font-bold"
                  >
                    <div className="flex justify-between">
                      <span>{x.branch}</span>
                      <span className="text-slate-400">{x.date}</span>
                    </div>
                    <p className="mt-1 text-slate-600">
                      {x.checkpoint || "賳賯胤丞 睾賷乇 賲丨丿丿丞"} 路{" "}
                      {x.notes || "亘丿賵賳 賲賱丕丨馗丕鬲"}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
  const debts = (
    <>
      <Title
        eyebrow="丿賮鬲乇 丕賱丿賷賵賳"
        title="賱賷賾 賵毓賱賷賾"
        desc="鬲丕亘毓 丕賱廿噩賲丕賱賷 賵丕賱賲丿賮賵毓 賵丕賱賲鬲亘賯賷 賵鬲丕乇賷禺 丕賱丕爻鬲丨賯丕賯."
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setModal("debt")}>
              <Plus className="h-4 w-4" />
              丿賷賳 噩丿賷丿
            </Button>
            <Button
              light
              onClick={() =>
                print(
                  "丿賮鬲乇 丕賱丿賷賵賳",
                  s.debts.map(x => ({
                    丕賱丕爻賲: x.name,
                    丕賱丕鬲噩丕賴: x.direction === "receivable" ? "賱賷" : "毓賱賷賾",
                    丕賱廿噩賲丕賱賷: cash(x.total),
                    丕賱賲丿賮賵毓: cash(x.paid),
                    丕賱賲鬲亘賯賷: cash(x.total - x.paid),
                    丕賱丕爻鬲丨賯丕賯: x.due,
                  }))
                )
              }
            >
              <Printer className="h-4 w-4" />
              PDF
            </Button>
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat
          label="賲亘丕賱睾 賱賷"
          value={cash(li)}
          icon={ArrowDownLeft}
          tone="bg-emerald-50 text-emerald-700"
        />
        <Stat
          label="丿賷賵賳 毓賱賷賾"
          value={cash(ali)}
          icon={ArrowUpRight}
          tone="bg-rose-50 text-rose-700"
        />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {s.debts.map(x => {
          const r = Math.max(0, x.total - x.paid);
          return (
            <div key={x.id} className="soft-card p-4">
              <div className="flex justify-between gap-2">
                <div>
                  <h3 className="font-black">{x.name}</h3>
                  <p
                    className={`mt-1 text-xs font-black ${x.direction === "receivable" ? "text-emerald-700" : "text-rose-700"}`}
                  >
                    {x.direction === "receivable" ? "賲亘賱睾 賱賷" : "丿賷賳 毓賱賷賾"} 路{" "}
                    {x.due || "亘丿賵賳 賲賵毓丿"}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black">
                  {r ? "賲賮鬲賵丨" : "鬲賲鬲 丕賱鬲爻賵賷丞"}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-slate-50 p-2">
                  <span>丕賱廿噩賲丕賱賷</span>
                  <b className="mt-1 block">{cash(x.total)}</b>
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  <span>丕賱賲丿賮賵毓</span>
                  <b className="mt-1 block">{cash(x.paid)}</b>
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  <span>丕賱賲鬲亘賯賷</span>
                  <b className="mt-1 block">{cash(r)}</b>
                </div>
              </div>
              {r > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const p = Number(prompt("賯賷賲丞 丕賱丿賮毓丞 丕賱噩夭卅賷丞") || 0);
                      if (!p) return;
                      const nextPaid = Math.min(x.total, x.paid + p);
                      await patch({
                        debts: s.debts.map(y =>
                          y.id === x.id ? { ...y, paid: nextPaid } : y
                        ),
                      });
                      const text = buildDebtReceiptText({
                        name: x.name,
                        paidAmount: p,
                        date: day(),
                        remaining: Math.max(0, x.total - nextPaid),
                      });
                      await navigator.clipboard.writeText(text);
                      toast.success("鬲賲 鬲爻噩賷賱 丕賱丿賮毓丞 賵賳爻禺 丕賱廿賷氐丕賱");
                    }}
                    className="rounded-2xl bg-teal-50 px-3 py-2.5 text-sm font-black text-teal-800"
                  >
                    鬲爻噩賷賱 丿賮毓丞 噩夭卅賷丞
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const text = buildDebtReceiptText({
                        name: x.name,
                        paidAmount: x.paid,
                        date: day(),
                        remaining: r,
                      });
                      await navigator.clipboard.writeText(text);
                      window.open(
                        buildWhatsAppShareUrl(text),
                        "_blank",
                        "noopener,noreferrer"
                      );
                      toast.success("鬲賲 賳爻禺 丕賱廿賷氐丕賱 賵賮鬲丨賴 賱賱賲卮丕乇賰丞 毓亘乇 賵丕鬲爻丕亘");
                    }}
                    className="rounded-2xl bg-emerald-600 px-3 py-2.5 text-sm font-black text-white"
                  >
                    賳爻禺 廿賷氐丕賱 丕賱爻丿丕丿
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {!s.debts.length && (
          <Empty
            text="丿賮鬲乇 丕賱丿賷賵賳 賮丕乇睾"
            action="廿囟丕賮丞 兀賵賱 丿賷賳"
            go={() => setModal("debt")}
          />
        )}
      </div>
    </>
  );
  const finance = (
    <>
      <Title
        eyebrow="丕賱賲丕賱賷丞"
        title="丕賱禺夭賷賳丞 丕賱賷賵賲賷丞"
        desc="丕賱廿賷乇丕丿丕鬲 賵丕賱賲氐乇賵賮丕鬲 賵氐丕賮賷 丕賱乇氐賷丿 賲毓 鬲氐丿賷乇 毓乇亘賷."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setModal("entry")}>
              <Plus className="h-4 w-4" />
              丨乇賰丞 噩丿賷丿丞
            </Button>
            <Button
              light
              onClick={() =>
                csv(
                  "丕賱鬲賯乇賷乇-丕賱賲丕賱賷.csv",
                  s.entries.map(x => ({
                    丕賱賳賵毓: x.type === "income" ? "廿賷乇丕丿" : "賲氐乇賵賮",
                    丕賱鬲氐賳賷賮: x.category,
                    丕賱賲亘賱睾: x.amount,
                    丕賱鬲丕乇賷禺: x.date,
                    丕賱亘賷丕賳: x.notes,
                  }))
                )
              }
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button
              light
              onClick={() =>
                print(
                  "丕賱鬲賯乇賷乇 丕賱賲丕賱賷",
                  s.entries.map(x => ({
                    丕賱賳賵毓: x.type === "income" ? "廿賷乇丕丿" : "賲氐乇賵賮",
                    丕賱鬲氐賳賷賮: x.category,
                    丕賱賲亘賱睾: cash(x.amount),
                    丕賱鬲丕乇賷禺: x.date,
                    丕賱亘賷丕賳: x.notes,
                  }))
                )
              }
            >
              <Printer className="h-4 w-4" />
              PDF
            </Button>
          </div>
        }
      />
      <Tabs
        value={financeTab}
        onValueChange={value =>
          setPath(value === "debts" ? "/finance?tab=debts" : "/finance")
        }
        className="gap-3"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
          <TabsTrigger
            value="treasury"
            className="rounded-xl py-2.5 text-sm font-black"
          >
            丕賱禺夭賷賳丞 賵丕賱丨乇賰丕鬲 丕賱賲丕賱賷丞
          </TabsTrigger>
          <TabsTrigger
            value="debts"
            className="rounded-xl py-2.5 text-sm font-black"
          >
            爻噩賱 丕賱丿賷賵賳 賵丕賱賲爻鬲丨賯丕鬲
          </TabsTrigger>
        </TabsList>
        <TabsContent value="treasury" className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="丕賱廿賷乇丕丿丕鬲"
              value={cash(
                s.entries
                  .filter(x => x.type === "income")
                  .reduce((a, x) => a + x.amount, 0)
              )}
              icon={ArrowDownLeft}
              tone="bg-emerald-50 text-emerald-700"
            />
            <Stat
              label="丕賱賲氐乇賵賮丕鬲"
              value={cash(
                s.entries
                  .filter(x => x.type === "expense")
                  .reduce((a, x) => a + x.amount, 0)
              )}
              icon={ArrowUpRight}
              tone="bg-rose-50 text-rose-700"
            />
            <Stat
              label="丕賱氐丕賮賷"
              value={cash(net)}
              icon={CircleDollarSign}
              tone="bg-teal-50 text-teal-700"
            />
          </div>
          <div className="soft-card mt-4 overflow-x-auto p-4">
            <table className="w-full min-w-[650px] text-right text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-black text-slate-500">
                  <th className="p-3">丕賱賳賵毓</th>
                  <th className="p-3">丕賱鬲氐賳賷賮</th>
                  <th className="p-3">丕賱賲亘賱睾</th>
                  <th className="p-3">丕賱鬲丕乇賷禺</th>
                  <th className="p-3">丕賱亘賷丕賳</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {s.entries
                  .slice()
                  .reverse()
                  .map(x => (
                    <tr
                      key={x.id}
                      className="border-b border-slate-50 font-bold"
                    >
                      <td className="p-3">
                        {x.type === "income" ? "廿賷乇丕丿" : "賲氐乇賵賮"}
                      </td>
                      <td className="p-3">{x.category}</td>
                      <td className="p-3">{cash(x.amount)}</td>
                      <td className="p-3 text-slate-500">{x.date}</td>
                      <td className="p-3 text-slate-500">{x.notes}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => void deleteEntry(x)}
                          aria-label={`丨匕賮 丕賱丨乇賰丞 ${x.category || "丕賱賲丕賱賷丞"}`}
                          className="text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!s.entries.length && (
              <Empty
                text="賱賲 鬲爻噩賱 丨乇賰丕鬲 賲丕賱賷丞 亘毓丿"
                action="鬲爻噩賷賱 兀賵賱 丨乇賰丞"
                go={() => setModal("entry")}
              />
            )}
          </div>
        </TabsContent>
        <TabsContent value="debts" className="space-y-3">
          {debts}
        </TabsContent>
      </Tabs>
    </>
  );
  const education = (
    <>
      <Title
        eyebrow="丕賱兀亘賳丕亍 賵丕賱丿乇賵爻"
        title="丕賱賲鬲丕亘毓丞 丕賱鬲毓賱賷賲賷丞"
        desc="賲賱賮丕鬲 丕賱兀亘賳丕亍 賵丕賱賲丿乇爻賷賳 賵噩丿賵賱 丕賱丨氐氐 賵鬲賰賱賮丞 賰賱 賲丕丿丞."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setModal("child")}>
              <Plus className="h-4 w-4" />
              丕亘賳 兀賵 丕亘賳丞
            </Button>
            <Button light onClick={() => setModal("teacher")}>
              <Plus className="h-4 w-4" />
              賲丿乇爻
            </Button>
            <Button
              light
              onClick={() =>
                csv(
                  "丨爻丕亘-丕賱丿乇賵爻.csv",
                  lessons.map(x => ({
                    丕賱丕亘賳: s.children.find(y => y.id === x.childId)?.name || "",
                    丕賱賲丕丿丞: x.subject,
                    丕賱鬲丕乇賷禺: x.date,
                    丕賱鬲賰賱賮丞: x.cost,
                    丕賱丨丕賱丞: x.status === "completed" ? "賲賰鬲賲賱丞" : "賲噩丿賵賱丞",
                  }))
                )
              }
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-4">
          <div className="soft-card p-4">
            <div className="flex justify-between">
              <h3 className="font-black">丕賱兀亘賳丕亍</h3>
              <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-black text-violet-800">
                {s.children.length}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {s.children.map(x => (
                <div key={x.id} className="rounded-2xl bg-violet-50 p-3">
                  <p className="font-black text-violet-950">{x.name}</p>
                  <p className="mt-1 text-xs font-bold text-violet-700">
                    {x.grade || "亘丿賵賳 氐賮"} 路 {x.school || "亘丿賵賳 賲丿乇爻丞"}
                  </p>
                </div>
              ))}
              {!s.children.length && (
                <Empty
                  text="兀囟賮 賲賱賮丕鬲 丕賱兀亘賳丕亍"
                  action="廿囟丕賮丞 丕亘賳"
                  go={() => setModal("child")}
                />
              )}
            </div>
          </div>
          <div className="soft-card p-4">
            <div className="flex justify-between">
              <h3 className="font-black">丕賱賲丿乇爻賵賳</h3>
              <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-black text-sky-800">
                {s.teachers.length}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {s.teachers.map(x => (
                <div
                  key={x.id}
                  className="flex justify-between rounded-2xl bg-sky-50 p-3"
                >
                  <div>
                    <p className="font-black text-sky-950">{x.name}</p>
                    <p className="mt-1 text-xs font-bold text-sky-700">
                      {x.subject} 路 {cash(x.cost)} 卮賴乇賷丕賸
                    </p>
                  </div>
                  {x.phone && (
                    <a
                      href={`https://wa.me/${x.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-white p-2 text-emerald-700"
                    >
                      <Smartphone className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="soft-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-black">噩丿賵賱 丕賱丨氐氐</h3>
              <p className="text-xs font-bold text-slate-500">
                {lessons.length} 丨氐丞 賮賷 丕賱卮賴乇
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                type="month"
                value={m}
                onChange={e => setM(e.target.value)}
                className="w-40"
              />
              <Button onClick={() => setModal("lesson")}>
                <Plus className="h-4 w-4" />
                丨氐丞
              </Button>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {lessons.map(x => (
              <div
                key={x.id}
                className="flex flex-col justify-between gap-2 rounded-2xl bg-slate-50 p-3 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-black">
                    {x.subject} 路{" "}
                    {s.children.find(y => y.id === x.childId)?.name || "丕亘賳"}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {x.date} 路{" "}
                    {s.teachers.find(y => y.id === x.teacherId)?.name ||
                      "亘丿賵賳 賲丿乇爻"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <b className="text-sm">{cash(x.cost)}</b>
                  <button
                    onClick={() =>
                      patch({
                        lessons: s.lessons.map(y =>
                          y.id === x.id
                            ? {
                                ...y,
                                status:
                                  y.status === "completed"
                                    ? "scheduled"
                                    : "completed",
                              }
                            : y
                        ),
                      })
                    }
                    className="rounded-xl bg-white px-3 py-2 text-xs font-black"
                  >
                    {x.status === "completed" ? "賲賰鬲賲賱丞" : "鬲丨丿賷丿 賰賲賰鬲賲賱丞"}
                  </button>
                </div>
              </div>
            ))}
            {!lessons.length && (
              <Empty
                text="賱丕 鬲賵噩丿 丨氐氐 賮賷 賴匕丕 丕賱卮賴乇"
                action="噩丿賵賱丞 兀賵賱 丨氐丞"
                go={() => setModal("lesson")}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
  const reports = (
    <>
      <Title
        eyebrow="丕賱鬲賯丕乇賷乇"
        title="丕賱鬲氐丿賷乇 賵丕賱胤亘丕毓丞"
        desc="鬲氐丿賷乇 賲賱賮丕鬲 CSV 賲鬲賵丕賮賯丞 賲毓 Excel 賵鬲賯丕乇賷乇 PDF 毓乇亘賷丞 賲賳爻賯丞."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(
          [
            [
              "賰卮賮 丕賱兀賲賳",
              ShieldCheck,
              s.staff.map(x => ({
                丕賱丕爻賲: x.name,
                丕賱賮乇毓: x.branch,
                丕賱賴丕鬲賮: x.phone,
                丕賱丨丕賱丞: x.active ? "賳卮胤" : "賲賵賯賵賮",
              })),
              "兀賮乇丕丿-丕賱兀賲賳.csv",
            ],
            [
              "丕賱鬲賯乇賷乇 丕賱賲丕賱賷",
              ReceiptText,
              s.entries.map(x => ({
                丕賱賳賵毓: x.type === "income" ? "廿賷乇丕丿" : "賲氐乇賵賮",
                丕賱鬲氐賳賷賮: x.category,
                丕賱賲亘賱睾: cash(x.amount),
                丕賱鬲丕乇賷禺: x.date,
                丕賱亘賷丕賳: x.notes,
              })),
              "丕賱鬲賯乇賷乇-丕賱賲丕賱賷.csv",
            ],
            [
              "丿賮鬲乇 丕賱丿賷賵賳",
              WalletCards,
              s.debts.map(x => ({
                丕賱丕爻賲: x.name,
                丕賱丕鬲噩丕賴: x.direction === "receivable" ? "賱賷" : "毓賱賷賾",
                丕賱廿噩賲丕賱賷: cash(x.total),
                丕賱賲丿賮賵毓: cash(x.paid),
                丕賱賲鬲亘賯賷: cash(x.total - x.paid),
              })),
              "丿賮鬲乇-丕賱丿賷賵賳.csv",
            ],
            [
              "丨爻丕亘 丕賱丿乇賵爻",
              GraduationCap,
              s.lessons.map(x => ({
                丕賱丕亘賳: s.children.find(y => y.id === x.childId)?.name || "",
                丕賱賲丕丿丞: x.subject,
                丕賱鬲丕乇賷禺: x.date,
                丕賱鬲賰賱賮丞: cash(x.cost),
                丕賱丨丕賱丞: x.status === "completed" ? "賲賰鬲賲賱丞" : "賲噩丿賵賱丞",
              })),
              "丨爻丕亘-丕賱丿乇賵爻.csv",
            ],
          ] as Array<
            [
              string,
              React.ComponentType<{ className?: string }>,
              Record<string, unknown>[],
              string,
            ]
          >
        ).map(([t, I, r, f]) => (
          <div key={String(t)} className="soft-card p-5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
              <I className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-black">{t}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              鬲賯乇賷乇 毓乇亘賷 賯丕亘賱 賱賱胤亘丕毓丞 賵丕賱鬲賳夭賷賱
            </p>
            <div className="mt-5 flex gap-2">
              <Button
                light
                onClick={() => csv(String(f), r as Record<string, unknown>[])}
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
              <Button
                onClick={() => print(String(t), r as Record<string, unknown>[])}
              >
                <Printer className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
  const settings = (
    <>
      <Title
        eyebrow="丕賱廿毓丿丕丿丕鬲"
        title="賴賵賷丞 丕賱鬲胤亘賷賯 賵丕賱亘賷丕賳丕鬲"
        desc="睾賷賾乇 丕爻賲 丕賱廿丿丕乇丞 賵丕賱賮乇毓 兀賵 乇丕噩毓 丕鬲氐丕賱 PostgreSQL 丕賱爻丨丕亘賷."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="soft-card space-y-4 p-5">
          <h3 className="text-lg font-black">亘賷丕賳丕鬲 丕賱賴賵賷丞</h3>
          <Field label="丕爻賲 丕賱廿丿丕乇丞">
            <Input
              value={s.settings.name}
              onChange={e =>
                patch({ settings: { ...s.settings, name: e.target.value } })
              }
            />
          </Field>
          <Field label="丕賱賮乇毓 丕賱丕賮鬲乇丕囟賷">
            <Input
              value={s.settings.branch}
              onChange={e =>
                patch({ settings: { ...s.settings, branch: e.target.value } })
              }
            />
          </Field>
        </div>
        <div className="soft-card p-5">
          <h3 className="text-lg font-black">廿丿丕乇丞 丕賱亘賷丕賳丕鬲</h3>
          <div
            className={`rounded-2xl border p-4 ${cloudConnected ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${cloudConnected ? "bg-emerald-500" : "bg-slate-400"}`}
                aria-hidden="true"
              />
              <strong
                className={
                  cloudConnected ? "text-emerald-900" : "text-slate-700"
                }
              >
                {cloudConnected
                  ? "賲鬲氐賱 亘丕賱爻丨丕亘丞 (PostgreSQL)"
                  : "噩丕乇賺 丕賱鬲丨賯賯 賲賳 丕鬲氐丕賱 PostgreSQL"}
              </strong>
            </div>
            <p
              className={`mt-2 text-sm font-semibold leading-7 ${cloudConnected ? "text-emerald-800" : "text-slate-600"}`}
            >
              {cloudConnected
                ? "鬲鬲賲 賲夭丕賲賳丞 丕賱亘賷丕賳丕鬲 鬲賱賯丕卅賷丕賸 亘賷賳 丕賱兀噩賴夭丞 賰賱 10 孬賵丕賳賺."
                : snapshotQuery.isError
                  ? "鬲毓匕乇 丕賱賵氐賵賱 廿賱賶 PostgreSQL 丨丕賱賷丕賸貨 爻鬲馗賱 丕賱亘賷丕賳丕鬲 丕賱丨丕賱賷丞 賲鬲丕丨丞 賲丨賱賷丕賸 丨鬲賶 毓賵丿丞 丕賱丕鬲氐丕賱."
                  : "噩丕乇賺 丕賱丕鬲氐丕賱 亘賯丕毓丿丞 丕賱亘賷丕賳丕鬲 丕賱爻丨丕亘賷丞鈥�"}
            </p>
          </div>
          <button
            onClick={wipe}
            className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700"
          >
            <Trash2 className="ml-2 inline h-4 w-4" />
            賲爻丨 亘賷丕賳丕鬲 丕賱噩賴丕夭
          </button>
        </div>
        <div className="soft-card p-5 lg:col-span-2">
          <TrashBinPanel
            items={trashItems}
            onChange={() => setTrashItems(getTrashItems())}
            onRestore={restoreTrashItem}
          />
        </div>
      </div>
    </>
  );
  const vehicleRows = s.vehicleVisits.map(v => {
    const car = s.vehicles.find(x => x.id === v.vehicleId);
    return {
      丕賱賲乇賰亘丞: car ? vehicleType(car.type, car.customType) : "",
      丕賱賱賵丨丞: car?.plate || "",
      丕賱鬲丕乇賷禺: v.date,
      丕賱賲毓丕賲賱丞: vehicleVisitKind(v.kind),
      丕賱賳鬲賷噩丞: v.result || "",
      丕賱鬲噩丿賷丿_丕賱賯丕丿賲: v.nextDue || "",
      丕賱乇爻賵賲: cash(v.fees),
      丕賱賲賱丕丨馗丕鬲: v.notes || "",
    };
  });
  const vehiclesPage = (
    <>
      <Title
        eyebrow="廿丿丕乇鬲賰 丕賱卮禺氐賷丞"
        title="賲乇賰亘丕鬲賷"
        desc="爻噩賱 爻賷丕乇鬲賰 兀賵 賲賵鬲賵爻賷賰賱賰 兀賵 丕賱鬲賵賰 鬲賵賰 賵賲毓丕賲賱丕鬲 丕賱賲乇賵乇 丕賱禺丕氐丞 亘賰 賮賯胤."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button light onClick={() => setModal("vehicleVisit")}>
              <Plus className="h-4 w-4" />
              鬲爻噩賷賱 賲毓丕賲賱丞 賲乇賵乇
            </Button>
            <Button onClick={() => setModal("vehicle")}>
              <Plus className="h-4 w-4" />
              廿囟丕賮丞 賲乇賰亘丞
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="廿噩賲丕賱賷 丕賱賲乇賰亘丕鬲"
          value={s.vehicles.length}
          icon={ReceiptText}
          tone="bg-teal-50 text-teal-700"
        />
        <Stat
          label="丕賱賲乇賰亘丕鬲 丕賱賲賲賱賵賰丞"
          value={s.vehicles.filter(x => x.ownership === "owned").length}
          icon={Check}
          tone="bg-emerald-50 text-emerald-700"
        />
        <Stat
          label="鬲賳亘賷賴丕鬲 丕賱乇禺氐"
          value={vehicleAlerts.length}
          icon={CalendarDays}
          tone="bg-amber-50 text-amber-700"
        />
      </div>
      {vehicleAlerts.length > 0 && (
        <div className="soft-card border-r-4 border-amber-400 bg-amber-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-black text-amber-950">鬲賳亘賷賴 賲乇賰亘丕鬲</h3>
              <p className="mt-1 text-sm font-bold text-amber-800">
                鬲賵噩丿 乇禺氐 爻鬲賳鬲賴賷 禺賱丕賱 卮賴乇賷賳貨 乇丕噩毓賴丕 賯亘賱 賲賵毓丿 丕賱鬲噩丿賷丿.
              </p>
            </div>
            <Button
              light
              onClick={() => {
                const t = `鬲賳亘賷賴: ${vehicleAlerts.length} 乇禺氐丞 賲乇賰亘丞 爻鬲賳鬲賴賷 禺賱丕賱 卮賴乇賷賳`;
                toast.warning(t);
                if ("speechSynthesis" in window)
                  window.speechSynthesis.speak(new SpeechSynthesisUtterance(t));
              }}
            >
              <span aria-hidden="true">馃攰</span>賯乇丕亍丞 丕賱鬲賳亘賷賴
            </Button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {vehicleAlerts.map(v => (
              <div
                key={v.id}
                className="rounded-2xl bg-white/75 p-3 text-sm font-black text-amber-950"
              >
                {vehicleType(v.type, v.customType)} 路 {v.plate || "亘丿賵賳 賱賵丨丞"}
                <span className="mr-2 text-amber-700">
                  鬲賳鬲賴賷 {dateText(v.licenseExpiry)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="soft-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black">丕賱賲乇賰亘丕鬲 丕賱賲爻噩賱丞</h3>
            <Button
              light
              onClick={() =>
                csv(
                  "賲乇賰亘丕鬲賷.csv",
                  s.vehicles.map(v => ({
                    丕賱賳賵毓: vehicleType(v.type, v.customType),
                    丕賱賲丕乇賰丞: v.make || "",
                    丕賱賲賵丿賷賱: v.model || "",
                    丕賱賱賵丨丞: v.plate || "",
                    丕賱賲賱賰賷丞:
                      v.ownership === "owned"
                        ? "賲賲賱賵賰丞"
                        : v.ownership === "sold"
                          ? "賲亘丕毓丞"
                          : "廿賷噩丕乇",
                    丕賱乇禺氐丞:
                      v.licenseStatus === "valid"
                        ? "爻丕乇賷丞"
                        : v.licenseStatus === "expired"
                          ? "賲賳鬲賴賷丞"
                          : v.licenseStatus === "withdrawn"
                            ? "賲爻丨賵亘丞"
                            : "亘丿賵賳 鬲乇禺賷氐",
                    丕賱丕賳鬲賴丕亍: v.licenseExpiry || "",
                  }))
                )
              }
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {s.vehicles.map(v => (
              <div
                key={v.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-teal-700">
                      {vehicleType(v.type, v.customType)}
                    </p>
                    <h4 className="mt-1 text-lg font-black text-slate-950">
                      {[v.make, v.model].filter(Boolean).join(" ") ||
                        "賲乇賰亘丞 亘丿賵賳 賵氐賮"}
                    </h4>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      丕賱賱賵丨丞: {v.plate || "睾賷乇 賲爻噩賱丞"} 路 丕賱賱賵賳:{" "}
                      {v.color || "睾賷乇 賲丨丿丿"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${v.licenseStatus === "valid" ? "bg-emerald-100 text-emerald-800" : v.licenseStatus === "withdrawn" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}
                  >
                    {v.licenseStatus === "valid"
                      ? "丕賱乇禺氐丞 爻丕乇賷丞"
                      : v.licenseStatus === "expired"
                        ? "丕賱乇禺氐丞 賲賳鬲賴賷丞"
                        : v.licenseStatus === "withdrawn"
                          ? "丕賱乇禺氐丞 賲爻丨賵亘丞"
                          : "亘丿賵賳 鬲乇禺賷氐"}
                  </span>
                </div>
                <p className="mt-3 text-xs font-bold text-slate-500">
                  卮乇丕亍: {dateText(v.purchaseDate)} 路 亘賷毓: {dateText(v.saleDate)}{" "}
                  路 乇賯賲 丕賱乇禺氐丞: {v.licenseNumber || "睾賷乇 賲丨丿丿"}
                </p>
              </div>
            ))}
            {!s.vehicles.length && (
              <Empty
                text="賱賲 鬲購爻噩賱 賲乇賰亘丕鬲 卮禺氐賷丞 亘毓丿."
                action="廿囟丕賮丞 兀賵賱 賲乇賰亘丞"
                go={() => setModal("vehicle")}
              />
            )}
          </div>
        </div>
        <div className="soft-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black">爻噩賱 丕賱賲乇賵乇 賵丕賱賮丨氐</h3>
            <Button
              light
              onClick={() => print("爻噩賱 賲毓丕賲賱丕鬲 賲乇賰亘丕鬲賷", vehicleRows)}
            >
              <Printer className="h-4 w-4" />
              PDF
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {s.vehicleVisits
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .map(v => (
                <div key={v.id} className="rounded-2xl bg-teal-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-black text-teal-950">
                        {vehicleVisitKind(v.kind)} 路{" "}
                        {s.vehicles.find(x => x.id === v.vehicleId)?.plate ||
                          "賲乇賰亘丞"}
                      </h4>
                      <p className="mt-1 text-xs font-bold text-teal-700">
                        {dateText(v.date)} 路 {v.result || "亘丿賵賳 賳鬲賷噩丞 賲爻噩賱丞"}
                      </p>
                    </div>
                    <b className="text-sm text-teal-800">{cash(v.fees)}</b>
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-600">
                    丕賱鬲噩丿賷丿 丕賱賯丕丿賲: {dateText(v.nextDue)}
                    {v.notes ? ` 路 ${v.notes}` : ""}
                  </p>
                </div>
              ))}
            {!s.vehicleVisits.length && (
              <Empty
                text="賱丕 鬲賵噩丿 賲毓丕賲賱丕鬲 賲乇賵乇 賲丨賮賵馗丞."
                action="鬲爻噩賷賱 兀賵賱 賲毓丕賲賱丞"
                go={() => setModal("vehicleVisit")}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
  let content =
    sec === "security"
      ? security
      : sec === "finance" || sec === "debts"
        ? finance
        : sec === "education"
          ? education
          : sec === "vehicles"
            ? vehiclesPage
            : sec === "reports"
              ? reports
              : sec === "settings"
                ? settings
                : home;
  const syncStatus = !cloudEnabled
    ? {
        text: "賵囟毓 賲丨賱賷 賲丐賯鬲 鈥� 爻噩賾賱 丕賱丿禺賵賱 賱鬲賮毓賷賱 丕賱賲夭丕賲賳丞 亘賷賳 丕賱兀噩賴夭丞",
        className: "bg-amber-50 text-amber-900",
      }
    : snapshotQuery.isError
      ? {
          text: "鬲毓匕乇 丕賱丕鬲氐丕賱 亘賯丕毓丿丞 PostgreSQL 鈥� 丕賱亘賷丕賳丕鬲 丕賱丨丕賱賷丞 賲鬲丕丨丞 賲丨賱賷丕賸 賲丐賯鬲丕賸",
          className: "bg-rose-50 text-rose-900",
        }
      : cloudConnected
        ? {
            text: "賲鬲氐賱 亘丕賱爻丨丕亘丞 (PostgreSQL) 鈥� 丕賱賲夭丕賲賳丞 丕賱鬲賱賯丕卅賷丞 賮毓丕賱丞 賰賱 10 孬賵丕賳賺",
            className: "bg-emerald-50 text-emerald-900",
          }
        : {
            text: "噩丕乇賺 丕賱丕鬲氐丕賱 亘丕賱爻丨丕亘丞 (PostgreSQL)鈥�",
            className: "bg-sky-50 text-sky-900",
          };
  return (
    <div dir="rtl" className="mx-auto w-full max-w-7xl px-1 space-y-2">
      <div
        role="status"
        aria-live="polite"
        className={`rounded-2xl px-4 py-3 text-sm font-black ${syncStatus.className}`}
      >
        {syncStatus.text}
      </div>
      {content}
      {selectedStaff && !modal && (
        <Modal
          title={`賲賱賮 ${selectedStaff.name}`}
          close={() => setSelectedStaff(null)}
          wide
        >
          <StaffProfilePanel
            staff={selectedStaff}
            locations={s.workLocations}
            patrols={s.patrols}
            onClose={() => setSelectedStaff(null)}
            onEditStaff={() => {
              setEditingStaff(selectedStaff);
              setModal("staff");
            }}
            onAddLocation={() => {
              setTargetStaffId(selectedStaff.id);
              setModal("workLocation");
            }}
            onAddPatrol={() => {
              setTargetStaffId(selectedStaff.id);
              setModal("patrol");
            }}
            onEditRecord={(kind, record) => {
              setEditingRecord({ kind, record });
              setModal(kind === "location" ? "workLocation" : kind);
            }}
            onDeleteRecord={(kind, record) => deleteRecord(kind, record)}
            onPrint={() =>
              print(`賲賱賮 賮乇丿 丕賱兀賲賳 鈥� ${selectedStaff.name}`, [
                {
                  丕賱丕爻賲: selectedStaff.name,
                  丕賱賰賵丿: selectedStaff.code || "",
                  丕賱賮乇毓: selectedStaff.branch,
                  丕賱賴丕鬲賮: selectedStaff.phone,
                  丕賱乇賯賲_丕賱賯賵賲賷: selectedStaff.nationalId || "",
                  鬲丕乇賷禺_丕賱鬲毓賷賷賳: selectedStaff.hireDate,
                  丕賱丨丕賱丞: selectedStaff.active ? "賳卮胤" : "賲賵賯賵賮",
                },
                ...s.workLocations
                  .filter(x => x.staffId === selectedStaff.id)
                  .map(x => ({
                    丕賱爻噩賱: "丕賳鬲賯丕賱 賵馗賷賮賷",
                    丕賱鬲丕乇賷禺: x.fromDate,
                    丕賱鬲賮丕氐賷賱: `${x.location}${x.toDate ? ` 廿賱賶 ${x.toDate}` : ""} ${x.reason || ""}`,
                  })),
                ...s.patrols
                  .filter(x => x.staffId === selectedStaff.id)
                  .map(x => ({
                    丕賱爻噩賱: "賲乇賵乇 賵鬲賮鬲賷卮",
                    丕賱鬲丕乇賷禺: x.date,
                    丕賱鬲賮丕氐賷賱: `${x.branch} 路 ${x.checkpoint} 路 ${x.notes || ""}`,
                  })),
              ])
            }
          />
        </Modal>
      )}
      {modal && (
        <Modal
          title={
            modal === "staff"
              ? editingStaff
                ? "鬲毓丿賷賱 亘賷丕賳丕鬲 賮乇丿 兀賲賳"
                : "廿囟丕賮丞 賮乇丿 兀賲賳"
              : modal === "vehicle"
                ? "廿囟丕賮丞 賲乇賰亘丞 卮禺氐賷丞"
                : modal === "vehicleVisit"
                  ? "鬲爻噩賷賱 賲毓丕賲賱丞 賲乇賵乇 賱賲乇賰亘鬲賷"
                  : modal === "workLocation"
                    ? "廿囟丕賮丞 丕賳鬲賯丕賱 賵馗賷賮賷"
                    : modal === "patrolPlan"
                      ? "禺胤丞 賲乇賵乇 卮賴乇賷丞"
                      : modal === "patrolImport"
                        ? "賱氐賯 賰卮賮 丕賱賲乇賵乇 丕賱卮賴乇賷"
                        : modal === "patrol"
                          ? "鬲爻噩賷賱 賲乇賵乇 賵鬲賮鬲賷卮"
                          : modal === "entry"
                            ? "丨乇賰丞 賲丕賱賷丞"
                            : modal === "debt"
                              ? "廿囟丕賮丞 丿賷賳"
                              : modal === "child"
                                ? "廿囟丕賮丞 丕亘賳 兀賵 丕亘賳丞"
                                : modal === "teacher"
                                  ? "廿囟丕賮丞 賲丿乇爻"
                                  : "噩丿賵賱丞 丨氐丞"
          }
          close={close}
        >
          {modal === "staff" && (
            <StaffForm save={saveStaff} initial={editingStaff || undefined} />
          )}{" "}
          {modal === "bulkStaff" && (
            <BulkStaffImportPanel onSave={saveBulkStaff} close={close} />
          )}{" "}
          {modal === "vehicle" && (
            <VehicleForm save={v => add("vehicles", v)} />
          )}{" "}
          {modal === "vehicleVisit" && (
            <VehicleVisitForm
              vehicles={s.vehicles}
              save={v => add("vehicleVisits", v)}
            />
          )}{" "}
          {modal === "workLocation" && (
            <WorkLocationForm
              staff={s.staff}
              initial={
                editingRecord?.kind === "location"
                  ? (editingRecord.record as WorkLocation)
                  : targetStaffId
                    ? {
                        id: "",
                        staffId: targetStaffId,
                        location: "",
                        fromDate: day(),
                        toDate: "",
                        reason: "",
                        notes: "",
                      }
                    : undefined
              }
              save={v => saveTimeline("location", v)}
            />
          )}{" "}
          {modal === "patrolPlan" && (
            <PatrolPlanForm staff={s.staff} save={v => add("patrolPlans", v)} />
          )}{" "}
          {modal === "patrolImport" && (
            <PatrolImportPanel
              staff={s.staff}
              onSave={savePatrolImport}
              close={close}
            />
          )}{" "}
          {modal === "patrol" && (
            <PatrolForm
              staff={s.staff}
              initial={
                editingRecord?.kind === "patrol"
                  ? (editingRecord.record as Patrol)
                  : targetStaffId
                    ? {
                        id: "",
                        staffId: targetStaffId,
                        branch: "",
                        date: day(),
                        checkpoint: "",
                        notes: "",
                        photo: "",
                      }
                    : undefined
              }
              save={v => saveTimeline("patrol", v)}
            />
          )}{" "}
          {modal === "entry" && <EntryForm save={v => add("entries", v)} />}{" "}
          {modal === "debt" && <DebtForm save={v => add("debts", v)} />}{" "}
          {modal === "child" && <ChildForm save={v => add("children", v)} />}{" "}
          {modal === "teacher" && (
            <TeacherForm save={v => add("teachers", v)} />
          )}{" "}
          {modal === "lesson" && (
            <LessonForm
              childrenList={s.children}
              teachers={s.teachers}
              save={v => add("lessons", v)}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
