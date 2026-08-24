import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readProjectFile = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

describe("تجهيز PWA الإدارة الذكية", () => {
  it("يستخدم manifest عربي مستقل للتطبيق الرئيسي", () => {
    const manifest = JSON.parse(readProjectFile("../public/manifest.json")) as {
      id: string;
      start_url: string;
      scope: string;
      short_name: string;
      dir: string;
    };

    expect(manifest.id).toBe("/smart-security-life");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.short_name).toBe("الإدارة الذكية");
    expect(manifest.dir).toBe("rtl");
  });

  it("يرفع إصدار الكاش ويمنع تخزين API القديم", () => {
    const serviceWorker = readProjectFile("../public/sw.js");
    expect(serviceWorker).toContain("smart-security-life-shell");
    expect(serviceWorker).toContain("requestUrl.pathname.startsWith(\"/api/\")");
  });
});
