"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, X, Loader2, GripVertical } from "lucide-react";
import { updateQuestion } from "@/lib/assessmentService";
import { Question } from "@/types";

interface Props {
  questions: Question[]; // harus sudah terurut sesuai question_order ascending
  onClose: () => void;
  onSaved: () => void;
}

export default function ReorderQuestionsModal({ questions, onClose, onSaved }: Props) {
  const [order, setOrder] = useState<Question[]>(questions);
  const [saving, setSaving] = useState(false);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...order];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setOrder(next);
  };

  const moveDown = (index: number) => {
    if (index === order.length - 1) return;
    const next = [...order];
    [next[index + 1], next[index]] = [next[index], next[index + 1]];
    setOrder(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Cuma update soal yang urutannya beneran berubah, biar nggak boros request.
      const updates = order
        .map((q, idx) => ({ q, newOrder: idx + 1 }))
        .filter(({ q, newOrder }) => q.question_order !== newOrder);

      await Promise.all(
        updates.map(({ q, newOrder }) => updateQuestion(q.id, { question_order: newOrder }))
      );

      onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message ?? "Gagal menyimpan urutan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-ink"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-bold text-ink mb-1">Atur Urutan Soal</h2>
        <p className="text-muted text-sm mb-4">
          Geser pakai tombol panah untuk mengubah urutan soal saat siswa mengerjakan asesmen.
        </p>

        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          <div className="flex flex-col gap-2">
            {order.map((q, idx) => (
              <div
                key={q.id}
                className="flex items-center gap-3 bg-white border border-primary-100 rounded-xl px-3.5 py-2.5"
              >
                <GripVertical size={15} className="text-muted/40 shrink-0" />
                <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <span className="text-primary-800 text-xs font-bold">{idx + 1}</span>
                </div>
                <p className="flex-1 text-sm text-ink truncate">{q.question_text}</p>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface disabled:opacity-30 transition-colors"
                  >
                    <ChevronUp size={16} className="text-primary-700" />
                  </button>
                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx === order.length - 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown size={16} className="text-primary-700" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold text-sm rounded-xl py-3 transition-colors"
        >
          {saving && <Loader2 className="animate-spin" size={16} />}
          Simpan Urutan
        </button>
      </div>
    </div>
  );
}