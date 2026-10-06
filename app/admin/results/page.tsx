"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, PieChartIcon, FileBarChart } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  fetchAssessmentsForAdmin,
  fetchAllResults,
  fetchAllStudents,
} from "@/lib/assessmentService";
import {
  fetchAssessmentsWithTingkat,
  fetchStudentTingkatMap,
  type AssessmentAdmin,
} from "@/lib/assessmentAdminService";
import { Assessment } from "@/types";
import {
  Avatar,
  EmptyState,
  PageHeader,
  Pagination,
  SortTh,
  TableSkeleton,
  controlCls,
  labelCls,
} from "@/components/ui";

const DIMENSION_BASED = ["study_plan", "learning_style", "disc", "rmib"];
const CHART_COLORS = ["#0a7d4e", "#14b8a6", "#84cc16", "#047857", "#f59e0b", "#0d9488", "#65a30d"];

const TINGKAT_OPTIONS = [
  { value: 10, label: "Kelas X" },
  { value: 11, label: "Kelas XI" },
  { value: 12, label: "Kelas XII" },
];

type SortKey = "student" | "assessment" | "result" | "date";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;

function categoryCounts(rows: any[]) {
  const counts = new Map<string, number>();
  rows.forEach((r) => {
    if (r.category) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
  });
  return Array.from(counts, ([name, value]) => ({ name, value }));
}

function assessmentDistributionCounts(rows: any[]) {
  const counts = new Map<string, number>();
  rows.forEach((r) => {
    const title = r.assessments?.title ?? "Lainnya";
    counts.set(title, (counts.get(title) ?? 0) + 1);
  });
  return Array.from(counts, ([name, value]) => ({ name, value }));
}

