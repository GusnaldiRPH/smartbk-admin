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
  ListOrdered,
  ListChecks,
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
import ReorderQuestionsModal from "@/components/ReorderQuestionsModal";
import {
  EmptyState,
  PageHeader,
  Pagination,
  SortTh,
  TableSkeleton,
  controlCls,
  labelCls,
} from "@/components/ui";

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
  const [showReorderModal, setShowReorderModal] = useState(false);

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

  const orderedForReorder = useMemo(
    () => [...questions].sort((a, b) => a.question_order - b.question_order),
    [questions]
  );

  const sortProps = (key: SortKey) => ({
    active: sortKey === key,
    dir: sortDir,
    onClick: () => handleSort(key),
  });

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <PageHeader
        icon={ListChecks}
        title="Kelola Soal"
        subtitle={
          loading ? "Memuat soal..." : `${questions.length} soal pada asesmen terpilih • tambah, edit, atau hapus`
        }
        actions={
          assessmentId && (
            <>
              <button
                onClick={() => setShowReorderModal(true)}
                disabled={questions.length < 2}
                className="flex items-center gap-2 bg-white border border-primary-100 hover:bg-surface disabled:opacity-40 text-ink text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                title={questions.length < 2 ? "Minimal 2 soal untuk diatur urutannya" : ""}
              >
                <ListOrdered size={16} />
                Atur Urutan
              </button>
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
            </>
          )
        }
      />

      <div className="flex flex-wrap gap-3 mb-5 animate-fadeUp" style={{ animationDelay: "80ms" }}>
        <div>
          <label className={labelCls}>Asesmen</label>
          <select
            value={assessmentId}
            onChange={(e) => setAssessmentId(e.target.value)}
            className={`${controlCls} min-w-[280px]`}
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} ({a.assessment_type})
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className={labelCls}>Cari Soal</label>
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
              className={`${controlCls} pl-10`}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-primary-100 rounded-2xl overflow-hidden animate-fadeUp" style={{ animationDelay: "140ms" }}>
        {loading ? (
          <TableSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            text={
              questions.length === 0
                ? "Belum ada soal untuk asesmen ini."
                : "Tidak ada soal yang cocok dengan pencarian."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted text-xs border-b border-primary-50">
                    <SortTh label="Urutan" className="w-28" {...sortProps("order")} />
                    <SortTh label={isRmib ? "Kelompok" : "Teks Soal"} {...sortProps("text")} />
                    <th className="px-5 py-3 w-32">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((q, i) => (
                    <tr
                      key={q.id}
                      className="border-b border-primary-50 last:border-0 animate-fadeUp"
                      style={{ animationDelay: `${i * 35}ms` }}
                    >
                      <td className="px-5 py-3">
                        <span className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 font-bold text-xs flex items-center justify-center tabular-nums">
                          {q.question_order}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink leading-relaxed">{q.question_text}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/questions/${q.id}`}
                            className="w-8 h-8 rounded-lg bg-primary-50 hover:bg-primary-100 flex items-center justify-center transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} color="#0a7d4e" />
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
            </div>

            <Pagination
              page={safePage}
              totalPages={totalPages}
              total={sorted.length}
              pageSize={PAGE_SIZE}
              noun="soal"
              onChange={setPage}
            />
          </>
        )}
      </div>

      {showReorderModal && (
        <ReorderQuestionsModal
          questions={orderedForReorder}
          onClose={() => setShowReorderModal(false)}
          onSaved={reloadQuestions}
        />
      )}

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
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center animate-popIn">
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