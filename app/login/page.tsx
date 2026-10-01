"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const inputCls =
  "w-full bg-surface/70 border border-primary-100 rounded-xl pl-11 pr-3.5 py-3.5 text-sm outline-none transition-all placeholder:text-muted/60 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15";

const CHIPS = [
  { icon: BookOpen, label: "Asesmen Minat" },
  { icon: Sparkles, label: "Gaya Belajar" },
  { icon: Users, label: "DISC" },
  { icon: BarChart3, label: "Skala Stres" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-700 bg-[length:200%_200%] animate-gradient">
      {/* ===== Background: grid + blob bercahaya ===== */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-primary-400/30 blur-3xl animate-floatA" />
      <div className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] rounded-full bg-lime-300/20 blur-3xl animate-floatB" />
      <div className="absolute -bottom-32 left-1/3 w-[26rem] h-[26rem] rounded-full bg-emerald-300/20 blur-3xl animate-floatC" />

      {/* ===== Kartu login ===== */}
      <div className="relative z-10 w-full max-w-4xl rounded-[2rem] overflow-hidden grid md:grid-cols-2 bg-white/95 backdrop-blur-xl shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)] ring-1 ring-white/20 animate-popIn">
        {/* ===== Kiri: Form ===== */}
        <div className="flex flex-col justify-between p-9 md:p-11">
          <div className="flex items-center gap-2.5 animate-fadeUp">
            <img src="/logo.png" alt="SmartBK" className="w-10 h-10 rounded-xl object-cover shadow-md shadow-primary-700/20" />
            <span className="font-extrabold text-ink tracking-tight text-lg">SmartBK</span>
          </div>

          <div className="my-9">
            <h1
              className="text-3xl md:text-[2.2rem] font-extrabold leading-tight text-ink mb-2 animate-fadeUp"
              style={{ animationDelay: "100ms" }}
            >
              Selamat datang{" "}
              <span className="bg-gradient-to-r from-primary-500 to-primary-800 bg-clip-text text-transparent">
                kembali
              </span>
            </h1>
            <p className="text-muted text-sm animate-fadeUp" style={{ animationDelay: "180ms" }}>
              Masuk ke panel Guru BK untuk mengelola soal, siswa, dan hasil asesmen.
            </p>

            <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-7">
              <div className="animate-fadeUp" style={{ animationDelay: "260ms" }}>
                <label className="text-xs font-bold text-ink mb-1.5 block uppercase tracking-wider">
                  Email
                </label>
                <div className="relative group">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary-600"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="guru@sekolah.sch.id"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="animate-fadeUp" style={{ animationDelay: "340ms" }}>
                <label className="text-xs font-bold text-ink mb-1.5 block uppercase tracking-wider">
                  Password
                </label>
                <div className="relative group">
                  <Lock
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary-600"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputCls} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary-700 transition-colors"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  key={error}
                  className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-sm text-red-700 animate-shake"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ animationDelay: "420ms" }}
                className="group relative mt-2 w-full overflow-hidden bg-gradient-to-r from-primary-500 to-primary-700 text-white font-semibold text-sm rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-[0_14px_30px_-12px_rgba(10,125,78,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-12px_rgba(10,125,78,0.9)] active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none animate-fadeUp"
              >
                <span className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 -translate-x-full bg-white/25 transition-transform duration-700 group-hover:translate-x-[400%]" />
                {loading ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <>
                    Masuk
                    <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p
            className="flex items-start gap-2 text-xs text-muted leading-relaxed animate-fadeUp"
            style={{ animationDelay: "500ms" }}
          >
            <ShieldCheck size={15} className="text-primary-600 shrink-0 mt-0.5" />
            Akses terbatas untuk Guru BK. Belum punya akun? Hubungi admin sistem sekolah kamu.
          </p>
        </div>

        {/* ===== Kanan: Panel visual ===== */}
        <div className="hidden md:block relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-700 to-primary-950 bg-[length:200%_200%] animate-gradient">
          <div
            className="absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
              backgroundSize: "36px 36px",
              maskImage: "radial-gradient(circle at center, black 25%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(circle at center, black 25%, transparent 75%)",
            }}
          />
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary-300/30 blur-3xl animate-floatA" />
          <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-lime-300/20 blur-3xl animate-floatB" />

          <div className="relative h-full flex flex-col items-center justify-center px-10 text-center">
            <div className="relative mb-7">
              <span className="absolute inset-0 rounded-3xl bg-white/30 animate-ring" />
              <span className="absolute inset-0 rounded-3xl bg-white/20 animate-ring" style={{ animationDelay: "1.2s" }} />
              <img
                src="/logo.png"
                alt="SmartBK"
                className="relative w-20 h-20 rounded-3xl shadow-2xl ring-1 ring-white/30"
              />
            </div>
            <h2 className="text-white font-extrabold text-2xl mb-2 tracking-tight">Bimbingan yang terarah</h2>
            <p className="text-primary-50/80 text-sm leading-relaxed max-w-[250px]">
              Pantau perkembangan minat, kepribadian, dan kesejahteraan setiap siswa dalam satu tempat.
            </p>

            <div className="flex flex-wrap justify-center gap-2.5 mt-8 max-w-[300px]">
              {CHIPS.map((c, i) => {
                const Icon = c.icon;
                return (
                  <span
                    key={c.label}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-2 text-xs font-medium text-white animate-bob"
                    style={{ animationDelay: `${i * 0.6}s` }}
                  >
                    <Icon size={13} />
                    {c.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}