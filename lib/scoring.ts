import { Question, StudentAnswer, Dimension } from "@/types";

interface ScoringResult {
  totalScore: number;
  maxScore: number;
  category: string;
  recommendation: string;
}

export function calculateLikertResult(
  questions: Question[],
  answers: StudentAnswer[]
): ScoringResult {
  const answerMap = new Map(answers.map((a) => [a.question_id, a.selected_option.value]));

  let totalScore = 0;
  let maxScore = 0;

  for (const q of questions) {
    const maxOptionValue = Math.max(...q.options.map((o) => o.value), 0);
    maxScore += maxOptionValue;
    totalScore += answerMap.get(q.id) ?? 0;
  }

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  let category = "Rendah";
  let recommendation =
    "Disarankan mengikuti sesi konsultasi lanjutan dengan Guru BK untuk pendampingan lebih intensif.";

  if (percentage >= 75) {
    category = "Tinggi";
    recommendation =
      "Pertahankan kondisi positif ini. Kamu bisa mulai mengeksplorasi peluang pengembangan diri lebih lanjut.";
  } else if (percentage >= 50) {
    category = "Sedang";
    recommendation =
      "Beberapa aspek sudah baik, namun ada ruang untuk berkembang. Diskusikan hasil ini dengan Guru BK.";
  }

  return { totalScore, maxScore, category, recommendation };
}

interface DimensionScore {
  code: string;
  label: string;
  score: number;
  maxScore: number;
}

interface DimensionResult {
  dimensionScores: DimensionScore[];
  topDimensions: Dimension[];
  recommendation: string;
}

export function calculateDimensionResult(
  questions: Question[],
  answers: StudentAnswer[],
  dimensions: Dimension[]
): DimensionResult {
  const answerMap = new Map(answers.map((a) => [a.question_id, a.selected_option.value]));
  const scoreByCode = new Map<string, number>();
  const maxByCode = new Map<string, number>();

  for (const q of questions) {
    const code = q.scoring_rules?.dimension_code;
    if (!code) continue;
    const maxOptionValue = Math.max(...q.options.map((o) => o.value), 0);
    maxByCode.set(code, (maxByCode.get(code) ?? 0) + maxOptionValue);
    scoreByCode.set(code, (scoreByCode.get(code) ?? 0) + (answerMap.get(q.id) ?? 0));
  }

  const dimensionScores: DimensionScore[] = dimensions.map((d) => ({
    code: d.code,
    label: d.label,
    score: scoreByCode.get(d.code) ?? 0,
    maxScore: maxByCode.get(d.code) ?? 0,
  }));

  const highestScore = Math.max(...dimensionScores.map((d) => d.score), 0);
  const topCodes = dimensionScores.filter((d) => d.score === highestScore).map((d) => d.code);
  const topDimensions = dimensions.filter((d) => topCodes.includes(d.code));

  const recommendation = topDimensions
    .map((d) => d.description ?? "")
    .filter(Boolean)
    .join("\n\n");

  return { dimensionScores, topDimensions, recommendation };
}

export function calculateDiscResult(
  questions: Question[],
  answers: StudentAnswer[],
  dimensions: Dimension[]
): DimensionResult {
  const answerMap = new Map(answers.map((a) => [a.question_id, a.selected_option.value]));
  const scoreByCode = new Map<string, number>();

  for (const q of questions) {
    const selectedValue = answerMap.get(q.id);
    if (selectedValue == null) continue;

    const optionIndex = q.options.findIndex((o) => o.value === selectedValue);
    if (optionIndex === -1) continue;

    const code = q.scoring_rules?.option_dimensions?.[optionIndex];
    if (!code) continue;

    scoreByCode.set(code, (scoreByCode.get(code) ?? 0) + 1);
  }

  const dimensionScores: DimensionScore[] = dimensions.map((d) => ({
    code: d.code,
    label: d.label,
    score: scoreByCode.get(d.code) ?? 0,
    maxScore: questions.length,
  }));

  const highestScore = Math.max(...dimensionScores.map((d) => d.score), 0);
  const topCodes = dimensionScores.filter((d) => d.score === highestScore).map((d) => d.code);
  const topDimensions = dimensions.filter((d) => topCodes.includes(d.code));

  const recommendation = topDimensions
    .map((d) => d.description ?? "")
    .filter(Boolean)
    .join("\n\n");

  return { dimensionScores, topDimensions, recommendation };
}

export function calculateRmibResult(
  questions: Question[],
  answers: StudentAnswer[],
  dimensions: Dimension[]
): DimensionResult {
  const answerMap = new Map(
    answers.map((a) => [a.question_id, a.selected_option as unknown as Record<string, number>])
  );
  const scoreByCode = new Map<string, number>();

  for (const q of questions) {
    const ranks = answerMap.get(q.id);
    if (!ranks) continue;
    for (const opt of q.options) {
      const code = opt.dimension_code;
      if (!code) continue;
      const rank = ranks[code];
      if (rank == null) continue;
      scoreByCode.set(code, (scoreByCode.get(code) ?? 0) + rank);
    }
  }

  const groupCount = questions.length;
  const dimensionScores: DimensionScore[] = dimensions.map((d) => ({
    code: d.code,
    label: d.label,
    score: scoreByCode.get(d.code) ?? 0,
    maxScore: groupCount * 12,
  }));

  const answeredScores = dimensionScores.filter((d) => scoreByCode.has(d.code));
  const lowestScore = Math.min(...answeredScores.map((d) => d.score));
  const topCodes = answeredScores
    .filter((d) => d.score === lowestScore)
    .map((d) => d.code);
  const topDimensions = dimensions.filter((d) => topCodes.includes(d.code));

  const recommendation = topDimensions
    .map((d) => d.description ?? "")
    .filter(Boolean)
    .join("\n\n");

  return { dimensionScores, topDimensions, recommendation };
}
