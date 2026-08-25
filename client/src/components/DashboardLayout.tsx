import React from "react";
import { Link, useLocation } from "wouter";
import { BarChart3, BookOpenCheck, CarFront, ChevronLeft, CircleDollarSign, Menu, Settings, ShieldCheck, WalletCards, X } from "lucide-react";
import BottomNavigation from "./BottomNavigation";

export const items = [
  { path: "/", label: "الرئيسية", icon: BarChart3, accent: "bg-teal-50 text-teal-700" },
  { path: "/security", label: "إدارة الأمن", icon: ShieldCheck, accent: "bg-sky-50 text-sky-700" },
  { path: "/finance", label: "المالية اليومية", icon: CircleDollarSign, accent: "bg-amber-50 text-amber-700" },
  { path: "/debts", label: "دفتر الديون", icon: WalletCards, accent: "bg-rose-50 text-rose-700" },
  { path: "/education", label: "الأبناء والدروس", icon: BookOpenCheck, accent: "bg-violet-50 text-violet-700" },
  { path: "/vehicles", label: "مركباتي", icon: CarFront, accent: "bg-cyan-50 text-cyan-700" },
  { path: "/reports", label: "التقارير", icon: BarChart3, accent: "bg-emerald-50 text-emerald-700" },
  { path: "/settings", label: "الإعدادات", icon: Settings, accent: "bg-slate-100 text-slate-700" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = React.useState(false);
  const active = items.find(item => item.path === location) || items[0];
  const ActiveIcon = active.icon;
  return (
    <div dir="rtl" className="app-shell compact-layout min-h-[100dvh] bg-[#f4f8f7] text-slate-950">
      <aside className={`fixed inset-y-0 right-0 z-40 flex w-[18rem] flex-col bg-[linear-gradient(160deg,#063b48_0%,#07545a_58%,#0f766e_100%)] p-3 text-white shadow-[0_0_50px_rgba(7,59,76,.18)] transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[.68rem] font-black tracking-[.24em] text-teal-200">SMART SECURITY LIFE</p>
            <h2 className="mt-2 text-[1.7rem] font-black tracking-tight">الإدارة الذكية</h2>
          </div>
          <button aria-label="إغلاق القائمة" className="rounded-2xl p-2 text-teal-100 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-3 max-w-[14rem] text-sm font-semibold leading-7 text-teal-50/75">مساحتك المنظمة لإدارة الأمن والمال والأسرة من مكان واحد.</p>
        <nav className="mt-5 flex-1 space-y-1" aria-label="القائمة الرئيسية">
          {items.map(item => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return <Link key={item.path} href={item.path} onClick={() => setOpen(false)} className={`group flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black ${isActive ? "bg-white text-teal-900 shadow-[0_12px_26px_rgba(0,0,0,.14)]" : "text-teal-50 hover:bg-white/10"}`}><span className={`grid h-9 w-9 place-items-center rounded-xl ${isActive ? "bg-teal-50 text-teal-700" : "bg-white/10 text-teal-100"}`}><Icon className="h-5 w-5" /></span><span>{item.label}</span>{isActive && <ChevronLeft className="mr-auto h-4 w-4" />}</Link>;
          })}
        </nav>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm"><p className="text-xs font-black text-teal-100">وضع التشغيل</p><p className="mt-1 font-black">سحابي مع نسخة احتياطية محلية</p><p className="mt-2 text-xs leading-5 text-teal-100/70">تُزامن السجلات عبر PostgreSQL، وتظل النسخة المحلية متاحة عند انقطاع الاتصال.</p></div>
      </aside>
      {open && <button aria-label="إغلاق القائمة" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden" />}
      <div className="lg:mr-[18rem]">
        <header className="sticky top-0 z-20 border-b border-teal-100/80 bg-[#f4f8f7]/90 px-2.5 py-2 backdrop-blur-xl sm:px-3"><div className="mx-auto flex max-w-7xl items-center justify-between gap-2"><div className="flex items-center gap-3"><button aria-label="فتح القائمة" onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-teal-800 shadow-sm lg:hidden"><Menu className="h-5 w-5" /></button><div><p className="text-xs font-black text-teal-700">لوحة الإدارة</p><h1 className="text-lg font-black text-slate-950 sm:text-xl">{active.label}</h1></div></div><span className={`grid h-11 w-11 place-items-center rounded-2xl shadow-sm ${active.accent}`}><ActiveIcon className="h-5 w-5" /></span></div></header>
        <main className="mx-auto max-w-7xl px-2 py-3 pb-24 sm:px-3 sm:py-4 lg:pb-5">{children}</main>
      </div>
      <BottomNavigation />
    </div>
  );
}

export function DashboardLayoutSkeleton() { return <div className="min-h-screen bg-[#f4f8f7]" />; }
export function AuthPage() { return null; }
export function LoginPage() { return null; }
export function RegisterPage() { return null; }
export function ProtectedRoute({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function Shell({ children }: { children: React.ReactNode }) { return <DashboardLayout>{children}</DashboardLayout>; }
export function useDashboardAuth() { return { user: { name: "المستخدم المحلي" } }; }
export function useAuth() { return { user: { name: "المستخدم المحلي" }, loading: false, isLoading: false, isAuthenticated: true }; }
export function useLogin() { return { mutate: () => undefined, isPending: false }; }
export function useLogout() { return { mutate: () => undefined, isPending: false }; }
export function useRegister() { return { mutate: () => undefined, isPending: false }; }
