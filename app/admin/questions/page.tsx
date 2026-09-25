"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Upload,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  fetchAssessmentsForAdmin,
  fetchAllQuestions,
  deleteQuestion,
  fetchDimensionsForAssessment,
} from "@/lib/assessmentService";
import { Assessment, Dimension, Question, QuestionOption } from "@/types";
import ImportQuestionsModal from "@/components/ImportQuestionsModal";
import ImportDiscQuestionsModal from "@/components/ImportDiscQuestionsModal";
import ImportRmibQuestionsModal from "@/components/ImportRmibQuestionsModal";

const OPTIONS_BY_TYPE: Record<string, QuestionOption[]> = {
  study_plan: [
    { label: "Ya", value: 1 },
    { label: "Tidak", value: 0 },
  ],
  learning_style: [
    { label: "Ya", value: 1 },
    { label: "Tidak", value: 0 },
  ],
  stress_scale: [
    { label: "Sangat Setuju", value: 4 },
    { label: "Setuju", value: 3 },
    { label: "Tidak Setuju", value: 2 },
    { label: "Sangat Tidak Setuju", value: 1 },
  ],
};
const DEFAULT_IMPORTABLE_TYPES = Object.keys(OPTIONS_BY_TYPE);

type SortKey = "order" | "text";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;

