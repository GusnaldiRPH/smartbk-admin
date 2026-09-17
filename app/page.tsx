import Link from "next/link";
import {
  Compass,
  UsersRound,
  BookOpen,
  GraduationCap,
  HeartPulse,
  Download,
  Smartphone,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: Compass,
    title: "Asesmen Minat RMIB",
    desc: "Bantu siswa menemukan bidang pekerjaan yang paling sesuai minatnya lewat metode ranking terstandar.",
  },
  {
    icon: UsersRound,
    title: "Kepribadian DISC",
    desc: "Petakan gaya kepribadian siswa (Dominance, Influence, Steadiness, Conscientiousness) lewat studi kasus interaktif.",
  },
  {
    icon: BookOpen,
    title: "Gaya Belajar",
    desc: "Kenali apakah siswa lebih cocok belajar secara visual, auditori, atau kinestetik.",
  },
  {
    icon: GraduationCap,
    title: "Perencanaan Studi Lanjut",
    desc: "Rekomendasi arah studi lanjut berdasarkan minat dan kesiapan siswa.",
  },
  {
    icon: HeartPulse,
    title: "Skala Stres Akademik",
    desc: "Deteksi dini tingkat stres akademik siswa, lengkap dengan rekomendasi tindak lanjut.",
  },
];

// URL file APK diambil dari Supabase Storage (bucket public), lewat env var
// supaya bisa diganti kapan saja tanpa perlu edit atau deploy ulang kode.
const APK_URL = process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL ?? "";

export default function LandingPage() {
  return (
    <div className="bg-[#FBF8F2] text-ink">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-primary-100">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="SmartBK" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-extrabold text-ink tracking-tight">SmartBK</span>
          </div>
          <Link
            href="/login"
            className="bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Masuk sebagai Admin
          </Link>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(14,111,76,0.18) 2px, transparent 2px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="absolute -top-24 -left-20 w-[28rem] h-[28rem] rounded-full bg-primary-700/15 blur-2xl animate-floatA" />
        <div className="absolute top-10 -right-20 w-[26rem] h-[26rem] rounded-full bg-[#F4A93B]/30 blur-2xl animate-floatB" />

        <div className="relative max-w-4xl mx-auto px-5 pt-20 pb-24 text-center">
          <span className="inline-block bg-primary-100 text-primary-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            Platform Bimbingan Konseling Digital
          </span>
          <h1 className="font-serif text-4xl md:text-5xl leading-tight mb-5">
            Kenali dirimu,
            <br />
            temukan arahmu.
          </h1>
          <p className="text-muted text-base md:text-lg max-w-xl mx-auto mb-8">
            SmartBK bantu Guru BK memetakan minat, kepribadian, gaya belajar, dan kesejahteraan
            setiap siswa — lewat asesmen digital yang cepat, terstruktur, dan mudah dipahami.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="#download"
              className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
            >
              <Download size={16} />
              Download Aplikasi
            </a>
            <a
              href="#fitur"
              className="flex items-center gap-2 bg-white hover:bg-surface border border-primary-100 text-ink text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
            >
              Lihat Fitur
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ===== Fitur ===== */}
      <section id="fitur" className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl mb-3">Asesmen yang SmartBK sediakan</h2>
          <p className="text-muted max-w-lg mx-auto">
            Lima jenis asesmen yang saling melengkapi untuk memahami siswa secara utuh.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-white border border-primary-100 rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
                  <Icon size={20} color="#0e6f4c" />
                </div>
                <h3 className="font-bold text-ink mb-1.5">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== Untuk siapa ===== */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-7">
            <h3 className="font-bold text-lg text-ink mb-2">Untuk Siswa</h3>
            <p className="text-muted text-sm leading-relaxed">
              Kerjakan asesmen kapan saja lewat aplikasi Android, lihat hasilnya langsung, dan
              pahami dirimu lebih baik — mulai dari minat karier sampai gaya belajar yang paling
              cocok.
            </p>
          </div>
          <div className="bg-primary-800 rounded-2xl p-7">
            <h3 className="font-bold text-lg text-white mb-2">Untuk Guru BK</h3>
            <p className="text-primary-100/80 text-sm leading-relaxed">
              Kelola soal, pantau hasil seluruh siswa dalam satu dashboard, dan berikan
              rekomendasi yang lebih tepat sasaran berdasarkan data, bukan sekadar asumsi.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Download ===== */}
      <section id="download" className="relative overflow-hidden bg-primary-800">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute bottom-0 -left-14 w-48 h-48 rounded-full bg-white/5" />

        <div className="relative max-w-3xl mx-auto px-5 py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
            <Smartphone color="#fff" size={26} />
          </div>
          <h2 className="font-serif text-3xl text-white mb-3">Coba SmartBK di HP kamu</h2>
          <p className="text-primary-100/80 text-sm md:text-base mb-8 max-w-md mx-auto">
            Unduh aplikasi Android SmartBK untuk siswa, kerjakan asesmen, dan lihat hasilnya
            langsung dari genggaman.
          </p>

          {APK_URL ? (
            <a
              href={APK_URL}
              download
              className="inline-flex items-center gap-2 bg-white hover:bg-primary-50 text-primary-800 text-sm font-bold px-6 py-3.5 rounded-xl transition-colors"
            >
              <Download size={18} />
              Download Aplikasi (.apk)
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 bg-white/50 text-primary-800/60 text-sm font-bold px-6 py-3.5 rounded-xl cursor-not-allowed">
              <Download size={18} />
              Link download belum diatur
            </span>
          )}

          <p className="text-primary-100/60 text-xs mt-4">
            Untuk perangkat Android. Aktifkan &quot;Izinkan dari sumber tidak dikenal&quot; di
            pengaturan HP kamu saat menginstal.
          </p>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-primary-100 py-6">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
          <span>© {new Date().getFullYear()} SmartBK. Semua hak dilindungi.</span>
          <Link href="/login" className="hover:text-primary-700">
            Masuk sebagai Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}