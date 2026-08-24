import { describe, expect, it } from "vitest";
import { normalizeNationalId, parseEgyptianNationalId } from "./egyptianNationalId";

describe("Egyptian national ID parser", () => {
  it("normalizes Arabic digits and extracts birth and retirement dates", () => {
    const details = parseEgyptianNationalId("٢٨٥٠١٠١١٢٣٤٥٦٧", new Date("2026-08-24T00:00:00Z"));
    expect(details).toEqual({
      nationalId: "28501011234567",
      birthDate: "1985-01-01",
      age: 41,
      retirementDate: "2045-01-01",
    });
  });

  it("calculates age before the birthday correctly", () => {
    const details = parseEgyptianNationalId("٣٠٠١٢٠٥١٢٣٤٥٦٧", new Date("2026-01-24T00:00:00Z"));
    expect(details?.birthDate).toBe("2000-12-05");
    expect(details?.age).toBe(25);
  });

  it("rejects malformed or impossible dates", () => {
    expect(parseEgyptianNationalId("28502321234567")).toBeNull();
    expect(parseEgyptianNationalId("12345678901234")).toBeNull();
    expect(parseEgyptianNationalId("2850101")).toBeNull();
  });

  it("keeps only normalized numeric characters", () => {
    expect(normalizeNationalId(" ٢٨٥٠١٠١-١٢٣٤٥٦٧ ")).toBe("28501011234567");
  });
});
