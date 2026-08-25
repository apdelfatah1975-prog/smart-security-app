export type BulkStaffRow = {
  id: string;
  code: string;
  name: string;
  phone: string;
  nationalId: string;
  branch: string;
  birthDate: string;
  governorate: string;
  hireDate: string;
  active: boolean;
  shift: "morning" | "evening" | "night";
  emergencyPhone: string;
  image: string;
  notes: string;
  licenseStatus: "licensed" | "unlicensed";
  weaponNumber: string;
  licenseNumber: string;
  licenseExpiry: string;
  retirementDate: string;
};

const governorates: Record<string, string> = {
  "01": "القاهرة", "02": "الإسكندرية", "03": "بورسعيد", "04": "السويس", "11": "دمياط",
  "12": "الدقهلية", "13": "الشرقية", "14": "القليوبية", "15": "كفر الشيخ", "16": "الغربية",
  "17": "المنوفية", "18": "البحيرة", "19": "الإسماعيلية", "21": "الجيزة", "22": "بني سويف",
  "23": "الفيوم", "24": "المنيا", "25": "أسيوط", "26": "سوهاج", "27": "قنا", "28": "أسوان",
  "29": "الأقصر", "31": "البحر الأحمر", "32": "الوادي الجديد", "33": "مطروح", "34": "شمال سيناء",
  "35": "جنوب سيناء", "88": "خارج الجمهورية"
};

const clean = (value: unknown) => String(value ?? "").trim().replace(/^['"]|['"]$/g, "");
const digits = (value: unknown) => clean(value).replace(/\D/g, "");
const id = () => `staff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function nationalIdDetails(value: string) {
  const n = digits(value);
  if (!/^([23])\d{13}$/.test(n)) return { birthDate: "", governorate: "", retirementDate: "" };
  const century = n[0] === "2" ? 1900 : 2000;
  const birth = new Date(century + Number(n.slice(1, 3)), Number(n.slice(3, 5)) - 1, Number(n.slice(5, 7)));
  if (Number.isNaN(birth.getTime()) || birth.getDate() !== Number(n.slice(5, 7))) return { birthDate: "", governorate: "", retirementDate: "" };
  const birthDate = birth.toISOString().slice(0, 10);
  const retirement = new Date(birth);
  retirement.setFullYear(retirement.getFullYear() + 60);
  return { birthDate, governorate: governorates[n.slice(7, 9)] || "غير محددة", retirementDate: retirement.toISOString().slice(0, 10) };
}

export function parseBulkStaff(text: string): BulkStaffRow[] {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  return lines.flatMap((line, index) => {
    const columns = line.split(/\t+|\s*[,،;|]\s*|\s+-\s+/).map(clean);
    if (!columns.length || /^(?:الاسم|name)(?:\s|$)/i.test(columns[0])) return [];
    const nationalIndex = columns.findIndex(column => /^\d{14}$/.test(digits(column)));
    const nationalId = nationalIndex >= 0 ? digits(columns[nationalIndex]) : digits(columns[1]);
    const phoneIndex = columns.findIndex(column => /^(?:\+?20|0)?1\d{9,10}$/.test(digits(column)) && digits(column) !== nationalId);
    const phone = phoneIndex >= 0 ? digits(columns[phoneIndex]) : digits(columns[2] || "");
    const branch = columns.find((column, i) => i !== nationalIndex && i !== phoneIndex && /فرع|شونة|مطوبس|فوه|برمبال|القومسيون|أبودراز|قبريط|الجزيرة|المرشد|السالمية/i.test(column)) || columns[3] || "";
    const details = nationalIdDetails(nationalId);
    return [{ id: id() + index, code: "", name: columns[0], phone, nationalId, branch, ...details, hireDate: "", active: true, shift: "morning", emergencyPhone: "", image: "", notes: "", licenseStatus: "unlicensed", weaponNumber: "", licenseNumber: "", licenseExpiry: "", retirementDate: details.retirementDate }];
  });
}
