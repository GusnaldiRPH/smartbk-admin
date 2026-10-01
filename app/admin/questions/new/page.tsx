"use client";

import { useSearchParams } from "next/navigation";
import { PlusCircle } from "lucide-react";
import QuestionForm from "@/components/QuestionForm";
import { PageHeader } from "@/components/ui";

export default function NewQuestionPage() {
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId") ?? undefined;

  return (
    <div className="p-4 sm:p-8">
      <PageHeader
        icon={PlusCircle}
        title="Tambah Soal Baru"
        subtitle="Isi detail soal di bawah ini."
      />
      <div className="animate-fadeUp" style={{ animationDelay: "100ms" }}>
        <QuestionForm defaultAssessmentId={assessmentId} />
      </div>
    </div>
  );
}