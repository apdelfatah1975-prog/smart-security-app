import { describe, expect, it } from "vitest";
import { parseClientId } from "./routers/smartSecurity";

describe("smart security cloud sync identifiers", () => {
  it("converts prefixed client identifiers to PostgreSQL ids", () => {
    expect(parseClientId("staff-12")).toBe(12);
    expect(parseClientId("child-7")).toBe(7);
    expect(parseClientId(31)).toBe(31);
  });

  it("rejects empty, zero, negative, and malformed identifiers", () => {
    expect(parseClientId("")).toBeNull();
    expect(parseClientId("staff-temp")).toBeNull();
    expect(parseClientId(0)).toBeNull();
    expect(parseClientId(-4)).toBeNull();
    expect(parseClientId(null)).toBeNull();
  });
});
