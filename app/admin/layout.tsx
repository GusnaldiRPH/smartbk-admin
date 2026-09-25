"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Users,
  FileBarChart,
  LogOut,
  Loader2,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-700" size={28} />
      </div>
    );
  }

  if (!profile) return null; // sudah di-redirect ke /login oleh useAdminAuth

  return (
    <div className="min-h-screen flex">
      {/* sticky + h-screen: sidebar tetap setinggi layar & diem di tempat,
          nggak ikut memanjang meski konten di kanan lebih tinggi (misal
          tabel dengan pagination). */}
      <aside className="w-64 bg-primary-800 flex flex-col sticky top-0 h-screen self-start">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <GraduationCap color="#fff" size={18} />
          </div>
          <span className="font-extrabold text-white">SmartBK</span>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white text-primary-800 font-semibold"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4">
          <div className="px-3.5 py-2.5 mb-2">
            <p className="text-sm font-semibold text-white truncate">{profile.full_name}</p>
            <p className="text-xs text-white/60 truncate">{profile.email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-200 hover:bg-white/10 hover:text-red-100 transition-colors"
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}