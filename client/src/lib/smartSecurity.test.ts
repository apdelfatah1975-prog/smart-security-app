import { describe, expect, it } from "vitest";
import { buildPatrolShareText, calculateFinancialTotals, calculateMonthlyAttendance, daysUntil, getLicenseAlertLevel } from "./smartSecurity";

describe("smart security helpers", () => {
  it("classifies license expiry within two months and expired dates", () => {
    const now = new Date("2026-08-24T10:00:00");
    expect(getLicenseAlertLevel("2026-10-10", now)).toBe("soon");
    expect(getLicenseAlertLevel("2026-08-01", now)).toBe("expired");
    expect(getLicenseAlertLevel("2027-01-01", now)).toBe("none");
    expect(daysUntil("2026-08-30", now)).toBe(6);
  });

  it("calculates income, expenses, and net balance", () => {
    expect(calculateFinancialTotals([
      { type: "income", amount: 12000 },
      { type: "expense", amount: 2500 },
      { type: "income", amount: 800 },
    ])).toEqual({ income: 12800, expenses: 2500, net: 10300 });
  });

  it("summarizes attendance for a selected month", () => {
    expect(calculateMonthlyAttendance([
      { date: "2026-08-01", status: "present", hours: 8 },
      { date: "2026-08-02", status: "absent", hours: 0 },
      { date: "2026-08-03", status: "excused", hours: 4 },
      { date: "2026-09-01", status: "present", hours: 8 },
    ], "2026-08")).toEqual({ total: 3, present: 1, absent: 1, excused: 1, hours: 12 });
  });

  it("builds a stable Arabic patrol schedule for sharing", () => {
    const text = buildPatrolShareText([
      { date: "2026-08-29", branch: "الفرع الثاني", checkpoint: "البوابة", shift: "مسائي", staffName: "أحمد" },
      { date: "2026-08-24", branch: "الفرع الأول", checkpoint: "المخزن", shift: "صباحي" },
    ], value => `تاريخ ${value}`);
    expect(text).toContain("جدول المرور الشهري — الإدارة الذكية");
    expect(text.indexOf("2026-08-24")).toBeLessThan(text.indexOf("2026-08-29"));
    expect(text).toContain("الفرع الثاني — البوابة — مسائي — أحمد");
  });
});
