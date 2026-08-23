import React from "react";
import { Link, useLocation } from "wouter";
import { BarChart3, BookOpenCheck, CarFront, ChevronLeft, CircleDollarSign, Menu, Settings, ShieldCheck, WalletCards, X } from "lucide-react";

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
  return <div dir="rtl" className="min-h-[100dvh] bg-[#f6fbfa] text-slate-950">
    <aside className={`fixed inset-y-0 right-0 z-40 w-72 transform bg-[#073b4c] p-5 text-white shadow-2xl transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "translate-x-full"}`}>
      <div className="flex items-center justify-between"><div><p className="text-xs font-black tracking-[.2em] text-teal-200">SMART SECURITY LIFE</p><h2 className="mt-2 text-2xl font-black">الإدارة الذكية</h2></div><button aria-label="إغلاق القائمة" className="rounded-xl p-2 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button></div>
      <p className="mt-2 text-sm font-semibold leading-6 text-teal-100/75">إدارة الأمن والمال والأسرة من مكان واحد.</p>
      <nav className="mt-8 space-y-2">{items.map(item => { const Icon = item.icon; const isActive = location === item.path; return <Link key={item.path} href={item.path} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${isActive ? "bg-white text-teal-900 shadow-lg" : "text-teal-50 hover:bg-white/10"}`}><Icon className="h-5 w-5" /><span>{item.label}</span>{isActive && <ChevronLeft className="mr-auto h-4 w-4" />}</Link>; })}</nav>
      <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/10 p-4"><p className="text-xs font-black text-teal-100">وضع التشغيل</p><p className="mt-1 font-black">محلي — محفوظ على هذا الجهاز</p><p className="mt-2 text-xs leading-5 text-teal-100/70">لا يحتاج هذا الوضع إلى قاعدة بيانات خارجية أو تسجيل دخول.</p></div>
    </aside>
    {open && <button aria-label="إغلاق القائمة" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" />}
    <div className="lg:mr-72"><header className="sticky top-0 z-20 border-b border-teal-100/80 bg-[#f6fbfa]/90 px-4 py-3 backdrop-blur-xl sm:px-6"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3"><div className="flex items-center gap-3"><button aria-label="فتح القائمة" onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-teal-800 shadow-sm lg:hidden"><Menu className="h-5 w-5" /></button><div><p className="text-xs font-black text-teal-700">لوحة الإدارة</p><h1 className="text-lg font-black text-slate-950 sm:text-xl">{active.label}</h1></div></div><span className={`grid h-10 w-10 place-items-center rounded-2xl ${active.accent}`}><ActiveIcon className="h-5 w-5" /></span></div></header><main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">{children}</main></div>
  </div>;
}

export function DashboardLayoutSkeleton() { return <div className="min-h-screen bg-[#f6fbfa]" />; }
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
