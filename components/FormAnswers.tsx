"use client";

import { useEffect, useState } from "react";
import { fetchFormAnswers, type FormAnswerItem } from "@/lib/assessmentAdminService";

export default function FormAnswers({
  studentId,
  assessmentId,
}: {
  studentId: string;
  assessmentId: string;
}) {
  const [items, setItems] = useState<FormAnswerItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchFormAnswers(studentId, assessmentId)
      .then((r) => {
        if (alive) setItems(r);
      })
      .catch((e: any) => {
        if (alive) setError(e?.message ?? "Gagal memuat jawaban.");
      });
    return () => {
      alive = false;
    };
  }, [studentId, assessmentId]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!items) {
    return (
      <div className="h-24 rounded-xl bg-gradient-to-r from-primary-50 via-primary-100 to-primary-50 bg-[length:200%_100%] animate-shimmer" />
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted">Form ini belum memiliki pertanyaan.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((it, i) => (
        <div key={it.question_id} className="rounded-xl bg-surface px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
            Pertanyaan {i + 1}
          </p>
          <p className="text-sm font-semibold text-ink leading-relaxed mb-2">{it.question_text}</p>

          {it.answer.length === 0 ? (
            <p className="text-sm italic text-muted">Tidak dijawab</p>
          ) : it.input_type === "text" ? (
            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap break-words">
              {it.answer[0]}
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {it.answer.map((a, idx) => (
                <span
                  key={idx}
                  className="bg-primary-100 text-primary-800 text-xs font-semibold px-2.5 py-1 rounded-full"
                >
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}