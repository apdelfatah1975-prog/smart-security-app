import React from "react";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./Home";

const setLocation = vi.fn();
let currentPath = "/";
const snapshotState = { data: undefined as unknown, isLoading: false, isFetching: false, isError: false, refetch: vi.fn() };
vi.mock("wouter", () => ({
  useLocation: () => [currentPath, setLocation],
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "cloud-user" }, loading: false, isAuthenticated: true, error: null, logout: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { setData: vi.fn(), invalidate: vi.fn(async () => undefined) } } }),
    auth: {
      me: { useQuery: () => ({ data: null, isLoading: false, isError: false, error: null, refetch: vi.fn() }) },
      logout: { useMutation: () => ({ mutateAsync: vi.fn(async () => undefined), isPending: false, error: null }) },
    },
    smartSecurity: {
      snapshot: { useQuery: () => snapshotState },
      save: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(async () => ({ id: 1 })), isPending: false }) },
      update: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(async () => undefined), isPending: false }) },
      delete: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(async () => undefined), isPending: false }) },
      uploadImage: { useMutation: () => ({ mutateAsync: vi.fn(async ({ dataUrl }: { dataUrl: string }) => ({ url: dataUrl })) }) },
    },
  },
}));

describe("صفحة إدارة الأمن في الإدارة الذكية", () => {
  beforeEach(() => {
    localStorage.clear();
    setLocation.mockReset();
    currentPath = "/";
    snapshotState.data = undefined;
    snapshotState.isLoading = false;
    snapshotState.isFetching = false;
    snapshotState.isError = false;
  });

  afterEach(() => cleanup());

  it("تعرض عنوان قسم الأمن وزر إضافة فرد أمن", () => {
    render(<Home />);
    expect(screen.getByText("إدارة حياتك العملية واليومية بوضوح")).toBeTruthy();
    expect(screen.getAllByText("إضافة فرد أمن").length).toBeGreaterThan(0);
  });

  it("تفتح نموذج فرد الأمن وتعرض الحقول التشغيلية الموسعة", () => {
    render(<Home />);
    fireEvent.click(screen.getAllByText("إضافة فرد أمن")[0]);
    expect(screen.getAllByText("إضافة فرد أمن").length).toBeGreaterThan(0);
    expect(screen.getByText("كود فرد الأمن")).toBeTruthy();
    expect(screen.getByText("حالة الترخيص")).toBeTruthy();
    expect(screen.getByText("رقم السلاح")).toBeTruthy();
    expect(screen.getByText("انتهاء الرخصة")).toBeTruthy();
    expect(screen.getByText("تاريخ الخروج على المعاش")).toBeTruthy();
  });

  it("تعرض اتصال PostgreSQL والمزامنة التلقائية في الإعدادات عند نجاح snapshot", () => {
    currentPath = "/settings";
    snapshotState.data = { staff: [], workLocations: [], attendance: [], patrols: [], patrolPlans: [], entries: [], debts: [], children: [], teachers: [], lessons: [], vehicles: [], vehicleVisits: [] };
    render(<Home />);
    expect(screen.getAllByText(/متصل بالسحابة \(PostgreSQL\)/).length).toBeGreaterThan(0);
    expect(screen.getByText(/المزامنة التلقائية فعالة كل 10 ثوانٍ/)).toBeTruthy();
    expect(screen.queryByText(/تُحفظ السجلات في PostgreSQL لمزامنتها بين الأجهزة عند تسجيل الدخول/)).toBeNull();
  });

  it("تفتح نافذة خطة المرور الشهرية من قسم الأمن", () => {
    currentPath = "/security";
    render(<Home />);
    fireEvent.click(screen.getAllByText("إضافة خطة")[0]);
    expect(screen.getByText("خطة مرور شهرية")).toBeTruthy();
    expect(screen.getByText("التكرار")).toBeTruthy();
    expect(screen.getByText("نقطة المرور")).toBeTruthy();
  });

  it("تفتح ملف فرد الأمن وتعرض ملخصه وسجله الزمني", () => {
    currentPath = "/security";
    localStorage.setItem("smart-security-life-v1", JSON.stringify({
      staff: [{ id: "staff-1", code: "ح-001", name: "أحمد علي", phone: "01000000000", nationalId: "29901011234567", birthDate: "1999-01-01", branch: "فرع النيل", workStartDate: "2024-01-01", atm: "ATM 1", hireDate: "2024-01-01", rate: 5000, active: true, shift: "morning" }],
      workLocations: [{ id: "location-1", staffId: "staff-1", location: "فرع النيل", fromDate: "2024-01-01", notes: "تكليف" }],
      attendance: [{ id: "attendance-1", staffId: "staff-1", date: "2026-08-24", shift: "morning", status: "present", hours: 8 }],
      patrols: [], patrolPlans: [], entries: [], debts: [], children: [], teachers: [], lessons: [], vehicles: [], vehicleVisits: [], settings: { name: "الإدارة الذكية", branch: "" },
    }));
    render(<Home />);
    fireEvent.click(screen.getByText("فتح الملف"));
    expect(screen.getByText("ملف فرد الأمن")).toBeTruthy();
    expect(screen.getByText("السجل الزمني للفرد")).toBeTruthy();
    expect(screen.getByText(/انتقال إلى فرع النيل/)).toBeTruthy();
  });
});
