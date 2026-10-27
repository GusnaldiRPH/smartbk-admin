import { BrowserFrame, PhoneFrame } from '@/components/Frames';
import Link from "next/link";
import { Caveat } from "next/font/google";
import {
  Compass, UsersRound, BookOpen, GraduationCap, HeartPulse, FileCheck2, Download, Smartphone,
  ArrowRight, Link2, Clock, Database, LogIn, ClipboardCheck, CloudUpload, BarChart3, Zap,
  FolderCheck, Timer, Smile, CheckCircle2, type LucideIcon,
} from "lucide-react";
import HeroImage from "@/components/HeroImage";
import Reveal from "@/components/Reveal";
import StatCounter from "@/components/StatCounter";
import Footer from "@/components/Footer";

const hand = Caveat({ subsets: ["latin"], weight: ["600", "700"] });

interface IconCard { icon: LucideIcon; title: string; desc: string }
interface Stat { value: string; label: string }

const FEATURES: IconCard[] = [
  { icon: Compass, title: "Asesmen Minat RMIB", desc: "Bantu siswa menemukan bidang pekerjaan yang paling sesuai minatnya lewat metode ranking terstandar." },
  { icon: UsersRound, title: "Kepribadian DISC", desc: "Petakan gaya kepribadian siswa (Dominance, Influence, Steadiness, Conscientiousness) lewat studi kasus interaktif." },
  { icon: BookOpen, title: "Gaya Belajar", desc: "Kenali apakah siswa lebih cocok belajar secara visual, auditori, atau kinestetik." },
  { icon: GraduationCap, title: "Perencanaan Studi Lanjut", desc: "Rekomendasi arah studi lanjut berdasarkan minat, bakat, kemampuan, serta cita-cita siswa." },
  { icon: HeartPulse, title: "Skala Stres Akademik", desc: "Deteksi dini tingkat stres akademik siswa, lengkap dengan rekomendasi tindak lanjut." },
  { icon: FileCheck2, title: "Laporan PDF", desc: "Hasil asesmen bisa langsung diunduh sebagai laporan PDF untuk didokumentasikan atau dibagikan." },
];
const PROBLEMS: IconCard[] = [
  { icon: Link2, title: "Akses Tersebar", desc: "Asesmen BK masih memakai form-form terpisah di browser dengan link yang beda-beda untuk tiap layanan." },
  { icon: Clock, title: "Butuh Waktu", desc: "Rekap data manual butuh waktu lama dan menyita jam layanan BK yang seharusnya untuk siswa." },
  { icon: Database, title: "Sulit Dikelola", desc: "Data hasil asesmen tersebar dan sulit dipantau, padahal perlu dikelola rapi agar mudah ditindaklanjuti." },
];
const STEPS: IconCard[] = [
  { icon: LogIn, title: "Masuk ke Aplikasi", desc: "Siswa login pakai akun masing-masing lewat aplikasi Android." },
  { icon: ClipboardCheck, title: "Kerjakan Asesmen", desc: "Pilih layanan BK, lalu isi asesmen langsung dari HP." },
  { icon: CloudUpload, title: "Tersimpan Otomatis", desc: "Jawaban & hasil tersimpan digital, tanpa rekap manual." },
  { icon: BarChart3, title: "Guru BK Pantau Hasil", desc: "Guru BK melihat dan menindaklanjuti hasil kapan saja." },
];
const BENEFITS: IconCard[] = [
  { icon: Zap, title: "Lebih Praktis", desc: "Asesmen lebih praktis bagi siswa maupun Guru BK." },
  { icon: FolderCheck, title: "Data Lebih Rapi", desc: "Rekap dan pengelolaan data lebih rapi dan terpantau." },
  { icon: Timer, title: "Hemat Waktu", desc: "Menghemat waktu administrasi Guru BK." },
  { icon: Smile, title: "Mudah Diisi", desc: "Memudahkan siswa mengisi asesmen kapan saja, di mana saja." },
];
const STATS: Stat[] = [
  { value: "5+", label: "Jenis Asesmen" },
  { value: "2", label: "Peran: Admin & Siswa" },
  { value: "100%", label: "Digital, Tanpa Kertas" },
  { value: "1", label: "Aplikasi untuk Semua Layanan BK" },
];
const TAPE_A = ["Minat RMIB", "Kepribadian DISC", "Gaya Belajar", "Studi Lanjut", "Stres Akademik", "Laporan PDF"];
const TAPE_B = ["tanpa kertas", "tanpa rekap manual", "kapan saja", "di mana saja", "langsung dari HP"];

