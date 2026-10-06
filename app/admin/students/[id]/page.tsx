"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileDown,
  Hash,
  Loader2,
  School,
  Star,
  Trophy,
} from "lucide-react";
import { fetchStudentById, fetchResultsForStudent } from "@/lib/assessmentService";
import { Avatar, EmptyState } from "@/components/ui";
import FormAnswers from "@/components/FormAnswers";

const DIMENSION_BASED = ["study_plan", "learning_style", "disc", "rmib"];
const LOWER_IS_BETTER = ["rmib"];

const shimmer =
  "rounded-2xl bg-gradient-to-r from-primary-50 via-primary-100 to-primary-50 bg-[length:200%_100%] animate-shimmer";

/* ---------- Ekspor PDF ---------- */

// Font bawaan PDF cuma mendukung karakter Latin; ganti tanda baca "pintar"
// (kutip lengkung, em dash, dst.) dan buang karakter yang tidak didukung.
const clean = (s: unknown) =>
  String(s ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");

// Nama kolom jenis kelamin di database bisa beda-beda, jadi dicek beberapa kemungkinan.
function genderText(student: any) {
  const raw = String(student.gender ?? student.jenis_kelamin ?? student.sex ?? "")
    .trim()
    .toLowerCase();
  if (!raw) return "-";
  if (["l", "laki-laki", "laki laki", "male", "m", "pria"].includes(raw)) return "Laki-laki";
  if (["p", "perempuan", "female", "f", "wanita"].includes(raw)) return "Perempuan";
  return String(student.gender ?? student.jenis_kelamin ?? student.sex);
}

// Kolom "Hasil Dimensi": asesmen berbasis dimensi -> kategori hasilnya,
// asesmen berbasis skor (mis. skala stres) -> kategori + skor.
function hasilText(r: any) {
  const type = r.assessments?.assessment_type ?? "";
  const isDimensionBased =
    DIMENSION_BASED.includes(type) && r.dimension_scores && r.dimension_scores.length > 0;
  if (isDimensionBased) return r.category ?? "-";
  return r.max_score
    ? `${r.category ?? "-"} (${r.total_score}/${r.max_score})`
    : r.category ?? "-";
}

const safeName = (s: string) => s.replace(/[\\/:*?"<>|]/g, "").trim();

async function exportToPdf(student: any, rows: any[], fileName: string) {
  // di-import saat dibutuhkan saja, supaya aman dari masalah SSR Next.js
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 14;

  // Judul
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(10, 125, 78);
  doc.text("LAPORAN HASIL ASESMEN SISWA", pageW / 2, 18, { align: "center" });
  doc.setDrawColor(10, 125, 78);
  doc.setLineWidth(0.6);
  doc.line(M, 22, pageW - M, 22);

  // Identitas: nama, NIS, jenis kelamin
  const info: [string, string][] = [
    ["Nama", student.full_name ?? "-"],
    ["NIS", student.nis ?? "-"],
    ["Jenis Kelamin", genderText(student)],
  ];
  doc.setFontSize(10.5);
  let y = 31;
  info.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(11, 31, 23);
    doc.text(label, M, y);
    doc.text(":", M + 32, y);
    doc.setFont("helvetica", "normal");
    doc.text(clean(value), M + 36, y);
    y += 7;
  });

  // Tabel: Nama Asesmen | Hasil Dimensi | Keterangan
  autoTable(doc, {
    startY: y + 4,
    head: [["Nama Asesmen", "Hasil Dimensi", "Keterangan"]],
    body: rows.map((r) => [
      clean(r.assessments?.title ?? "Asesmen"),
      clean(hasilText(r)),
      clean(r.recommendation ?? "-"),
    ]),
    margin: { left: M, right: M, bottom: 18 },
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 2.5,
      valign: "top",
      lineColor: [179, 240, 207],
      lineWidth: 0.2,
      textColor: [11, 31, 23],
    },
    headStyles: { fillColor: [10, 125, 78], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [239, 253, 245] },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: "bold" },
      1: { cellWidth: 46 },
      2: { cellWidth: "auto" },
    },
  });

  // Footer di setiap halaman
  const printed = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(91, 111, 102);
    doc.text(`Dicetak: ${printed}`, M, pageH - 8);
    doc.text(`Halaman ${i} dari ${total}`, pageW - M, pageH - 8, { align: "right" });
  }

  doc.save(fileName);
}

