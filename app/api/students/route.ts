import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeJenisKelamin, normalizeTanggal, upsertSiswaDanKelas } from "@/lib/adminKelasHelper";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      full_name, email, password, class_name, nis,
      jenis_kelamin, no_telepon, alamat, tempat_lahir, tanggal_lahir,
    } = body as Record<string, string | undefined>;

    if (!full_name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Nama, email, dan password wajib diisi." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
    }
    if (!nis?.trim()) {
      return NextResponse.json({ error: "NIS wajib diisi." }, { status: 400 });
    }
    if (!class_name?.trim()) {
      return NextResponse.json({ error: "Kelas wajib diisi (contoh: XI RPL 2)." }, { status: 400 });
    }
    const jk = normalizeJenisKelamin(jenis_kelamin);
    if (!jk) {
      return NextResponse.json({ error: "Jenis Kelamin wajib diisi (L atau P)." }, { status: 400 });
    }
    const tgl = normalizeTanggal(tanggal_lahir);
    if (!tgl.ok) {
      return NextResponse.json({ error: "Format Tanggal Lahir tidak valid (pakai YYYY-MM-DD)." }, { status: 400 });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (userError || !userData.user) {
      return NextResponse.json({ error: userError?.message ?? "Gagal membuat akun siswa." }, { status: 400 });
    }
    const userId = userData.user.id;

    try {
      const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
        id: userId, email, full_name: full_name.trim(), role: "siswa",
        class_name: class_name.trim(), nis: nis.trim(),
      });
      if (profileError) throw profileError;

      await upsertSiswaDanKelas({
        userId, nis: nis.trim(), nama: full_name.trim(), jenisKelamin: jk,
        noTelepon: no_telepon?.trim() || null, alamat: alamat?.trim() || null,
        tempatLahir: tempat_lahir?.trim() || null, tanggalLahir: tgl.value,
        kelasText: class_name.trim(),
      });

      return NextResponse.json({ success: true, id: userId });
    } catch (inner: any) {
      // rollback: profile dan siswa boleh gagal terhapus sebagian,
      // yang penting akun auth tidak jadi "hantu" tanpa data
      await supabaseAdmin.from("siswa").delete().eq("user_id", userId);
      await supabaseAdmin.from("profiles").delete().eq("id", userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: inner.message ?? "Gagal menyimpan data siswa." }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan tak terduga." }, { status: 500 });
  }
}