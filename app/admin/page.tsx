"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Users,
  ListChecks,
  FileBarChart,
  ClipboardCheck,
  CalendarDays,
  UserX,
  School,
  Activity,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  PieChartIcon,
  type LucideIcon,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  fetchDashboardStats,
  fetchResultCountsByAssessment,
  fetchAllResults,
  fetchAllStudents,
  fetchAssessmentsForAdmin,
} from "@/lib/assessmentService";
import { Avatar, EmptyState } from "@/components/ui";

interface Stats {
  totalStudents: number;
  totalAssessments: number;
  totalQuestions: number;
  totalResults: number;
}

const STAT_CARDS = [
  { key: "totalStudents", label: "Total Siswa", icon: Users, from: "#17b574", to: "#0a7d4e" },
  { key: "totalAssessments", label: "Total Asesmen", icon: ClipboardCheck, from: "#2dd4bf", to: "#0f766e" },
  { key: "totalQuestions", label: "Total Soal", icon: ListChecks, from: "#84cc16", to: "#4d7c0f" },
  { key: "totalResults", label: "Hasil Terkumpul", icon: FileBarChart, from: "#34d399", to: "#047857" },
] as const;

const CHART_COLORS = ["#0a7d4e", "#14b8a6", "#84cc16", "#047857", "#f59e0b", "#0d9488", "#65a30d"];

const BELUM_PER_PAGE = 6;
const KELAS_PER_PAGE = 5;
const TERBARU_PER_PAGE = 8;

/* ---------- helpers ---------- */

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3)))); // easeOutCubic
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // kalau data berkurang & halaman aktif melebihi total, mundurkan
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const current = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => items.slice((current - 1) * pageSize, current * pageSize),
    [items, current, pageSize]
  );

  return { page: current, setPage, totalPages, pageItems, total: items.length, pageSize };
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const byDateDesc = (a: any, b: any) =>
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

/* ---------- komponen kecil ---------- */