const APK_URL = process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL ?? "";

// ===== Bahasa visual: buku catatan BK =====
const RULED = "repeating-linear-gradient(transparent 0 31px, rgba(14,111,76,.10) 31px 32px)";
const pop = "border-2 border-primary-950 shadow-[4px_4px_0_#0a5036]";
const btn = "inline-flex items-center gap-2 rounded-lg border-2 border-primary-950 text-sm font-bold px-5 py-3 shadow-[3px_3px_0_#0a5036] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#0a5036] active:translate-y-0 active:shadow-[1px_1px_0_#0a5036]";
const marker = "bg-[linear-gradient(transparent_58%,#F4A93B_58%,#F4A93B_92%,transparent_92%)] px-1 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]";

function Tape({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`absolute z-10 h-6 w-20 bg-[#F4A93B]/70 shadow-sm [clip-path:polygon(4%_0,100%_0,96%_50%,100%_100%,0_100%,4%_50%)] ${className}`}
    />
  );
}

function Note({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`absolute z-10 bg-[#FFF3B0] px-4 py-3 shadow-[2px_8px_14px_rgba(10,80,54,0.18)] ${hand.className} text-xl leading-tight ${className}`}>
      {children}
    </div>
  );
}

function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <Reveal direction="up">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">{title}</h2>
        {sub && <p className="text-muted max-w-xl mx-auto">{sub}</p>}
      </div>
    </Reveal>
  );
}

