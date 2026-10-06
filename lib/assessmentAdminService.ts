import { supabase } from "@/lib/supabaseClient";

export const TINGKAT_LIST = [10, 11, 12] as const;

/* ================= Asesmen ================= */

export interface AssessmentAdmin {
  id: string;
  title: string;
  description: string | null;
  assessment_type: string;
  is_active: boolean;
  materi: string | null;
  tata_cara: string | null;
  service_id: string | null;
  duration_minutes: number | null;
  tingkat: number[];
}

export interface ServiceOption {
  id: string;
  title: string;
  category: string;
}

export async function fetchServiceOptions(): Promise<ServiceOption[]> {
  const { data, error } = await supabase
    .from("services")
    .select("id, title, category")
    .eq("is_active", true)
    .order("title");
  if (error) throw error;
  return (data ?? []) as ServiceOption[];
}

export async function fetchAssessmentsWithTingkat(): Promise<AssessmentAdmin[]> {
  const [aRes, tRes] = await Promise.all([
    supabase.from("assessments").select("*"),
    supabase.from("assessment_tingkat").select("assessment_id, tingkat"),
  ]);
  if (aRes.error) throw aRes.error;
  if (tRes.error) throw tRes.error;

  const tingkatMap = new Map<string, number[]>();
  (tRes.data ?? []).forEach((r: any) => {
    const arr = tingkatMap.get(r.assessment_id) ?? [];
    arr.push(r.tingkat);
    tingkatMap.set(r.assessment_id, arr);
  });

  return (aRes.data ?? [])
    .map((a: any) => ({
      id: a.id,
      title: a.title ?? "",
      description: a.description ?? null,
      assessment_type: a.assessment_type ?? "",
      is_active: a.is_active ?? true,
      materi: a.materi ?? null,
      tata_cara: a.tata_cara ?? null,
      service_id: a.service_id ?? null,
      duration_minutes: a.duration_minutes ?? null,
      tingkat: (tingkatMap.get(a.id) ?? []).sort((x, y) => x - y),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "id"));
}

export async function fetchAssessmentBasic(id: string) {
  const { data, error } = await supabase
    .from("assessments")
    .select("id, title, assessment_type")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as { id: string; title: string; assessment_type: string };
}

export async function setAssessmentActive(id: string, isActive: boolean) {
  const { error } = await supabase.from("assessments").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

export interface SaveAssessmentInput {
  id?: string;
  title: string;
  description: string;
  assessment_type: string;
  is_active: boolean;
  materi: string;
  tata_cara: string;
  service_id: string | null;
  duration_minutes: number | null;
  tingkat: number[];
}

export async function saveAssessment(input: SaveAssessmentInput): Promise<string> {
  const payload = {
    title: input.title.trim(),
    description: input.description.trim() || null,
    is_active: input.is_active,
    materi: input.materi.trim() || null,
    tata_cara: input.tata_cara.trim() || null,
    service_id: input.service_id || null,
    duration_minutes: input.duration_minutes,
  };

  let id = input.id;

  if (id) {
    // tipe sengaja tidak diubah saat edit (menentukan cara hasil dihitung)
    const { error } = await supabase.from("assessments").update(payload).eq("id", id);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("assessments")
      .insert({ ...payload, assessment_type: input.assessment_type })
      .select("id")
      .single();
    if (error) throw error;
    id = data.id as string;
  }

  // sinkronkan tingkat: hapus yang tidak dipilih, simpan yang dipilih
  if (input.tingkat.length === 0) {
    const { error } = await supabase.from("assessment_tingkat").delete().eq("assessment_id", id);
    if (error) throw error;
  } else {
    const { error: delErr } = await supabase
      .from("assessment_tingkat")
      .delete()
      .eq("assessment_id", id)
      .not("tingkat", "in", `(${input.tingkat.join(",")})`);
    if (delErr) throw delErr;

    const { error: upErr } = await supabase
      .from("assessment_tingkat")
      .upsert(
        input.tingkat.map((t) => ({ assessment_id: id, tingkat: t })),
        { onConflict: "assessment_id,tingkat" }
      );
    if (upErr) throw upErr;
  }

  return id!;
}

/* ================= Pertanyaan Form ================= */

export type FormInputType = "text" | "single" | "multiple";

export interface FormQuestion {
  id: string;
  question_text: string;
  question_order: number;
  input_type: FormInputType;
  required: boolean;
  options: string[];
}

export interface FormQuestionDraft {
  id?: string;
  question_text: string;
  input_type: FormInputType;
  required: boolean;
  options: string[];
}

export async function fetchFormQuestions(assessmentId: string): Promise<FormQuestion[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("id, question_text, question_order, options, scoring_rules")
    .eq("assessment_id", assessmentId)
    .order("question_order", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    id: r.id,
    question_text: r.question_text ?? "",
    question_order: r.question_order ?? 0,
    input_type: (r.scoring_rules?.input_type ?? "single") as FormInputType,
    required: r.scoring_rules?.required ?? true,
    options: Array.isArray(r.options) ? r.options.map((o: any) => String(o.label ?? "")) : [],
  }));
}

export async function saveFormQuestion(
  assessmentId: string,
  draft: FormQuestionDraft,
  nextOrder: number
) {
  const payload = {
    question_text: draft.question_text.trim(),
    options:
      draft.input_type === "text"
        ? []
        : draft.options.map((label, i) => ({ label: label.trim(), value: i + 1 })),
    scoring_rules: { input_type: draft.input_type, required: draft.required },
  };

  if (draft.id) {
    const { error } = await supabase.from("questions").update(payload).eq("id", draft.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("questions")
      .insert({ ...payload, assessment_id: assessmentId, question_order: nextOrder });
    if (error) throw error;
  }
}

export async function deleteFormQuestion(id: string) {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw error;
}

/** Tukar urutan dua pertanyaan (lewat nilai sementara supaya aman kalau ada unique constraint). */
export async function swapQuestionOrder(
  a: { id: string; order: number },
  b: { id: string; order: number }
) {
  const tmp = Math.max(a.order, b.order) + 1000;
  const step = async (id: string, order: number) => {
    const { error } = await supabase.from("questions").update({ question_order: order }).eq("id", id);
    if (error) throw error;
  };
  await step(a.id, tmp);
  await step(b.id, a.order);
  await step(a.id, b.order);
}