"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Loader2, Upload, Download, CheckCircle2, ArrowRight } from "lucide-react";
import {
  fetchTahunAjaranList, createTahunAjaran, activateTahunAjaran,
  fetchRosterAktif, promoteStudent, markSiswaLulus,
  type TahunAjaran, type RosterItem,
} from "@/lib/assessmentService";
import { parseKelas, ensureKelasId } from "@/lib/kelasClientHelper";

type BarisExcel = { nis: string; kelasBaru: string };
type BarisSiap = {
  roster: RosterItem;
  kelasBaru: ReturnType<typeof parseKelas>;
  hasil: "naik" | "tinggal_kelas";
};
type BarisError = { nis: string; kelasBaru: string; pesan: string };

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
      <div className="p-8">
        <Loader2 className="animate-spin text-primary-700" size={22} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-ink mb-1">Naik Kelas</h1>
      <p className="text-muted text-sm mb-6">
        Tahun ajaran aktif saat ini: <b>{tahunAktif?.nama ?? "belum ada"}</b> ({roster.length} siswa)
      </p>

      {/* Langkah 1: pilih / buat tahun ajaran tujuan */}
      <div className="bg-white border border-primary-100 rounded-2xl p-5 mb-6">
        <h2 className="font-semibold text-ink mb-3">1. Tahun ajaran tujuan</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {tahunList.filter((t) => !t.is_active).map((t) => (
            <button
              key={t.id}
              onClick={() => setTahunTarget(t)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium border ${
                tahunTarget?.id === t.id
                  ? "bg-primary-700 text-white border-primary-700"
                  : "bg-white text-ink border-primary-100 hover:bg-surface"
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
            className="flex-1 bg-surface border border-primary-100 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary-700"
          />
          <button
            onClick={handleBuatTahun}
            disabled={membuatTahun || !namaTahunBaru.trim()}
            className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
          >
            {membuatTahun && <Loader2 className="animate-spin" size={14} />}
            Buat
          </button>
        </div>
      </div>

      {tahunTarget && (
        <>
          {/* Langkah 2: upload excel */}
          <div className="bg-white border border-primary-100 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-ink">
                2. Upload daftar kenaikan ke <span className="text-primary-700">{tahunTarget.nama}</span>
              </h2>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 text-sm text-primary-700 hover:underline"
              >
                <Download size={14} />
                Template
              </button>
            </div>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary-100 rounded-xl py-8 cursor-pointer hover:border-primary-700">
              <Upload size={22} className="text-primary-700" />
              <span className="text-sm text-ink font-medium">Klik untuk pilih file Excel (kolom: NIS, Kelas Baru)</span>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
            </label>
          </div>

          {/* Langkah 3: pratinjau */}
          {(siap.length > 0 || errorRows.length > 0 || belumDitempatkan.length > 0 || otomatisLulus.length > 0) && (
            <div className="bg-white border border-primary-100 rounded-2xl p-5 mb-6">
              <h2 className="font-semibold text-ink mb-3">3. Pratinjau</h2>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-primary-50 rounded-xl px-3.5 py-2.5">
                  <span className="font-semibold text-primary-800">{siap.length}</span> siswa siap dipindahkan
                </div>
                <div className="bg-primary-50 rounded-xl px-3.5 py-2.5">
                  <span className="font-semibold text-primary-800">{otomatisLulus.length}</span> otomatis lulus (kelas 12)
                </div>
                {errorRows.length > 0 && (
                  <div className="bg-red-50 rounded-xl px-3.5 py-2.5 text-red-700">
                    <span className="font-semibold">{errorRows.length}</span> baris bermasalah
                  </div>
                )}
                {belumDitempatkan.length > 0 && (
                  <div className="bg-yellow-50 rounded-xl px-3.5 py-2.5 text-yellow-800">
                    <span className="font-semibold">{belumDitempatkan.length}</span> belum ditempatkan
                  </div>
                )}
              </div>

              {errorRows.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-ink mb-1">Baris bermasalah:</p>
                  <ul className="text-sm text-red-700 list-disc pl-5">
                    {errorRows.map((r, i) => (
                      <li key={i}>NIS {r.nis || "-"}: {r.pesan}</li>
                    ))}
                  </ul>
                </div>
              )}

              {belumDitempatkan.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-ink mb-1">
                    Belum ditempatkan (tidak akan diubah, tetap di kelas lama):
                  </p>
                  <ul className="text-sm text-muted list-disc pl-5">
                    {belumDitempatkan.map((r) => (
                      <li key={r.siswa_id}>{r.nama} — {r.nis} ({r.kelas_nama})</li>
                    ))}
                  </ul>
                </div>
              )}

              {siap.length > 0 && !selesai && (
                <div className="border border-primary-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto mb-4">
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
                          <td className="px-3 py-1.5 text-ink">{r.roster.nama}</td>
                          <td className="px-3 py-1.5 text-muted">{r.roster.kelas_nama}</td>
                          <td className="px-3 py-1.5 text-muted"><ArrowRight size={12} /></td>
                          <td className="px-3 py-1.5 text-ink">{r.kelasBaru!.nama}</td>
                          <td className="px-3 py-1.5">
                            {r.hasil === "naik" ? (
                              <span className="text-primary-700">Naik</span>
                            ) : (
                              <span className="text-yellow-700">Tinggal kelas</span>
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
                <div>
                  <div className="flex items-center gap-2 text-primary-700 text-sm font-semibold mb-3">
                    <CheckCircle2 size={16} />
                    Data sudah dipindahkan ke {tahunTarget.nama}.
                  </div>
                  <button
                    onClick={handleAktifkan}
                    disabled={mengaktifkan}
                    className="w-full flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl py-3"
                  >
                    {mengaktifkan && <Loader2 className="animate-spin" size={16} />}
                    Aktifkan Tahun Ajaran {tahunTarget.nama}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}