export default function LandingPage() {
  return (
    <div className="relative overflow-x-clip bg-white text-ink" style={{ backgroundImage: RULED }}>
      {/* garis margin buku tulis */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-3 w-[2px] bg-red-300/50" />

      {/* ===== Header ===== */}
      <header className="sticky top-3 z-50 px-4">
        <div className={`mx-auto max-w-5xl flex items-center justify-between rounded-xl bg-white ${pop} px-4 py-2.5`}>
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="SmartBK" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-extrabold tracking-tight">SmartBK</span>
          </div>
          <nav className="hidden sm:flex items-center gap-7 text-sm font-semibold text-muted">
            <a href="#showcase" className="hover:text-primary-700">Produk</a>
            <a href="#fitur" className="hover:text-primary-700">Fitur</a>
            <a href="#download" className="hover:text-primary-700">Download</a>
          </nav>
          <Link href="/login" className="rounded-lg border-2 border-primary-950 bg-primary-700 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-primary-800">
            Masuk Admin
          </Link>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative max-w-6xl mx-auto px-5 pt-16 pb-20">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-16 items-center">
          <div className="text-center lg:text-left">
            <Reveal direction="down" duration={600}>
              <span className="mb-7 inline-block -rotate-2 rounded-md border-2 border-dashed border-primary-700 bg-white px-3 py-1.5 text-xs font-extrabold text-primary-800">
                Platform Bimbingan Konseling Digital
              </span>
            </Reveal>
            <Reveal direction="up" delay={120} duration={800}>
              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-extrabold leading-[1.08] tracking-tighter mb-6">
                Kenali dirimu,
                <br />
                <span className={marker}>temukan arahmu.</span>
              </h1>
            </Reveal>
            <Reveal direction="up" delay={220} duration={700}>
              <p className="text-muted text-base md:text-lg max-w-lg mx-auto lg:mx-0 mb-9 leading-relaxed">
                SmartBK adalah aplikasi Bimbingan dan Konseling berbasis Android yang membantu
                Guru BK mengelola layanan &amp; asesmen, sekaligus memudahkan siswa mengerjakan
                asesmen dan melihat hasilnya langsung dari HP.
              </p>
            </Reveal>
            <Reveal direction="up" delay={320} duration={700}>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <a href="#download" className={`${btn} bg-primary-700 text-white hover:bg-primary-800`}>
                  <Download size={16} /> Download Aplikasi
                </a>
                <a href="#showcase" className={`${btn} bg-white text-ink`}>
                  Lihat Tampilan Aplikasi <ArrowRight size={16} />
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal direction="left" delay={150} duration={900}>
            <div className="relative mx-auto max-w-md">
              <div className="relative -rotate-2">
                <Tape className="-top-3 left-6 -rotate-6" />
                <Tape className="-top-3 right-6 rotate-6" />
                <HeroImage />
              </div>
              <Note className="-left-6 top-14 hidden sm:block -rotate-6">
                <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-primary-700" /> Asesmen RMIB selesai!</span>
              </Note>
              <Note className="-right-4 top-1/2 hidden sm:block rotate-3">
                <span className="flex items-center gap-2"><HeartPulse size={18} className="text-primary-700" /> Stres akademik: Rendah</span>
              </Note>
              <Note className="bottom-[-1.5rem] left-8 hidden sm:block -rotate-2 !bg-primary-100">
                <span className="flex items-center gap-2"><FileCheck2 size={18} className="text-primary-700" /> Laporan PDF siap</span>
              </Note>
              <p className={`${hand.className} absolute -top-9 right-4 hidden sm:block rotate-6 text-2xl text-primary-700`}>
                tinggal buka HP!
              </p>
            </div>
          </Reveal>
        </div>

        <div className="mt-24 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {STATS.map((s, idx) => (
            <Reveal key={s.label} direction="up" delay={idx * 90} duration={600}>
              <div className={`h-full rounded-lg border-2 border-dashed border-primary-700 bg-white p-5 ${idx % 2 ? "rotate-1" : "-rotate-1"}`}>
                <p className="text-4xl font-extrabold tracking-tight text-primary-800 md:text-5xl">
                  <StatCounter value={s.value} />
                </p>
                <p className="mt-2 text-xs leading-snug text-muted">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== Dua lakban bersilang ===== */}
      <div className="relative h-32 overflow-hidden">
        <div className={`${hand.className} absolute inset-x-[-3%] top-6 -rotate-[1.5deg] overflow-hidden bg-primary-800 py-2 text-3xl text-white shadow-md`}>
          <div className="flex w-max animate-marquee motion-reduce:animate-none">
            {[0, 1].map((k) => (
              <div key={k} aria-hidden={k === 1} className="flex shrink-0">
                {TAPE_A.map((t) => <span key={t + k} className="pr-10">{t} ✦</span>)}
              </div>
            ))}
          </div>
        </div>
        <div className={`${hand.className} absolute inset-x-[-3%] top-[3.9rem] rotate-[1.2deg] overflow-hidden bg-[#F4A93B] py-1.5 text-2xl text-primary-950 shadow-md`}>
          <div className="flex w-max animate-marquee [animation-direction:reverse] motion-reduce:animate-none">
            {[0, 1].map((k) => (
              <div key={k} aria-hidden={k === 1} className="flex shrink-0">
                {TAPE_B.map((t) => <span key={t + k} className="pr-10">{t} ✎</span>)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Showcase ===== */}
      <section id="showcase" className="max-w-6xl mx-auto px-5 py-24">
        <Heading title="Lihat SmartBK bekerja" sub="Satu aplikasi, dua sisi — dashboard lengkap untuk Guru BK dan pengalaman ringkas untuk siswa." />

        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <Reveal direction="right">
            <div>
              <span className={`${hand.className} text-2xl text-primary-700`}>Untuk Guru BK</span>
              <h3 className="text-3xl font-extrabold tracking-tight mt-1 mb-4">Kelola semuanya dari satu dashboard</h3>
              <p className="text-muted leading-relaxed">
                Pantau aktivitas asesmen, kelola soal per layanan BK, kelola data siswa, dan lihat
                hasil setiap siswa — semua dari satu panel admin berbasis web, tanpa perlu rekap manual.
              </p>
            </div>
          </Reveal>
          <Reveal direction="left" delay={100}>
            <div className="relative rotate-1 transition duration-300 hover:rotate-0">
              <Tape className="-top-3 left-1/2 -translate-x-1/2" />
              <BrowserFrame label="Dashboard Admin (statistik + grafik aktivitas asesmen)" src="/dashboard.png" alt="Dashboard Admin SmartBK" />
            </div>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div className="order-2 md:order-1 max-w-xs mx-auto">
            <Reveal direction="right">
              <div className="relative -rotate-3 transition duration-300 hover:rotate-0">
                <Tape className="-top-3 left-1/2 -translate-x-1/2 rotate-3" />
                <PhoneFrame label="Mengerjakan asesmen di HP" src="/mengerjakan-asesmen.png" alt="Mengerjakan asesmen di HP" />
              </div>
            </Reveal>
          </div>
          <div className="order-1 md:order-2">
            <Reveal direction="left" delay={100}>
              <div>
                <span className={`${hand.className} text-2xl text-primary-700`}>Untuk Siswa</span>
                <h3 className="text-3xl font-extrabold tracking-tight mt-1 mb-4">Kerjakan asesmen langsung dari HP</h3>
                <p className="text-muted leading-relaxed">
                  Siswa tinggal buka aplikasi Android, pilih layanan BK, dan mengisi asesmen kapan
                  saja — tanpa perlu buka link form yang berbeda-beda lagi.
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <Reveal direction="right">
            <div>
              <span className={`${hand.className} text-2xl text-primary-700`}>Hasil Instan</span>
              <h3 className="text-3xl font-extrabold tracking-tight mt-1 mb-4">Hasil &amp; rekomendasi otomatis</h3>
              <p className="text-muted leading-relaxed">
                Begitu asesmen selesai, hasilnya langsung muncul — skor, kategori, sampai dimensi
                minat atau kepribadian yang paling menonjol — lengkap dengan rekomendasi yang bisa
                diunduh sebagai PDF.
              </p>
            </div>
          </Reveal>
          <Reveal direction="left" delay={100}>
            <div className="relative mx-auto max-w-xs rotate-3 transition duration-300 hover:rotate-0">
              <Tape className="-top-3 left-1/2 -translate-x-1/2 -rotate-3" />
              <PhoneFrame label="Halaman hasil asesmen (RMIB/DISC)" src="/hasil-asesmen.png" alt="Halaman hasil asesmen" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Masalah: sticky notes ===== */}
      <section className="border-y-2 border-dashed border-primary-700/40 bg-primary-50/80">
        <div className="max-w-6xl mx-auto px-5 py-24">
          <Heading title="Masalah yang sering dihadapi" sub="Layanan BK di banyak sekolah masih dikerjakan serba manual dan tersebar." />
          <div className="grid sm:grid-cols-3 gap-8">
            {PROBLEMS.map((p, idx) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.title} direction="up" delay={idx * 100}>
                  <div
                    className="relative h-full bg-[#FFF3B0] p-7 shadow-[2px_10px_18px_rgba(10,80,54,0.18)] transition duration-300 hover:rotate-0"
                    style={{ transform: `rotate(${[-2, 1.5, -1][idx]}deg)` }}
                  >
                    <span aria-hidden className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-red-500 shadow-md" />
                    <Icon size={26} className="mb-4 text-red-500" />
                    <h3 className={`${hand.className} mb-2 text-3xl text-red-600 line-through decoration-2`}>{p.title}</h3>
                    <p className="text-sm leading-relaxed text-ink/75">{p.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Fitur: kartu indeks ===== */}
      <section id="fitur" className="max-w-6xl mx-auto px-5 py-28">
        <Heading
          title="Asesmen yang SmartBK sediakan"
          sub="Bagian dari Layanan Perencanaan Individual — lima jenis asesmen yang saling melengkapi untuk memahami siswa secara utuh, plus laporan hasilnya."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((f, idx) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} direction="up" delay={(idx % 3) * 100}>
                <div
                  className={`group h-full overflow-hidden rounded-md bg-white ${pop} transition duration-300 hover:!rotate-0 hover:-translate-y-1`}
                  style={{ transform: `rotate(${[-1, 0.8, -0.5, 0.7, -1.1, 0.5][idx]}deg)` }}
                >
                  <div className="flex items-center gap-3 border-b-2 border-red-300 px-5 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-700 transition group-hover:rotate-12">
                      <Icon size={20} className="text-white" />
                    </div>
                    <h3 className="font-extrabold leading-tight">{f.title}</h3>
                  </div>
                  <p className="px-5 pb-4 pt-[2px] text-sm leading-7 text-muted" style={{ backgroundImage: "repeating-linear-gradient(transparent 0 27px, rgba(14,111,76,.14) 27px 28px)" }}>
                    {f.desc}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ===== Cara Kerja ===== */}
      <section className="border-y-2 border-dashed border-primary-700/40 bg-primary-50/80">
        <div className="max-w-6xl mx-auto px-5 py-24">
          <Heading title="Cara kerja SmartBK" sub="Dari isi asesmen sampai Guru BK menindaklanjuti, semuanya digital." />
          <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div aria-hidden className="absolute left-[12%] right-[12%] top-[2.6rem] hidden border-t-[3px] border-dashed border-primary-700/50 lg:block" />
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.title} direction="up" delay={idx * 110}>
                  <div className="relative text-center">
                    <div className={`${hand.className} relative mx-auto mb-5 flex h-[5.2rem] w-[5.2rem] -rotate-6 items-center justify-center rounded-full border-4 border-double border-primary-700 bg-white text-5xl font-bold text-primary-700`}>
                      {idx + 1}
                    </div>
                    <Icon size={22} className="mx-auto mb-2 text-primary-700" />
                    <h3 className="mb-1.5 font-extrabold">{s.title}</h3>
                    <p className="text-sm leading-relaxed text-muted">{s.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Manfaat: daftar centang ===== */}
      <section className="max-w-4xl mx-auto px-5 py-28">
        <Heading title="Kenapa pilih SmartBK" />
        <Reveal direction="up">
          <div className={`relative rounded-md bg-white p-8 md:p-10 ${pop}`} style={{ backgroundImage: RULED }}>
            <Tape className="-top-3 left-1/2 -translate-x-1/2" />
            <ul className="grid gap-x-10 gap-y-2 sm:grid-cols-2">
              {BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <li key={b.title} className="flex items-start gap-3 py-2">
                    <CheckCircle2 size={28} className="mt-0.5 shrink-0 text-primary-700" />
                    <div>
                      <h3 className={`${hand.className} flex items-center gap-2 text-3xl leading-none text-primary-900`}>
                        {b.title} <Icon size={18} className="text-[#F4A93B]" />
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{b.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* ===== Download: tiket sobek ===== */}
      <section id="download" className="px-5 pb-28">
        <Reveal direction="up">
          <div className="relative mx-auto max-w-4xl rounded-2xl bg-primary-800 p-3 shadow-[8px_8px_0_#032d1e]">
            <span aria-hidden className="absolute -left-5 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white" />
            <span aria-hidden className="absolute -right-5 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white" />
            <div className="relative rounded-xl border-2 border-dashed border-white/40 px-6 py-16 text-center text-white">
              <div className={`${hand.className} absolute right-6 top-6 hidden rotate-12 rounded-full border-4 border-double border-[#F4A93B] px-4 py-3 text-2xl text-[#F4A93B] sm:block`}>
                Android
              </div>
              <Smartphone size={34} className="mx-auto mb-5 text-[#F4A93B]" />
              <h2 className="mb-3 text-4xl font-extrabold tracking-tighter md:text-5xl">Coba SmartBK di HP kamu</h2>
              <p className="mx-auto mb-9 max-w-md text-sm text-primary-100/80 md:text-base">
                Unduh aplikasi Android SmartBK untuk siswa, kerjakan asesmen, dan lihat hasilnya langsung dari genggaman.
              </p>
              {APK_URL ? (
                <a href={APK_URL} download className={`${btn} !border-primary-950 bg-[#F4A93B] !px-7 !py-4 text-primary-950 !shadow-[4px_4px_0_#032d1e] hover:!shadow-[6px_6px_0_#032d1e]`}>
                  <Download size={18} /> Download Aplikasi (.apk)
                </a>
              ) : (
                <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-white/15 px-7 py-4 text-sm font-bold text-white/50">
                  <Download size={18} /> Link download belum diatur
                </span>
              )}
              <p className="mt-5 text-xs text-primary-100/60">
                Untuk perangkat Android. Aktifkan &quot;Izinkan dari sumber tidak dikenal&quot; di pengaturan HP kamu saat menginstal.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ===== Footer ===== */}
      <Footer />
    </div>
  );
}