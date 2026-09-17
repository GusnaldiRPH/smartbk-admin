"use client";

import { useEffect, useState } from "react";
import { Users, ListChecks, FileBarChart, ClipboardCheck, Loader2 } from "lucide-react";
import { fetchDashboardStats, fetchResultCountsByAssessment } from "@/lib/assessmentService";
import ResultsByAssessmentChart from "@/components/ResultsByAssessmentChart";

interface Stats {
  totalStudents: number;
  totalAssessments: number;
  totalQuestions: number;
  totalResults: number;
}

const STAT_CARDS = [
  { key: "totalStudents", label: "Total Siswa", icon: Users, color: "#0e6f4c" },
  { key: "totalAssessments", label: "Total Asesmen", icon: ClipboardCheck, color: "#dd7c05" },
  { key: "totalQuestions", label: "Total Soal", icon: ListChecks, color: "#2563eb" },
  { key: "totalResults", label: "Hasil Terkumpul", icon: FileBarChart, color: "#7c3aed" },
] as const;

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

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-ink mb-1">Dashboard</h1>
      <p className="text-muted text-sm mb-6">Ringkasan aktivitas asesmen SmartBK.</p>

      {loading ? (
        <Loader2 className="animate-spin text-primary-700" size={24} />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {STAT_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.key}
                  className="bg-white border border-primary-100 rounded-2xl p-5"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${card.color}1a` }}
                  >
                    <Icon size={19} color={card.color} />
                  </div>
                  <p className="text-2xl font-extrabold text-ink">
                    {stats?.[card.key] ?? 0}
                  </p>
                  <p className="text-sm text-muted mt-0.5">{card.label}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-primary-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-primary-50">
              <h2 className="font-bold text-ink">Aktivitas Asesmen</h2>
              <p className="text-muted text-xs mt-0.5">
                Jumlah hasil yang terkumpul per jenis asesmen.
              </p>
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