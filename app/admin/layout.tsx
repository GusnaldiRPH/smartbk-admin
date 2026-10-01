"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Users,
  FileBarChart,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAdminAuth } from "@/lib/useAdminAuth";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/questions", label: "Kelola Soal", icon: ListChecks },
  { href: "/admin/results", label: "Hasil Asesmen", icon: FileBarChart },
  { href: "/admin/students", label: "Kelola Siswa", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, logout } = useAdminAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // tutup drawer otomatis saat pindah halaman
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <span className="absolute inset-0 rounded-2xl bg-primary-500/30 animate-ring" />
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-800 flex items-center justify-center shadow-lg shadow-primary-700/30 animate-bob">
            <GraduationCap color="#fff" size={26} />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null; // sudah di-redirect ke /login oleh useAdminAuth

  const initial = (profile.full_name ?? "A").trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex">
      {/* overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden animate-pageIn"
          onClick={() => setOpen(false)}
        />
      )}

      {/* sticky + h-screen: sidebar tetap setinggi layar & diem di tempat */}
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-64 shrink-0 self-start flex flex-col overflow-hidden bg-gradient-to-b from-primary-900 via-primary-800 to-primary-950 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* dekorasi cahaya */}
        <div className="absolute -top-24 -left-20 w-64 h-64 rounded-full bg-primary-400/25 blur-3xl animate-floatA pointer-events-none" />
        <div className="absolute -bottom-28 -right-24 w-64 h-64 rounded-full bg-lime-300/10 blur-3xl animate-floatB pointer-events-none" />

        <div className="relative flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-black/20 ring-1 ring-white/20">
              <GraduationCap color="#fff" size={19} />
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-white text-lg tracking-tight block">SmartBK</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-primary-200/70">Panel Guru BK</span>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-white/70 hover:text-white"
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="relative flex-1 px-3 py-2 flex flex-col gap-1.5">
          <p className="px-3.5 mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-200/50">
            Menu
          </p>
          {NAV_ITEMS.map((item, i) => {
            const isActive =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ animationDelay: `${i * 70}ms` }}
                className={`group relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-300 animate-fadeUp ${
                  isActive
                    ? "bg-white text-primary-800 font-semibold shadow-lg shadow-black/20"
                    : "text-white/75 hover:bg-white/10 hover:text-white hover:translate-x-1"
                }`}
              >
                {isActive && (
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-1.5 rounded-r-full bg-primary-300" />
                )}
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? "bg-primary-100 text-primary-700"
                      : "bg-white/10 group-hover:bg-white/15 group-hover:scale-110"
                  }`}
                >
                  <Icon size={17} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative px-3 pb-4">
          <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-2xl bg-white/10 backdrop-blur border border-white/10">
            <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-primary-950 font-extrabold flex items-center justify-center">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile.full_name}</p>
              <p className="text-xs text-white/60 truncate">{profile.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-200 hover:bg-red-500/15 hover:text-red-100 transition-colors"
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      <main className="admin-main relative flex-1 min-w-0">
        {/* top bar mobile */}
        <div className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-primary-100">
          <button
            onClick={() => setOpen(true)}
            className="w-9 h-9 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center"
            aria-label="Buka menu"
          >
            <Menu size={19} />
          </button>
          <span className="font-extrabold text-ink">SmartBK</span>
        </div>

        {/* hiasan gradient di atas konten */}
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary-100/70 to-transparent pointer-events-none" />

        {/* key={pathname} -> animasi masuk setiap pindah halaman */}
        <div key={pathname} className="page-enter relative">
          {children}
        </div>
      </main>
    </div>
  );
}