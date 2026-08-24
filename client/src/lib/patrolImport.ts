export type PatrolImportRow = {
  rowNumber: number;
  date: string;
  staffName: string;
  staffCode: string;
  branch: string;
  checkpoint: string;
  shift: "morning" | "evening" | "night" | "off";
  notes: string;
};

export type PatrolImportIssue = {
  rowNumber: number;
  reason: string;
};

export type PatrolImportResult = {
  rows: PatrolImportRow[];
  issues: PatrolImportIssue[];
  hasHeader: boolean;
};

type PatrolColumn = keyof Omit<PatrolImportRow, "rowNumber">;

const columnAliases: Record<PatrolColumn, string[]> = {
  date: ["التاريخ", "تاريخ المرور", "اليوم", "date", "patrol date", "day"],
  staffName: ["فرد الأمن", "اسم فرد الأمن", "الحارس", "اسم الحارس", "الفرد", "الاسم", "staff", "guard", "name"],
  staffCode: ["كود الفرد", "كود الحارس", "كود الأمن", "الكود", "كود", "staff code", "guard code", "code"],
  branch: ["الفرع", "المقر", "مكان العمل", "الموقع", "الجهة", "branch", "site", "location"],
  checkpoint: ["نقطة المرور", "نقطة التفتيش", "النقطة", "المرور على", "نقطة", "checkpoint", "patrol point"],
  shift: ["الوردية", "الفترة", "الشيفت", "shift", "period"],
  notes: ["ملاحظات", "البيان", "تفاصيل", "notes", "remark", "remarks"],
};

const shiftAliases: Record<PatrolImportRow["shift"], string[]> = {
  morning: ["صباحي", "صباح", "الفترة الصباحية", "morning", "am"],
  evening: ["مسائي", "مساء", "الفترة المسائية", "evening", "pm"],
  night: ["ليلي", "ليل", "الفترة الليلية", "night"],
  off: ["راحة", "اجازة", "إجازة", "off", "休"],
};

const arabicMonths: Record<string, number> = {
  يناير: 1,
  فبراير: 2,
  مارس: 3,
  ابريل: 4,
  أبريل: 4,
  مايو: 5,
  يونيو: 6,
  يوليو: 7,
  اغسطس: 8,
  أغسطس: 8,
  سبتمبر: 9,
  اكتوبر: 10,
  أكتوبر: 10,
  نوفمبر: 11,
  ديسمبر: 12,
};

function toAsciiDigits(value: string): string {
  return value.replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06f0));
}

export function normalizePatrolText(value: unknown): string {
  return toAsciiDigits(String(value ?? ""))
    .normalize("NFKC")
    .toLocaleLowerCase("ar-EG")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ـ\u200B\uFEFF]/g, "")
    .replace(/[\s_\-:/\\]+/g, "")
    .trim();
}

function cleanCell(value: unknown): string {
  return toAsciiDigits(String(value ?? "")).replace(/[\u200B\uFEFF]/g, "").trim();
}

function matchesAlias(value: string, aliases: string[]): boolean {
  const normalized = normalizePatrolText(value);
  return Boolean(normalized) && aliases.some(alias => {
    const candidate = normalizePatrolText(alias);
    return normalized === candidate || normalized.includes(candidate) || candidate.includes(normalized);
  });
}

function parseMonthDate(dayText: string, monthText: string, yearText: string): string | null {
  const dayNumber = Number(toAsciiDigits(dayText));
  const monthNumber = Number(toAsciiDigits(monthText)) || arabicMonths[normalizePatrolText(monthText)];
  let yearNumber = Number(toAsciiDigits(yearText));
  if (yearNumber < 100) yearNumber += yearNumber >= 70 ? 1900 : 2000;
  if (!Number.isInteger(dayNumber) || !Number.isInteger(monthNumber) || !Number.isInteger(yearNumber) || monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > 31) return null;
  const date = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber));
  return date.getUTCFullYear() === yearNumber && date.getUTCMonth() === monthNumber - 1 && date.getUTCDate() === dayNumber
    ? `${yearNumber.toString().padStart(4, "0")}-${monthNumber.toString().padStart(2, "0")}-${dayNumber.toString().padStart(2, "0")}`
    : null;
}