/* ---------- Halaman ---------- */

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const [student, setStudent] = useState<any | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null); // "all" atau id hasil

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
      <div className="p-4 sm:p-8 max-w-3xl flex flex-col gap-4">
        <div className={`${shimmer} h-44`} />
        <div className={`${shimmer} h-40`} />
        <div className={`${shimmer} h-40`} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl">
        <EmptyState text="Siswa tidak ditemukan." />
      </div>
    );
  }

  const runExport = async (key: string, rows: any[], fileName: string) => {
    setExporting(key);
    try {
      await exportToPdf(student, rows, fileName);
    } catch (err: any) {
      alert(err?.message ?? "Gagal membuat PDF.");
    } finally {
      setExporting(null);
    }
  };

  const handleExportAll = () =>
    runExport("all", results, safeName(`Hasil Asesmen - ${student.full_name}`) + ".pdf");

  const handleExportOne = (r: any) =>
    runExport(
      r.id,
      [r],
      safeName(`${r.assessments?.title ?? "Asesmen"} - ${student.full_name}`) + ".pdf"
    );

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <Link
        href="/admin/students"
        className="group inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary-700 mb-4 transition-colors"
      >
        <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1" />
        Kembali ke daftar siswa
      </Link>

      {/* Kartu profil */}
      <div className="bg-white border border-primary-100 rounded-2xl overflow-hidden mb-8 animate-fadeUp">
        <div className="h-24 bg-gradient-to-br from-primary-500 via-primary-700 to-primary-900 bg-[length:200%_200%] animate-gradient" />

        {/* avatar menimpa banner, nama & email sepenuhnya di bawah banner */}
        <div className="px-5 flex items-start gap-4">
          <div className="-mt-9 shrink-0 rounded-full ring-4 ring-white">
            <Avatar name={student.full_name} size={72} />
          </div>
          <div className="pt-3 min-w-0">
            <h1 className="text-xl font-extrabold text-ink tracking-tight leading-tight break-words">
              {student.full_name}
            </h1>
            <p className="text-muted text-sm mt-0.5 break-all">{student.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-5 pt-4 pb-5">
          <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-800 rounded-full px-3 py-1 text-xs font-semibold">
            <School size={13} />
            Kelas: {student.class_name ?? "-"}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-800 rounded-full px-3 py-1 text-xs font-semibold">
            <Hash size={13} />
            NIS: {student.nis ?? "-"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-extrabold text-ink tracking-tight">Riwayat Hasil Asesmen</h2>
          <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {results.length}
          </span>
        </div>
        {results.length > 0 && (
          <button
            onClick={handleExportAll}
            disabled={exporting !== null}
            className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            {exporting === "all" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileDown size={16} />
            )}
            Ekspor Semua PDF
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="bg-white border border-primary-100 rounded-2xl">
          <EmptyState text="Siswa ini belum menyelesaikan asesmen apa pun." />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {results.map((r, idx) => {
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
              <div
                key={r.id}
                className="relative overflow-hidden bg-white border border-primary-100 rounded-2xl p-5 pl-6 animate-fadeUp"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary-400 to-primary-700" />

                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-bold text-ink">{r.assessments?.title ?? "Asesmen"}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted bg-surface px-2.5 py-1 rounded-full">
                      {new Date(r.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      onClick={() => handleExportOne(r)}
                      disabled={exporting !== null}
                      title="Ekspor asesmen ini ke PDF"
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 disabled:opacity-60 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      {exporting === r.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <FileDown size={13} />
                      )}
                      PDF
                    </button>
                  </div>
                </div>

                {isDimensionBased ? (
                  <>
                    <div className="flex items-center gap-2 mb-4 bg-gradient-to-r from-primary-50 to-transparent rounded-xl px-3.5 py-2.5">
                      <Trophy size={16} color="#0a7d4e" />
                      <span className="text-sm font-bold text-primary-800">{r.category}</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {sortedDimensions.map((d: any) => {
                        const isTop = r.top_dimension_codes?.includes(d.code);
                        const pct =
                          !lowerIsBetter && d.maxScore
                            ? Math.min(100, Math.round((d.score / d.maxScore) * 100))
                            : 0;
                        return (
                          <div key={d.code}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span
                                className={`flex items-center gap-1.5 ${
                                  isTop ? "font-semibold text-primary-800" : "text-ink"
                                }`}
                              >
                                {d.label}
                                {isTop && <Star size={13} className="fill-amber-400 text-amber-500" />}
                              </span>
                              <span className="text-muted text-xs tabular-nums">
                                {lowerIsBetter ? `Rank ${d.score}` : `${d.score}/${d.maxScore}`}
                              </span>
                            </div>
                            {!lowerIsBetter && (
                              <div className="h-2 bg-surface rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${
                                    isTop
                                      ? "bg-gradient-to-r from-primary-400 to-primary-700"
                                      : "bg-primary-200"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : assessmentType === "form" ? (
                  <FormAnswers studentId={params.id} assessmentId={r.assessment_id} />
                ) : (
                  <p className="text-sm text-ink">
                    Skor: <span className="font-bold">{r.total_score}</span>/{r.max_score} —{" "}
                    <span className="font-bold text-primary-800">{r.category}</span>
                  </p>
                )}

                {r.recommendation && (
                  <p className="text-sm text-muted mt-4 leading-relaxed border-t border-primary-50 pt-3">
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