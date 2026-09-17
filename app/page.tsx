import { BrowserFrame, PhoneFrame } from '@/components/Frames';
import Link from "next/link";
import {
  Compass,
  UsersRound,
  BookOpen,
  GraduationCap,
  HeartPulse,
  FileCheck2,
  Download,
  Smartphone,
  ArrowRight,
  Link2,
  Clock,
  Database,
  LogIn,
  ClipboardCheck,
  CloudUpload,
  BarChart3,
  Zap,
  FolderCheck,
  Timer,
  Smile,
} from "lucide-react";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import HeroImage from "@/components/HeroImage";

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
    desc: "Rekomendasi arah studi lanjut berdasarkan minat, bakat, kemampuan, serta cita-cita siswa.",
  },
  {
    icon: HeartPulse,
    title: "Skala Stres Akademik",
    desc: "Deteksi dini tingkat stres akademik siswa, lengkap dengan rekomendasi tindak lanjut.",
  },
  {
    icon: FileCheck2,
    title: "Laporan PDF",
    desc: "Hasil asesmen bisa langsung diunduh sebagai laporan PDF untuk didokumentasikan atau dibagikan.",
  },
];

const PROBLEMS = [
  {
    icon: Link2,
    title: "Akses Tersebar",
    desc: "Asesmen BK masih memakai form-form terpisah di browser dengan link yang beda-beda untuk tiap layanan.",
  },
  {
    icon: Clock,
    title: "Butuh Waktu",
    desc: "Rekap data manual butuh waktu lama dan menyita jam layanan BK yang seharusnya untuk siswa.",
  },
  {
    icon: Database,
    title: "Sulit Dikelola",
    desc: "Data hasil asesmen tersebar dan sulit dipantau, padahal perlu dikelola rapi agar mudah ditindaklanjuti.",
  },
];

const STEPS = [
  { icon: LogIn, title: "Masuk ke Aplikasi", desc: "Siswa login pakai akun masing-masing lewat aplikasi Android." },
  { icon: ClipboardCheck, title: "Kerjakan Asesmen", desc: "Pilih layanan BK, lalu isi asesmen langsung dari HP." },
  { icon: CloudUpload, title: "Tersimpan Otomatis", desc: "Jawaban & hasil tersimpan digital, tanpa rekap manual." },
  { icon: BarChart3, title: "Guru BK Pantau Hasil", desc: "Guru BK melihat dan menindaklanjuti hasil kapan saja." },
];

const BENEFITS = [
  { icon: Zap, title: "Lebih Praktis", desc: "Asesmen lebih praktis bagi siswa maupun Guru BK." },
  { icon: FolderCheck, title: "Data Lebih Rapi", desc: "Rekap dan pengelolaan data lebih rapi dan terpantau." },
  { icon: Timer, title: "Hemat Waktu", desc: "Menghemat waktu administrasi Guru BK." },
  { icon: Smile, title: "Mudah Diisi", desc: "Memudahkan siswa mengisi asesmen kapan saja, di mana saja." },
];

const STATS = [
  { value: "5+", label: "Jenis Asesmen" },
  { value: "2", label: "Peran: Admin & Siswa" },
  { value: "100%", label: "Digital, Tanpa Kertas" },
  { value: "1", label: "Aplikasi untuk Semua Layanan BK" },
];

