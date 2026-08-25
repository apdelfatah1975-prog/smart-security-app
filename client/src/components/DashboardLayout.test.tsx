import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DashboardLayout from "./DashboardLayout";

vi.mock("wouter", () => ({
  useLocation: () => ["/"],
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => <a href={href} {...props}>{children}</a>,
}));

afterEach(() => cleanup());

describe("compact dashboard layout", () => {
  it("uses compact density and small content gutters while keeping navigation available", () => {
    render(<DashboardLayout><p>محتوى الصفحة</p></DashboardLayout>);

    const shell = document.querySelector(".compact-layout");
    const main = screen.getByRole("main");

    expect(shell).toBeTruthy();
    expect(main.className).toContain("px-1");
    expect(main.className).toContain("py-1");
    expect(screen.getByRole("navigation", { name: "التنقل السريع" })).toBeTruthy();
    expect(screen.getByText("محتوى الصفحة")).toBeTruthy();
  });
});
