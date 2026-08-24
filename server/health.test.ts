import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("minimal health endpoint", () => {
  it("registers GET /api/health with the lightweight ok payload", () => {
    const source = readFileSync(path.resolve(import.meta.dirname, "_core/index.ts"), "utf8");
    expect(source).toContain('app.get("/api/health"');
    expect(source).toContain('res.status(200).json({ status: "ok" })');
  });
});
