import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BottomNavigation from "./BottomNavigation";

let currentPath = "/";
vi.mock("wouter", () => ({
  useLocation: () => [currentPath, vi.fn()],
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));

describe("التنقل السفلي للهاتف", () => {
  afterEach(() => cleanup());

  it("يعرض الأقسام الأكثر استخداماً ويحدد الرئيسية", () => {
    currentPath = "/";
    render(<BottomNavigation />);
    expect(screen.getByRole("navigation", { name: "التنقل السريع" })).toBeTruthy();
    expect(screen.getByText("الرئيسية").closest("a")?.getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("الأمن")).toBeTruthy();
    expect(screen.getByText("المالية")).toBeTruthy();
    expect(screen.queryByText("الديون")).toBeNull();
    expect(screen.getByRole("navigation", { name: "التنقل السريع" }).className).toContain("grid-cols-4");
    expect(screen.getByText("المزيد").closest("a")?.getAttribute("href")).toBe("/settings");
  });

  it("يحدد المالية عند فتح تبويب الديون عبر query string", () => {
    currentPath = "/finance?tab=debts";
    render(<BottomNavigation />);
    expect(screen.getByText("المالية").closest("a")?.getAttribute("aria-current")).toBe("page");
  });
});
