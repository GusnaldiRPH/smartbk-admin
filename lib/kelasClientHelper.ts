import { supabase } from "@/lib/supabaseClient";

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

export async function ensureKelasId(tahunAjaranId: string, k: NonNullable<ReturnType<typeof parseKelas>>) {
  const { data: existing } = await supabase
    .from("kelas").select("id")
    .eq("tahun_ajaran_id", tahunAjaranId).eq("nama", k.nama).maybeSingle();
  if (existing) return existing.id as string;

  const { data: konsentrasi } = await supabase
    .from("konsentrasi_keahlian").select("id, program_id").eq("kode", k.kode).maybeSingle();

  let program_id: string;
  let konsentrasi_id: string | null = null;
  if (konsentrasi) {
    program_id = konsentrasi.program_id;
    konsentrasi_id = konsentrasi.id;
  } else {
    const { data: program } = await supabase
      .from("program_keahlian").select("id").eq("kode", k.kode).maybeSingle();
    if (!program) throw new Error(`Kode jurusan "${k.kode}" belum terdaftar di program/konsentrasi keahlian.`);
    program_id = program.id;
  }

  const { data: created, error } = await supabase
    .from("kelas")
    .insert({ tahun_ajaran_id: tahunAjaranId, tingkat: k.tingkat, program_id, konsentrasi_id, rombel: k.rombel, nama: k.nama })
    .select("id").single();
  if (error) throw error;
  return created.id as string;
}