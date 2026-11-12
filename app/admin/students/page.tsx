"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Plus,
  Search,
  Upload,
  Trash2,
  ArrowUpCircle,
  Users,
} from "lucide-react";
import { fetchAllStudents } from "@/lib/assessmentService";
import AddStudentModal from "@/components/AddStudentModal";
import ImportStudentsModal from "@/components/ImportStudentsModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  Avatar,
  EmptyState,
  PageHeader,
  Pagination,
  SortTh,
  TableSkeleton,
  controlCls,
} from "@/components/ui";

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

  // Dialog konfirmasi hapus
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const askDelete = (student: any) => {
    setDeleteError(null);
    setToDelete(student);
  };

  const closeDelete = () => {
    if (deleting) return;
    setToDelete(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/students/${toDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menghapus siswa.");
      setStudents((prev) => prev.filter((s) => s.id !== toDelete.id));
      setToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message ?? "Gagal menghapus siswa.");
    } finally {
      setDeleting(false);
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

  const sortProps = (key: SortKey) => ({
    active: sortKey === key,
    dir: sortDir,
    onClick: () => handleSort(key),
  });

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <PageHeader
        icon={Users}
        title="Kelola Siswa"
        subtitle={
          loading
            ? "Memuat data siswa..."
            : `${students.length} siswa terdaftar • lihat data dan riwayat hasil asesmennya`
        }
        actions={
          <>
            <Link
              href="/admin/naik-kelas"
              className="flex items-center gap-2 bg-white border border-primary-100 hover:bg-surface text-ink text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <ArrowUpCircle size={16} />
              Naik Kelas
            </Link>
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
          </>
        }
      />

      <div className="flex flex-wrap gap-3 mb-5 animate-fadeUp" style={{ animationDelay: "80ms" }}>
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama, email, kelas, atau NIS..."
            className={`${controlCls} pl-10`}
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value);
            setPage(1);
          }}
          disabled={classOptions.length === 0}
          className={`${controlCls} !w-auto min-w-[170px]`}
        >
          <option value="">Semua Kelas</option>
          {classOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-primary-100 rounded-2xl overflow-hidden animate-fadeUp" style={{ animationDelay: "140ms" }}>
        {loading ? (
          <TableSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Users}
            text={
              students.length === 0
                ? 'Belum ada siswa. Klik "Tambah Siswa" untuk menambahkan.'
                : "Tidak ada siswa ditemukan."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted text-xs border-b border-primary-50">
                    <SortTh label="Nama" {...sortProps("name")} />
                    <SortTh label="Kelas" {...sortProps("class")} />
                    <SortTh label="NIS" {...sortProps("nis")} />
                    <SortTh label="Email" {...sortProps("email")} />
                    <th className="px-5 py-3 w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((s, i) => (
                    <tr
                      key={s.id}
                      className="border-b border-primary-50 last:border-0 animate-fadeUp"
                      style={{ animationDelay: `${i * 35}ms` }}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.full_name} />
                          <Link
                            href={`/admin/students/${s.id}`}
                            className="font-semibold text-ink hover:text-primary-700 transition-colors"
                          >
                            {s.full_name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {s.class_name ? (
                          <span className="inline-block bg-primary-50 text-primary-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {s.class_name}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted tabular-nums">{s.nis ?? "-"}</td>
                      <td className="px-5 py-3 text-muted">{s.email}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/students/${s.id}`}
                            className="group w-8 h-8 rounded-lg bg-primary-50 hover:bg-primary-100 flex items-center justify-center transition-colors"
                            title="Lihat detail"
                          >
                            <ChevronRight
                              size={14}
                              className="text-primary-700 transition-transform group-hover:translate-x-0.5"
                            />
                          </Link>
                          <button
                            onClick={() => askDelete(s)}
                            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                            title="Hapus siswa"
                            aria-label={`Hapus ${s.full_name}`}
                          >
                            <Trash2 size={14} color="#dc2626" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={safePage}
              totalPages={totalPages}
              total={sorted.length}
              pageSize={PAGE_SIZE}
              noun="siswa"
              onChange={setPage}
            />
          </>
        )}
      </div>

      {showAddModal && (
        <AddStudentModal onClose={() => setShowAddModal(false)} onCreated={loadStudents} />
      )}

      {showImportModal && (
        <ImportStudentsModal onClose={() => setShowImportModal(false)} onImported={loadStudents} />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Hapus siswa ini?"
        subject={toDelete?.full_name}
        meta={
          toDelete
            ? [toDelete.class_name, toDelete.nis ? `NIS ${toDelete.nis}` : null].filter(Boolean).join(" • ")
            : undefined
        }
        description={
          <>
            Akun login dan <b className="text-ink">seluruh datanya</b> akan dihapus permanen dan tidak bisa
            dikembalikan.
          </>
        }
        confirmLabel="Ya, Hapus"
        loading={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={closeDelete}
      />
    </div>
  );
}