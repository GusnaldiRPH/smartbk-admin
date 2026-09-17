"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Plus, Search, Upload } from "lucide-react";
import { fetchAllStudents } from "@/lib/assessmentService";
import AddStudentModal from "@/components/AddStudentModal";
import ImportStudentsModal from "@/components/ImportStudentsModal";

export default function ManageStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const loadStudents = () => {
    setLoading(true);
    fetchAllStudents()
      .then(setStudents)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const classOptions = Array.from(
    new Set(students.map((s) => s.class_name).filter(Boolean))
  ).sort();

  const filtered = students.filter((s) => {
    const matchesSearch = `${s.full_name} ${s.email} ${s.class_name ?? ""} ${s.nis ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesClass = !classFilter || s.class_name === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-1">Kelola Siswa</h1>
          <p className="text-muted text-sm">Lihat data siswa dan riwayat hasil asesmennya.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-white border border-primary-100 hover:bg-surface text-ink text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Upload size={16} />
            Import dari Excel
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={16} />
            Tambah Siswa
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, kelas, atau NIS..."
            className="w-full bg-white border border-primary-100 rounded-xl pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-primary-700"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          disabled={classOptions.length === 0}
          className="bg-white border border-primary-100 rounded-xl px-3.5 py-2.5 text-sm min-w-[160px] outline-none focus:border-primary-700 disabled:bg-surface disabled:text-muted"
        >
          <option value="">Semua Kelas</option>
          {classOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-primary-100 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="px-5 py-8 flex justify-center">
            <Loader2 className="animate-spin text-primary-700" size={22} />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted text-sm px-5 py-8 text-center">
            {students.length === 0
              ? "Belum ada siswa. Klik \"Tambah Siswa\" untuk menambahkan."
              : "Tidak ada siswa ditemukan."}
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-left text-muted text-xs border-b border-primary-50">
                  <th className="px-5 py-2.5 font-medium">Nama</th>
                  <th className="px-5 py-2.5 font-medium">Kelas</th>
                  <th className="px-5 py-2.5 font-medium">NIS</th>
                  <th className="px-5 py-2.5 font-medium">Email</th>
                  <th className="px-5 py-2.5 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-primary-50 last:border-0">
                    <td className="px-5 py-3 font-medium text-ink">
                      <Link href={`/admin/students/${s.id}`} className="hover:text-primary-700">
                        {s.full_name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted">{s.class_name ?? "-"}</td>
                    <td className="px-5 py-3 text-muted">{s.nis ?? "-"}</td>
                    <td className="px-5 py-3 text-muted">{s.email}</td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/students/${s.id}`}>
                        <ChevronRight size={16} className="text-muted" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddStudentModal
          onClose={() => setShowAddModal(false)}
          onCreated={loadStudents}
        />
      )}

      {showImportModal && (
        <ImportStudentsModal
          onClose={() => setShowImportModal(false)}
          onImported={loadStudents}
        />
      )}
    </div>
  );
}