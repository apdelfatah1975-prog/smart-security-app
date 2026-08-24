import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SecurityCommandCenter } from "./SecurityCommandCenter";

const baseProps = {
  attendance: [],
  patrolPlans: [],
  workLocations: [],
  patrolQuery: "",
  onPatrolQueryChange: vi.fn(),
  onSharePatrol: vi.fn(),
  onOpenStaff: vi.fn(),
  onAddStaff: vi.fn(),
  onAddAttendance: vi.fn(),
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

  it("opens the complete staff profile callback from a location result", () => {
    const onOpenStaff = vi.fn();
    render(<SecurityCommandCenter {...baseProps} onOpenStaff={onOpenStaff} staff={[{ id: "1", name: "حارس مطوبس", branch: "فرع مطوبس", active: true }]} />);

    fireEvent.click(screen.getAllByRole("button", { name: /حارس مطوبس/ })[0]);

    expect(onOpenStaff).toHaveBeenCalledWith(expect.objectContaining({ id: "1", name: "حارس مطوبس" }));
  });
});
