"use client";

import { useEffect, type ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  /** Nama item yang akan dihapus, ditampilkan tebal di bawah judul. */
  subject?: string;
  /** Info tambahan di bawah nama, misalnya kelas dan NIS. */
  meta?: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string | null;
  /** danger = merah (hapus), primary = hijau (aksi biasa). */
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  subject,
  meta,
  description,
  confirmLabel = "Ya, Hapus",
  cancelLabel = "Batal",
  loading = false,
  error,
  tone = "danger",
  onConfirm,
  onCancel,
}: Props) {
  // Esc menutup dialog (kecuali sedang memproses).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const danger = tone === "danger";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-popIn"
      >
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            danger ? "bg-red-50" : "bg-primary-50"
          }`}
        >
          <AlertTriangle size={22} className={danger ? "text-red-600" : "text-primary-700"} />
        </div>

        <h2 id="confirm-title" className="text-lg font-extrabold text-ink tracking-tight">
          {title}
        </h2>

        {subject && (
          <div className="mt-3 rounded-xl bg-surface px-3.5 py-2.5">
            <p className="text-sm font-semibold text-ink leading-snug break-words">{subject}</p>
            {meta && <p className="text-xs text-muted mt-0.5">{meta}</p>}
          </div>
        )}

        {description && <div className="text-sm text-muted mt-3 leading-relaxed">{description}</div>}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-sm text-red-700 mt-4">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-white border border-primary-100 hover:bg-surface disabled:opacity-60 text-ink text-sm font-semibold py-3 rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            autoFocus
            className={`flex-1 flex items-center justify-center gap-2 disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-xl transition-colors ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-primary-700 hover:bg-primary-800"
            }`}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}