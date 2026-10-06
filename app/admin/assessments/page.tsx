"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Clock, FileText, Loader2, Pencil, Plus, X } from "lucide-react";
import {
  TINGKAT_LIST,
  fetchAssessmentsWithTingkat,
  fetchServiceOptions,
  saveAssessment,
  setAssessmentActive,
  type AssessmentAdmin,
  type ServiceOption,
} from "@/lib/assessmentAdminService";
import { EmptyState, PageHeader, controlCls, labelCls } from "@/components/ui";

const TYPE_LABELS: Record<string, string> = {
  form: "Form / Angket",
  study_plan: "Perencanaan Studi Lanjut",
  learning_style: "Gaya Belajar",
  disc: "Kepribadian DISC",
  rmib: "Minat RMIB",
  stress_scale: "Skala Stres Akademik",
};
const ROMAWI: Record<number, string> = { 10: "X", 11: "XI", 12: "XII" };

function Switch({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 shrink-0 rounded-full transition-colors duration-300 disabled:opacity-50 ${
        on ? "bg-primary-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
          on ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

/* ---------- Modal tambah / edit ---------- */

function AssessmentModal({
  initial,
  services,
  onClose,
  onSaved,
}: {
  initial: AssessmentAdmin | null;
  services: ServiceOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState(initial?.assessment_type ?? "form");
  const [serviceId, setServiceId] = useState(initial?.service_id ?? "");
  const [durasi, setDurasi] = useState(initial?.duration_minutes ? String(initial.duration_minutes) : "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? false);
  const [materi, setMateri] = useState(initial?.materi ?? "");
  const [tataCara, setTataCara] = useState(initial?.tata_cara ?? "");
  const [tingkat, setTingkat] = useState<number[]>(initial?.tingkat ?? [10, 11, 12]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTingkat = (t: number) =>
    setTingkat((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handleSave = async () => {
    if (!title.trim()) return setError("Judul asesmen wajib diisi.");
    if (tingkat.length === 0) return setError("Pilih minimal satu tingkat kelas.");
    const durasiNum = durasi.trim() ? Number(durasi) : null;
    if (durasiNum !== null && (!Number.isFinite(durasiNum) || durasiNum <= 0)) {
      return setError("Durasi harus berupa angka lebih dari 0.");
    }
    setSaving(true);
    setError(null);
    try {
      const id = await saveAssessment({
        id: initial?.id,
        title,
        description,
        assessment_type: type,
        is_active: isActive,
        materi,
        tata_cara: tataCara,
        service_id: serviceId || null,
        duration_minutes: durasiNum,
        tingkat,
      });
      onSaved();
      onClose();
      // form baru -> langsung ke halaman penyusun pertanyaan
      if (!isEdit && type === "form") router.push(`/admin/assessments/${id}/builder`);
    } catch (e: any) {
      setError(e?.message ?? "Gagal menyimpan asesmen.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-ink tracking-tight">
              {isEdit ? "Edit Asesmen" : "Tambah Asesmen"}
            </h2>
            <p className="text-muted text-sm mt-0.5">
              Atur judul, layanan, tingkat kelas, serta materi dan tata cara pengisian.
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors" aria-label="Tutup">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Judul Asesmen</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Angket Kebiasaan Belajar"
              className={controlCls}
            />
          </div>

          <div>
            <label className={labelCls}>Deskripsi Singkat</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Satu kalimat tentang asesmen ini"
              className={controlCls}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tipe</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={isEdit}
                className={controlCls}
              >
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                {isEdit
                  ? "Tipe tidak bisa diubah setelah dibuat."
                  : type === "form"
                  ? "Pertanyaan disusun sendiri lewat tombol Susun Form. Tanpa skor atau kategori; jawaban siswa ditampilkan apa adanya."
                  : "Tipe ini memakai perhitungan hasil bawaan. Dimensi dan soalnya diatur lewat Kelola Soal."}
              </p>
            </div>

            <div>
              <label className={labelCls}>Berlaku untuk Tingkat</label>
              <div className="flex gap-2">
                {TINGKAT_LIST.map((t) => {
                  const on = tingkat.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTingkat(t)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        on
                          ? "bg-primary-700 text-white border-primary-700"
                          : "bg-white text-ink border-primary-100 hover:border-primary-300"
                      }`}
                    >
                      Kelas {ROMAWI[t]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Layanan</label>
              <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={controlCls}>
                <option value="">Tanpa layanan</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                Menentukan di daftar layanan mana asesmen ini muncul di aplikasi.
              </p>
            </div>
            <div>
              <label className={labelCls}>Durasi (menit)</label>
              <input
                type="number"
                min={1}
                value={durasi}
                onChange={(e) => setDurasi(e.target.value)}
                placeholder="Contoh: 15"
                className={controlCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Materi</label>
            <textarea
              value={materi}
              onChange={(e) => setMateri(e.target.value)}
              rows={4}
              placeholder="Penjelasan singkat tentang asesmen ini, tampil di layar pembuka sebelum siswa mulai."
              className={`${controlCls} resize-y leading-relaxed`}
            />
            <p className="text-xs text-muted mt-1.5">Pisahkan paragraf dengan satu baris kosong.</p>
          </div>

          <div>
            <label className={labelCls}>Tata Cara Pengisian</label>
            <textarea
              value={tataCara}
              onChange={(e) => setTataCara(e.target.value)}
              rows={4}
              placeholder={"Satu langkah per baris, contoh:\nBaca setiap pertanyaan dengan teliti.\nJawab sesuai kondisimu yang sebenarnya."}
              className={`${controlCls} resize-y leading-relaxed`}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">Asesmen aktif</p>
              <p className="text-xs text-muted">
                Nonaktif = disembunyikan dari siswa. Nyalakan setelah soal selesai disusun.
              </p>
            </div>
            <Switch on={isActive} onChange={setIsActive} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 bg-white border border-primary-100 hover:bg-surface text-ink text-sm font-semibold py-3 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-xl"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Buat Asesmen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Halaman ---------- */

export default function ManageAssessmentsPage() {
  const [items, setItems] = useState<AssessmentAdmin[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState<"new" | AssessmentAdmin | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    Promise.all([fetchAssessmentsWithTingkat(), fetchServiceOptions()])
      .then(([a, s]) => {
        setItems(a);
        setServices(s);
      })
      .catch((e: any) => setLoadError(e?.message ?? "Gagal memuat asesmen."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const serviceName = (id: string | null) => services.find((s) => s.id === id)?.title;

  const handleToggle = async (a: AssessmentAdmin, value: boolean) => {
    setTogglingId(a.id);
    setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, is_active: value } : x))); // optimistis
    try {
      await setAssessmentActive(a.id, value);
    } catch (e: any) {
      setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, is_active: !value } : x)));
      alert(e?.message ?? "Gagal mengubah status asesmen.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <PageHeader
        icon={ClipboardList}
        title="Kelola Asesmen"
        subtitle={
          loading
            ? "Memuat asesmen..."
            : `${items.length} asesmen • atur tingkat kelas, materi, dan tata cara pengisian`
        }
        actions={
          <button
            onClick={() => setModal("new")}
            className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={16} />
            Tambah Asesmen
          </button>
        }
      />

      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-5">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl bg-gradient-to-r from-primary-50 via-primary-100 to-primary-50 bg-[length:200%_100%] animate-shimmer"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-primary-100 rounded-2xl">
          <EmptyState icon={ClipboardList} text='Belum ada asesmen. Klik "Tambah Asesmen" untuk membuat.' />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((a, i) => (
            <div
              key={a.id}
              className={`flex flex-col bg-white border border-primary-100 rounded-2xl p-5 animate-fadeUp transition-opacity ${
                a.is_active ? "" : "opacity-60"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="min-w-0 mb-2">
                <h3 className="font-bold text-ink leading-snug">{a.title}</h3>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="bg-primary-50 text-primary-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                    {TYPE_LABELS[a.assessment_type] ?? a.assessment_type}
                  </span>
                  {serviceName(a.service_id) && (
                    <span className="bg-surface text-muted text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      {serviceName(a.service_id)}
                    </span>
                  )}
                  {a.duration_minutes && (
                    <span className="flex items-center gap-1 bg-surface text-muted text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      <Clock size={11} />
                      {a.duration_minutes} menit
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted leading-relaxed line-clamp-2 min-h-[2.5rem]">
                {a.description || "Belum ada deskripsi."}
              </p>

              <div className="flex flex-wrap items-center gap-1.5 mt-3 mb-4">
                {a.tingkat.length === 0 ? (
                  <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-semibold">
                    Belum ada tingkat
                  </span>
                ) : (
                  a.tingkat.map((t) => (
                    <span
                      key={t}
                      className="text-xs font-semibold text-primary-800 bg-primary-50 px-2.5 py-1 rounded-full"
                    >
                      Kelas {ROMAWI[t]}
                    </span>
                  ))
                )}
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    a.materi || a.tata_cara ? "text-primary-700 bg-primary-50" : "text-muted bg-surface"
                  }`}
                >
                  {a.materi || a.tata_cara ? "Materi terisi" : "Materi kosong"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mt-auto pt-4 border-t border-primary-50">
                <label className="flex items-center gap-2.5 text-sm text-ink font-medium">
                  <Switch
                    on={a.is_active}
                    disabled={togglingId === a.id}
                    onChange={(v) => handleToggle(a, v)}
                  />
                  {a.is_active ? "Aktif" : "Nonaktif"}
                </label>
                <div className="flex items-center gap-2">
                  {a.assessment_type === "form" && (
                    <Link
                      href={`/admin/assessments/${a.id}/builder`}
                      className="flex items-center gap-1.5 text-sm font-semibold text-white bg-primary-700 hover:bg-primary-800 px-3 py-2 rounded-lg transition-colors"
                    >
                      <FileText size={14} />
                      Susun Form
                    </Link>
                  )}
                  <button
                    onClick={() => setModal(a)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <AssessmentModal
          initial={modal === "new" ? null : modal}
          services={services}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}