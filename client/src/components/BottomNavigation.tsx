import React from "react";
import { BarChart3, CircleDollarSign, LayoutGrid, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
const bottomItems = [
  { path: "/", label: "الرئيسية", icon: BarChart3 },
  { path: "/security", label: "الأمن", icon: ShieldCheck },
  { path: "/finance", label: "المالية", icon: CircleDollarSign },
  { path: "/more", label: "المزيد", icon: LayoutGrid },
];

export default function BottomNavigation() {
  const [location] = useLocation();
  return (
    <nav aria-label="التنقل السريع" className="bottom-navigation fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 gap-1 rounded-[1.35rem] border border-white/70 bg-white/95 p-1.5 shadow-[0_18px_45px_rgba(15,23,42,.18)] backdrop-blur-xl lg:hidden">
      {bottomItems.map(item => {
        const Icon = item.icon;
        const active = item.path === "/more" ? location !== "/" && !bottomItems.slice(0, 3).some(entry => entry.path !== "/" && location.startsWith(entry.path)) : item.path === "/" ? location === "/" : location.startsWith(item.path);
        const href = item.path === "/more" ? "/settings" : item.path;
        return (
          <Link key={item.path} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 text-[.68rem] font-black ${active ? "bg-teal-700 text-white shadow-md" : "text-slate-500 hover:bg-teal-50 hover:text-teal-800"}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
