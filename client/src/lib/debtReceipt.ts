export type DebtReceiptInput = {
  name: string;
  paidAmount: number;
  date?: string;
  remaining: number;
};

const money = (value: number) => Number(value || 0).toLocaleString("ar-EG", { maximumFractionDigits: 2 });

export function buildDebtReceiptText(input: DebtReceiptInput) {
  const remaining = Math.max(0, Number(input.remaining || 0));
  const date = input.date || new Date().toLocaleDateString("ar-EG");
  return [
    "📄 مستند إثبات سداد",
    `الاسم: ${input.name}`,
    `المبلغ المسدد: ${money(input.paidAmount)} ج.م`,
    `تاريخ السداد: ${date}`,
    `المبلغ المتبقي: ${money(remaining)} ج.م`,
    `الحالة: ${remaining === 0 ? "خالص" : "متبقي"}`,
  ].join("\n");
}

export function buildWhatsAppShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
