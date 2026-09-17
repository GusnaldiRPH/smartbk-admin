"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError(authError?.message ?? "Login gagal.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      setError("Akun ini bukan akun admin (Guru BK).");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    router.replace("/admin");
  };

  return (
    <div className="relative min-h-screen bg-[#FBF8F2] flex items-center justify-center px-4 py-10 overflow-hidden">
      {/* ===== Background dekoratif: pola titik + blob mengambang (kontras dikuatkan) ===== */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(14,111,76,0.22) 2px, transparent 2px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="absolute -top-20 -left-20 w-[26rem] h-[26rem] rounded-full bg-primary-700/25 blur-2xl animate-floatA" />
      <div className="absolute top-1/3 -right-24 w-[30rem] h-[30rem] rounded-full bg-[#F4A93B]/35 blur-2xl animate-floatB" />
      <div className="absolute -bottom-24 left-1/4 w-96 h-96 rounded-full bg-primary-700/20 blur-2xl animate-floatC" />
      <div className="absolute top-10 right-1/3 w-40 h-40 rounded-full bg-primary-700/15 blur-xl animate-floatC" />

      {/* ===== Kartu login ===== */}
      <div className="relative z-10 w-full max-w-4xl rounded-[2rem] overflow-hidden border border-primary-100 shadow-[0_20px_60px_-25px_rgba(14,111,76,0.35)] grid md:grid-cols-2 bg-white">
        {/* ===== Kiri: Form ===== */}
        <div className="flex flex-col justify-between p-9 md:p-11">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="SmartBK" className="w-9 h-9 rounded-xl object-cover" />
            <span className="font-extrabold text-ink tracking-tight">SmartBK</span>
          </div>

          <div className="my-9">
            <h1 className="font-serif text-3xl md:text-[2.15rem] leading-tight text-ink mb-2">
              Selamat datang kembali
            </h1>
            <p className="text-muted text-sm">
              Masuk ke panel Guru BK untuk mengelola soal, siswa, dan hasil asesmen.
            </p>

            <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-7">
              <div>
                <label className="text-xs font-semibold text-ink mb-1.5 block uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guru@sekolah.sch.id"
                  className="w-full bg-surface border border-primary-100 rounded-xl px-3.5 py-3 text-sm outline-none focus:border-primary-700 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink mb-1.5 block uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface border border-primary-100 rounded-xl px-3.5 py-3 text-sm outline-none focus:border-primary-700 transition-colors"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold text-sm rounded-xl py-3.5 flex items-center justify-center gap-2 transition-colors"
              >
                {loading && <Loader2 className="animate-spin" size={16} />}
                Masuk
              </button>
            </form>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Akses terbatas untuk Guru BK. Belum punya akun? Hubungi admin sistem sekolah kamu.
          </p>
        </div>

        {/* ===== Kanan: Panel visual ===== */}
        <div className="hidden md:block relative bg-primary-800 overflow-hidden">
          {/* lingkaran dekoratif statis (kontras panel) */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute bottom-10 -left-14 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-white/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full border border-white/10" />

          <div className="relative h-full flex flex-col items-center justify-center px-10 text-center">
            <img
              src="/logo.png"
              alt="SmartBK"
              className="w-20 h-20 rounded-3xl mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.25)] ring-1 ring-white/20"
            />
            <h2 className="text-white font-serif text-2xl mb-2">Bimbingan yang terarah</h2>
            <p className="text-primary-100/80 text-sm leading-relaxed max-w-[240px]">
              Pantau perkembangan minat, kepribadian, dan kesejahteraan setiap siswa dalam satu
              tempat.
            </p>

            <div className="flex items-center gap-3 mt-8">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <BookOpen color="#fff" size={16} />
              </div>
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Sparkles color="#fff" size={16} />
              </div>
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <img src="/logo.png" alt="" className="w-6 h-6 rounded-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}