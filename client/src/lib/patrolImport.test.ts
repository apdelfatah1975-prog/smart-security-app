import { describe, expect, it } from "vitest";
import { filterPatrolPlans, normalizePatrolText, parsePatrolClipboard, parsePatrolDate } from "./patrolImport";

describe("patrol import parser", () => {
  it("parses an Arabic tab-separated Excel schedule and normalizes Arabic digits", () => {
    const result = parsePatrolClipboard([
      "التاريخ\tكود الحارس\tاسم الحارس\tالفرع\tنقطة المرور\tالوردية\tملاحظات",
      "١٥/٠٨/٢٠٢٦\tح-٠٠٧\tأحمد حسن\tفرع المعادي\tالبوابة الرئيسية\tمسائي\tالتأكد من السجل",
    ].join("\n"));

    expect(result.hasHeader).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.rows).toEqual([{
      rowNumber: 2,
      date: "2026-08-15",
      staffName: "أحمد حسن",
      staffCode: "ح-007",
      branch: "فرع المعادي",
      checkpoint: "البوابة الرئيسية",
      shift: "evening",
      notes: "التأكد من السجل",
    }]);
  });

  it("parses a WhatsApp-style unheaded line with dash separators", () => {
    const result = parsePatrolClipboard("١٥-٨-٢٠٢٦ - ح-٠٠٧ - فرع المعادي - البوابة الرئيسية - مرور مسائي");

    expect(result.hasHeader).toBe(false);
    expect(result.rows[0]).toMatchObject({
      date: "2026-08-15",
      staffCode: "ح-007",
      branch: "فرع المعادي",
      checkpoint: "البوابة الرئيسية",
      shift: "evening",
    });
  });

  it("accepts ISO dates and Arabic month names, but rejects impossible dates", () => {
    expect(parsePatrolDate("2026/08/15")).toBe("2026-08-15");
    expect(parsePatrolDate("15 أغسطس 2026")).toBe("2026-08-15");
    expect(parsePatrolDate("31/02/2026")).toBeNull();
  });

  it("keeps incomplete rows in the preview and reports actionable issues", () => {
    const result = parsePatrolClipboard([
      "التاريخ\tالفرع\tنقطة المرور",
      "ليس تاريخاً\tفرع أكتوبر\tالبوابة",
      "١٦/٠٨/٢٠٢٦\t\t",
    ].join("\n"));

    expect(result.rows).toHaveLength(2);
    expect(result.issues.some(issue => issue.rowNumber === 2 && issue.reason.includes("التاريخ"))).toBe(true);
    expect(result.issues.some(issue => issue.rowNumber === 3 && issue.reason.includes("الفرع"))).toBe(true);
  });
});

describe("patrol plan filtering", () => {
  const plans = [
    { id: "1", date: "2026-08-24", branch: "فرع المعادي", checkpoint: "البوابة الرئيسية", staffId: "staff-7", shift: "morning", notes: "تفتيش" },
    { id: "2", date: "2026-08-25", branch: "فرع أكتوبر", checkpoint: "المخزن", staffId: "staff-8", shift: "night", notes: "" },
  ];
  const staff = [{ id: "staff-7", name: "أحمد حسن", code: "ح-007" }, { id: "staff-8", name: "محمود علي", code: "ح-008" }];

  it("answers the today question and searches by guard code", () => {
    expect(filterPatrolPlans(plans, "النهارده", staff, "2026-08-24").map(plan => plan.id)).toEqual(["1"]);
    expect(filterPatrolPlans(plans, "ح-008", staff, "2026-08-24").map(plan => plan.id)).toEqual(["2"]);
  });

  it("normalizes Arabic search text consistently", () => {
    expect(normalizePatrolText("أحمد ـ حسن")).toBe("احمدحسن");
  });
});
