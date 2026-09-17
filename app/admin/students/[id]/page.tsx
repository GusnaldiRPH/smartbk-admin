"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Trophy } from "lucide-react";
import { fetchStudentById, fetchResultsForStudent } from "@/lib/assessmentService";

const DIMENSION_BASED = ["study_plan", "learning_style", "disc", "rmib"];
const LOWER_IS_BETTER = ["rmib"];

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const [student, setStudent] = useState<any | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchStudentById(params.id), fetchResultsForStudent(params.id)])
      .then(([s, r]) => {
        setStudent(s);
        setResults(r);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-8">
        <Loader2 className="animate-spin text-primary-700" size={22} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8">
        <p className="text-muted text-sm">Siswa tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary-700 mb-4"
      >
        <ArrowLeft size={15} />
        Kembali ke daftar siswa
      </Link>

      <div className="bg-white border border-primary-100 rounded-2xl p-5 mb-6">
        <h1 className="text-xl font-bold text-ink">{student.full_name}</h1>
        <p className="text-muted text-sm mt-0.5">{student.email}</p>
        <div className="flex gap-4 mt-3 text-sm">
          <span className="text-muted">
            Kelas: <span className="text-ink font-medium">{student.class_name ?? "-"}</span>
          </span>
          <span className="text-muted">
            NIS: <span className="text-ink font-medium">{student.nis ?? "-"}</span>
          </span>
        </div>
      </div>

      <h2 className="text-lg font-bold text-ink mb-3">Riwayat Hasil Asesmen</h2>

      {results.length === 0 ? (
        <p className="text-muted text-sm">Siswa ini belum menyelesaikan asesmen apa pun.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {results.map((r) => {
            const assessmentType = r.assessments?.assessment_type ?? "";
            const isDimensionBased =
              DIMENSION_BASED.includes(assessmentType) &&
              r.dimension_scores &&
              r.dimension_scores.length > 0;
            const lowerIsBetter = LOWER_IS_BETTER.includes(assessmentType);
            const sortedDimensions = isDimensionBased
              ? [...r.dimension_scores].sort((a: any, b: any) =>
                  lowerIsBetter ? a.score - b.score : b.score - a.score
                )
              : [];

            return (
              <div key={r.id} className="bg-white border border-primary-100 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-ink">{r.assessments?.title ?? "Asesmen"}</h3>
                  <span className="text-xs text-muted">
                    {new Date(r.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {isDimensionBased ? (
                  <>
                    <div className="flex items-center gap-2 mb-3 bg-primary-50 rounded-xl px-3.5 py-2.5">
                      <Trophy size={16} color="#0e6f4c" />
                      <span className="text-sm font-semibold text-primary-800">
                        {r.category}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {sortedDimensions.map((d: any) => {
                        const isTop = r.top_dimension_codes?.includes(d.code);
                        return (
                          <div
                            key={d.code}
                            className="flex items-center justify-between text-sm"
                          >
                            <span
                              className={isTop ? "font-semibold text-primary-800" : "text-ink"}
                            >
                              {d.label} {isTop ? "⭐" : ""}
                            </span>
                            <span className="text-muted text-xs">
                              {lowerIsBetter ? `Rank ${d.score}` : `${d.score}/${d.maxScore}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-ink">
                    Skor: <span className="font-semibold">{r.total_score}</span>/{r.max_score}{" "}
                    — <span className="font-semibold">{r.category}</span>
                  </p>
                )}

                {r.recommendation && (
                  <p className="text-sm text-muted mt-3 leading-relaxed border-t border-primary-50 pt-3">
                    {r.recommendation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
