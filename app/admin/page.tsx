"use client";

import { useEffect, useState } from "react";
import { Users, ListChecks, FileBarChart, ClipboardCheck, CalendarDays } from "lucide-react";
import { fetchDashboardStats, fetchResultCountsByAssessment } from "@/lib/assessmentService";
import ResultsByAssessmentChart from "@/components/ResultsByAssessmentChart";

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
      {/* ikon besar transparan di pojok */}
      <Icon
        size={92}
        color={card.from}
        className="absolute -right-4 -bottom-5 opacity-[0.07] transition-all duration-500 group-hover:opacity-[0.14] group-hover:scale-110 group-hover:-rotate-6"
      />
      <div
        className="relative w-11 h-11 rounded-xl flex items-center justify-center mb-4 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
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

const skeleton =
  "rounded-2xl bg-gradient-to-r from-primary-50 via-primary-100 to-primary-50 bg-[length:200%_100%] animate-shimmer";

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<{ title: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchResultCountsByAssessment()])
      .then(([s, c]) => {
        setStats(s);
        setChartData(c);
      })
      .finally(() => setLoading(false));
  }, []);

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`${skeleton} h-[138px]`} />
            ))}
          </div>
          <div className={`${skeleton} h-72`} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STAT_CARDS.map((card, i) => (
              <StatCard key={card.key} card={card} value={stats?.[card.key] ?? 0} index={i} />
            ))}
          </div>

          <div
            className="bg-white border border-primary-100 rounded-2xl overflow-hidden animate-fadeUp"
            style={{ animationDelay: "380ms" }}
          >
            <div className="px-5 py-4 border-b border-primary-50 flex items-center gap-3">
              <span className="w-1.5 h-9 rounded-full bg-gradient-to-b from-primary-400 to-primary-700" />
              <div>
                <h2 className="font-bold text-ink">Aktivitas Asesmen</h2>
                <p className="text-muted text-xs mt-0.5">
                  Jumlah hasil yang terkumpul per jenis asesmen.
                </p>
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