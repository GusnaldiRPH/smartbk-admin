import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase dengan Service Role Key — HANYA boleh dipakai di kode
 * server-side (API routes / route handlers), TIDAK PERNAH di komponen client.
 * Service role key bisa bypass RLS, jadi kalau bocor ke browser siapa pun
 * bisa baca/tulis semua data.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);