"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import QuestionForm from "@/components/QuestionForm";
import { fetchQuestionById } from "@/lib/assessmentService";
import { Question } from "@/types";
import { EmptyState, PageHeader } from "@/components/ui";

export default function EditQuestionPage({ params }: { params: { id: string } }) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestionById(params.id)
      .then(setQuestion)
      .catch((err) => alert(err.message ?? "Gagal memuat soal."))
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="p-4 sm:p-8">
      <PageHeader icon={Pencil} title="Edit Soal" subtitle="Perbarui detail soal di bawah ini." />

      {loading ? (
        <div className="h-64 max-w-3xl rounded-2xl bg-gradient-to-r from-primary-50 via-primary-100 to-primary-50 bg-[length:200%_100%] animate-shimmer" />
      ) : question ? (
        <div className="animate-fadeUp" style={{ animationDelay: "100ms" }}>
          <QuestionForm editing={question} />
        </div>
      ) : (
        <EmptyState text="Soal tidak ditemukan." />
      )}
    </div>
  );
}