// URL file APK (GitHub Releases / Supabase Storage), lewat env var supaya
// bisa diganti kapan saja tanpa perlu edit atau deploy ulang kode.
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
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted">
            <a href="#showcase" className="hover:text-primary-700">Produk</a>
            <a href="#fitur" className="hover:text-primary-700">Fitur</a>
            <a href="#download" className="hover:text-primary-700">Download</a>
          </nav>
          <Link
            href="/login"
            className="bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Masuk sebagai Admin
          </Link>
        </div>
      </header>

      {/* ===== Hero: teks kiri, gambar kanan ===== */}
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

        <div className="relative max-w-6xl mx-auto px-5 pt-14 pb-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Kiri: teks */}
            <div className="text-center md:text-left">
              <span className="inline-block bg-primary-100 text-primary-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                Platform Bimbingan Konseling Digital
              </span>
              <h1 className="font-serif text-4xl md:text-5xl leading-tight mb-5">
                Kenali dirimu,
                <br />
                temukan arahmu.
              </h1>
              <p className="text-muted text-base md:text-lg max-w-md mx-auto md:mx-0 mb-8">
                SmartBK adalah aplikasi Bimbingan dan Konseling berbasis Android yang membantu
                Guru BK mengelola layanan &amp; asesmen, sekaligus memudahkan siswa mengerjakan
                asesmen dan melihat hasilnya langsung dari HP.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <a
                  href="#download"
                  className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
                >
                  <Download size={16} />
                  Download Aplikasi
                </a>
                <a
                  href="#showcase"
                  className="flex items-center gap-2 bg-white hover:bg-surface border border-primary-100 text-ink text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
                >
                  Lihat Tampilan Aplikasi
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>

            {/* Kanan: gambar */}
            <HeroImage />
          </div>

          {/* Stat row ala Crocoblock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-primary-100 pt-8 mt-14">
            {STATS.map((s) => (
              <div key={s.label} className="text-center md:text-left">
                <p className="font-serif text-2xl md:text-3xl text-primary-800">{s.value}</p>
                <p className="text-xs text-muted mt-1 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Showcase: screenshot produk, bergantian kiri-kanan ===== */}
      <section id="showcase" className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center mb-14">
          <h2 className="font-serif text-3xl mb-3">Lihat SmartBK bekerja</h2>
          <p className="text-muted max-w-lg mx-auto">
            Satu aplikasi, dua sisi — dashboard lengkap untuk Guru BK dan pengalaman ringkas
            untuk siswa.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center mb-16">
          <div>
            <span className="text-xs font-bold text-primary-700 uppercase tracking-wide">
              Untuk Guru BK
            </span>
            <h3 className="font-serif text-2xl mt-2 mb-3">Kelola semuanya dari satu dashboard</h3>
            <p className="text-muted text-sm leading-relaxed">
              Pantau aktivitas asesmen, kelola soal per layanan BK, kelola data siswa, dan lihat
              hasil setiap siswa — semua dari satu panel admin berbasis web, tanpa perlu rekap
              manual.
            </p>
          </div>
          
          {/* DIGANTI: Tambahkan prop src dan alt */}
          <BrowserFrame 
            label="Dashboard Admin (statistik + grafik aktivitas asesmen)" 
            src="/dashboard.png" 
            alt="Dashboard Admin SmartBK"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center mb-16">
          <div className="order-2 md:order-1 max-w-xs mx-auto">
            {/* DIGANTI: Tambahkan prop src dan alt */}
            <PhoneFrame 
              label="Mengerjakan asesmen di HP" 
              src="/mengerjakan-asesmen.png" 
              alt="Mengerjakan asesmen di HP"
            />
          </div>
          <div className="order-1 md:order-2">
            <span className="text-xs font-bold text-primary-700 uppercase tracking-wide">
              Untuk Siswa
            </span>
            <h3 className="font-serif text-2xl mt-2 mb-3">Kerjakan asesmen langsung dari HP</h3>
            <p className="text-muted text-sm leading-relaxed">
              Siswa tinggal buka aplikasi Android, pilih layanan BK, dan mengisi asesmen kapan
              saja — tanpa perlu buka link form yang berbeda-beda lagi.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-bold text-primary-700 uppercase tracking-wide">
              Hasil Instan
            </span>
            <h3 className="font-serif text-2xl mt-2 mb-3">Hasil & rekomendasi otomatis</h3>
            <p className="text-muted text-sm leading-relaxed">
              Begitu asesmen selesai, hasilnya langsung muncul — skor, kategori, sampai dimensi
              minat atau kepribadian yang paling menonjol — lengkap dengan rekomendasi yang bisa
              diunduh sebagai PDF.
            </p>
          </div>
          <div className="max-w-xs mx-auto">
            {/* DIGANTI: Tambahkan prop src dan alt */}
            <PhoneFrame 
              label="Halaman hasil asesmen (RMIB/DISC)" 
              src="/hasil-asesmen.png" 
              alt="Halaman hasil asesmen"
            />
          </div>
        </div>
      </section>
      {/* ===== Masalah ===== */}
      <section className="bg-primary-50/60 border-y border-primary-100">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl mb-3">Masalah yang sering dihadapi</h2>
            <p className="text-muted max-w-lg mx-auto">
              Layanan BK di banyak sekolah masih dikerjakan serba manual dan tersebar.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {PROBLEMS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="bg-white border border-primary-100 rounded-2xl p-6">
                  <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                    <Icon size={20} color="#dc2626" />
                  </div>
                  <h3 className="font-bold text-ink mb-1.5">{p.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Fitur ===== */}
      <section id="fitur" className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl mb-3">Asesmen yang SmartBK sediakan</h2>
          <p className="text-muted max-w-lg mx-auto">
            Bagian dari Layanan Perencanaan Individual — lima jenis asesmen yang saling
            melengkapi untuk memahami siswa secara utuh, plus laporan hasilnya.
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

      {/* ===== Cara Kerja ===== */}
      <section className="bg-primary-50/60 border-y border-primary-100">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl mb-3">Cara kerja SmartBK</h2>
            <p className="text-muted max-w-lg mx-auto">
              Dari isi asesmen sampai Guru BK menindaklanjuti, semuanya digital.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="bg-white border border-primary-100 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-full bg-primary-700 text-white text-sm font-bold flex items-center justify-center">
                      {idx + 1}
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                      <Icon size={17} color="#0e6f4c" />
                    </div>
                  </div>
                  <h3 className="font-bold text-ink mb-1.5">{s.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Manfaat ===== */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl mb-3">Kenapa pilih SmartBK</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="text-center px-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-3">
                  <Icon size={20} color="#0e6f4c" />
                </div>
                <h3 className="font-bold text-ink text-sm mb-1">{b.title}</h3>
                <p className="text-muted text-xs leading-relaxed">{b.desc}</p>
              </div>
            );
          })}
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
          <span>© {new Date().getFullYear()} SmartBK. Dibangun dengan React Native &amp; Supabase.</span>
          <Link href="/login" className="hover:text-primary-700">
            Masuk sebagai Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}