export default function ManageQuestionsPage() {
  const [assessments, setAssessments] = useState<
    Pick<Assessment, "id" | "title" | "assessment_type">[]
  >([]);
  const [assessmentId, setAssessmentId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("order");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAssessmentsForAdmin().then((data) => {
      setAssessments(data);
      if (data.length > 0) setAssessmentId(data[0].id);
      else setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!assessmentId) return;
    setLoading(true);
    setSearch("");
    setPage(1);
    Promise.all([fetchAllQuestions(assessmentId), fetchDimensionsForAssessment(assessmentId)])
      .then(([q, d]) => {
        setQuestions(q);
        setDimensions(d);
      })
      .finally(() => setLoading(false));
  }, [assessmentId]);

  const reloadQuestions = () => {
    if (!assessmentId) return;
    fetchAllQuestions(assessmentId).then(setQuestions);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus soal ini? Tindakan ini tidak bisa dibatalkan.")) return;
    setDeletingId(id);
    try {
      await deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err: any) {
      alert(err.message ?? "Gagal menghapus soal.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const selectedAssessment = assessments.find((a) => a.id === assessmentId);
  const assessmentType = selectedAssessment?.assessment_type ?? "";
  const isRmib = assessmentType === "rmib";
  const isDisc = assessmentType === "disc";
  const isDefaultImportable = DEFAULT_IMPORTABLE_TYPES.includes(assessmentType);

  const filtered = useMemo(
    () =>
      questions.filter((q) =>
        `${q.question_text} ${q.question_order}`.toLowerCase().includes(search.toLowerCase())
      ),
    [questions, search]
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "order") cmp = a.question_order - b.question_order;
      else cmp = a.question_text.localeCompare(b.question_text, "id");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown size={13} className="text-muted/50" />;
    return sortDir === "asc" ? (
      <ArrowUp size={13} className="text-primary-700" />
    ) : (
      <ArrowDown size={13} className="text-primary-700" />
    );
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-1">Kelola Soal</h1>
          <p className="text-muted text-sm">Tambah, edit, atau hapus soal per asesmen.</p>
        </div>
        {assessmentId && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 bg-white border border-primary-100 hover:bg-surface text-ink text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Upload size={16} />
              Import dari Excel
            </button>
            <Link
              href={`/admin/questions/new?assessmentId=${assessmentId}`}
              className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus size={16} />
              Tambah Soal
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div>
          <label className="text-sm font-semibold text-ink mb-1.5 block">Asesmen</label>
          <select
            value={assessmentId}
            onChange={(e) => setAssessmentId(e.target.value)}
            className="bg-white border border-primary-100 rounded-xl px-3.5 py-2.5 text-sm min-w-[280px] outline-none focus:border-primary-700"
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} ({a.assessment_type})
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-semibold text-ink mb-1.5 block">Cari Soal</label>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari teks soal atau nomor urut..."
              className="w-full bg-white border border-primary-100 rounded-xl pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-primary-700"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-primary-100 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="px-5 py-8 flex justify-center">
            <Loader2 className="animate-spin text-primary-700" size={22} />
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-muted text-sm px-5 py-8 text-center">
            {questions.length === 0
              ? "Belum ada soal untuk asesmen ini."
              : "Tidak ada soal yang cocok dengan pencarian."}
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs border-b border-primary-50">
                  <th className="px-5 py-2.5 font-medium w-20">
                    <button
                      onClick={() => handleSort("order")}
                      className="flex items-center gap-1 hover:text-ink transition-colors"
                    >
                      Urutan
                      <SortIcon column="order" />
                    </button>
                  </th>
                  <th className="px-5 py-2.5 font-medium">
                    <button
                      onClick={() => handleSort("text")}
                      className="flex items-center gap-1 hover:text-ink transition-colors"
                    >
                      {isRmib ? "Kelompok" : "Teks Soal"}
                      <SortIcon column="text" />
                    </button>
                  </th>
                  <th className="px-5 py-2.5 font-medium w-32">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((q) => (
                  <tr key={q.id} className="border-b border-primary-50 last:border-0">
                    <td className="px-5 py-3 text-muted">{q.question_order}</td>
                    <td className="px-5 py-3 text-ink">{q.question_text}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/questions/${q.id}`}
                          className="w-8 h-8 rounded-lg bg-primary-50 hover:bg-primary-100 flex items-center justify-center transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} color="#0e6f4c" />
                        </Link>
                        <button
                          onClick={() => handleDelete(q.id)}
                          disabled={deletingId === q.id}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-50"
                          title="Hapus"
                        >
                          {deletingId === q.id ? (
                            <Loader2 size={14} className="animate-spin text-red-600" />
                          ) : (
                            <Trash2 size={14} color="#dc2626" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-primary-50 text-xs text-muted">
              <span>
                Menampilkan {(safePage - 1) * PAGE_SIZE + 1}-
                {Math.min(safePage * PAGE_SIZE, sorted.length)} dari {sorted.length} soal
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="w-7 h-7 rounded-lg border border-primary-100 flex items-center justify-center disabled:opacity-40 hover:bg-surface transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 font-medium text-ink">
                  {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="w-7 h-7 rounded-lg border border-primary-100 flex items-center justify-center disabled:opacity-40 hover:bg-surface transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showImportModal && selectedAssessment && isDefaultImportable && (
        <ImportQuestionsModal
          assessmentId={assessmentId}
          assessmentType={assessmentType}
          dimensions={dimensions}
          existingQuestions={questions}
          options={OPTIONS_BY_TYPE[assessmentType] ?? []}
          onClose={() => setShowImportModal(false)}
          onImported={reloadQuestions}
        />
      )}

      {showImportModal && selectedAssessment && isDisc && (
        <ImportDiscQuestionsModal
          assessmentId={assessmentId}
          dimensions={dimensions}
          existingQuestions={questions}
          onClose={() => setShowImportModal(false)}
          onImported={reloadQuestions}
        />
      )}

      {showImportModal && selectedAssessment && isRmib && (
        <ImportRmibQuestionsModal
          assessmentId={assessmentId}
          dimensions={dimensions}
          existingQuestions={questions}
          onClose={() => setShowImportModal(false)}
          onImported={reloadQuestions}
        />
      )}

      {showImportModal && selectedAssessment && !isDefaultImportable && !isDisc && !isRmib && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <p className="text-sm text-ink mb-4">
              Import Excel belum tersedia untuk tipe asesmen &quot;{assessmentType}&quot;.
            </p>
            <button
              onClick={() => setShowImportModal(false)}
              className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold text-sm rounded-xl py-2.5 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}