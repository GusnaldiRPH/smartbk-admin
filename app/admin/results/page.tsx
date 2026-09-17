"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { fetchAssessmentsForAdmin, fetchAllResults } from "@/lib/assessmentService";
import { Assessment } from "@/types";

const DIMENSION_BASED = ["study_plan", "learning_style", "disc", "rmib"];

export default function AssessmentResultsPage() {
  const [assessments, setAssessments] = useState<
    Pick<Assessment, "id" | "title" | "assessment_type">[]
  >([]);
  const [assessmentId, setAssessmentId] = useState<string>("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  useEffect(() => {
    fetchAssessmentsForAdmin().then(setAssessments);
  }, []);

  useEffect(() => {
    setLoading(true);
    setCategoryFilter("");
    fetchAllResults(assessmentId || undefined)
      .then(setResults)
      .finally(() => setLoading(false));
  }, [assessmentId]);

  // Daftar kategori/hasil unik yang muncul di data saat ini, buat dropdown filter kedua.
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    results.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set).sort();
  }, [results]);

  const filtered = results.filter((r) => {
    const matchesSearch = `${r.profiles?.full_name ?? ""} ${r.profiles?.class_name ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-ink mb-1">Hasil Asesmen</h1>
      <p className="text-muted text-sm mb-6">
        Lihat dan filter hasil asesmen semua siswa, per asesmen dan per hasil.
      </p>

      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <label className="text-sm font-semibold text-ink mb-1.5 block">Asesmen</label>
          <select
            value={assessmentId}
            onChange={(e) => setAssessmentId(e.target.value)}
            className="bg-white border border-primary-100 rounded-xl px-3.5 py-2.5 text-sm min-w-[240px] outline-none focus:border-primary-700"
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
          <label className="text-sm font-semibold text-ink mb-1.5 block">Hasil</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            disabled={categoryOptions.length === 0}
            className="bg-white border border-primary-100 rounded-xl px-3.5 py-2.5 text-sm min-w-[200px] outline-none focus:border-primary-700 disabled:bg-surface disabled:text-muted"
          >
            <option value="">Semua Hasil</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 min-w-[220px]">
          <label className="text-sm font-semibold text-ink mb-1.5 block">Cari Siswa</label>
          <Search size={15} className="absolute left-3.5 top-[42px] text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nama atau kelas..."
            className="w-full bg-white border border-primary-100 rounded-xl pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-primary-700"
          />
        </div>
      </div>

      <div className="bg-white border border-primary-100 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="px-5 py-8 flex justify-center">
            <Loader2 className="animate-spin text-primary-700" size={22} />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted text-sm px-5 py-8 text-center">
            Tidak ada hasil yang cocok dengan filter ini.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted text-xs border-b border-primary-50">
                <th className="px-5 py-2.5 font-medium">Siswa</th>
                <th className="px-5 py-2.5 font-medium">Asesmen</th>
                <th className="px-5 py-2.5 font-medium">Hasil</th>
                <th className="px-5 py-2.5 font-medium">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const assessmentType = r.assessments?.assessment_type ?? "";
                const isDimensionBased =
                  DIMENSION_BASED.includes(assessmentType) &&
                  r.dimension_scores &&
                  r.dimension_scores.length > 0;

                return (
                  <tr key={r.id} className="border-b border-primary-50 last:border-0">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/students/${r.student_id}`}
                        className="font-semibold text-ink hover:text-primary-700"
                      >
                        {r.profiles?.full_name ?? "-"}
                      </Link>
                      <p className="text-xs text-muted">{r.profiles?.class_name ?? ""}</p>
                    </td>
                    <td className="px-5 py-3 text-ink">{r.assessments?.title ?? "-"}</td>
                    <td className="px-5 py-3">
                      <span className="inline-block bg-primary-50 text-primary-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {isDimensionBased ? r.category : `${r.category ?? "-"}`}
                      </span>
                      {!isDimensionBased && (
                        <span className="text-xs text-muted ml-2">
                          {r.total_score}/{r.max_score ?? "-"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted">
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
        )}
      </div>
    </div>
  );
}