export default function AssessmentResultsPage() {
  const [assessments, setAssessments] = useState<
    Pick<Assessment, "id" | "title" | "assessment_type">[]
  >([]);
  const [assessmentId, setAssessmentId] = useState<string>("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("");
  const [tingkatFilter, setTingkatFilter] = useState<number>(0); // 0 = semua tingkat

  // data pendukung untuk perhitungan per tingkat
  const [students, setStudents] = useState<any[]>([]);
  const [scopes, setScopes] = useState<AssessmentAdmin[]>([]);
  const [tingkatMap, setTingkatMap] = useState<Map<string, number>>(new Map());

  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAssessmentsForAdmin().then(setAssessments);
    fetchAllStudents().then(setStudents);
    fetchAssessmentsWithTingkat()
      .then(setScopes)
      .catch(() => {});
    fetchStudentTingkatMap()
      .then(setTingkatMap)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setCategoryFilter("");
    setClassFilter("");
    setPage(1);
    fetchAllResults(assessmentId || undefined)
      .then(setResults)
      .finally(() => setLoading(false));
  }, [assessmentId]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
    setPage(1);
  };

  // Hasil yang sesuai filter tingkat (tingkat = kelas aktif siswa saat ini)
  const byTingkat = useMemo(
    () =>
      tingkatFilter ? results.filter((r) => tingkatMap.get(r.student_id) === tingkatFilter) : results,
    [results, tingkatFilter, tingkatMap]
  );

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    byTingkat.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set).sort();
  }, [byTingkat]);

  const classOptions = useMemo(() => {
    const set = new Set<string>();
    byTingkat.forEach((r) => {
      if (r.profiles?.class_name) set.add(r.profiles.class_name);
    });
    return Array.from(set).sort();
  }, [byTingkat]);

  const filtered = useMemo(
    () =>
      byTingkat.filter((r) => {
        const matchesSearch = `${r.profiles?.full_name ?? ""} ${r.profiles?.class_name ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesCategory = !categoryFilter || r.category === categoryFilter;
        const matchesClass = !classFilter || r.profiles?.class_name === classFilter;
        return matchesSearch && matchesCategory && matchesClass;
      }),
    [byTingkat, search, categoryFilter, classFilter]
  );

  const isAllAssessments = !assessmentId;

  // Saat "Semua Asesmen": tampilkan proporsi hasil PER JENIS ASESMEN.
  // Saat 1 asesmen spesifik dipilih: tampilkan distribusi kategori hasilnya.
  const chartData = useMemo(
    () => (isAllAssessments ? assessmentDistributionCounts(filtered) : categoryCounts(filtered)),
    [isAllAssessments, filtered]
  );

  // Persentase pengisian per asesmen: siswa yang sudah mengisi dibagi siswa yang
  // WAJIB mengisi, yaitu siswa dengan tingkat kelas yang termasuk dalam tingkat
  // asesmen itu (dan sesuai filter tingkat / kelas yang sedang aktif).
  const completionData = useMemo(() => {
    if (!isAllAssessments) return [];

    const pool = students.filter((s) => {
      const t = tingkatMap.get(s.id);
      if (t == null) return false;
      if (tingkatFilter && t !== tingkatFilter) return false;
      if (classFilter && s.class_name !== classFilter) return false;
      return true;
    });

    return scopes
      .map((a) => {
        const eligibleIds = new Set(
          pool.filter((s) => a.tingkat.includes(tingkatMap.get(s.id) as number)).map((s) => s.id)
        );
        const doneIds = new Set(
          results
            .filter((r) => r.assessment_id === a.id && eligibleIds.has(r.student_id))
            .map((r) => r.student_id)
        );
        const denom = eligibleIds.size;
        return {
          title: a.title,
          active: a.is_active,
          count: doneIds.size,
          denom,
          pct: denom ? Math.round((doneIds.size / denom) * 100) : 0,
        };
      })
      .filter((c) => c.denom > 0 && (c.active || c.count > 0))
      .sort((a, b) => b.pct - a.pct);
  }, [isAllAssessments, scopes, students, results, tingkatMap, tingkatFilter, classFilter]);

  const chartSubtitle = [
    isAllAssessments ? "Semua Asesmen" : assessments.find((a) => a.id === assessmentId)?.title,
    tingkatFilter ? TINGKAT_OPTIONS.find((o) => o.value === tingkatFilter)?.label : "Semua Tingkat",
    classFilter || "Semua Kelas",
    categoryFilter ? `Hasil: ${categoryFilter}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "student") {
        cmp = String(a.profiles?.full_name ?? "").localeCompare(
          String(b.profiles?.full_name ?? ""),
          "id"
        );
      } else if (sortKey === "assessment") {
        cmp = String(a.assessments?.title ?? "").localeCompare(
          String(b.assessments?.title ?? ""),
          "id"
        );
      } else if (sortKey === "result") {
        cmp = String(a.category ?? "").localeCompare(String(b.category ?? ""), "id");
      } else {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const sortProps = (key: SortKey) => ({
    active: sortKey === key,
    dir: sortDir,
    onClick: () => handleSort(key),
  });

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      <PageHeader
        icon={FileBarChart}
        title="Hasil Asesmen"
        subtitle="Lihat dan filter hasil asesmen semua siswa, per asesmen, tingkat, dan hasil."
      />

      {/* Filter */}
      <div
        className="bg-white border border-primary-100 rounded-2xl p-4 mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 animate-fadeUp"
        style={{ animationDelay: "80ms" }}
      >
        <div>
          <label className={labelCls}>Asesmen</label>
          <select
            value={assessmentId}
            onChange={(e) => setAssessmentId(e.target.value)}
            className={controlCls}
          >
            <option value="">Semua Asesmen</option>
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Tingkat</label>
          <select
            value={tingkatFilter}
            onChange={(e) => {
              setTingkatFilter(Number(e.target.value));
              setClassFilter("");
              setCategoryFilter("");
              setPage(1);
            }}
            className={controlCls}
          >
            <option value={0}>Semua Tingkat</option>
            {TINGKAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Kelas</label>
          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setPage(1);
            }}
            disabled={classOptions.length === 0}
            className={controlCls}
          >
            <option value="">Semua Kelas</option>
            {classOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Hasil</label>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            disabled={categoryOptions.length === 0}
            className={controlCls}
          >
            <option value="">Semua Hasil</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Cari Siswa</label>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Nama atau kelas..."
              className={`${controlCls} pl-10`}
            />
          </div>
        </div>
      </div>

      {/* Tabel (kiri) + grafik (kanan), berdampingan di layar lebar */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_310px] gap-5 items-start">
        <div className="bg-white border border-primary-100 rounded-2xl overflow-hidden animate-fadeUp" style={{ animationDelay: "140ms" }}>
          {loading ? (
            <TableSkeleton />
          ) : sorted.length === 0 ? (
            <EmptyState text="Tidak ada hasil yang cocok dengan filter ini." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted text-xs border-b border-primary-50">
                      <SortTh label="Siswa" {...sortProps("student")} />
                      <SortTh label="Asesmen" {...sortProps("assessment")} />
                      <SortTh label="Hasil" {...sortProps("result")} />
                      <SortTh label="Tanggal" {...sortProps("date")} />
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((r, i) => {
                      const assessmentType = r.assessments?.assessment_type ?? "";
                      const isDimensionBased =
                        DIMENSION_BASED.includes(assessmentType) &&
                        r.dimension_scores &&
                        r.dimension_scores.length > 0;

                      return (
                        <tr
                          key={r.id}
                          className="border-b border-primary-50 last:border-0 animate-fadeUp"
                          style={{ animationDelay: `${i * 35}ms` }}
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={r.profiles?.full_name} size={34} />
                              <div className="min-w-0">
                                <Link
                                  href={`/admin/students/${r.student_id}`}
                                  className="font-semibold text-ink hover:text-primary-700 transition-colors"
                                >
                                  {r.profiles?.full_name ?? "-"}
                                </Link>
                                <p className="text-xs text-muted">{r.profiles?.class_name ?? ""}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-ink">{r.assessments?.title ?? "-"}</td>
                          <td className="px-5 py-3">
                            <span className="inline-block bg-primary-50 text-primary-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                              {isDimensionBased ? r.category : `${r.category ?? "-"}`}
                            </span>
                            {!isDimensionBased && r.total_score != null && (
                              <span className="text-xs text-muted ml-2 tabular-nums">
                                {r.total_score}/{r.max_score ?? "-"}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-muted whitespace-nowrap">
                            {new Date(r.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={safePage}
                totalPages={totalPages}
                total={sorted.length}
                pageSize={PAGE_SIZE}
                noun="hasil"
                onChange={setPage}
              />
            </>
          )}
        </div>

        {/* Grafik — ngikutin persis data yang lagi tampil di tabel kiri */}
        <div className="bg-white border border-primary-100 rounded-2xl p-5 lg:sticky lg:top-5 animate-fadeUp" style={{ animationDelay: "220ms" }}>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-primary-400 to-primary-700" />
            <h2 className="font-bold text-ink text-sm">
              {isAllAssessments ? "Proporsi Hasil per Asesmen" : "Distribusi Hasil"}
            </h2>
          </div>
          <p className="text-muted text-xs mb-2 leading-relaxed">{chartSubtitle}</p>

          {loading ? (
            <div className="h-[260px] rounded-xl bg-gradient-to-r from-primary-50 via-primary-100 to-primary-50 bg-[length:200%_100%] animate-shimmer" />
          ) : chartData.length === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-center gap-2">
              <PieChartIcon size={24} className="text-primary-300" />
              <p className="text-muted text-sm">Tidak ada data untuk filter ini.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="42%"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={3}
                  cornerRadius={4}
                  stroke="none"
                  label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
                  labelLine={false}
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
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 11, lineHeight: "16px" }}
                  formatter={(value) => <span className="text-ink">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          {/* Persentase pengisian per asesmen — cuma relevan saat "Semua Asesmen". */}
          {isAllAssessments && !loading && completionData.length > 0 && (
            <div className="mt-5 pt-5 border-t border-primary-50">
              <h3 className="font-bold text-ink text-sm mb-1">Persentase Pengisian</h3>
              <p className="text-muted text-[11px] mb-3 leading-relaxed">
                Dihitung dari siswa yang tingkatnya termasuk dalam asesmen tersebut.
              </p>
              <div className="flex flex-col gap-3">
                {completionData.map((c) => (
                  <div key={c.title}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-ink font-medium truncate pr-2">{c.title}</span>
                      <span className="text-xs text-muted shrink-0 tabular-nums">
                        {c.count}/{c.denom} ({c.pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-400 to-primary-700 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, c.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}