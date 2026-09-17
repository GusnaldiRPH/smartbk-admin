export type UserRole = "admin" | "siswa";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  class_name?: string | null;
  nis?: string | null;
  avatar_url?: string | null;
}

export type ServiceCategory = "dasar" | "perencanaan";

export interface Service {
  id: string;
  title: string;
  description: string | null;
  category: ServiceCategory;
  icon_name: string;
  is_active: boolean;
}

export type AssessmentType =
  | "study_plan"
  | "learning_style"
  | "stress_scale"
  | "disc"
  | "rmib";

export interface Assessment {
  id: string;
  service_id: string | null;
  title: string;
  description: string | null;
  assessment_type: AssessmentType;
  duration_minutes: number;
  is_active: boolean;
}

export interface QuestionOption {
  label: string;
  value: number;
  dimension_code?: string;
}

export interface Question {
  id: string;
  assessment_id: string;
  question_text: string;
  question_order: number;
  options: QuestionOption[];
  scoring_rules?: {
    dimension_code?: string;
    option_dimensions?: string[];
    [key: string]: any;
  } | null;
}

export interface StudentAnswer {
  question_id: string;
  assessment_id: string;
  selected_option: QuestionOption;
}

export interface DimensionScore {
  code: string;
  label: string;
  score: number;
  maxScore: number;
}

export interface AssessmentResult {
  id: string;
  student_id: string;
  assessment_id: string;
  total_score: number;
  max_score: number | null;
  category: string | null;
  recommendation: string | null;
  dimension_scores?: DimensionScore[] | null;
  top_dimension_codes?: string[] | null;
  report_pdf_url?: string | null;
  created_at: string;
}

export interface Dimension {
  id: string;
  assessment_id: string;
  code: string;
  label: string;
  description?: string;
  recommendation?: any;
  min_score?: number;
  max_score?: number;
  sort_order?: number;
}
