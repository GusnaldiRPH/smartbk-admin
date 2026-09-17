"use client";

import { useSearchParams } from "next/navigation";
import QuestionForm from "@/components/QuestionForm";

export default function NewQuestionPage() {
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId") ?? undefined;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Tambah Soal Baru</h1>
      <p className="text-muted text-sm mb-6">Isi detail soal di bawah ini.</p>
      <QuestionForm defaultAssessmentId={assessmentId} />
    </div>
  );
}
