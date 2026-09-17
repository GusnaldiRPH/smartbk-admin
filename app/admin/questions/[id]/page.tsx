"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import QuestionForm from "@/components/QuestionForm";
import { fetchQuestionById } from "@/lib/assessmentService";
import { Question } from "@/types";

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
    <div className="p-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Edit Soal</h1>
      <p className="text-muted text-sm mb-6">Perbarui detail soal di bawah ini.</p>

      {loading ? (
        <Loader2 className="animate-spin text-primary-700" size={22} />
      ) : question ? (
        <QuestionForm editing={question} />
      ) : (
        <p className="text-muted text-sm">Soal tidak ditemukan.</p>
      )}
    </div>
  );
}
