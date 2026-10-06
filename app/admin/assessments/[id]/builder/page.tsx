"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlignLeft,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CircleDot,
  FileText,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteFormQuestion,
  fetchAssessmentBasic,
  fetchFormQuestions,
  saveFormQuestion,
  swapQuestionOrder,
  type FormInputType,
  type FormQuestion,
  type FormQuestionDraft,
} from "@/lib/assessmentAdminService";
import { EmptyState, PageHeader, controlCls, labelCls } from "@/components/ui";

const INPUT_TYPES: { value: FormInputType; label: string; hint: string; icon: typeof AlignLeft }[] = [
  { value: "text", label: "Isian", hint: "Siswa mengetik jawaban", icon: AlignLeft },
  { value: "single", label: "Pilihan tunggal", hint: "Pilih satu jawaban", icon: CircleDot },
  { value: "multiple", label: "Pilihan ganda", hint: "Boleh pilih lebih dari satu", icon: ListChecks },
];
const typeMeta = (t: FormInputType) => INPUT_TYPES.find((x) => x.value === t)!;

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 shrink-0 rounded-full transition-colors duration-300 ${
        on ? "bg-primary-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
          on ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

/* ---------- Editor satu pertanyaan ---------- */

function QuestionEditor({
  initial,
  saving,
  onCancel,
  onSave,
}: {
  initial: FormQuestion | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (draft: FormQuestionDraft) => void;
}) {
  const [text, setText] = useState(initial?.question_text ?? "");
  const [type, setType] = useState<FormInputType>(initial?.input_type ?? "single");
  const [required, setRequired] = useState(initial?.required ?? true);
  const [options, setOptions] = useState<string[]>(
    initial?.options && initial.options.length > 0 ? initial.options : ["", ""]
  );
  const [error, setError] = useState<string | null>(null);

  const setOption = (i: number, v: string) => setOptions((prev) => prev.map((o, idx) => (idx === i ? v : o)));

  const handleSave = () => {
    if (!text.trim()) return setError("Teks pertanyaan wajib diisi.");
    let cleaned: string[] = [];
    if (type !== "text") {
      cleaned = options.map((o) => o.trim()).filter(Boolean);
      if (cleaned.length < 2) return setError("Pilihan jawaban minimal 2.");
      if (new Set(cleaned.map((o) => o.toLowerCase())).size !== cleaned.length) {
        return setError("Ada pilihan jawaban yang sama. Setiap pilihan harus berbeda.");
      }
    }
    setError(null);
    onSave({ id: initial?.id, question_text: text, input_type: type, required, options: cleaned });
  };

  return (
    <div className="bg-white border-2 border-primary-300 rounded-2xl p-5 animate-fadeUp">
      <div className="flex flex-col gap-4">
        <div>
          <label className={labelCls}>Pertanyaan</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            autoFocus
            placeholder="Tulis pertanyaannya di sini"
            className={`${controlCls} resize-y leading-relaxed`}
          />
        </div>

        <div>
          <label className={labelCls}>Jenis Jawaban</label>
          <div className="grid sm:grid-cols-3 gap-2">
            {INPUT_TYPES.map((t) => {
              const Icon = t.icon;
              const on = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex items-center gap-2.5 text-left rounded-xl border px-3.5 py-2.5 transition-all ${
                    on
                      ? "bg-primary-50 border-primary-500 ring-4 ring-primary-500/10"
                      : "bg-white border-primary-100 hover:border-primary-300"
                  }`}
                >
                  <Icon size={17} className={on ? "text-primary-700" : "text-muted"} />
                  <span>
                    <span className={`block text-sm font-semibold ${on ? "text-primary-800" : "text-ink"}`}>
                      {t.label}
                    </span>
                    <span className="block text-[11px] text-muted">{t.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {type !== "text" && (
          <div>
            <label className={labelCls}>Pilihan Jawaban</label>
            <div className="flex flex-col gap-2">
              {options.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-primary-50 text-primary-700 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <input
                    value={o}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={`Pilihan ${i + 1}`}
                    className={controlCls}
                  />
                  <button
                    type="button"
                    onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
                    disabled={options.length <= 2}
                    className="w-9 h-9 shrink-0 rounded-lg bg-red-50 hover:bg-red-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors"
                    aria-label="Hapus pilihan"
                  >
                    <X size={15} color="#dc2626" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOptions((prev) => [...prev, ""])}
              className="mt-2.5 flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              <Plus size={15} />
              Tambah pilihan
            </button>
          </div>
        )}

        <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">Wajib dijawab</p>
            <p className="text-xs text-muted">Siswa tidak bisa lanjut kalau pertanyaan ini belum dijawab.</p>
          </div>
          <Toggle on={required} onChange={setRequired} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-white border border-primary-100 hover:bg-surface text-ink text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {initial ? "Simpan Pertanyaan" : "Tambah Pertanyaan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Halaman ---------- */

export default function FormBuilderPage({ params }: { params: { id: string } }) {
  const [assessment, setAssessment] = useState<{ id: string; title: string; assessment_type: string } | null>(null);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = async () => {
    const q = await fetchFormQuestions(params.id);
    setQuestions(q);
  };

  useEffect(() => {
    Promise.all([fetchAssessmentBasic(params.id), fetchFormQuestions(params.id)])
      .then(([a, q]) => {
        setAssessment(a);
        setQuestions(q);
      })
      .catch((e: any) => setLoadError(e?.message ?? "Gagal memuat form."))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSave = async (draft: FormQuestionDraft) => {
    setSaving(true);
    try {
      const nextOrder = questions.length ? Math.max(...questions.map((q) => q.question_order)) + 1 : 1;
      await saveFormQuestion(params.id, draft, nextOrder);
      await reload();
      setEditingId(null);
    } catch (e: any) {
      alert(e?.message ?? "Gagal menyimpan pertanyaan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (q: FormQuestion) => {
    if (
      !confirm(
        "Hapus pertanyaan ini? Jawaban siswa yang sudah masuk untuk pertanyaan ini juga bisa ikut terhapus."
      )
    )
      return;
    setBusyId(q.id);
    try {
      await deleteFormQuestion(q.id);
      await reload();
    } catch (e: any) {
      alert(e?.message ?? "Gagal menghapus pertanyaan.");
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (index: number, dir: -1 | 1) => {
    const a = questions[index];
    const b = questions[index + dir];
    if (!a || !b) return;
    setBusyId(a.id);
    try {
      await swapQuestionOrder(
        { id: a.id, order: a.question_order },
        { id: b.id, order: b.question_order }
      );
      await reload();
    } catch (e: any) {
      alert(e?.message ?? "Gagal mengubah urutan.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-gradient-to-r from-primary-50 via-primary-100 to-primary-50 bg-[length:200%_100%] animate-shimmer"
          />
        ))}
      </div>
    );
  }

  if (loadError || !assessment) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl">
        <EmptyState text={loadError ?? "Asesmen tidak ditemukan."} />
      </div>
    );
  }

  if (assessment.assessment_type !== "form") {
    return (
      <div className="p-4 sm:p-8 max-w-3xl">
        <Link
          href="/admin/assessments"
          className="group inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary-700 mb-4 transition-colors"
        >
          <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1" />
          Kembali ke Kelola Asesmen
        </Link>
        <div className="bg-white border border-primary-100 rounded-2xl">
          <EmptyState text="Asesmen ini bukan tipe Form. Soalnya dikelola lewat menu Kelola Soal." />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <Link
        href="/admin/assessments"
        className="group inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary-700 mb-4 transition-colors"
      >
        <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1" />
        Kembali ke Kelola Asesmen
      </Link>

      <PageHeader
        icon={FileText}
        title="Susun Form"
        subtitle={`${assessment.title} • ${questions.length} pertanyaan`}
        actions={
          editingId !== "new" && (
            <button
              onClick={() => setEditingId("new")}
              className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus size={16} />
              Tambah Pertanyaan
            </button>
          )
        }
      />

      <div className="flex flex-col gap-3">
        {questions.length === 0 && editingId !== "new" && (
          <div className="bg-white border border-primary-100 rounded-2xl">
            <EmptyState
              icon={FileText}
              text='Form ini belum punya pertanyaan. Klik "Tambah Pertanyaan" untuk mulai menyusun.'
            />
          </div>
        )}

        {questions.map((q, i) =>
          editingId === q.id ? (
            <QuestionEditor
              key={q.id}
              initial={q}
              saving={saving}
              onCancel={() => setEditingId(null)}
              onSave={handleSave}
            />
          ) : (
            <div
              key={q.id}
              className="bg-white border border-primary-100 rounded-2xl p-4 flex gap-3.5 animate-fadeUp"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <span className="w-8 h-8 shrink-0 rounded-lg bg-primary-50 text-primary-700 font-bold text-sm flex items-center justify-center tabular-nums">
                {i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink font-medium leading-relaxed">{q.question_text}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                    {typeMeta(q.input_type).label}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      q.required ? "bg-amber-50 text-amber-800" : "bg-surface text-muted"
                    }`}
                  >
                    {q.required ? "Wajib" : "Opsional"}
                  </span>
                </div>
                {q.input_type !== "text" && q.options.length > 0 && (
                  <ul className="mt-2.5 flex flex-col gap-1">
                    {q.options.map((o, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-muted">
                        <span
                          className={`w-3.5 h-3.5 shrink-0 border-2 border-primary-300 ${
                            q.input_type === "multiple" ? "rounded" : "rounded-full"
                          }`}
                        />
                        {o}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleMove(i, -1)}
                    disabled={i === 0 || busyId !== null}
                    className="w-8 h-8 rounded-lg bg-surface hover:bg-primary-50 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors"
                    title="Naikkan"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => handleMove(i, 1)}
                    disabled={i === questions.length - 1 || busyId !== null}
                    className="w-8 h-8 rounded-lg bg-surface hover:bg-primary-50 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors"
                    title="Turunkan"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditingId(q.id)}
                    className="w-8 h-8 rounded-lg bg-primary-50 hover:bg-primary-100 flex items-center justify-center transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} color="#0a7d4e" />
                  </button>
                  <button
                    onClick={() => handleDelete(q)}
                    disabled={busyId === q.id}
                    className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-50"
                    title="Hapus"
                  >
                    {busyId === q.id ? (
                      <Loader2 size={14} className="animate-spin text-red-600" />
                    ) : (
                      <Trash2 size={14} color="#dc2626" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {editingId === "new" && (
          <QuestionEditor
            initial={null}
            saving={saving}
            onCancel={() => setEditingId(null)}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}