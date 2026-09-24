import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "ID siswa tidak valid." }, { status: 400 });
  }

  try {
    // Hapus baris profile dulu (supaya kalau ada foreign key ke tabel lain
    // seperti assessment_results/student_answers, errornya jelas kelihatan
    // di sini, bukan menyisakan akun login tanpa profile).
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // Baru hapus akun login-nya dari Supabase Auth.
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) {
      return NextResponse.json(
        {
          error: `Profile terhapus, tapi akun login gagal dihapus: ${authError.message}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Terjadi kesalahan tak terduga." },
      { status: 500 }
    );
  }
}