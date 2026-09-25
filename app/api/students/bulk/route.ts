import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeJenisKelamin, normalizeTanggal, upsertSiswaDanKelas } from "@/lib/adminKelasHelper";

interface StudentRow {
  full_name: string;
  email: string;
  password?: string;
  class_name?: string;
  nis?: string;
  jenis_kelamin?: string;
  no_telepon?: string;
  alamat?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
}

export async function POST(req: Request) {
  try {
    const { students } = (await req.json()) as { students: StudentRow[] };
    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: "Tidak ada data siswa yang dikirim." }, { status: 400 });
    }

    const results: { row: number; email: string; success: boolean; error?: string }[] = [];

    for (let i = 0; i < students.length; i++) {
      const r = students[i];
      const rowNum = i + 2;
      const email = r.email?.trim().toLowerCase();

      try {
        if (!r.full_name?.trim() || !email) throw new Error("Nama atau email kosong.");
        if (!r.nis?.trim()) throw new Error("NIS kosong.");
        if (!r.class_name?.trim()) throw new Error("Kelas kosong.");
        const jk = normalizeJenisKelamin(r.jenis_kelamin);
        if (!jk) throw new Error("Jenis Kelamin wajib diisi (L/P).");
        const tgl = normalizeTanggal(r.tanggal_lahir);
        if (!tgl.ok) throw new Error("Format Tanggal Lahir tidak valid.");

        const { data: existing } = await supabaseAdmin
          .from("profiles").select("id, role").ilike("email", email).maybeSingle();

        let userId: string;
        if (existing) {
          if (existing.role === "admin") throw new Error("Email ini adalah akun admin, bukan siswa.");
          userId = existing.id;
        } else {
          if (!r.password || r.password.length < 6) {
            throw new Error("Akun belum ada, Password wajib diisi (minimal 6 karakter).");
          }
          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email, password: r.password, email_confirm: true,
          });
          if (userError || !userData.user) throw new Error(userError?.message ?? "Gagal membuat akun.");
          userId = userData.user.id;
        }

        const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
          id: userId, email, full_name: r.full_name.trim(), role: "siswa",
          class_name: r.class_name.trim(), nis: r.nis.trim(),
        });
        if (profileError) throw profileError;

        await upsertSiswaDanKelas({
          userId, nis: r.nis.trim(), nama: r.full_name.trim(), jenisKelamin: jk,
          noTelepon: r.no_telepon?.trim() || null, alamat: r.alamat?.trim() || null,
          tempatLahir: r.tempat_lahir?.trim() || null, tanggalLahir: tgl.value,
          kelasText: r.class_name.trim(),
        });

        results.push({ row: rowNum, email, success: true });
      } catch (e: any) {
        results.push({ row: rowNum, email: email ?? "-", success: false, error: e.message });
      }
    }

    return NextResponse.json({ results, successCount: results.filter((r) => r.success).length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan tak terduga." }, { status: 500 });
  }
}