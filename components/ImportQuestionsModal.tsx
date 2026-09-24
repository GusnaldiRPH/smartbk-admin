"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { X, Loader2, Upload, Download, CheckCircle2, XCircle } from "lucide-react";
import { createQuestion } from "@/lib/assessmentService";
import { Dimension, Question, QuestionOption } from "@/types";

interface ParsedRow {
  question_order?: number;
  question_text: string;
  dimension_code: string;
  rowNum: number;
  error?: string;
}

interface RowResult {
  row: number;
  text: string;
  success: boolean;
  error?: string;
}

interface Props {
  assessmentId: string;
  assessmentType: string;
  dimensions: Dimension[];
  existingQuestions: Question[];
  options: QuestionOption[]; // opsi jawaban standar (Ya/Tidak atau Likert) untuk tipe asesmen ini
  onClose: () => void;
  onImported: () => void;
}

const HEADER_ALIASES: Record<string, string[]> = {
  question_order: ["urutan", "urutan (opsional)", "no"],
  question_text: ["teks soal", "soal", "pertanyaan", "teks soal (wajib)"],
  dimension_code: ["kode dimensi", "dimensi", "kode dimensi (wajib)"],
};

function normalizeKey(key: string) {
  return key.trim().toLowerCase();
}

function findField(row: Record<string, any>, field: keyof typeof HEADER_ALIASES): string {
  const aliases = HEADER_ALIASES[field];
  const normalizedRow: Record<string, any> = {};
  Object.keys(row).forEach((k) => {
    normalizedRow[normalizeKey(k)] = row[k];
  });
  for (const alias of aliases) {
    if (normalizedRow[alias] != null && normalizedRow[alias] !== "") {
      return String(normalizedRow[alias]).trim();
    }
  }
  return "";
}

