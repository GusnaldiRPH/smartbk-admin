"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { X, Loader2, Upload, Download, CheckCircle2, XCircle } from "lucide-react";
import { createQuestion } from "@/lib/assessmentService";
import { Dimension, Question } from "@/types";

interface ParsedRow {
  groupOrder?: number;
  jobsByDimCode: Record<string, string>;
  rowNum: number;
  error?: string;
}

interface RowResult {
  row: number;
  label: string;
  success: boolean;
  error?: string;
}

interface Props {
  assessmentId: string;
  dimensions: Dimension[];
  existingQuestions: Question[];
  onClose: () => void;
  onImported: () => void;
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase();
}

export default function ImportRmibQuestionsModal({
  assessmentId,
  dimensions,
  existingQuestions,
  onClose,
  onImported,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<RowResult[] | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const existingOrders = new Set(existingQuestions.map((q) => q.question_order));

  const handleDownloadTemplate = () => {
    const exampleRow: Record<string, any> = { "Nomor Kelompok (wajib)": 1 };
    dimensions.forEach((d) => {
      exampleRow[d.label] = "Contoh nama pekerjaan";
    });

    const wsSoal = XLSX.utils.json_to_sheet([exampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSoal, "Kelompok RMIB");
    XLSX.writeFile(wb, "template-import-soal-rmib.xlsx");
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
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (rows.length === 0) {
          setSummaryError("File kosong atau formatnya tidak sesuai.");
          setParsedRows([]);
          return;
        }

        const parsed: ParsedRow[] = rows.map((row, idx) => {
          const normalizedRow: Record<string, any> = {};
          Object.keys(row).forEach((k) => (normalizedRow[normalizeKey(k)] = row[k]));

          const orderRaw = String(
            normalizedRow["nomor kelompok (wajib)"] ??
              normalizedRow["nomor kelompok"] ??
              normalizedRow["kelompok"] ??
              ""
          ).trim();
          const groupOrder = orderRaw ? Number(orderRaw) : undefined;

          const jobsByDimCode: Record<string, string> = {};
          let error: string | undefined;

          if (!orderRaw || !groupOrder || Number.isNaN(groupOrder)) {
            error = "Nomor Kelompok kosong atau bukan angka.";
          } else if (existingOrders.has(groupOrder)) {
            error = `Kelompok ${groupOrder} sudah ada di asesmen ini.`;
          }

          for (const d of dimensions) {
            const jobName = String(normalizedRow[normalizeKey(d.label)] ?? "").trim();
            if (!error && !jobName) error = `Pekerjaan untuk "${d.label}" kosong.`;
            jobsByDimCode[d.code] = jobName;
          }

          return { groupOrder, jobsByDimCode, rowNum: idx + 2, error };
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

    for (const row of validRows) {
      const label = `Kelompok ${row.groupOrder}`;
      try {
        await createQuestion({
          assessment_id: assessmentId,
          question_text: label,
          question_order: row.groupOrder as number,
          options: dimensions.map((d, idx) => ({
            label: row.jobsByDimCode[d.code],
            value: idx + 1,
            dimension_code: d.code,
          })),
          scoring_rules: { type: "rank", min: 1, max: dimensions.length },
        });
        results.push({ row: row.rowNum, label, success: true });
      } catch (err: any) {
        results.push({
          row: row.rowNum,
          label,
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

        <h2 className="text-lg font-bold text-ink mb-1">Import Kelompok RMIB dari Excel</h2>
        <p className="text-muted text-sm mb-4">
          Tiap baris = 1 kelompok. Kolom nama pekerjaan otomatis mengikuti dimensi asesmen ini —
          isi 1 nama pekerjaan untuk tiap dimensi di baris yang sama.
        </p>

        {dimensions.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-sm text-amber-800 mb-4">
            Asesmen ini belum punya dimensi. Tambahkan dimensi dulu sebelum import kelompok.
          </div>
        ) : (
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 text-sm font-medium text-primary-700 hover:underline mb-4"
          >
            <Download size={15} />
            Download Template Excel
          </button>
        )}

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
                  {validRows.length} kelompok siap diimport
                  {invalidRows.length > 0 && `, ${invalidRows.length} baris bermasalah`}
                </p>

                <div className="border border-primary-100 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-surface">
                      <tr className="text-left text-muted">
                        <th className="px-3 py-2">Baris</th>
                        <th className="px-3 py-2">Kelompok</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((r) => (
                        <tr key={r.rowNum} className="border-t border-primary-50">
                          <td className="px-3 py-1.5 text-muted">{r.rowNum}</td>
                          <td className="px-3 py-1.5 text-ink">{r.groupOrder ?? "-"}</td>
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
                Import {validRows.length > 0 ? `${validRows.length} Kelompok` : ""}
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
                    <th className="px-3 py-2">Kelompok</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.row} className="border-t border-primary-50">
                      <td className="px-3 py-1.5 text-muted">{r.row}</td>
                      <td className="px-3 py-1.5 text-ink">{r.label}</td>
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