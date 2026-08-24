export type EgyptianNationalIdDetails = {
  nationalId: string;
  birthDate: string;
  age: number;
  retirementDate: string;
};

const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
const easternArabicDigits = "۰۱۲۳۴۵۶۷۸۹";

export function normalizeNationalId(value: string): string {
  return value
    .split("")
    .map(char => {
      const arabicIndex = arabicDigits.indexOf(char);
      if (arabicIndex >= 0) return String(arabicIndex);
      const easternIndex = easternArabicDigits.indexOf(char);
      return easternIndex >= 0 ? String(easternIndex) : char;
    })
    .join("")
    .replace(/\D/g, "");
}

function isValidDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function formatDate(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function calculateAge(birthDate: string, today = new Date()): number {
  const birth = new Date(`${birthDate}T00:00:00Z`);
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const birthdayPassed =
    today.getUTCMonth() > birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() >= birth.getUTCDate());
  if (!birthdayPassed) age -= 1;
  return Math.max(0, age);
}

export function parseEgyptianNationalId(value: string, today = new Date()): EgyptianNationalIdDetails | null {
  const nationalId = normalizeNationalId(value);
  if (nationalId.length !== 14 || !["2", "3"].includes(nationalId[0])) return null;

  const century = nationalId[0] === "2" ? 1900 : 2000;
  const year = century + Number(nationalId.slice(1, 3));
  const month = Number(nationalId.slice(3, 5));
  const day = Number(nationalId.slice(5, 7));
  if (!isValidDate(year, month, day)) return null;

  const birthDate = formatDate(year, month, day);
  return {
    nationalId,
    birthDate,
    age: calculateAge(birthDate, today),
    retirementDate: formatDate(year + 60, month, day),
  };
}
