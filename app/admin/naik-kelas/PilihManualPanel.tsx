"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  GraduationCap,
  X as XIcon,
} from "lucide-react";
import type { RosterItem } from "@/lib/assessmentService";
import { parseKelas } from "@/lib/kelasClientHelper";
import { controlCls } from "@/components/ui";

/** Satu siswa yang siap dipindahkan (bentuknya sama dengan BarisSiap di halaman). */
export type SiapManual = {
  roster: RosterItem;
  kelasBaru: ReturnType<typeof parseKelas>;
  hasil: "naik" | "tinggal_kelas";
};
export type ErrorManual = { nis: string; kelasBaru: string; pesan: string };

export type HasilManual = {
  siap: SiapManual[];
  errorRows: ErrorManual[];
  belumDitempatkan: RosterItem[];
  otomatisLulus: RosterItem[];
};

/**
 * Aturan jurusan saat naik dari kelas X ke XI.
 * Kalau pilihannya lebih dari satu (mis. MPLB), guru harus memilih per siswa.
 * Dari XI ke XII jurusan tetap sama.
 */
const JURUSAN_NAIK_DARI_X: Record<string, string[]> = {
  PPLG: ["RPL"],
  MPLB: ["MP", "MLOG"],
  PM: ["BR"],
  DKV: ["DKV"],
  AKL: ["AKL"],
  TJKT: ["TKJ"],
};

const ROMAWI: Record<number, string> = { 10: "X", 11: "XI", 12: "XII" };

type Parsed = { tingkat: number; program: string; rombel: number };
type Draft = {
  /** Kelas X/XI: tinggal kelas. Kelas XII: tidak lulus. */
  tinggal: boolean;
  program: string | null; // null = belum dipilih
  rombel: number;
  dipilih: boolean; // dicentang untuk aksi massal
};

const labelTinggal = (tingkat: number) => (tingkat === 12 ? "Tidak lulus" : "Tinggal kelas");
const labelNaik = (tingkat: number) => (tingkat === 12 ? "Lulus" : "Naik");

/** "X PPLG 1" -> { tingkat: 10, program: "PPLG", rombel: 1 } */
function bacaKelas(nama: string, tingkat: number): Parsed | null {
  const m = nama.trim().toUpperCase().match(/^(XII|XI|X)\s+(.+?)[\s-]*(\d+)?$/);
  if (!m) return null;
  return { tingkat, program: m[2].trim(), rombel: m[3] ? parseInt(m[3], 10) : 1 };
}

/** Pilihan jurusan tujuan untuk satu siswa. */
function pilihanJurusan(p: Parsed, tinggal: boolean): string[] {
  if (tinggal) return [p.program];
  if (p.tingkat === 10) return JURUSAN_NAIK_DARI_X[p.program] ?? [p.program];
  return [p.program];
}

/** Nama kelas tujuan. null = belum dipilih, atau siswa XII yang lulus (tidak punya kelas baru). */
function namaTujuan(p: Parsed, d: Draft): string | null {
  if (!d.program) return null;
  if (p.tingkat === 12 && !d.tinggal) return null;
  const tingkatBaru = d.tinggal ? p.tingkat : p.tingkat + 1;
  return `${ROMAWI[tingkatBaru]} ${d.program} ${d.rombel}`;
}

/**
 * Ambil semua NIS dari teks tempelan.
 * Setiap deret angka minimal 6 digit dianggap satu NIS, jadi pemisahnya bebas:
 * baris baru, spasi, tab, koma, titik koma, atau satu baris berisi nama + NIS.
 */
function ambilNis(teks: string): string[] {
  return Array.from(new Set(teks.match(/\d{6,}/g) ?? []));
}

interface Props {
  roster: RosterItem[];
  onLanjut: (hasil: HasilManual) => void;
}

