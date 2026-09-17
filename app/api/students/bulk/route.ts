import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface StudentRow {
  full_name: string;
  email: string;
  password: string;
  class_name?: string;
  nis?: string;
}

interface RowResult {
  row: number;
  email: string;
  success: boolean;
  error?: string;
}

const MAX_ROWS = 200;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const students: StudentRow[] = body.students ?? [];

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: "Tidak ada data siswa yang dikirim." }, { status: 400 });
    }
    if (students.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_ROWS} siswa per import. Bagi file jadi beberapa bagian.` },
        { status: 400 }
      );
    }

    const results: RowResult[] = [];

    // Diproses satu-satu (bukan paralel) supaya kalau ada 1 baris gagal,
    // baris lain tetap lanjut diproses tanpa saling mengganggu rate limit Supabase Auth.
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const rowNum = i + 2; // +2 karena baris 1 di Excel = header

      if (!s.full_name?.trim() || !s.email?.trim() || !s.password?.trim()) {
        results.push({
          row: rowNum,
          email: s.email ?? "-",
          success: false,
          error: "Nama, email, atau password kosong.",
        });
        continue;
      }
      if (s.password.length < 6) {
        results.push({
          row: rowNum,
          email: s.email,
          success: false,
          error: "Password minimal 6 karakter.",
        });
        continue;
      }

      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: s.email.trim(),
        password: s.password,
        email_confirm: true,
      });

      if (userError || !userData.user) {
        results.push({
          row: rowNum,
          email: s.email,
          success: false,
          error: userError?.message ?? "Gagal membuat akun.",
        });
        continue;
      }

      const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
        id: userData.user.id,
        email: s.email.trim(),
        full_name: s.full_name.trim(),
        role: "siswa",
        class_name: s.class_name?.trim() || null,
        nis: s.nis?.trim() || null,
      });

      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
        results.push({ row: rowNum, email: s.email, success: false, error: profileError.message });
        continue;
      }

      results.push({ row: rowNum, email: s.email, success: true });
    }

    const successCount = results.filter((r) => r.success).length;
    return NextResponse.json({
      successCount,
      failCount: results.length - successCount,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Terjadi kesalahan tak terduga." },
      { status: 500 }
    );
  }
}