function StatCard({
  card,
  value,
  index,
}: {
  card: (typeof STAT_CARDS)[number];
  value: number;
  index: number;
}) {
  const Icon = card.icon;
  const display = useCountUp(value);
  return (
    <div
      className="group relative overflow-hidden bg-white border border-primary-100 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary-700/15 animate-fadeUp"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <Icon
        size={92}
        color={card.from}
        className="absolute -right-4 -bottom-5 opacity-[0.07] transition-all duration-500 group-hover:opacity-[0.14] group-hover:scale-110 group-hover:-rotate-6"
      />
      <div
        className="relative w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
        style={{
          backgroundImage: `linear-gradient(135deg, ${card.from}, ${card.to})`,
          boxShadow: `0 10px 20px -8px ${card.to}99`,
        }}
      >
        <Icon size={20} color="#fff" />
      </div>
      <p className="relative text-3xl font-extrabold text-ink tabular-nums tracking-tight">{display}</p>
      <p className="relative text-sm text-muted mt-0.5">{card.label}</p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  badge,
  delay = 0,
  children,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  badge?: ReactNode;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <div
      className="bg-white border border-primary-100 rounded-2xl overflow-hidden flex flex-col animate-fadeUp"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="px-5 py-4 border-b border-primary-50 flex items-center gap-3">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-primary-50 flex items-center justify-center">
          <Icon size={17} className="text-primary-700" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-ink text-sm">{title}</h2>
          <p className="text-muted text-xs mt-0.5">{subtitle}</p>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const btn =
    "w-8 h-8 rounded-lg flex items-center justify-center text-primary-700 border border-primary-100 transition-colors hover:bg-primary-50 disabled:opacity-40 disabled:pointer-events-none";

  return (
    <div className="mt-auto flex items-center justify-between gap-3 px-5 py-3 border-t border-primary-50">
      <span className="text-xs text-muted tabular-nums">
        {from}–{to} dari {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={btn}
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-semibold text-ink tabular-nums min-w-[3rem] text-center">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className={btn}
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

const rowCls =
  "group flex items-center gap-3 px-5 py-3 border-b border-primary-50 last:border-0 transition-colors hover:bg-primary-50/60 animate-fadeUp";

const skeleton =
  "rounded-2xl bg-gradient-to-r from-primary-50 via-primary-100 to-primary-50 bg-[length:200%_100%] animate-shimmer";

/* ---------- halaman ---------- */

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<{ title: string; count: number }[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchDashboardStats(),
      fetchResultCountsByAssessment(),
      fetchAllStudents(),
      fetchAllResults(),
      fetchAssessmentsForAdmin(),
    ])
      .then(([s, c, st, r, a]) => {
        setStats(s);
        setChartData(c);
        setStudents(st);
        setResults(r);
        setAssessments(a);
      })
      .catch((err) => console.error("Gagal memuat dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  const { belumMengisi, belumMulai, kelasProgress, terbaru } = useMemo(() => {
    const totalA = assessments.length;

    // siswa -> set asesmen yang sudah dikerjakan
    const done = new Map<string, Set<string>>();
    results.forEach((r) => {
      if (!done.has(r.student_id)) done.set(r.student_id, new Set());
      done.get(r.student_id)!.add(r.assessment_id);
    });

    // 1) Siswa yang belum mengisi (belum lengkap)
    const belumMengisi =
      totalA === 0
        ? []
        : students
            .map((s) => ({ s, n: Math.min(done.get(s.id)?.size ?? 0, totalA) }))
            .filter((x) => x.n < totalA)
            .sort(
              (a, b) =>
                a.n - b.n || String(a.s.full_name).localeCompare(String(b.s.full_name), "id")
            );
    const belumMulai = belumMengisi.filter((x) => x.n === 0).length;

    // 2) Progres pengisian per kelas (rata-rata kelengkapan asesmen)
    const byClass = new Map<string, { students: number; pairs: number }>();
    students.forEach((s) => {
      if (!s.class_name) return;
      const c = byClass.get(s.class_name) ?? { students: 0, pairs: 0 };
      c.students += 1;
      c.pairs += Math.min(done.get(s.id)?.size ?? 0, totalA);
      byClass.set(s.class_name, c);
    });
    const kelasProgress = Array.from(byClass, ([name, c]) => ({
      name,
      students: c.students,
      pct: totalA ? Math.min(100, Math.round((c.pairs / (c.students * totalA)) * 100)) : 0,
    })).sort((a, b) => a.pct - b.pct || a.name.localeCompare(b.name, "id"));

    // 3) Aktivitas terbaru (semua, diurutkan; dipaginasi di UI)
    const terbaru = [...results].sort(byDateDesc);

    return { belumMengisi, belumMulai, kelasProgress, terbaru };
  }, [students, results, assessments]);

  const belumPg = usePagination(belumMengisi, BELUM_PER_PAGE);
  const kelasPg = usePagination(kelasProgress, KELAS_PER_PAGE);
  const terbaruPg = usePagination(terbaru, TERBARU_PER_PAGE);

  const totalA = assessments.length;
  const donutTotal = chartData.reduce((sum, d) => sum + d.count, 0);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl p-7 sm:p-8 mb-6 bg-gradient-to-br from-primary-500 via-primary-700 to-primary-900 bg-[length:200%_200%] animate-gradient shadow-xl shadow-primary-700/25">
        <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl animate-floatA" />
        <div className="absolute -bottom-20 left-1/3 w-52 h-52 rounded-full bg-lime-300/20 blur-3xl animate-floatB" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium text-white border border-white/20 mb-3">
            <CalendarDays size={13} />
            {today}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">Dashboard</h1>
          <p className="text-primary-50/80 text-sm">Ringkasan aktivitas asesmen SmartBK.</p>
        </div>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`${skeleton} h-[138px]`} />
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-5 mb-5">
            <div className={`${skeleton} h-80`} />
            <div className={`${skeleton} h-80`} />
          </div>
          <div className="grid lg:grid-cols-2 gap-5">
            <div className={`${skeleton} h-80`} />
            <div className={`${skeleton} h-80`} />
          </div>
        </>
      ) : (
        <>
          {/* Statistik */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {STAT_CARDS.map((card, i) => (
              <StatCard key={card.key} card={card} value={stats?.[card.key] ?? 0} index={i} />
            ))}
          </div>

          {/* Baris 1: belum mengisi + diagram lingkaran aktivitas asesmen */}
          <div className="grid lg:grid-cols-2 gap-5 mb-5">
            <Panel
              icon={UserX}
              title="Belum Mengisi Asesmen"
              subtitle={
                belumMengisi.length === 0
                  ? "Semua siswa sudah menyelesaikan asesmen"
                  : `${belumMulai} belum mulai sama sekali • ${belumMengisi.length - belumMulai} baru sebagian`
              }
              delay={300}
              badge={
                belumMengisi.length > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full tabular-nums">
                    {belumMengisi.length}
                  </span>
                )
              }
            >
              {belumMengisi.length === 0 ? (
                <EmptyState icon={CheckCircle2} text="Mantap! Semua siswa sudah menyelesaikan seluruh asesmen." />
              ) : (
                <>
                  <div>
                    {belumPg.pageItems.map(({ s, n }, i) => (
                      <Link
                        key={s.id}
                        href={`/admin/students/${s.id}`}
                        className={rowCls}
                        style={{ animationDelay: `${i * 45}ms` }}
                      >
                        <Avatar name={s.full_name} size={34} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink truncate">{s.full_name}</p>
                          <p className="text-xs text-muted">{s.class_name ?? "Tanpa kelas"}</p>
                        </div>
                        <div className="w-24 shrink-0">
                          <div className="flex justify-end text-[11px] text-muted mb-1 tabular-nums">
                            {n}/{totalA} asesmen
                          </div>
                          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                n === 0 ? "bg-amber-400" : "bg-gradient-to-r from-primary-400 to-primary-700"
                              }`}
                              style={{ width: `${Math.round((n / totalA) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <ChevronRight
                          size={15}
                          className="text-muted/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600"
                        />
                      </Link>
                    ))}
                  </div>
                  <Pagination
                    page={belumPg.page}
                    totalPages={belumPg.totalPages}
                    total={belumPg.total}
                    pageSize={belumPg.pageSize}
                    onChange={belumPg.setPage}
                  />
                </>
              )}
            </Panel>

            <Panel
              icon={PieChartIcon}
              title="Aktivitas Asesmen"
              subtitle="Proporsi hasil yang terkumpul per jenis asesmen"
              delay={380}
            >
              {donutTotal === 0 ? (
                <EmptyState icon={PieChartIcon} text="Belum ada hasil asesmen yang terkumpul." />
              ) : (
                <div className="p-5 flex flex-col gap-4">
                  <div className="relative h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="count"
                          nameKey="title"
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={96}
                          paddingAngle={3}
                          cornerRadius={5}
                          stroke="none"
                          animationDuration={900}
                        >
                          {chartData.map((_, idx) => (
                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [`${value} hasil`, name]}
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #b3f0cf",
                            fontSize: 13,
                            boxShadow: "0 10px 30px -10px rgba(5,46,31,0.25)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* angka di tengah donat */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-extrabold text-ink tabular-nums leading-none">
                        {donutTotal}
                      </span>
                      <span className="text-xs text-muted mt-1">total hasil</span>
                    </div>
                  </div>

                  {/* legenda */}
                  <div className="flex flex-col gap-2">
                    {chartData.map((d, idx) => (
                      <div key={d.title} className="flex items-center gap-2.5 text-sm">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                        />
                        <span className="flex-1 min-w-0 truncate text-ink">{d.title}</span>
                        <span className="text-xs text-muted tabular-nums shrink-0">
                          {d.count} •{" "}
                          <b className="text-ink">{Math.round((d.count / donutTotal) * 100)}%</b>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          </div>

          {/* Baris 2: progres per kelas + aktivitas terbaru */}
          <div className="grid lg:grid-cols-2 gap-5">
            <Panel
              icon={School}
              title="Progres Pengisian per Kelas"
              subtitle="Kelas yang paling tertinggal tampil paling atas"
              delay={460}
            >
              {kelasProgress.length === 0 ? (
                <EmptyState icon={School} text="Belum ada data kelas siswa." />
              ) : (
                <>
                  <div>
                    {kelasPg.pageItems.map((c, i) => (
                      <div
                        key={c.name}
                        className="px-5 py-3 border-b border-primary-50 last:border-0 animate-fadeUp"
                        style={{ animationDelay: `${i * 45}ms` }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold text-ink">{c.name}</span>
                          <span className="text-xs text-muted tabular-nums">
                            {c.students} siswa •{" "}
                            <b className={c.pct < 34 ? "text-amber-700" : "text-ink"}>{c.pct}%</b>
                          </span>
                        </div>
                        <div className="h-2 bg-surface rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${
                              c.pct < 34 ? "from-amber-300 to-amber-500" : "from-primary-400 to-primary-700"
                            }`}
                            style={{ width: `${Math.max(c.pct, 2)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination
                    page={kelasPg.page}
                    totalPages={kelasPg.totalPages}
                    total={kelasPg.total}
                    pageSize={kelasPg.pageSize}
                    onChange={kelasPg.setPage}
                  />
                </>
              )}
            </Panel>

            <Panel
              icon={Activity}
              title="Aktivitas Terbaru"
              subtitle="Hasil asesmen yang baru masuk"
              delay={540}
            >
              {terbaru.length === 0 ? (
                <EmptyState icon={Activity} text="Belum ada hasil asesmen yang masuk." />
              ) : (
                <>
                  <div>
                    {terbaruPg.pageItems.map((r, i) => (
                      <Link
                        key={r.id}
                        href={`/admin/students/${r.student_id}`}
                        className={rowCls}
                        style={{ animationDelay: `${i * 45}ms` }}
                      >
                        <Avatar name={r.profiles?.full_name} size={34} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-ink truncate">
                            <b>{r.profiles?.full_name ?? "-"}</b>{" "}
                            <span className="text-muted">menyelesaikan</span>{" "}
                            {r.assessments?.title ?? "asesmen"}
                          </p>
                          <p className="text-xs text-muted truncate">
                            {r.profiles?.class_name ?? "Tanpa kelas"}
                            {r.category ? ` • ${r.category}` : ""}
                          </p>
                        </div>
                        <span className="text-[11px] text-muted shrink-0 bg-surface px-2.5 py-1 rounded-full">
                          {timeAgo(r.created_at)}
                        </span>
                      </Link>
                    ))}
                  </div>
                  <Pagination
                    page={terbaruPg.page}
                    totalPages={terbaruPg.totalPages}
                    total={terbaruPg.total}
                    pageSize={terbaruPg.pageSize}
                    onChange={terbaruPg.setPage}
                  />
                </>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}