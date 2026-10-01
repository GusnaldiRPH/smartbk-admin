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
  HeartPulse,
  School,
  Activity,
  CheckCircle2,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import {
  fetchDashboardStats,
  fetchResultCountsByAssessment,
  fetchAllResults,
  fetchAllStudents,
  fetchAssessmentsForAdmin,
} from "@/lib/assessmentService";
import ResultsByAssessmentChart from "@/components/ResultsByAssessmentChart";
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

const BELUM_LIMIT = 6;
const PERHATIAN_LIMIT = 6;
const TERBARU_LIMIT = 8;

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

  const { belumMengisi, belumMulai, perhatian, kelasProgress, terbaru } = useMemo(() => {
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

    // 2) Perlu perhatian: hasil TERBARU skala stres tiap siswa berkategori "tinggi"
    const latestStress = new Map<string, any>();
    results
      .filter((r) => r.assessments?.assessment_type === "stress_scale")
      .sort(byDateDesc)
      .forEach((r) => {
        if (!latestStress.has(r.student_id)) latestStress.set(r.student_id, r);
      });
    const perhatian = Array.from(latestStress.values())
      .filter((r) => /tinggi/i.test(r.category ?? ""))
      .sort(
        (a, b) => (b.total_score ?? 0) / (b.max_score || 1) - (a.total_score ?? 0) / (a.max_score || 1)
      );

    // 3) Progres pengisian per kelas (rata-rata kelengkapan asesmen)
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

    // 4) Aktivitas terbaru
    const terbaru = [...results].sort(byDateDesc).slice(0, TERBARU_LIMIT);

    return { belumMengisi, belumMulai, perhatian, kelasProgress, terbaru };
  }, [students, results, assessments]);

  const totalA = assessments.length;

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
          <div className="grid lg:grid-cols-2 gap-5 mb-5">
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

          {/* Baris 1: belum mengisi + perlu perhatian */}
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
                    {belumMengisi.slice(0, BELUM_LIMIT).map(({ s, n }, i) => (
                      <Link
                        key={s.id}
                        href={`/admin/students/${s.id}`}
                        className={rowCls}
                        style={{ animationDelay: `${360 + i * 45}ms` }}
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
                  {belumMengisi.length > BELUM_LIMIT && (
                    <Link
                      href="/admin/students"
                      className="mt-auto px-5 py-3 text-xs font-semibold text-primary-700 hover:bg-primary-50 border-t border-primary-50 transition-colors"
                    >
                      +{belumMengisi.length - BELUM_LIMIT} siswa lainnya • Lihat semua siswa
                    </Link>
                  )}
                </>
              )}
            </Panel>

            <Panel
              icon={HeartPulse}
              title="Perlu Perhatian"
              subtitle="Hasil terbaru Skala Stres Akademik berkategori tinggi"
              delay={380}
              badge={
                perhatian.length > 0 && (
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full tabular-nums">
                    {perhatian.length}
                  </span>
                )
              }
            >
              {perhatian.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  text="Belum ada siswa dengan tingkat stres akademik tinggi."
                />
              ) : (
                <>
                  <div>
                    {perhatian.slice(0, PERHATIAN_LIMIT).map((r, i) => (
                      <Link
                        key={r.id}
                        href={`/admin/students/${r.student_id}`}
                        className={rowCls}
                        style={{ animationDelay: `${440 + i * 45}ms` }}
                      >
                        <Avatar name={r.profiles?.full_name} size={34} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink truncate">
                            {r.profiles?.full_name ?? "-"}
                          </p>
                          <p className="text-xs text-muted">
                            {r.profiles?.class_name ?? "Tanpa kelas"} • {timeAgo(r.created_at)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-block bg-red-50 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {r.category}
                          </span>
                          <p className="text-[11px] text-muted mt-1 tabular-nums">
                            {r.total_score}/{r.max_score ?? "-"}
                          </p>
                        </div>
                        <ChevronRight
                          size={15}
                          className="text-muted/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600"
                        />
                      </Link>
                    ))}
                  </div>
                  {perhatian.length > PERHATIAN_LIMIT && (
                    <Link
                      href="/admin/results"
                      className="mt-auto px-5 py-3 text-xs font-semibold text-primary-700 hover:bg-primary-50 border-t border-primary-50 transition-colors"
                    >
                      +{perhatian.length - PERHATIAN_LIMIT} siswa lainnya • Buka Hasil Asesmen
                    </Link>
                  )}
                </>
              )}
            </Panel>
          </div>

          {/* Baris 2: progres per kelas + aktivitas terbaru */}
          <div className="grid lg:grid-cols-2 gap-5 mb-5">
            <Panel
              icon={School}
              title="Progres Pengisian per Kelas"
              subtitle="Kelas yang paling tertinggal tampil paling atas"
              delay={460}
            >
              {kelasProgress.length === 0 ? (
                <EmptyState icon={School} text="Belum ada data kelas siswa." />
              ) : (
                <div className="max-h-[22rem] overflow-y-auto">
                  {kelasProgress.map((c, i) => (
                    <div
                      key={c.name}
                      className="px-5 py-3 border-b border-primary-50 last:border-0 animate-fadeUp"
                      style={{ animationDelay: `${520 + Math.min(i, 8) * 45}ms` }}
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
                <div>
                  {terbaru.map((r, i) => (
                    <Link
                      key={r.id}
                      href={`/admin/students/${r.student_id}`}
                      className={rowCls}
                      style={{ animationDelay: `${600 + i * 45}ms` }}
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
              )}
            </Panel>
          </div>

          {/* Grafik per asesmen (tetap) */}
          <div
            className="bg-white border border-primary-100 rounded-2xl overflow-hidden animate-fadeUp"
            style={{ animationDelay: "620ms" }}
          >
            <div className="px-5 py-4 border-b border-primary-50 flex items-center gap-3">
              <span className="w-1.5 h-9 rounded-full bg-gradient-to-b from-primary-400 to-primary-700" />
              <div>
                <h2 className="font-bold text-ink">Aktivitas Asesmen</h2>
                <p className="text-muted text-xs mt-0.5">Jumlah hasil yang terkumpul per jenis asesmen.</p>
              </div>
            </div>
            <div className="px-4 pt-4 pb-2">
              <ResultsByAssessmentChart data={chartData} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}