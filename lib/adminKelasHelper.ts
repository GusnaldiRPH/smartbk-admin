import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ROMAWI: Record<string, number> = { X: 10, XI: 11, XII: 12 };

export function parseKelas(raw: string) {
  const m = raw.trim().toUpperCase().match(/^(XII|XI|X)\s+(\S+)\s+(\d+)$/);
  if (!m) return null;
  return {
    tingkat: ROMAWI[m[1]],
    kode: m[2],
    rombel: Number(m[3]),
    nama: `${m[1]} ${m[2]} ${Number(m[3])}`,
  };
}

export function normalizeJenisKelamin(v: string | undefined | null): "L" | "P" | null {
  const s = (v ?? "").trim().toLowerCase();
  if (["l", "laki-laki", "laki laki", "pria"].includes(s)) return "L";
  if (["p", "perempuan", "wanita"].includes(s)) return "P";
  return null;
}

export function normalizeTanggal(v: string | undefined | null): { ok: boolean; value: string | null } {
  const s = (v ?? "").trim();
  if (!s) return { ok: true, value: null };
  let y: number, m: number, d: number;
  let match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    y = +match[1]; m = +match[2]; d = +match[3];
  } else {
    match = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (!match) return { ok: false, value: null };
    d = +match[1]; m = +match[2]; y = +match[3];
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return { ok: false, value: null };
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return { ok: true, value: `${y}-${pad(m)}-${pad(d)}` };
}

async function ensureKelasId(k: { tingkat: number; kode: string; rombel: number; nama: string }) {
  const { data: ta, error: taError } = await supabaseAdmin
    .from("tahun_ajaran").select("id").eq("is_active", true).single();
  if (taError || !ta) throw new Error("Tidak ada tahun ajaran aktif di database.");

  const { data: existing } = await supabaseAdmin
    .from("kelas").select("id")
    .eq("tahun_ajaran_id", ta.id).eq("nama", k.nama).maybeSingle();
  if (existing) return existing.id;

  const { data: konsentrasi } = await supabaseAdmin
    .from("konsentrasi_keahlian").select("id, program_id").eq("kode", k.kode).maybeSingle();

  let program_id: string;
  let konsentrasi_id: string | null = null;
  if (konsentrasi) {
    program_id = konsentrasi.program_id;
    konsentrasi_id = konsentrasi.id;
  } else {
    const { data: program } = await supabaseAdmin
      .from("program_keahlian").select("id").eq("kode", k.kode).maybeSingle();
    if (!program) throw new Error(`Kode jurusan "${k.kode}" belum terdaftar di program/konsentrasi keahlian.`);
    program_id = program.id;
  }

  const { data: created, error } = await supabaseAdmin
    .from("kelas")
    .insert({ tahun_ajaran_id: ta.id, tingkat: k.tingkat, program_id, konsentrasi_id, rombel: k.rombel, nama: k.nama })
    .select("id").single();
  if (error) throw error;
  return created.id;
}

/** Menghubungkan akun siswa ke tabel `siswa` dan menempatkannya di kelas tahun ajaran aktif. */
export async function upsertSiswaDanKelas(params: {
  userId: string;
  nis: string;
  nama: string;
  jenisKelamin: "L" | "P";
  noTelepon?: string | null;
  alamat?: string | null;
  tempatLahir?: string | null;
  tanggalLahir?: string | null;
  kelasText: string;
}) {
  const parsed = parseKelas(params.kelasText);
  if (!parsed) throw new Error(`Format kelas "${params.kelasText}" tidak dikenali (contoh: XI RPL 2).`);
  const kelasId = await ensureKelasId(parsed);

  const { data: siswa, error: siswaError } = await supabaseAdmin
    .from("siswa")
    .upsert(
      {
        user_id: params.userId,
        nis: params.nis,
        nama: params.nama,
        jenis_kelamin: params.jenisKelamin,
        no_telepon: params.noTelepon ?? null,
        alamat: params.alamat ?? null,
        tempat_lahir: params.tempatLahir ?? null,
        tanggal_lahir: params.tanggalLahir ?? null,
      },
      { onConflict: "user_id" }
    )
    .select("id").single();
  if (siswaError) throw siswaError;

  const { data: ta } = await supabaseAdmin.from("tahun_ajaran").select("id").eq("is_active", true).single();

  const { error: rkError } = await supabaseAdmin
    .from("riwayat_kelas")
    .upsert(
      { siswa_id: siswa.id, kelas_id: kelasId, tahun_ajaran_id: ta!.id },
      { onConflict: "siswa_id,tahun_ajaran_id" }
    );
  if (rkError) throw rkError;

  return parsed.nama;
}