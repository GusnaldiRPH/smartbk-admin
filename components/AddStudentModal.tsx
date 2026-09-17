"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function AddStudentModal({ onClose, onCreated }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [className, setClassName] = useState("");
  const [nis, setNis] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          class_name: className,
          nis,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menambah siswa.");
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-ink"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-bold text-ink mb-4">Tambah Siswa Baru</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-semibold text-ink mb-1 block">Nama Lengkap</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama siswa"
              className="w-full bg-surface border border-primary-100 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary-700"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-ink mb-1 block">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="siswa@sekolah.sch.id"
              className="w-full bg-surface border border-primary-100 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary-700"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-ink mb-1 block">Password Awal</label>
            <input
              required
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full bg-surface border border-primary-100 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary-700"
            />
            <p className="text-xs text-muted mt-1">
              Siswa bisa mengganti password ini nanti setelah login pertama.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-ink mb-1 block">Kelas</label>
              <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="XI IPA 1"
                className="w-full bg-surface border border-primary-100 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary-700"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-ink mb-1 block">NIS</label>
              <input
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                placeholder="Opsional"
                className="w-full bg-surface border border-primary-100 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary-700"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold text-sm rounded-xl py-3 transition-colors"
          >
            {saving && <Loader2 className="animate-spin" size={16} />}
            Tambah Siswa
          </button>
        </form>
      </div>
    </div>
  );
}