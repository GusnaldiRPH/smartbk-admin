"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  fetchAssessmentsForAdmin,
  fetchAllQuestions,
  deleteQuestion,
} from "@/lib/assessmentService";
import { Assessment, Question } from "@/types";

export default function ManageQuestionsPage() {
  const [assessments, setAssessments] = useState<
    Pick<Assessment, "id" | "title" | "assessment_type">[]
  >([]);
  const [assessmentId, setAssessmentId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    fetchAllQuestions(assessmentId)
      .then(setQuestions)
      .finally(() => setLoading(false));
  }, [assessmentId]);

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

  const selectedAssessment = assessments.find((a) => a.id === assessmentId);
  const isRmib = selectedAssessment?.assessment_type === "rmib";

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-1">Kelola Soal</h1>
          <p className="text-muted text-sm">Tambah, edit, atau hapus soal per asesmen.</p>
        </div>
        {assessmentId && (
          <Link
            href={`/admin/questions/new?assessmentId=${assessmentId}`}
            className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={16} />
            Tambah Soal
          </Link>
        )}
      </div>

      <div className="mb-5">
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

      <div className="bg-white border border-primary-100 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="px-5 py-8 flex justify-center">
            <Loader2 className="animate-spin text-primary-700" size={22} />
          </div>
        ) : questions.length === 0 ? (
          <p className="text-muted text-sm px-5 py-8 text-center">
            Belum ada soal untuk asesmen ini.
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-left text-muted text-xs border-b border-primary-50">
                  <th className="px-5 py-2.5 font-medium w-16">Urutan</th>
                  <th className="px-5 py-2.5 font-medium">
                    {isRmib ? "Kelompok" : "Teks Soal"}
                  </th>
                  <th className="px-5 py-2.5 font-medium w-32">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
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
          </div>
        )}
      </div>
    </div>
  );
}