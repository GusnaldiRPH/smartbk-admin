"use client";

import { useEffect, useState, type ReactNode } from "react";
import * as XLSX from "xlsx";
import {
  Loader2,
  Upload,
  Download,
  CheckCircle2,
  ArrowRight,
  ArrowUpCircle,
  FileSpreadsheet,
  AlertTriangle,
  GraduationCap,
  UserCheck,
  Clock,
} from "lucide-react";
import {
  fetchTahunAjaranList, createTahunAjaran, activateTahunAjaran,
  fetchRosterAktif, promoteStudent, markSiswaLulus,
  type TahunAjaran, type RosterItem,
} from "@/lib/assessmentService";
import { parseKelas, ensureKelasId } from "@/lib/kelasClientHelper";
import { PageHeader, controlCls } from "@/components/ui";

type BarisExcel = { nis: string; kelasBaru: string };
type BarisSiap = {
  roster: RosterItem;
  kelasBaru: ReturnType<typeof parseKelas>;
  hasil: "naik" | "tinggal_kelas";
};
type BarisError = { nis: string; kelasBaru: string; pesan: string };

function StepCard({
  n,
  title,
  done,
  right,
  children,
}: {
  n: number;
  title: ReactNode;
  done?: boolean;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-white border border-primary-100 rounded-2xl p-5 mb-6 animate-fadeUp">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md shadow-primary-700/25 bg-gradient-to-br ${
              done ? "from-primary-300 to-primary-600" : "from-primary-500 to-primary-800"
            }`}
          >
            {done ? <CheckCircle2 size={16} /> : n}
          </span>
          <h2 className="font-bold text-ink">{title}</h2>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function NaikKelasPage() {
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [tahunAktif, setTahunAktif] = useState<TahunAjaran | null>(null);
  const [tahunTarget, setTahunTarget] = useState<TahunAjaran | null>(null);
  const [namaTahunBaru, setNamaTahunBaru] = useState("");
  const [membuatTahun, setMembuatTahun] = useState(false);

  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [siap, setSiap] = useState<BarisSiap[]>([]);
  const [errorRows, setErrorRows] = useState<BarisError[]>([]);
  const [belumDitempatkan, setBelumDitempatkan] = useState<RosterItem[]>([]);
  const [otomatisLulus, setOtomatisLulus] = useState<RosterItem[]>([]);
  const [fileName, setFileName] = useState("");

  const [menerapkan, setMenerapkan] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const [mengaktifkan, setMengaktifkan] = useState(false);

  const load = async () => {
    setLoading(true);
    const [list, r] = await Promise.all([fetchTahunAjaranList(), fetchRosterAktif()]);
    setTahunList(list);
    setTahunAktif(list.find((t) => t.is_active) ?? null);
    setRoster(r);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleBuatTahun = async () => {
    if (!namaTahunBaru.trim()) return;
    setMembuatTahun(true);
    try {
      const t = await createTahunAjaran(namaTahunBaru.trim());
      setTahunList((prev) => [t, ...prev]);
      setTahunTarget(t);
      setNamaTahunBaru("");
    } catch (e: any) {
      alert(e.message ?? "Gagal membuat tahun ajaran.");
    } finally {
      setMembuatTahun(false);
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ NIS: "12345", "Kelas Baru": "XI RPL 2" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Naik Kelas");
    XLSX.writeFile(wb, "template-naik-kelas.xlsx");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tahunTarget) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: "binary" });
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });

      const parsed: BarisExcel[] = rows.map((row) => {
        const norm: Record<string, any> = {};
        Object.keys(row).forEach((k) => (norm[k.trim().toLowerCase()] = row[k]));
        return {
          nis: String(norm["nis"] ?? "").trim(),
          kelasBaru: String(norm["kelas baru"] ?? norm["kelas"] ?? "").trim(),
        };
      });

      const rosterByNis = new Map(roster.map((r) => [r.nis, r]));
      const nisDiExcel = new Set<string>();
      const okRows: BarisSiap[] = [];
      const badRows: BarisError[] = [];

      parsed.forEach((row) => {
        if (!row.nis) return;
        nisDiExcel.add(row.nis);
        const r = rosterByNis.get(row.nis);
        if (!r) {
          badRows.push({ ...row, pesan: "NIS tidak ditemukan di kelas aktif tahun ini." });
          return;
        }
        const kb = parseKelas(row.kelasBaru);
        if (!kb) {
          badRows.push({ ...row, pesan: `Format kelas "${row.kelasBaru}" salah (contoh: XI RPL 2).` });
          return;
        }
        if (kb.tingkat < r.tingkat) {
          badRows.push({ ...row, pesan: `Tingkat tidak boleh turun (sekarang tingkat ${r.tingkat}).` });
          return;
        }
        okRows.push({ roster: r, kelasBaru: kb, hasil: kb.tingkat > r.tingkat ? "naik" : "tinggal_kelas" });
      });

      const sisaRoster = roster.filter((r) => !nisDiExcel.has(r.nis));
      setOtomatisLulus(sisaRoster.filter((r) => r.tingkat === 12));
      setBelumDitempatkan(sisaRoster.filter((r) => r.tingkat !== 12));
      setSiap(okRows);
      setErrorRows(badRows);
      setSelesai(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleTerapkan = async () => {
    if (!tahunTarget) return;
    setMenerapkan(true);
    try {
      const kelasCache = new Map<string, string>();
      for (const row of siap) {
        let kelasId = kelasCache.get(row.kelasBaru!.nama);
        if (!kelasId) {
          kelasId = await ensureKelasId(tahunTarget.id, row.kelasBaru!);
          kelasCache.set(row.kelasBaru!.nama, kelasId);
        }
        await promoteStudent({
          siswaId: row.roster.siswa_id,
          userId: row.roster.user_id,
          oldRiwayatId: row.roster.riwayat_kelas_id,
          newTahunAjaranId: tahunTarget.id,
          newKelasId: kelasId,
          newKelasNama: row.kelasBaru!.nama,
          hasil: row.hasil,
        });
      }
      for (const r of otomatisLulus) {
        await markSiswaLulus(r.siswa_id, r.riwayat_kelas_id);
      }
      setSelesai(true);
    } catch (e: any) {
      alert(`Gagal di tengah proses: ${e.message}. Data yang sudah diproses tidak akan diulang kalau kamu menjalankan lagi.`);
    } finally {
      setMenerapkan(false);
    }
  };

  const handleAktifkan = async () => {
    if (!tahunTarget) return;
    if (!confirm(`Aktifkan tahun ajaran "${tahunTarget.nama}" sekarang? Semua siswa akan langsung melihat kelas barunya.`)) return;
    setMengaktifkan(true);
    try {
      await activateTahunAjaran(tahunTarget.id);
      await load();
      setTahunTarget(null);
      setSiap([]);
      setErrorRows([]);
      setBelumDitempatkan([]);
      setOtomatisLulus([]);
      setFileName("");
      setSelesai(false);
      alert("Tahun ajaran baru sudah aktif.");
    } catch (e: any) {
      alert(e.message ?? "Gagal mengaktifkan tahun ajaran.");
    } finally {
      setMengaktifkan(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl flex flex-col gap-4">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-40 rounded-2xl bg-gradient-to-r from-primary-50 via-primary-100 to-primary-50 bg-[length:200%_100%] animate-shimmer"
          />
        ))}
      </div>
    );
  }

  const hasPreview =
    siap.length > 0 || errorRows.length > 0 || belumDitempatkan.length > 0 || otomatisLulus.length > 0;

  const tiles = [
    { n: siap.length, label: "siswa siap dipindahkan", icon: UserCheck, cls: "bg-primary-50 text-primary-800", show: true },
    { n: otomatisLulus.length, label: "otomatis lulus (kelas 12)", icon: GraduationCap, cls: "bg-primary-50 text-primary-800", show: true },
    { n: errorRows.length, label: "baris bermasalah", icon: AlertTriangle, cls: "bg-red-50 text-red-700", show: errorRows.length > 0 },
    { n: belumDitempatkan.length, label: "belum ditempatkan", icon: Clock, cls: "bg-amber-50 text-amber-800", show: belumDitempatkan.length > 0 },
  ].filter((t) => t.show);

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <PageHeader
        icon={ArrowUpCircle}
        title="Naik Kelas"
        subtitle={
          <>
            Tahun ajaran aktif: <b className="text-ink">{tahunAktif?.nama ?? "belum ada"}</b> ({roster.length} siswa)
          </>
        }
      />

      {/* Langkah 1: pilih / buat tahun ajaran tujuan */}
      <StepCard n={1} title="Tahun ajaran tujuan" done={!!tahunTarget}>
        <div className="flex flex-wrap gap-2 mb-3">
          {tahunList.filter((t) => !t.is_active).map((t) => (
            <button
              key={t.id}
              onClick={() => setTahunTarget(t)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                tahunTarget?.id === t.id
                  ? "bg-primary-700 text-white border-primary-700"
                  : "bg-white text-ink border-primary-100 hover:bg-primary-50 hover:border-primary-300"
              }`}
            >
              {t.nama}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={namaTahunBaru}
            onChange={(e) => setNamaTahunBaru(e.target.value)}
            placeholder="Tahun ajaran baru, contoh: 2027/2028"
            className={`${controlCls} flex-1 bg-surface`}
          />
          <button
            onClick={handleBuatTahun}
            disabled={membuatTahun || !namaTahunBaru.trim()}
            className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
          >
            {membuatTahun && <Loader2 className="animate-spin" size={14} />}
            Buat
          </button>
        </div>
      </StepCard>

      {tahunTarget && (
        <>
          {/* Langkah 2: upload excel */}
          <StepCard
            n={2}
            done={hasPreview}
            title={
              <>
                Upload daftar kenaikan ke <span className="text-primary-700">{tahunTarget.nama}</span>
              </>
            }
            right={
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download size={14} />
                Template
              </button>
            }
          >
            <label className="group flex flex-col items-center justify-center gap-2.5 border-2 border-dashed border-primary-200 rounded-2xl py-9 cursor-pointer transition-all hover:border-primary-500 hover:bg-primary-50/60">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 group-hover:bg-white flex items-center justify-center transition-all group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-primary-700/15">
                {fileName ? (
                  <FileSpreadsheet size={22} className="text-primary-600" />
                ) : (
                  <Upload size={22} className="text-primary-600" />
                )}
              </div>
              <span className="text-sm text-ink font-semibold">
                {fileName || "Klik untuk pilih file Excel"}
              </span>
              <span className="text-xs text-muted">Kolom: NIS, Kelas Baru (.xlsx, .xls, .csv)</span>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
            </label>
          </StepCard>

          {/* Langkah 3: pratinjau */}
          {hasPreview && (
            <StepCard n={3} title="Pratinjau" done={selesai}>
              <div className="grid sm:grid-cols-2 gap-3 mb-5 text-sm">
                {tiles.map((t) => {
                  const Icon = t.icon;
                  return (
                    <div key={t.label} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 ${t.cls}`}>
                      <Icon size={18} />
                      <span>
                        <span className="font-extrabold text-base">{t.n}</span> {t.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {errorRows.length > 0 && (
                <div className="mb-4 rounded-xl bg-red-50/60 border border-red-100 p-3.5">
                  <p className="text-sm font-semibold text-red-800 mb-1">Baris bermasalah:</p>
                  <ul className="text-sm text-red-700 list-disc pl-5">
                    {errorRows.map((r, i) => (
                      <li key={i}>
                        NIS {r.nis || "-"}: {r.pesan}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {belumDitempatkan.length > 0 && (
                <div className="mb-4 rounded-xl bg-amber-50/60 border border-amber-100 p-3.5">
                  <p className="text-sm font-semibold text-amber-900 mb-1">
                    Belum ditempatkan (tidak akan diubah, tetap di kelas lama):
                  </p>
                  <ul className="text-sm text-muted list-disc pl-5">
                    {belumDitempatkan.map((r) => (
                      <li key={r.siswa_id}>
                        {r.nama} — {r.nis} ({r.kelas_nama})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {siap.length > 0 && !selesai && (
                <div className="border border-primary-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto mb-5">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-surface">
                      <tr className="text-left text-muted">
                        <th className="px-3 py-2">Nama</th>
                        <th className="px-3 py-2">Dari</th>
                        <th className="px-3 py-2"></th>
                        <th className="px-3 py-2">Ke</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siap.map((r) => (
                        <tr key={r.roster.siswa_id} className="border-t border-primary-50">
                          <td className="px-3 py-2 text-ink font-medium">{r.roster.nama}</td>
                          <td className="px-3 py-2 text-muted">{r.roster.kelas_nama}</td>
                          <td className="px-3 py-2 text-primary-500">
                            <ArrowRight size={12} />
                          </td>
                          <td className="px-3 py-2 text-ink font-medium">{r.kelasBaru!.nama}</td>
                          <td className="px-3 py-2">
                            {r.hasil === "naik" ? (
                              <span className="bg-primary-50 text-primary-700 font-semibold px-2 py-0.5 rounded-full">
                                Naik
                              </span>
                            ) : (
                              <span className="bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                                Tinggal kelas
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!selesai ? (
                <button
                  onClick={handleTerapkan}
                  disabled={menerapkan || siap.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl py-3"
                >
                  {menerapkan && <Loader2 className="animate-spin" size={16} />}
                  Terapkan Kenaikan Kelas
                </button>
              ) : (
                <div className="animate-fadeUp">
                  <div className="flex items-center gap-2 text-primary-700 text-sm font-semibold mb-3 bg-primary-50 rounded-xl px-3.5 py-3">
                    <CheckCircle2 size={17} />
                    Data sudah dipindahkan ke {tahunTarget.nama}.
                  </div>
                  <button
                    onClick={handleAktifkan}
                    disabled={mengaktifkan}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-105 disabled:opacity-50 text-white font-semibold text-sm rounded-xl py-3 shadow-lg shadow-amber-600/25 transition-all hover:-translate-y-0.5"
                  >
                    {mengaktifkan && <Loader2 className="animate-spin" size={16} />}
                    Aktifkan Tahun Ajaran {tahunTarget.nama}
                  </button>
                </div>
              )}
            </StepCard>
          )}
        </>
      )}
    </div>
  );
}