import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { full_name, email, password, class_name, nis } = body as {
      full_name?: string;
      email?: string;
      password?: string;
      class_name?: string;
      nis?: string;
    };

    if (!full_name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Nama, email, dan password wajib diisi." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    // 1. Buat akun auth (langsung terverifikasi, tanpa email konfirmasi)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: userError?.message ?? "Gagal membuat akun siswa." },
        { status: 400 }
      );
    }

    // 2. Buat/lengkapi baris profile-nya
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userData.user.id,
      email,
      full_name: full_name.trim(),
      role: "siswa",
      class_name: class_name?.trim() || null,
      nis: nis?.trim() || null,
    });

    if (profileError) {
      // Rollback: kalau profile gagal disimpan, hapus lagi akun auth-nya
      // biar tidak jadi akun "hantu" tanpa profile.
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: userData.user.id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Terjadi kesalahan tak terduga." },
      { status: 500 }
    );
  }
}