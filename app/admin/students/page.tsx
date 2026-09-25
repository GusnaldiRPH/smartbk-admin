"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Loader2,
  Plus,
  Search,
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
} from "lucide-react";
import { fetchAllStudents } from "@/lib/assessmentService";
import AddStudentModal from "@/components/AddStudentModal";
import ImportStudentsModal from "@/components/ImportStudentsModal";

type SortKey = "name" | "class" | "nis" | "email";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;

export default function ManageStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const loadStudents = () => {
    setLoading(true);
    fetchAllStudents()
      .then(setStudents)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Hapus siswa "${name}"? Akun login dan seluruh datanya akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`
      )
    ) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menghapus siswa.");
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message ?? "Gagal menghapus siswa.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const classOptions = Array.from(
    new Set(students.map((s) => s.class_name).filter(Boolean))
  ).sort();

  const filtered = useMemo(
    () =>
      students.filter((s) => {
        const matchesSearch = `${s.full_name} ${s.email} ${s.class_name ?? ""} ${s.nis ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesClass = !classFilter || s.class_name === classFilter;
        return matchesSearch && matchesClass;
      }),
    [students, search, classFilter]
  );

  const sorted = useMemo(() => {
    const fieldMap: Record<SortKey, string> = {
      name: "full_name",
      class: "class_name",
      nis: "nis",
      email: "email",
    };
    const field = fieldMap[sortKey];
    const arr = [...filtered];
    arr.sort((a, b) => {
      const cmp = String(a[field] ?? "").localeCompare(String(b[field] ?? ""), "id");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown size={13} className="text-muted/50" />;
    return sortDir === "asc" ? (
      <ArrowUp size={13} className="text-primary-700" />
    ) : (
      <ArrowDown size={13} className="text-primary-700" />
    );
  };

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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama, email, kelas, atau NIS..."
            className="w-full bg-white border border-primary-100 rounded-xl pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-primary-700"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value);
            setPage(1);
          }}
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
        ) : sorted.length === 0 ? (
          <p className="text-muted text-sm px-5 py-8 text-center">
            {students.length === 0
              ? "Belum ada siswa. Klik \"Tambah Siswa\" untuk menambahkan."
              : "Tidak ada siswa ditemukan."}
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs border-b border-primary-50">
                  <th className="px-5 py-2.5 font-medium">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 hover:text-ink transition-colors"
                    >
                      Nama
                      <SortIcon column="name" />
                    </button>
                  </th>
                  <th className="px-5 py-2.5 font-medium">
                    <button
                      onClick={() => handleSort("class")}
                      className="flex items-center gap-1 hover:text-ink transition-colors"
                    >
                      Kelas
                      <SortIcon column="class" />
                    </button>
                  </th>
                  <th className="px-5 py-2.5 font-medium">
                    <button
                      onClick={() => handleSort("nis")}
                      className="flex items-center gap-1 hover:text-ink transition-colors"
                    >
                      NIS
                      <SortIcon column="nis" />
                    </button>
                  </th>
                  <th className="px-5 py-2.5 font-medium">
                    <button
                      onClick={() => handleSort("email")}
                      className="flex items-center gap-1 hover:text-ink transition-colors"
                    >
                      Email
                      <SortIcon column="email" />
                    </button>
                  </th>
                  <th className="px-5 py-2.5 font-medium w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((s) => (
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
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/students/${s.id}`}
                          className="w-8 h-8 rounded-lg bg-primary-50 hover:bg-primary-100 flex items-center justify-center transition-colors"
                          title="Lihat detail"
                        >
                          <ChevronRight size={14} className="text-primary-700" />
                        </Link>
                        <button
                          onClick={() => handleDelete(s.id, s.full_name)}
                          disabled={deletingId === s.id}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-50"
                          title="Hapus siswa"
                        >
                          {deletingId === s.id ? (
                            <Loader2 size={14} className="animate-spin text-red-600" />
                          ) : (
                            <Trash2 size={14} color="#dc2626" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-primary-50 text-xs text-muted">
              <span>
                Menampilkan {(safePage - 1) * PAGE_SIZE + 1}-
                {Math.min(safePage * PAGE_SIZE, sorted.length)} dari {sorted.length} siswa
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="w-7 h-7 rounded-lg border border-primary-100 flex items-center justify-center disabled:opacity-40 hover:bg-surface transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 font-medium text-ink">
                  {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="w-7 h-7 rounded-lg border border-primary-100 flex items-center justify-center disabled:opacity-40 hover:bg-surface transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
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