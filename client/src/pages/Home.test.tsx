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
      save: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
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
});
