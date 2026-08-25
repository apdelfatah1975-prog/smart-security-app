import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SecurityCommandCenter } from "./SecurityCommandCenter";

const baseProps = {
  patrolPlans: [],
  workLocations: [],
  patrolQuery: "",
  onPatrolQueryChange: vi.fn(),
  onSharePatrol: vi.fn(),
  onOpenStaff: vi.fn(),
  onAddStaff: vi.fn(),
  onBulkImport: vi.fn(),
  onAddPatrol: vi.fn(),
  onAddPlan: vi.fn(),
  onImportPlan: vi.fn(),
};

afterEach(() => cleanup());

describe("SecurityCommandCenter location cards", () => {
  it("shows all location cards and filters staff by the selected location", () => {
    render(<SecurityCommandCenter {...baseProps} staff={[{ id: "1", name: "أحمد مطوبس", branch: "فرع مطوبس", phone: "010", active: true }, { id: "2", name: "حارس فوه", branch: "فرع فوه", phone: "011", active: true }]} />);

    expect(screen.getByRole("button", { name: /كل الحراس والأفراد/ })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /فرع مطوبس/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /شونة السالمية/ })).toBeTruthy();
    expect(screen.getAllByText("أحمد مطوبس").length).toBeGreaterThan(0);
    expect(screen.getAllByText("حارس فوه").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByTestId("location-card-فرع مطوبس"));

    expect(screen.getAllByText("أحمد مطوبس").length).toBeGreaterThan(0);
    expect(screen.getByText(/١ فرد معروض/)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /أحمد مطوبس/ }).length).toBeGreaterThan(0);
  });

  it("keeps the security header compact and exposes both quick actions", () => {
    const onAddStaff = vi.fn();
    const onBulkImport = vi.fn();
    render(<SecurityCommandCenter {...baseProps} onAddStaff={onAddStaff} onBulkImport={onBulkImport} staff={[]} />);

    expect(screen.getByRole("heading", { name: "الحراس والأفراد" })).toBeTruthy();
    expect(screen.queryByText("مركز التشغيل اليومي")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /فرد جديد/ }));
    fireEvent.click(screen.getByRole("button", { name: /استيراد مجمع/ }));
    expect(onAddStaff).toHaveBeenCalledTimes(1);
    expect(onBulkImport).toHaveBeenCalledTimes(1);
  });

  it("renders clean staff cards with working contact actions", () => {
    render(<SecurityCommandCenter {...baseProps} staff={[{ id: "1", name: "حارس تجريبي", branch: "فرع مطوبس", phone: "01012345678", active: true }]} />);

    expect(screen.getAllByText("حارس تجريبي").some((element) => element.className.includes("text-base"))).toBe(true);
    expect(screen.getByText("نشط")).toBeTruthy();
    expect(screen.getByRole("link", { name: "اتصال بـ حارس تجريبي" }).getAttribute("href")).toBe("tel:01012345678");
    expect(screen.getByRole("link", { name: "واتساب حارس تجريبي" }).getAttribute("href")).toBe("https://wa.me/201012345678");
    expect(screen.getByRole("button", { name: "نسخ بيانات حارس تجريبي" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "الملف" })).toBeTruthy();
  });

  it("opens the complete staff profile callback from a location result", () => {
    const onOpenStaff = vi.fn();
    render(<SecurityCommandCenter {...baseProps} onOpenStaff={onOpenStaff} staff={[{ id: "1", name: "حارس مطوبس", branch: "فرع مطوبس", active: true }]} />);

    fireEvent.click(screen.getAllByRole("button", { name: /حارس مطوبس/ })[0]);

    expect(onOpenStaff).toHaveBeenCalledWith(expect.objectContaining({ id: "1", name: "حارس مطوبس" }));
  });
});
