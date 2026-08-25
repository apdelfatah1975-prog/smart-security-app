import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DebtRedirect } from "./App";

vi.mock("wouter", () => ({
  Redirect: ({ to, replace }: { to: string; replace?: boolean }) => <div data-testid="redirect" data-to={to} data-replace={String(Boolean(replace))} />,
  Route: () => null,
  Switch: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLocation: () => ["/", vi.fn()],
}));

afterEach(() => cleanup());

describe("تحويل مسار الديون", () => {
  it("يوجّه المسار القديم إلى تبويب الديون داخل المالية", () => {
    render(<DebtRedirect />);
    expect(screen.getByTestId("redirect").getAttribute("data-to")).toBe("/finance?tab=debts");
    expect(screen.getByTestId("redirect").getAttribute("data-replace")).toBe("true");
  });
});