export default function PilihManualPanel({ roster, onLanjut }: Props) {
  const parsed = useMemo(() => {
    const map = new Map<string, Parsed | null>();
    roster.forEach((r) => map.set(r.siswa_id, bacaKelas(r.kelas_nama, r.tingkat)));
    return map;
  }, [roster]);

  const maxRombel = useMemo(() => {
    let m = 4;
    parsed.forEach((p) => {
      if (p && p.rombel > m) m = p.rombel;
    });
    return m;
  }, [parsed]);

  const [draft, setDraft] = useState<Record<string, Draft>>({});
  const [filterTingkat, setFilterTingkat] = useState<"semua" | "10" | "11" | "12">("semua");
  const [filterJurusan, setFilterJurusan] = useState("semua");
  const [cari, setCari] = useState("");
  const [hanyaBelumDipilih, setHanyaBelumDipilih] = useState(false);

  // Isi awal: jurusan tujuan otomatis kalau hanya ada satu pilihan, rombel ikut rombel lama.
  // Kelas XII defaultnya lulus.
  useEffect(() => {
    const awal: Record<string, Draft> = {};
    roster.forEach((r) => {
      const p = parsed.get(r.siswa_id);
      if (!p) return;
      const pil = pilihanJurusan(p, false);
      awal[r.siswa_id] = {
        tinggal: false,
        program: pil.length === 1 ? pil[0] : null,
        rombel: p.rombel,
        dipilih: false,
      };
    });
    setDraft(awal);
  }, [roster, parsed]);

  // Daftar jurusan untuk filter, mengikuti tingkat yang sedang dipilih.
  const jurusanList = useMemo(() => {
    const s = new Set<string>();
    roster.forEach((r) => {
      if (filterTingkat !== "semua" && String(r.tingkat) !== filterTingkat) return;
      const p = parsed.get(r.siswa_id);
      if (p) s.add(p.program);
    });
    return Array.from(s).sort();
  }, [roster, parsed, filterTingkat]);

  // Kalau jurusan yang dipilih tidak ada di tingkat baru, kembalikan ke "semua".
  useEffect(() => {
    if (filterJurusan !== "semua" && !jurusanList.includes(filterJurusan)) setFilterJurusan("semua");
  }, [jurusanList, filterJurusan]);

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return roster.filter((r) => {
      if (filterTingkat !== "semua" && String(r.tingkat) !== filterTingkat) return false;
      if (filterJurusan !== "semua" && parsed.get(r.siswa_id)?.program !== filterJurusan) return false;
      if (q && !(r.nama.toLowerCase().includes(q) || r.nis.toLowerCase().includes(q))) return false;
      if (hanyaBelumDipilih && (r.tingkat === 12 || draft[r.siswa_id]?.program)) return false;
      return true;
    });
  }, [roster, parsed, filterTingkat, filterJurusan, cari, hanyaBelumDipilih, draft]);

  const tampilBisaDiatur = useMemo(() => tampil.filter((r) => draft[r.siswa_id]), [tampil, draft]);

  const dipilihIds = useMemo(() => roster.filter((r) => draft[r.siswa_id]?.dipilih).map((r) => r.siswa_id), [roster, draft]);
  const semuaTampilDipilih = tampilBisaDiatur.length > 0 && tampilBisaDiatur.every((r) => draft[r.siswa_id]?.dipilih);
  const belumDipilihCount = roster.filter((r) => !draft[r.siswa_id]?.program).length;

  const jumlahLulus = useMemo(
    () => roster.filter((r) => r.tingkat === 12 && draft[r.siswa_id] && !draft[r.siswa_id].tinggal).length,
    [roster, draft]
  );
  const jumlahTidakLulus = useMemo(
    () => roster.filter((r) => r.tingkat === 12 && draft[r.siswa_id]?.tinggal).length,
    [roster, draft]
  );

  const ubah = (id: string, patch: Partial<Draft>) =>
    setDraft((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const ubahBanyak = (ids: string[], fn: (r: RosterItem, p: Parsed, d: Draft) => Partial<Draft>) =>
    setDraft((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        const r = roster.find((x) => x.siswa_id === id);
        const p = parsed.get(id);
        if (!r || !p || !next[id]) return;
        next[id] = { ...next[id], ...fn(r, p, next[id]) };
      });
      return next;
    });

  const toggleSemuaTampil = () => {
    const nilai = !semuaTampilDipilih;
    ubahBanyak(tampilBisaDiatur.map((r) => r.siswa_id), () => ({ dipilih: nilai }));
  };

  // ---- aksi massal untuk siswa yang dicentang ----
  const [bulkJurusan, setBulkJurusan] = useState("");
  const [bulkRombel, setBulkRombel] = useState("");
  const [infoBulk, setInfoBulk] = useState("");

  // ---- pilih banyak siswa dengan menempel NIS ----
  const [bukaTempel, setBukaTempel] = useState(false);
  const [teksNis, setTeksNis] = useState("");
  const [infoTempel, setInfoTempel] = useState<{
    ditemukan: number;
    tidakAda: string[];
  } | null>(null);

  const nisTerbaca = useMemo(() => ambilNis(teksNis), [teksNis]);

  const kosongkanPilihan = () => {
    ubahBanyak(dipilihIds, () => ({ dipilih: false }));
    setInfoBulk("");
    setInfoTempel(null);
  };

  const terapkanTempel = () => {
    const byNis = new Map(roster.map((r) => [r.nis, r]));
    const ids: string[] = [];
    const tidakAda: string[] = [];
    nisTerbaca.forEach((nis) => {
      const r = byNis.get(nis);
      if (!r) tidakAda.push(nis);
      else ids.push(r.siswa_id);
    });

    ubahBanyak(ids, () => ({ dipilih: true }));
    setInfoTempel({ ditemukan: ids.length, tidakAda });
    // Reset filter supaya semua siswa yang terpilih kelihatan di tabel.
    setFilterTingkat("semua");
    setFilterJurusan("semua");
    setCari("");
    setHanyaBelumDipilih(false);
    setTeksNis("");
    setBukaTempel(false);
  };

  // Pilihan jurusan tujuan mengikuti siswa yang sedang dicentang.
  const jurusanTujuanOpsi = useMemo(() => {
    const s = new Set<string>();
    dipilihIds.forEach((id) => {
      const p = parsed.get(id);
      const d = draft[id];
      if (p && d) pilihanJurusan(p, d.tinggal).forEach((j) => s.add(j));
    });
    return Array.from(s).sort();
  }, [dipilihIds, parsed, draft]);

  useEffect(() => {
    if (bulkJurusan && !jurusanTujuanOpsi.includes(bulkJurusan)) setBulkJurusan("");
  }, [jurusanTujuanOpsi, bulkJurusan]);

  const terapkanJurusanBulk = () => {
    if (!bulkJurusan) return;
    let berhasil = 0;
    let dilewati = 0;
    ubahBanyak(dipilihIds, (_r, p, d) => {
      if (pilihanJurusan(p, d.tinggal).includes(bulkJurusan)) {
        berhasil++;
        return { program: bulkJurusan };
      }
      dilewati++;
      return {};
    });
    setInfoBulk(
      dilewati > 0
        ? `${berhasil} siswa diubah ke ${bulkJurusan}. ${dilewati} dilewati karena jurusan itu bukan tujuan yang sesuai untuk kelas asalnya.`
        : `${berhasil} siswa diubah ke ${bulkJurusan}.`
    );
  };

  const terapkanRombelBulk = () => {
    if (!bulkRombel) return;
    const n = parseInt(bulkRombel, 10);
    ubahBanyak(dipilihIds, () => ({ rombel: n }));
    setInfoBulk(`${dipilihIds.length} siswa dipindah ke rombel ${n}.`);
  };

  const setTinggalBulk = (tinggal: boolean) => {
    ubahBanyak(dipilihIds, (_r, p) => {
      const pil = pilihanJurusan(p, tinggal);
      return { tinggal, program: pil.length === 1 ? pil[0] : null };
    });
    setInfoBulk(
      `${dipilihIds.length} siswa ditandai ${tinggal ? "tinggal kelas / tidak lulus" : "naik / lulus"}.`
    );
  };

  const lanjut = () => {
    const siap: SiapManual[] = [];
    const errorRows: ErrorManual[] = [];
    const belum: RosterItem[] = [];
    const lulus: RosterItem[] = [];
    roster.forEach((r) => {
      const p = parsed.get(r.siswa_id);
      const d = draft[r.siswa_id];
      if (!p || !d) {
        errorRows.push({ nis: r.nis, kelasBaru: "", pesan: `Format kelas asal "${r.kelas_nama}" tidak dikenali.` });
        return;
      }
      // Kelas XII yang lulus: tidak punya kelas baru.
      if (r.tingkat === 12 && !d.tinggal) {
        lulus.push(r);
        return;
      }
      const nama = namaTujuan(p, d);
      if (!nama) {
        belum.push(r);
        return;
      }
      const kb = parseKelas(nama);
      if (!kb) {
        errorRows.push({ nis: r.nis, kelasBaru: nama, pesan: `Format kelas tujuan "${nama}" tidak valid.` });
        return;
      }
      siap.push({ roster: r, kelasBaru: kb, hasil: d.tinggal ? "tinggal_kelas" : "naik" });
    });
    onLanjut({ siap, errorRows, belumDitempatkan: belum, otomatisLulus: lulus });
  };

  return (
    <div>
      <p className="text-sm text-muted mb-4">
        Semua siswa sudah diisi otomatis naik ke jurusan lanjutannya (PPLG → RPL, PM → BR, TJKT → TKJ, dst.).
        Siswa <b className="text-ink">MPLB</b> perlu dipilih sendiri antara MP atau MLOG.
        Kelas XII otomatis <b className="text-ink">lulus</b>, tandai &quot;Tidak lulus&quot; untuk yang harus mengulang.
        Pilih tingkat dan jurusan untuk mengatur satu angkatan sekaligus, atau tempel daftar NIS untuk memilih banyak siswa.
      </p>

      {belumDipilihCount > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50/70 border border-amber-100 text-amber-900 text-sm px-3.5 py-3 mb-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            <b>{belumDipilihCount}</b> siswa belum punya jurusan tujuan (kemungkinan MPLB). Siswa ini tidak akan dipindahkan
            sebelum kamu memilihnya.{" "}
            <button onClick={() => setHanyaBelumDipilih((v) => !v)} className="underline font-semibold">
              {hanyaBelumDipilih ? "Tampilkan semua" : "Tampilkan hanya yang belum dipilih"}
            </button>
          </span>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama atau NIS"
            className={`${controlCls} w-full pl-9 bg-surface`}
          />
        </div>
        <select
          value={filterTingkat}
          onChange={(e) => setFilterTingkat(e.target.value as any)}
          className={`${controlCls} !w-auto bg-surface`}
        >
          <option value="semua">Semua tingkat</option>
          <option value="10">Kelas X (10)</option>
          <option value="11">Kelas XI (11)</option>
          <option value="12">Kelas XII (12)</option>
        </select>
        <select
          value={filterJurusan}
          onChange={(e) => setFilterJurusan(e.target.value)}
          className={`${controlCls} !w-auto bg-surface`}
        >
          <option value="semua">Semua jurusan</option>
          {jurusanList.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>
        <button
          onClick={() => setBukaTempel((v) => !v)}
          className={`flex items-center gap-2 border text-ink text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors ${
            bukaTempel ? "bg-primary-50 border-primary-200" : "bg-white border-primary-100 hover:bg-surface"
          }`}
        >
          <ClipboardList size={15} />
          Tempel NIS
        </button>
      </div>

      {/* Kolom tempel NIS */}
      {bukaTempel && (
        <div className="rounded-xl border border-primary-100 bg-surface p-3.5 mb-3">
          <p className="text-sm font-semibold text-ink mb-1">Tempel daftar NIS</p>
          <p className="text-xs text-muted mb-2.5">
            Salin kolom NIS dari data sekolah, lalu tempel di bawah. Satu NIS per baris, atau dipisah spasi atau koma.
            Baris yang berisi nama dan NIS sekaligus juga bisa, angka NIS-nya akan diambil otomatis.
          </p>
          <textarea
            value={teksNis}
            onChange={(e) => setTeksNis(e.target.value)}
            rows={6}
            placeholder={"2682010355\n2682010356\n2682010357"}
            className={`${controlCls} w-full font-mono text-xs bg-white`}
            autoFocus
          />
          <div className="flex items-center justify-between gap-3 flex-wrap mt-2.5">
            <p className="text-xs text-muted">
              {nisTerbaca.length > 0 ? (
                <>
                  <b className="text-ink">{nisTerbaca.length}</b> NIS terbaca
                </>
              ) : (
                "Belum ada NIS yang terbaca"
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setBukaTempel(false);
                  setTeksNis("");
                }}
                className="text-sm font-semibold text-muted hover:text-ink px-3.5 py-2 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={terapkanTempel}
                disabled={nisTerbaca.length === 0}
                className="text-sm font-semibold bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl"
              >
                Pilih {nisTerbaca.length > 0 ? `${nisTerbaca.length} ` : ""}siswa
              </button>
            </div>
          </div>
        </div>
      )}

      {infoTempel && (
        <div className="rounded-xl bg-primary-50/70 border border-primary-100 text-sm text-primary-900 px-3.5 py-3 mb-3 flex items-start justify-between gap-3">
          <div>
            <p>
              <b>{infoTempel.ditemukan}</b> siswa dipilih
              {infoTempel.tidakAda.length > 0 && `, ${infoTempel.tidakAda.length} NIS tidak ditemukan`}.
            </p>
            {infoTempel.tidakAda.length > 0 && (
              <p className="text-xs mt-1 text-amber-800 break-words">
                Tidak ditemukan: {infoTempel.tidakAda.slice(0, 10).join(", ")}
                {infoTempel.tidakAda.length > 10 && ` dan ${infoTempel.tidakAda.length - 10} lainnya`}
              </p>
            )}
          </div>
          <button onClick={() => setInfoTempel(null)} className="text-muted hover:text-ink shrink-0" title="Tutup">
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* Aksi massal */}
      {dipilihIds.length > 0 && (
        <div className="rounded-xl bg-primary-50/70 border border-primary-100 p-3.5 mb-3">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-sm font-semibold text-primary-800">{dipilihIds.length} siswa dipilih</p>
            <button onClick={kosongkanPilihan} className="text-xs font-semibold text-primary-700 underline">
              Kosongkan pilihan
            </button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select value={bulkJurusan} onChange={(e) => setBulkJurusan(e.target.value)} className={`${controlCls} !w-auto bg-white`}>
              <option value="">Jurusan tujuan…</option>
              {jurusanTujuanOpsi.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
            <button
              onClick={terapkanJurusanBulk}
              disabled={!bulkJurusan}
              className="text-sm font-semibold bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl"
            >
              Terapkan
            </button>

            <select value={bulkRombel} onChange={(e) => setBulkRombel(e.target.value)} className={`${controlCls} !w-auto bg-white`}>
              <option value="">Rombel…</option>
              {Array.from({ length: maxRombel }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  Rombel {n}
                </option>
              ))}
            </select>
            <button
              onClick={terapkanRombelBulk}
              disabled={!bulkRombel}
              className="text-sm font-semibold bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl"
            >
              Terapkan
            </button>

            <span className="w-px h-6 bg-primary-200 mx-1" />
            <button
              onClick={() => setTinggalBulk(true)}
              className="text-sm font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 px-3.5 py-2 rounded-xl"
              title="Kelas X/XI: tinggal kelas. Kelas XII: tidak lulus."
            >
              Tinggal kelas / Tidak lulus
            </button>
            <button
              onClick={() => setTinggalBulk(false)}
              className="text-sm font-semibold bg-white border border-primary-200 hover:bg-primary-50 text-primary-800 px-3.5 py-2 rounded-xl"
              title="Kelas X/XI: naik. Kelas XII: lulus."
            >
              Naik / Lulus
            </button>
          </div>
          {infoBulk && <p className="text-xs text-primary-800 mt-2.5">{infoBulk}</p>}
        </div>
      )}

      {/* Tabel */}
      <div className="border border-primary-100 rounded-xl overflow-hidden max-h-[28rem] overflow-y-auto mb-5">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-surface z-10">
            <tr className="text-left text-muted">
              <th className="px-3 py-2 w-8">
                <input type="checkbox" checked={semuaTampilDipilih} onChange={toggleSemuaTampil} />
              </th>
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">Dari</th>
              <th className="px-3 py-2"></th>
              <th className="px-3 py-2">Ke</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {tampil.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted">
                  Tidak ada siswa yang cocok.
                </td>
              </tr>
            )}
            {tampil.map((r) => {
              const p = parsed.get(r.siswa_id);
              const d = draft[r.siswa_id];
              if (!p || !d) {
                return (
                  <tr key={r.siswa_id} className="border-t border-primary-50">
                    <td />
                    <td className="px-3 py-2 text-ink font-medium">{r.nama}</td>
                    <td className="px-3 py-2 text-muted">{r.kelas_nama}</td>
                    <td colSpan={3} className="px-3 py-2 text-red-600">
                      Format kelas tidak dikenali
                    </td>
                  </tr>
                );
              }
              const pil = pilihanJurusan(p, d.tinggal);
              const tujuan = namaTujuan(p, d);
              const lulus = p.tingkat === 12 && !d.tinggal;
              return (
                <tr key={r.siswa_id} className={`border-t border-primary-50 ${d.dipilih ? "bg-primary-50/50" : ""}`}>
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={d.dipilih} onChange={(e) => ubah(r.siswa_id, { dipilih: e.target.checked })} />
                  </td>
                  <td className="px-3 py-2 text-ink font-medium">
                    {r.nama}
                    <span className="block text-muted font-normal">{r.nis}</span>
                  </td>
                  <td className="px-3 py-2 text-muted">{r.kelas_nama}</td>
                  <td className="px-3 py-2 text-primary-500">
                    <ArrowRight size={12} />
                  </td>
                  <td className="px-3 py-2">
                    {lulus ? (
                      <span className="inline-flex items-center gap-1 text-muted">
                        <GraduationCap size={12} /> Lulus
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {pil.length > 1 ? (
                          <select
                            value={d.program ?? ""}
                            onChange={(e) => ubah(r.siswa_id, { program: e.target.value || null })}
                            className={`rounded-lg border px-2 py-1 text-xs ${
                              d.program ? "border-primary-200 bg-white" : "border-amber-300 bg-amber-50"
                            }`}
                          >
                            <option value="">Pilih jurusan…</option>
                            {pil.map((j) => (
                              <option key={j} value={j}>
                                {j}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-ink font-medium">
                            {ROMAWI[d.tinggal ? p.tingkat : p.tingkat + 1]} {pil[0]}
                          </span>
                        )}
                        <select
                          value={d.rombel}
                          onChange={(e) => ubah(r.siswa_id, { rombel: parseInt(e.target.value, 10) })}
                          className="rounded-lg border border-primary-200 bg-white px-1.5 py-1 text-xs"
                        >
                          {Array.from({ length: Math.max(maxRombel, d.rombel) }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                        {pil.length > 1 && d.program && <span className="text-muted">= {tujuan}</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => {
                        const tinggalBaru = !d.tinggal;
                        const pilBaru = pilihanJurusan(p, tinggalBaru);
                        ubah(r.siswa_id, { tinggal: tinggalBaru, program: pilBaru.length === 1 ? pilBaru[0] : null });
                      }}
                      className={`font-semibold px-2 py-0.5 rounded-full ${
                        d.tinggal ? "bg-amber-50 text-amber-700" : "bg-primary-50 text-primary-700"
                      }`}
                      title={`Klik untuk ganti ${labelNaik(p.tingkat)} / ${labelTinggal(p.tingkat)}`}
                    >
                      {d.tinggal ? labelTinggal(p.tingkat) : labelNaik(p.tingkat)}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted flex items-center gap-1.5">
          <CheckCircle2 size={14} className="text-primary-600" />
          Kelas XII: {jumlahLulus} siswa lulus
          {jumlahTidakLulus > 0 && `, ${jumlahTidakLulus} tidak lulus (tetap di XII)`}.
        </p>
        <button
          onClick={lanjut}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-semibold text-sm rounded-xl px-5 py-2.5"
        >
          Lanjut ke Pratinjau
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}