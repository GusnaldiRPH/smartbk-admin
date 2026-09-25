import { supabase } from "@/lib/supabaseClient";
import { Assessment, Dimension, Question, Service } from "@/types";

/** Ambil semua layanan (Layanan Dasar / Perencanaan Individual). */
export async function fetchServices(category?: "dasar" | "perencanaan"): Promise<Service[]> {
  let query = supabase.from("services").select("*");
  if (category) query = query.eq("category", category);
  const { data, error } = await query.order("title");
  if (error) throw error;
  return data as Service[];
}

/** Semua asesmen, termasuk join nama layanan — dipakai admin (tanpa filter is_active). */
export async function fetchAllAssessments() {
  const { data, error } = await supabase
    .from("assessments")
    .select("*, services(title, icon_name, category)")
    .order("title");
  if (error) throw error;
  return data;
}

/** Daftar ringkas asesmen untuk dropdown form soal. */
export async function fetchAssessmentsForAdmin() {
  const { data, error } = await supabase
    .from("assessments")
    .select("id, title, assessment_type")
    .order("title");
  if (error) throw error;
  return data as Pick<Assessment, "id" | "title" | "assessment_type">[];
}

export async function fetchAssessmentById(assessmentId: string) {
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", assessmentId)
    .single();
  if (error) throw error;
  return data as Assessment;
}

export async function createAssessment(payload: Omit<Assessment, "id">) {
  const { data, error } = await supabase.from("assessments").insert(payload).select().single();
  if (error) throw error;
  return data as Assessment;
}

export async function updateAssessment(id: string, payload: Partial<Assessment>) {
  const { data, error } = await supabase
    .from("assessments")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Assessment;
}

export async function deleteAssessment(id: string) {
  const { error } = await supabase.from("assessments").delete().eq("id", id);
  if (error) throw error;
}

/** Semua soal, join sampai assessments -> services untuk badge/filter di tabel admin. */
export async function fetchAllQuestions(assessmentId?: string): Promise<Question[]> {
  let query = supabase
    .from("questions")
    .select("*, assessments(id, service_id, title, assessment_type, services(title, category))")
    .order("question_order");
  if (assessmentId) query = query.eq("assessment_id", assessmentId);
  const { data, error } = await query;
  if (error) throw error;
  return data as Question[];
}

export async function fetchQuestionById(id: string): Promise<Question> {
  const { data, error } = await supabase.from("questions").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Question;
}

export async function createQuestion(payload: Omit<Question, "id">) {
  const { data, error } = await supabase.from("questions").insert(payload).select().single();
  if (error) throw error;
  return data as Question;
}

export async function updateQuestion(id: string, payload: Partial<Question>) {
  const { data, error } = await supabase
    .from("questions")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Question;
}

