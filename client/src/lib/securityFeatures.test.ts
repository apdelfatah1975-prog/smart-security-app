import { describe, expect, it } from "vitest";
import { buildDebtReceiptText, buildWhatsAppShareUrl } from "./debtReceipt";
import { nationalIdDetails, parseBulkStaff } from "./bulkStaffImport";

describe("security feature helpers", () => {
  it("builds an Arabic debt receipt and WhatsApp share URL", () => {
    const text = buildDebtReceiptText({
      name: "أحمد علي",
      paidAmount: 500,
      date: "2026-08-25",
      remaining: 250,
    });

    expect(text).toContain("📄 مستند إثبات سداد");
    expect(text).toContain("الاسم: أحمد علي");
    expect(text).toContain("المبلغ المسدد: ٥٠٠ ج.م");
    expect(text).toContain("المبلغ المتبقي: ٢٥٠ ج.م");
    expect(text).toContain("الحالة: متبقي");
    expect(buildWhatsAppShareUrl(text)).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });

  it("extracts birth and retirement dates from a valid Egyptian national ID", () => {
    expect(nationalIdDetails("29901010101234")).toEqual({
      birthDate: "1999-01-01",
      governorate: "القاهرة",
      retirementDate: "2059-01-01",
    });
  });

  it("parses pasted staff rows and keeps derived identity fields", () => {
    const rows = parseBulkStaff("الاسم - الرقم القومي - الهاتف - الفرع\nمحمد حسن - 29901010101234 - 01012345678 - فرع مطوبس");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: "محمد حسن",
      nationalId: "29901010101234",
      phone: "01012345678",
      branch: "فرع مطوبس",
      birthDate: "1999-01-01",
      governorate: "القاهرة",
      retirementDate: "2059-01-01",
      active: true,
    });
  });
});
