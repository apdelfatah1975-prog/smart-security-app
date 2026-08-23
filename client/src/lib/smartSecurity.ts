export type LicenseAlertLevel = "none" | "soon" | "expired";

export function getLicenseAlertLevel(value?: string, now = new Date()): LicenseAlertLevel {
  if (!value) return "none";
  const expiry = new Date(`${value}T23:59:59`);
  if (Number.isNaN(expiry.getTime())) return "none";
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (expiry < today) return "expired";
  const limit = new Date(today);
  limit.setMonth(limit.getMonth() + 2);
  return expiry <= limit ? "soon" : "none";
}

export function calculateFinancialTotals(entries: Array<{ type: "income" | "expense"; amount: number }>) {
  const income = entries.reduce((sum, entry) => sum + (entry.type === "income" ? entry.amount : 0), 0);
  const expenses = entries.reduce((sum, entry) => sum + (entry.type === "expense" ? entry.amount : 0), 0);
  return { income, expenses, net: income - expenses };
}

export function calculateMonthlyAttendance(
  records: Array<{ date: string; status: string; hours: number }>,
  targetMonth: string,
) {
  const monthRecords = records.filter(record => record.date.startsWith(targetMonth));
  const present = monthRecords.filter(record => record.status === "present").length;
  const absent = monthRecords.filter(record => record.status === "absent").length;
  const excused = monthRecords.filter(record => record.status === "excused").length;
  const hours = monthRecords.reduce((sum, record) => sum + (Number.isFinite(record.hours) ? record.hours : 0), 0);
  return { total: monthRecords.length, present, absent, excused, hours };
}

export function buildPatrolShareText(
  plans: Array<{ date: string; branch: string; checkpoint: string; shift: string; staffName?: string }>,
  formatDate = (value: string) => value,
) {
  const rows = plans
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(plan => `${formatDate(plan.date)} — ${plan.branch} — ${plan.checkpoint} — ${plan.shift}${plan.staffName ? ` — ${plan.staffName}` : ""}`);
  return ["جدول المرور الشهري — الإدارة الذكية", ...rows].join("\n");
}

export function daysUntil(value?: string, now = new Date()) {
  if (!value) return null;
  const expiry = new Date(`${value}T12:00:00`);
  if (Number.isNaN(expiry.getTime())) return null;
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
}