export function parsePatrolDate(value: unknown): string | null {
  const text = cleanCell(value);
  if (!text) return null;
  const normalized = toAsciiDigits(text).replace(/[،]/g, "/").replace(/[.]/g, "/");
  const iso = normalized.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return parseMonthDate(iso[3], iso[2], iso[1]);
  const numeric = normalized.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (numeric) return parseMonthDate(numeric[1], numeric[2], numeric[3]);
  const named = normalized.match(/(\d{1,2})\s+([^\d\s]+)\s+(\d{2,4})/);
  if (named) return parseMonthDate(named[1], named[2], named[3]);
  if (!/\d{4}/.test(normalized) || !/[a-z]/i.test(normalized)) return null;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear().toString().padStart(4, "0")}-${(parsed.getMonth() + 1).toString().padStart(2, "0")}-${parsed.getDate().toString().padStart(2, "0")}`;
}

function splitLine(line: string): string[] {
  const cleaned = line.replace(/^\s*(?:[-*•]+|\d+[.)-])\s*/, "").trim();
  if (!cleaned) return [];
  if (/\t/.test(cleaned)) return cleaned.split(/\t+/).map(cleanCell);
  if (/[|؛;]/.test(cleaned)) return cleaned.split(/[|؛;]/).map(cleanCell).filter(Boolean);
  if (/\s(?:-|–|—)\s/.test(cleaned)) return cleaned.split(/\s+(?:-|–|—)\s+/).map(cleanCell).filter(Boolean);
  return [cleaned];
}

function detectHeader(cells: string[]): Map<PatrolColumn, number> {
  const map = new Map<PatrolColumn, number>();
  const normalizedCells = cells.map(normalizePatrolText);
  (Object.keys(columnAliases) as PatrolColumn[]).forEach(key => {
    const exactIndex = normalizedCells.findIndex(cell => columnAliases[key].some(alias => cell === normalizePatrolText(alias)));
    const fuzzyIndex = exactIndex >= 0 ? exactIndex : cells.findIndex(cell => matchesAlias(cell, columnAliases[key]));
    if (fuzzyIndex >= 0 && !Array.from(map.values()).includes(fuzzyIndex)) map.set(key, fuzzyIndex);
  });
  return map;
}

function parseShift(value: string): PatrolImportRow["shift"] | null {
  const text = normalizePatrolText(value);
  if (!text) return null;
  return (Object.entries(shiftAliases).find(([, aliases]) => aliases.some(alias => normalizePatrolText(alias) === text || text.includes(normalizePatrolText(alias))))?.[0] as PatrolImportRow["shift"] | undefined) ?? null;
}

function extractStaffCode(value: string): string {
  const text = cleanCell(value);
  const labelled = text.match(/(?:كود|code)\s*[:#-]?\s*([A-Za-z\u0600-\u06FF0-9][A-Za-z\u0600-\u06FF0-9 _\/-]{0,15})/i)?.[1];
  if (labelled) return labelled.trim().replace(/[ _]+/g, "-");
  const code = text.match(/(?:^|\s)([A-Za-z\u0600-\u06FF]{1,4}[ _-]?\d{1,8}|\d{2,8})(?:\s|$)/)?.[1];
  return code ? code.trim().replace(/[ _]+/g, "-") : "";
}

function removeDateFromText(text: string, date: string | null): string {
  if (!date) return text;
  const [year, month, day] = date.split("-");
  const patterns = [
    new RegExp(`${day}[\\/-]0?${month}[\\/-]${year}`, "g"),
    new RegExp(`${year}[\\/-]0?${month}[\\/-]0?${day}`, "g"),
  ];
  return patterns.reduce((current, pattern) => current.replace(pattern, ""), text).replace(/^\s*[-–—|:]+\s*|\s*[-–—|:]+\s*$/g, "").trim();
}

function parseUnheadedLine(cells: string[], line: string, rowNumber: number, issues: PatrolImportIssue[]): PatrolImportRow | null {
  const dateMatch = toAsciiDigits(line).match(/(?:\d{4}[/-]\d{1,2}[/-]\d{1,2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+(?:يناير|فبراير|مارس|ابريل|أبريل|مايو|يونيو|يوليو|اغسطس|أغسطس|سبتمبر|اكتوبر|أكتوبر|نوفمبر|ديسمبر)\s+\d{2,4})/i);
  const date = parsePatrolDate(dateMatch?.[0] ?? cells[0]);
  if (!date) {
    issues.push({ rowNumber, reason: "لم أتعرف على تاريخ المرور؛ استخدم يوم/شهر/سنة أو سنة-شهر-يوم." });
    return null;
  }
  const shiftCell = cells.find(cell => parseShift(cell));
  const shift = parseShift(shiftCell ?? "") ?? "morning";
  const withoutDate = dateMatch ? removeDateFromText(line, date) : cells.slice(1).join(" | ");
  const rawParts = dateMatch && cells.length === 1 ? splitLine(withoutDate) : cells.slice(parsePatrolDate(cells[0]) ? 1 : 0);
  const useful = rawParts.map(cleanCell).filter(Boolean).filter(part => !parsePatrolDate(part) && !parseShift(part));
  if (useful.length < 2) {
    issues.push({ rowNumber, reason: "يجب أن يتضمن الصف مكان العمل ونقطة المرور على الأقل." });
    return null;
  }
  const staffCell = useful[0] ?? "";
  const staffCode = extractStaffCode(staffCell) || extractStaffCode(useful.join(" "));
  const staffName = staffCode ? staffCell.replace(staffCode, "").replace(/\b(?:كود|code)\b\s*[:#-]?/i, "").trim() : staffCell;
  const branch = useful[1] ?? "";
  const checkpoint = useful[2] ?? useful[1] ?? "";
  const notes = useful.slice(3).join(" | ");
  if (!staffName && !staffCode) issues.push({ rowNumber, reason: "لم يتم تحديد اسم أو كود فرد الأمن؛ يمكنك استكماله في المعاينة." });
  return { rowNumber, date, staffName, staffCode, branch, checkpoint, shift, notes };
}

export function parsePatrolClipboard(text: string): PatrolImportResult {
  const lines = String(text ?? "").replace(/\r/g, "").split("\n").map(line => line.trim()).filter(Boolean);
  if (!lines.length) return { rows: [], issues: [{ rowNumber: 1, reason: "لم يتم لصق أي بيانات." }], hasHeader: false };
  const matrix = lines.map(splitLine).filter(cells => cells.length);
  const headerMap = detectHeader(matrix[0]);
  const hasHeader = headerMap.size >= 2 && (headerMap.has("date") || headerMap.has("branch") || headerMap.has("checkpoint"));
  const rows: PatrolImportRow[] = [];
  const issues: PatrolImportIssue[] = [];
  if (hasHeader) {
    if (!headerMap.has("date")) issues.push({ rowNumber: 1, reason: "لم يتم العثور على عمود التاريخ." });
    if (!headerMap.has("branch") && !headerMap.has("checkpoint")) issues.push({ rowNumber: 1, reason: "لم يتم العثور على عمود الفرع أو نقطة المرور." });
    matrix.slice(1).forEach((cells, offset) => {
      const rowNumber = offset + 2;
      const value = (key: PatrolColumn) => cleanCell(cells[headerMap.get(key) ?? -1]);
      const date = parsePatrolDate(value("date"));
      const branch = value("branch");
      const checkpoint = value("checkpoint");
      if (!date && !branch && !checkpoint) return;
      if (!date) issues.push({ rowNumber, reason: "التاريخ ناقص أو غير صالح." });
      if (!branch && !checkpoint) issues.push({ rowNumber, reason: "الفرع ونقطة المرور ناقصان." });
      const shift = parseShift(value("shift")) ?? "morning";
      if (value("shift") && !parseShift(value("shift"))) issues.push({ rowNumber, reason: "الوردية غير معروفة؛ تم اعتماد صباحي ويمكن تعديلها." });
      rows.push({ rowNumber, date: date ?? "", staffName: value("staffName"), staffCode: extractStaffCode(value("staffCode")) || value("staffCode"), branch, checkpoint, shift, notes: value("notes") });
    });
  } else {
    matrix.forEach((cells, offset) => {
      const parsed = parseUnheadedLine(cells, lines[offset], offset + 1, issues);
      if (parsed) rows.push(parsed);
    });
  }
  return { rows, issues, hasHeader };
}

export type PatrolStaffLookup = { id: string; name?: string; code?: string };
export type PatrolPlanLike = { id: string; date: string; branch: string; checkpoint: string; staffId?: string; shift: string; notes?: string };

export function patrolPlanSearchText(plan: PatrolPlanLike, staff: PatrolStaffLookup[] = []): string {
  const assigned = plan.staffId ? staff.find(item => item.id === plan.staffId) : undefined;
  return [plan.date, plan.branch, plan.checkpoint, plan.shift, plan.notes, assigned?.name, assigned?.code].filter(Boolean).join(" ");
}

export function filterPatrolPlans(plans: PatrolPlanLike[], query: string, staff: PatrolStaffLookup[] = [], today = new Date().toISOString().slice(0, 10)): PatrolPlanLike[] {
  const normalizedQuery = normalizePatrolText(query);
  if (!normalizedQuery) return plans;
  const asksForToday = /(اليوم|النهارده|النهار|today)/i.test(query);
  const searchQuery = normalizedQuery.replace(/اليوم|النهارده|النهار|today/g, "");
  return plans.filter(plan => {
    if (asksForToday && plan.date !== today) return false;
    if (!searchQuery) return true;
    return normalizePatrolText(patrolPlanSearchText(plan, staff)).includes(searchQuery);
  });
}