export default function ImportQuestionsModal({
  assessmentId,
  assessmentType,
  dimensions,
  existingQuestions,
  options,
  onClose,
  onImported,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<RowResult[] | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const dimensionCodeSet = new Map(dimensions.map((d) => [d.code.toLowerCase(), d.code]));
  const startOrder =
    existingQuestions.length > 0
      ? Math.max(...existingQuestions.map((q) => q.question_order)) + 1
      : 1;

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    const wsSoal = XLSX.utils.json_to_sheet([
      {
        "Urutan (opsional)": "",
        "Teks Soal (wajib)": "Saya lebih suka belajar dengan melihat gambar atau diagram.",
        "Kode Dimensi (wajib)": dimensions[0]?.code ?? "contoh_kode",
      },
    ]);
    XLSX.utils.book_append_sheet(wb, wsSoal, "Soal");

    const wsDim = XLSX.utils.json_to_sheet(
      dimensions.length > 0
        ? dimensions.map((d) => ({ "Kode Dimensi": d.code, Label: d.label }))
        : [{ "Kode Dimensi": "(belum ada dimensi untuk asesmen ini)", Label: "" }]
    );
    XLSX.utils.book_append_sheet(wb, wsDim, "Referensi Dimensi");

    XLSX.writeFile(wb, "template-import-soal.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResults(null);
    setSummaryError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (rows.length === 0) {
          setSummaryError("File kosong atau formatnya tidak sesuai.");
          setParsedRows([]);
          return;
        }

        const parsed: ParsedRow[] = rows.map((row, idx) => {
          const orderRaw = findField(row, "question_order");
          const question_text = findField(row, "question_text");
          const dimension_code_raw = findField(row, "dimension_code");
          const matchedCode = dimensionCodeSet.get(dimension_code_raw.toLowerCase());

          let error: string | undefined;
          if (!question_text) error = "Teks Soal kosong.";
          else if (!dimension_code_raw) error = "Kode Dimensi kosong.";
          else if (!matchedCode)
            error = `Kode Dimensi "${dimension_code_raw}" tidak ditemukan di asesmen ini.`;

          return {
            question_order: orderRaw ? Number(orderRaw) : undefined,
            question_text,
            dimension_code: matchedCode ?? dimension_code_raw,
            rowNum: idx + 2,
            error,
          };
        });

        setParsedRows(parsed);
      } catch {
        setSummaryError(
          "Gagal membaca file. Pastikan formatnya .xlsx, .xls, atau .csv sesuai template."
        );
        setParsedRows([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const validRows = parsedRows.filter((r) => !r.error);
  const invalidRows = parsedRows.filter((r) => r.error);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setSubmitting(true);
    setSummaryError(null);

    const results: RowResult[] = [];
    let nextOrder = startOrder;

    // Diproses satu-satu, bukan paralel, supaya urutan (question_order)
    // tetap konsisten dan 1 baris gagal tidak menghentikan baris lainnya.
    for (const row of validRows) {
      const order = row.question_order ?? nextOrder;
      if (!row.question_order) nextOrder += 1;

      try {
        await createQuestion({
          assessment_id: assessmentId,
          question_text: row.question_text,
          question_order: order,
          options,
          scoring_rules: { dimension_code: row.dimension_code },
        });
        results.push({ row: row.rowNum, text: row.question_text, success: true });
      } catch (err: any) {
        results.push({
          row: row.rowNum,
          text: row.question_text,
          success: false,
          error: err.message ?? "Gagal menyimpan.",
        });
      }
    }

    setResults(results);
    if (results.some((r) => r.success)) onImported();
    setSubmitting(false);
  };

  const reset = () => {
    setParsedRows([]);
    setFileName("");
    setResults(null);
    setSummaryError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-ink"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-bold text-ink mb-1">Import Soal dari Excel</h2>
        <p className="text-muted text-sm mb-4">
          Untuk tipe soal Ya/Tidak &amp; Skala Likert. Kolom <b>Teks Soal</b> dan{" "}
          <b>Kode Dimensi</b> wajib diisi — kode dimensi harus sesuai dengan dimensi yang sudah
          ada di asesmen ini (lihat sheet &quot;Referensi Dimensi&quot; di template).
        </p>

        {dimensions.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-sm text-amber-800 mb-4">
            Asesmen ini belum punya dimensi. Tambahkan dimensi dulu sebelum import soal.
          </div>
        )}

        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 text-sm font-medium text-primary-700 hover:underline mb-4"
        >
          <Download size={15} />
          Download Template Excel
        </button>

        {!results && (
          <>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary-100 rounded-xl py-8 cursor-pointer hover:border-primary-700 transition-colors mb-4">
              <Upload size={22} className="text-primary-700" />
              <span className="text-sm text-ink font-medium text-center px-4">
                {fileName || "Klik untuk pilih file .xlsx / .xls / .csv"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {summaryError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-sm text-red-700 mb-4">
                {summaryError}
              </div>
            )}

            {parsedRows.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-ink font-semibold mb-2">
                  {validRows.length} baris siap diimport
                  {invalidRows.length > 0 && `, ${invalidRows.length} baris bermasalah`}
                </p>

                <div className="border border-primary-100 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-surface">
                      <tr className="text-left text-muted">
                        <th className="px-3 py-2">Baris</th>
                        <th className="px-3 py-2">Teks Soal</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((r) => (
                        <tr key={r.rowNum} className="border-t border-primary-50">
                          <td className="px-3 py-1.5 text-muted">{r.rowNum}</td>
                          <td className="px-3 py-1.5 text-ink">
                            {r.question_text || "-"}
                          </td>
                          <td className="px-3 py-1.5">
                            {r.error ? (
                              <span className="text-red-600">{r.error}</span>
                            ) : (
                              <span className="text-primary-700">Siap</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {parsedRows.length > 0 && (
                <button
                  onClick={reset}
                  className="flex-1 border border-primary-100 text-ink text-sm font-semibold rounded-xl py-3 hover:bg-surface transition-colors"
                >
                  Pilih File Lain
                </button>
              )}
              <button
                onClick={handleImport}
                disabled={validRows.length === 0 || submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl py-3 transition-colors"
              >
                {submitting && <Loader2 className="animate-spin" size={16} />}
                Import {validRows.length > 0 ? `${validRows.length} Soal` : ""}
              </button>
            </div>
          </>
        )}

        {results && (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle2 size={16} className="text-primary-700" />
                <span className="font-semibold text-ink">
                  {results.filter((r) => r.success).length} berhasil
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <XCircle size={16} className="text-red-600" />
                <span className="font-semibold text-ink">
                  {results.filter((r) => !r.success).length} gagal
                </span>
              </div>
            </div>

            <div className="border border-primary-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto mb-4">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-surface">
                  <tr className="text-left text-muted">
                    <th className="px-3 py-2">Baris</th>
                    <th className="px-3 py-2">Teks Soal</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.row} className="border-t border-primary-50">
                      <td className="px-3 py-1.5 text-muted">{r.row}</td>
                      <td className="px-3 py-1.5 text-ink">{r.text}</td>
                      <td className="px-3 py-1.5">
                        {r.success ? (
                          <span className="text-primary-700">Berhasil</span>
                        ) : (
                          <span className="text-red-600">{r.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold text-sm rounded-xl py-3 transition-colors"
            >
              Selesai
            </button>
          </div>
        )}
      </div>
    </div>
  );
}