export async function deleteQuestion(id: string) {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchDimensionsForAssessment(assessmentId: string): Promise<Dimension[]> {
  const { data, error } = await supabase
    .from("assessment_dimensions")
    .select("*")
    .eq("assessment_id", assessmentId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as Dimension[];
}

export async function createDimension(payload: Omit<Dimension, "id">) {
  const { data, error } = await supabase
    .from("assessment_dimensions")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Dimension;
}

export async function updateDimension(id: string, payload: Partial<Dimension>) {
  const { data, error } = await supabase
    .from("assessment_dimensions")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Dimension;
}

export async function deleteDimension(id: string) {
  const { error } = await supabase.from("assessment_dimensions").delete().eq("id", id);
  if (error) throw error;
}

/** Semua siswa (role = "siswa"), dengan kelas dari riwayat_kelas (bukan dari profiles.class_name yang bisa basi). */
export async function fetchAllStudents() {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, class_name, nis")
    .eq("role", "siswa")
    .order("full_name");
  if (error) throw error;

  const { data: siswaRows } = await supabase.from("siswa").select("id, user_id, nis");
  const { data: kelasRows } = await supabase.from("kelas_siswa_aktif").select("siswa_id, kelas_nama");

  const kelasBySiswaId = new Map<string, string>(
    (kelasRows ?? []).map((k: { siswa_id: string; kelas_nama: string }) => [k.siswa_id, k.kelas_nama])
  );
  const siswaByUserId = new Map<string, { id: string; user_id: string; nis: string }>(
    (siswaRows ?? []).map((s: { id: string; user_id: string; nis: string }) => [s.user_id, s])
  );

  return (profiles ?? []).map(
    (p: { id: string; full_name: string; email: string; class_name: string | null; nis: string | null }) => {
      const siswa = siswaByUserId.get(p.id);
      const kelasNama = siswa ? kelasBySiswaId.get(siswa.id) : undefined;
      return { ...p, class_name: kelasNama ?? p.class_name, nis: siswa?.nis ?? p.nis };
    }
  );
}

export async function fetchStudentById(id: string) {
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (error) throw error;

  const { data: siswa } = await supabase.from("siswa").select("*").eq("user_id", id).maybeSingle();
  if (!siswa) return profile;

  const { data: kelas } = await supabase
    .from("kelas_siswa_aktif")
    .select("kelas_nama")
    .eq("siswa_id", siswa.id)
    .maybeSingle();

  return { ...profile, class_name: kelas?.kelas_nama ?? profile.class_name, nis: siswa.nis, siswa };
}

/** Riwayat hasil asesmen 1 siswa, dengan assessment_type ikut untuk render breakdown per-dimensi. */
export async function fetchResultsForStudent(studentId: string) {
  const { data, error } = await supabase
    .from("assessment_results")
    .select("*, assessments(title, assessment_type)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Semua hasil asesmen LINTAS SISWA (bukan cuma 1 siswa), dipakai halaman
 * "Hasil Asesmen". Bisa difilter per asesmen lewat parameter opsional.
 */
export async function fetchAllResults(assessmentId?: string) {
  let query = supabase
    .from("assessment_results")
    .select("*, profiles(full_name, class_name), assessments(id, title, assessment_type)")
    .order("created_at", { ascending: false });
  if (assessmentId) query = query.eq("assessment_id", assessmentId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------
// Statistik ringkas untuk Dashboard
// ---------------------------------------------------------------------
export async function fetchDashboardStats() {
  const [studentsRes, assessmentsRes, questionsRes, resultsRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "siswa"),
    supabase.from("assessments").select("id", { count: "exact", head: true }),
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase.from("assessment_results").select("id", { count: "exact", head: true }),
  ]);

  if (studentsRes.error) throw studentsRes.error;
  if (assessmentsRes.error) throw assessmentsRes.error;
  if (questionsRes.error) throw questionsRes.error;
  if (resultsRes.error) throw resultsRes.error;

  return {
    totalStudents: studentsRes.count ?? 0,
    totalAssessments: assessmentsRes.count ?? 0,
    totalQuestions: questionsRes.count ?? 0,
    totalResults: resultsRes.count ?? 0,
  };
}

/** Hasil-hasil terbaru (lintas siswa) untuk ditampilkan di dashboard. */
export async function fetchRecentResults(limit = 8) {
  const { data, error } = await supabase
    .from("assessment_results")
    .select("*, profiles(full_name, class_name), assessments(title, assessment_type)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

/**
 * Jumlah hasil asesmen yang terkumpul, dikelompokkan per jenis asesmen —
 * dipakai bar chart "Aktivitas Asesmen" di dashboard.
 */
export async function fetchResultCountsByAssessment() {
  const { data, error } = await supabase
    .from("assessment_results")
    .select("assessment_id, assessments(title)");
  if (error) throw error;

  const counts = new Map<string, { title: string; count: number }>();
  (data as any[]).forEach((r) => {
    const key = r.assessment_id as string;
    const title = r.assessments?.title ?? "Lainnya";
    if (!counts.has(key)) counts.set(key, { title, count: 0 });
    counts.get(key)!.count += 1;
  });

  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}