# SmartBK Admin (Next.js)

Panel admin untuk Guru BK — dashboard, kelola soal, kelola siswa. Pakai Supabase
project yang **sama** dengan app React Native (`smartbk-app`) supaya datanya konsisten.

## Setup

1. Extract folder ini, lalu masuk ke direktorinya:
   ```bash
   cd smartbk-admin
   npm install
   ```

2. Copy `.env.local.example` jadi `.env.local`, lalu isi dengan URL & anon key
   Supabase project kamu (Project Settings > API di dashboard Supabase — sama
   dengan yang dipakai di `smartbk-app/src/config/supabase.ts`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://andearoulbepkjsjcsdz.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_4H6pWZCBC4BGUIbW9s0K1A_ktfPpQdd
   ```

3. Jalankan:
   ```bash
   npm run dev
   ```
   Buka http://localhost:3000 — otomatis redirect ke `/login`.

## Login

Login pakai akun yang di tabel `profiles` punya `role = 'admin'`. Kalau belum
punya akun admin, buat lewat Supabase Dashboard > Authentication > Add User,
lalu insert baris di tabel `profiles` dengan `role: 'admin'` dan `id` yang sama
dengan `id` user auth-nya.

## Struktur

```
app/
  login/page.tsx              — halaman login admin
  admin/
    layout.tsx                — sidebar + auth guard (semua /admin/* butuh login admin)
    page.tsx                  — Dashboard (stats + hasil terbaru)
    questions/
      page.tsx                — daftar soal per asesmen
      new/page.tsx             — tambah soal baru
      [id]/page.tsx            — edit soal
    students/
      page.tsx                — daftar siswa
      [id]/page.tsx            — detail siswa + riwayat hasil asesmen
components/
  QuestionForm.tsx             — form soal (cabang: default/DISC/RMIB), dipakai new & edit
lib/
  supabaseClient.ts            — Supabase client
  assessmentService.ts         — semua query ke Supabase
  scoring.ts                   — logic perhitungan skor (identik dengan app RN)
  useAdminAuth.ts               — hook cek sesi login + role admin
types/
  index.ts                     — tipe data (identik dengan app RN)
```

## Catatan

- Semua logic scoring (`lib/scoring.ts`) dan query Supabase (`lib/assessmentService.ts`)
  di-port 1:1 dari `smartbk-app` (React Native), supaya hasil hitungannya konsisten
  di kedua platform.
- Kalau nanti perlu fitur "Kelola Dimensi" (tambah/edit dimensi per asesmen) di UI,
  function `createDimension` / `updateDimension` / `deleteDimension` sudah ada di
  `lib/assessmentService.ts`, tinggal dibuatkan halamannya.
- RLS (Row Level Security) di Supabase perlu diatur supaya user dengan role admin
  bisa baca/tulis ke tabel `questions`, `assessments`, `assessment_dimensions`,
  `assessment_results`, dan `profiles` (role siswa).
