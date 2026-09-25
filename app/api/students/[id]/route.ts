import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "ID siswa tidak valid." }, { status: 400 });
  }

  try {
    // Menghapus siswa otomatis ikut menghapus riwayat_kelas-nya (ON DELETE CASCADE),
    // dan mengosongkan riwayat_kelas_id di assessment_results (ON DELETE SET NULL),
    // jadi hasil asesmennya tidak ikut hilang.
    const { error: siswaError } = await supabaseAdmin.from("siswa").delete().eq("user_id", id);
    if (siswaError) {
      return NextResponse.json({ error: `Gagal menghapus data siswa: ${siswaError.message}` }, { status: 400 });
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", id);
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) {
      return NextResponse.json(
        { error: `Profile terhapus, tapi akun login gagal dihapus: ${authError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan tak terduga." }, { status: 500 });
  }
}