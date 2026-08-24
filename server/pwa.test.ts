import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

type FetchHandler = (event: { request: Request; respondWith: (response: Promise<unknown>) => void }) => void;

function loadServiceWorker(fetchImplementation: ReturnType<typeof vi.fn>, cachedRoot: unknown, offlinePage: unknown) {
  const handlers = new Map<string, FetchHandler>();
  const cache = { addAll: vi.fn(), put: vi.fn(), match: vi.fn(async (request: Request | string) => request === "/" ? cachedRoot : offlinePage) };
  const caches = {
    open: vi.fn(async () => cache),
    keys: vi.fn(async () => []),
    delete: vi.fn(async () => true),
    match: vi.fn(async (request: Request | string) => request === "/" ? cachedRoot : offlinePage),
  };
  const self = {
    addEventListener: (name: string, handler: FetchHandler) => handlers.set(name, handler),
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
    location: { origin: "https://smart-security.test" },
  };
  const source = readFileSync(path.resolve(import.meta.dirname, "../client/public/sw.js"), "utf8");
  runInNewContext(source, { self, caches, fetch: fetchImplementation, URL, Promise });
  return { fetchHandler: handlers.get("fetch")!, caches };
}

async function executeNavigation(handler: FetchHandler) {
  let responsePromise: Promise<unknown> | undefined;
  handler({
    request: { method: "GET", mode: "navigate", url: "https://smart-security.test/" } as Request,
    respondWith: response => { responsePromise = response; },
  });
  return responsePromise;
}

describe("عامل خدمة الإدارة الذكية القابل للتثبيت", () => {
  it("يجهز manifest عربي مستقل مع مشاركة آمنة", () => {
    const manifest = JSON.parse(readFileSync(path.resolve(import.meta.dirname, "../client/public/manifest.json"), "utf8")) as Record<string, any>;
    expect(manifest.name).toContain("الإدارة الذكية");
    expect(manifest.lang).toBe("ar");
    expect(manifest.dir).toBe("rtl");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.share_target.action).toBe("/");
    expect(manifest.share_target.params.url).toBe("url");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons).toEqual([
      { src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ]);
    expect(existsSync(path.resolve(import.meta.dirname, "../client/public/icon.png"))).toBe(true);
    expect(existsSync(path.resolve(import.meta.dirname, "../client/public/icon-512.png"))).toBe(true);
  });

  it("يربط غلاف HTML بالعامل الخدمي والأيقونة العربية", () => {
    const indexHtml = readFileSync(path.resolve(import.meta.dirname, "../client/index.html"), "utf8");
    const mainSource = readFileSync(path.resolve(import.meta.dirname, "../client/src/main.tsx"), "utf8");
    const serviceWorker = readFileSync(path.resolve(import.meta.dirname, "../client/public/sw.js"), "utf8");
    expect(indexHtml).toContain("/manifest.json");
    expect(indexHtml).toContain('rel="icon" href="/icon.png" type="image/png"');
    expect(indexHtml).toContain('rel="apple-touch-icon" href="/icon-512.png"');
    expect(serviceWorker).toContain('"/icon.png"');
    expect(serviceWorker).toContain('"/icon-512.png"');
    expect(mainSource).toContain('navigator.serviceWorker.register("/sw.js",');
    expect(serviceWorker).toContain('const APP_SHELL = ["/"');
  });

  it("لا يخزن طلبات API داخل غلاف التطبيق", () => {
    const source = readFileSync(path.resolve(import.meta.dirname, "../client/public/sw.js"), "utf8");
    expect(source).toContain('if (requestUrl.pathname.startsWith("/api/")) return;');
  });

  it("يعرض نسخة الشبكة الحديثة لمسار التطبيق ويحدّث الكاش، ثم يستخدم المخزنة عند انقطاع الاتصال", async () => {
    const networkResponse = { ok: true, clone: () => networkResponse };
    const cachedRoot = { cached: true };
    const fetchImplementation = vi.fn(async () => networkResponse);
    const { fetchHandler, caches } = loadServiceWorker(fetchImplementation, cachedRoot, { offline: true });

    await expect(executeNavigation(fetchHandler)).resolves.toBe(networkResponse);
    await Promise.resolve();
    expect(fetchImplementation).toHaveBeenCalledOnce();
    expect(caches.match).toHaveBeenCalledWith("/");
  });

  it("يعرض صفحة عدم الاتصال عند فشل الشبكة وعدم وجود نسخة من المسار", async () => {
    const offlinePage = { offline: true };
    const fetchImplementation = vi.fn(async () => { throw new Error("offline"); });
    const { fetchHandler, caches } = loadServiceWorker(fetchImplementation, undefined, offlinePage);

    await expect(executeNavigation(fetchHandler)).resolves.toBe(offlinePage);
    expect(caches.match).toHaveBeenCalledWith("/");
    expect(caches.match).toHaveBeenCalledWith("/offline.html");
  });
});
