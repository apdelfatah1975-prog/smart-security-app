import React from "react";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./Home";

const setLocation = vi.fn();
let currentPath = "/";
vi.mock("wouter", () => ({
  useLocation: () => [currentPath, setLocation],
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    smartSecurity: {
      snapshot: { useQuery: () => ({ data: undefined, isLoading: false, isError: false, refetch: vi.fn() }) },
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

  it("تفتح نافذة خطة المرور الشهرية من قسم الأمن", () => {
    currentPath = "/security";
    render(<Home />);
    fireEvent.click(screen.getAllByText("إضافة خطة")[0]);
    expect(screen.getByText("خطة مرور شهرية")).toBeTruthy();
    expect(screen.getByText("التكرار")).toBeTruthy();
    expect(screen.getByText("نقطة المرور")).toBeTruthy();
  });
});
