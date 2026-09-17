"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  createQuestion,
  updateQuestion,
  fetchDimensionsForAssessment,
  fetchAssessmentsForAdmin,
} from "@/lib/assessmentService";
import { Assessment, Dimension, Question, QuestionOption } from "@/types";

type AdminAssessmentOption = Pick<Assessment, "id" | "title" | "assessment_type">;

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
  disc: [],
  rmib: [], // ditangani cabang khusus, bukan opsi statis
};

const DISC_TYPE = "disc";
const RMIB_TYPE = "rmib";
const SUPPORTED_TYPES = Object.keys(OPTIONS_BY_TYPE);

interface Props {
  editing?: Question | null;
  defaultAssessmentId?: string;
}

export default function QuestionForm({ editing, defaultAssessmentId }: Props) {
  const router = useRouter();

  const [questionText, setQuestionText] = useState(editing?.question_text ?? "");
  const [assessments, setAssessments] = useState<AdminAssessmentOption[]>([]);
  const [assessmentId, setAssessmentId] = useState(
    defaultAssessmentId ?? editing?.assessment_id ?? ""
  );
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [dimensionCode, setDimensionCode] = useState<string>(
    editing?.scoring_rules?.dimension_code ?? ""
  );

  // --- state khusus DISC ---
  const [discOptionTexts, setDiscOptionTexts] = useState<string[]>(
    editing?.options?.length === 4 ? editing.options.map((o) => o.label) : ["", "", "", ""]
  );
  const [discOptionDimensions, setDiscOptionDimensions] = useState<string[]>(
    editing?.scoring_rules?.option_dimensions?.length === 4
      ? editing.scoring_rules.option_dimensions
      : ["", "", "", ""]
  );

  // --- state khusus RMIB ---
  const [rmibGroupOrder, setRmibGroupOrder] = useState(String(editing?.question_order ?? ""));
  const [rmibJobLabels, setRmibJobLabels] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);

  useEffect(() => {
    fetchAssessmentsForAdmin()
      .then(setAssessments)
      .catch((err) => alert(err.message ?? "Gagal memuat daftar asesmen."));
  }, []);

  useEffect(() => {
    if (!assessmentId) {
      setLoadingMeta(false);
      return;
    }
    setLoadingMeta(true);
    fetchDimensionsForAssessment(assessmentId)
      .then((dims) => {
        setDimensions(dims);
        if (
          assessmentId === (defaultAssessmentId ?? editing?.assessment_id) &&
          editing?.options?.length === dims.length
        ) {
          setRmibJobLabels(
            dims.map((d) => editing.options.find((o) => o.dimension_code === d.code)?.label ?? "")
          );
        } else {
          setRmibJobLabels((prev) => (prev.length === dims.length ? prev : dims.map(() => "")));
        }
      })
      .catch((err) => alert(err.message ?? "Gagal memuat dimensi."))
      .finally(() => setLoadingMeta(false));
  }, [assessmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedAssessment = useMemo(
    () => assessments.find((a) => a.id === assessmentId),
    [assessments, assessmentId]
  );
  const assessmentType = selectedAssessment?.assessment_type ?? "";
  const options = OPTIONS_BY_TYPE[assessmentType] ?? [];
  const isSupportedType = SUPPORTED_TYPES.includes(assessmentType);
  const isDisc = assessmentType === DISC_TYPE;
  const isRmib = assessmentType === RMIB_TYPE;

  const handleSave = async () => {
    if (!assessmentId) {
      alert("Pilih asesmen tujuan.");
      return;
    }
    if (!isSupportedType) {
      alert("Tipe asesmen ini belum memiliki opsi jawaban standar.");
      return;
    }

    let finalQuestionText = questionText;
    let finalQuestionOrder = 0;
    let finalOptions: QuestionOption[];
    let scoring_rules: Record<string, any>;

    if (isDisc) {
      if (!questionText.trim()) {
        alert("Isi teks studi kasus.");
        return;
      }
      if (discOptionTexts.some((t) => !t.trim())) {
        alert("Isi keempat opsi jawaban studi kasus.");
        return;
      }
      if (discOptionDimensions.some((d) => !d)) {
        alert("Pilih dimensi untuk setiap opsi jawaban.");
        return;
      }
      finalOptions = discOptionTexts.map((text, idx) => ({ label: text, value: idx + 1 }));
      scoring_rules = { option_dimensions: discOptionDimensions };
    } else if (isRmib) {
      if (!rmibGroupOrder.trim()) {
        alert("Isi nomor kelompok (1-12).");
        return;
      }
      if (dimensions.length === 0) {
        alert("Asesmen ini belum punya dimensi. Tambahkan dimensi dulu.");
        return;
      }
      if (rmibJobLabels.some((l) => !l.trim())) {
        alert(`Isi nama pekerjaan untuk semua ${dimensions.length} dimensi.`);
        return;
      }
      finalQuestionText = `Kelompok ${rmibGroupOrder}`;
      finalQuestionOrder = Number(rmibGroupOrder);
      finalOptions = dimensions.map((d, idx) => ({
        label: rmibJobLabels[idx],
        value: idx + 1,
        dimension_code: d.code,
      }));
      scoring_rules = { type: "rank", min: 1, max: dimensions.length };
    } else {
      if (!questionText.trim()) {
        alert("Isi teks soal.");
        return;
      }
      if (!dimensionCode) {
        alert("Pilih dimensi untuk soal ini.");
        return;
      }
      finalOptions = options;
      scoring_rules = { dimension_code: dimensionCode };
    }

    try {
      setSaving(true);
      if (editing) {
        await updateQuestion(editing.id, {
          question_text: finalQuestionText,
          question_order: isRmib ? finalQuestionOrder : editing.question_order,
          options: finalOptions,
          scoring_rules,
        });
      } else {
        await createQuestion({
          assessment_id: assessmentId,
          question_text: finalQuestionText,
          question_order: finalQuestionOrder,
          options: finalOptions,
          scoring_rules,
        });
      }
      router.push("/admin/questions");
      router.refresh();
    } catch (err: any) {
      alert(err.message ?? "Gagal menyimpan soal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <label className="text-sm font-semibold text-ink mb-1.5 block">Asesmen</label>
        <select
          value={assessmentId}
          disabled={!!editing}
          onChange={(e) => {
            setAssessmentId(e.target.value);
            setDimensionCode("");
          }}
          className="w-full bg-white border border-primary-100 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary-700 disabled:bg-surface disabled:text-muted"
        >
          <option value="">Pilih asesmen tujuan</option>
          {assessments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title} ({a.assessment_type})
            </option>
          ))}
        </select>
      </div>

      {selectedAssessment && !isSupportedType && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4 text-sm text-amber-800">
          Tipe asesmen &quot;{assessmentType}&quot; belum memiliki opsi jawaban standar di form
          ini.
        </div>
      )}

      {!isRmib && (
        <div className="mb-5">
          <label className="text-sm font-semibold text-ink mb-1.5 block">Teks Soal</label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Tuliskan pernyataan / pertanyaan asesmen..."
            rows={3}
            className="w-full bg-white border border-primary-100 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary-700 resize-none"
          />
        </div>
      )}

      {/* ================= CABANG DEFAULT (Yes/No, Likert) ================= */}
      {selectedAssessment && isSupportedType && !isDisc && !isRmib && (
        <>
          <label className="text-sm font-semibold text-ink mb-2 block">Dimensi</label>
          {loadingMeta ? (
            <Loader2 className="animate-spin text-primary-700 mb-4" size={18} />
          ) : dimensions.length === 0 ? (
            <p className="text-muted text-sm mb-4">
              Belum ada dimensi untuk asesmen ini. Tambahkan dimensi dulu sebelum bikin soal.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-5">
              {dimensions.map((d) => {
                const isActive = dimensionCode === d.code;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDimensionCode(d.code)}
                    className={`px-3.5 py-2 rounded-full border text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary-700 border-primary-700 text-white"
                        : "bg-white border-primary-100 text-ink hover:border-primary-700"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          )}

          <label className="text-sm font-semibold text-ink mb-1 block">Opsi Jawaban</label>
          <p className="text-muted text-xs mb-2">
            Otomatis sesuai tipe asesmen — tidak bisa diubah manual.
          </p>
          <div className="bg-white border border-primary-100 rounded-xl overflow-hidden mb-6">
            {options.map((opt, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between px-4 py-3 text-sm ${
                  idx !== options.length - 1 ? "border-b border-primary-50" : ""
                }`}
              >
                <span className="text-ink">{opt.label}</span>
                <span className="text-muted font-medium">Skor: {opt.value}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ================= CABANG DISC ================= */}
      {selectedAssessment && isSupportedType && isDisc && (
        <>
          <label className="text-sm font-semibold text-ink mb-1 block">
            Opsi Jawaban (Studi Kasus)
          </label>
          <p className="text-muted text-xs mb-3">
            Tuliskan 4 pilihan jawaban, lalu pilih dimensi kepribadian yang diwakili tiap pilihan.
          </p>
          {loadingMeta ? (
            <Loader2 className="animate-spin text-primary-700 mb-4" size={18} />
          ) : dimensions.length === 0 ? (
            <p className="text-muted text-sm mb-4">
              Belum ada dimensi untuk asesmen ini. Tambahkan dimensi dulu sebelum bikin soal.
            </p>
          ) : (
            <div className="flex flex-col gap-3 mb-6">
              {discOptionTexts.map((text, idx) => (
                <div key={idx} className="bg-white border border-primary-100 rounded-xl p-3.5">
                  <p className="text-ink text-xs font-semibold mb-1.5">Opsi {idx + 1}</p>
                  <textarea
                    value={text}
                    onChange={(e) => {
                      const next = [...discOptionTexts];
                      next[idx] = e.target.value;
                      setDiscOptionTexts(next);
                    }}
                    placeholder={`Jawaban opsi ${idx + 1}...`}
                    rows={2}
                    className="w-full border border-primary-100 rounded-lg px-3 py-2 text-sm mb-2.5 outline-none focus:border-primary-700 resize-none"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {dimensions.map((d) => {
                      const isActive = discOptionDimensions[idx] === d.code;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            const next = [...discOptionDimensions];
                            next[idx] = d.code;
                            setDiscOptionDimensions(next);
                          }}
                          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                            isActive
                              ? "bg-primary-700 border-primary-700 text-white"
                              : "bg-white border-primary-100 text-ink hover:border-primary-700"
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= CABANG RMIB ================= */}
      {selectedAssessment && isSupportedType && isRmib && (
        <>
          <label className="text-sm font-semibold text-ink mb-1.5 block">Nomor Kelompok</label>
          <input
            type="number"
            value={rmibGroupOrder}
            onChange={(e) => setRmibGroupOrder(e.target.value)}
            disabled={!!editing}
            placeholder="1 - 12"
            className="w-full bg-white border border-primary-100 rounded-xl px-3.5 py-2.5 text-sm mb-5 outline-none focus:border-primary-700 disabled:bg-surface disabled:text-muted"
          />

          <label className="text-sm font-semibold text-ink mb-1.5 block">Daftar Pekerjaan</label>
          <p className="text-muted text-xs mb-3">
            Isi 1 nama pekerjaan untuk setiap dimensi. Urutan mengikuti urutan dimensi asesmen ini.
          </p>

          {loadingMeta ? (
            <Loader2 className="animate-spin text-primary-700 mb-4" size={18} />
          ) : dimensions.length === 0 ? (
            <p className="text-muted text-sm mb-4">
              Asesmen ini belum punya dimensi. Tambahkan dimensi dulu sebelum bikin kelompok.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5 mb-6">
              {dimensions.map((d, idx) => (
                <div key={d.id} className="flex items-center gap-2.5">
                  <span className="w-28 text-ink text-xs font-semibold shrink-0">{d.label}</span>
                  <input
                    type="text"
                    value={rmibJobLabels[idx] ?? ""}
                    onChange={(e) => {
                      const next = [...rmibJobLabels];
                      next[idx] = e.target.value;
                      setRmibJobLabels(next);
                    }}
                    placeholder="Nama pekerjaan..."
                    className="flex-1 bg-white border border-primary-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-700"
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <button
        onClick={handleSave}
        disabled={saving || (!isSupportedType && !!selectedAssessment)}
        className="flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold text-sm rounded-xl py-3 px-6 transition-colors"
      >
        {saving && <Loader2 className="animate-spin" size={16} />}
        Simpan Soal
      </button>
    </div>
  );
}
