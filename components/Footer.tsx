import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const COLUMNS = [
  {
    title: "Jelajahi",
    links: [
      { label: "Produk", href: "#showcase" },
      { label: "Fitur", href: "#fitur" },
      { label: "Download", href: "#download" },
    ],
  },
  {
    title: "Asesmen",
    links: [
      { label: "Minat RMIB", href: "#fitur" },
      { label: "Kepribadian DISC", href: "#fitur" },
      { label: "Gaya Belajar", href: "#fitur" },
      { label: "Studi Lanjut", href: "#fitur" },
      { label: "Stres Akademik", href: "#fitur" },
      { label: "Laporan PDF", href: "#fitur" },
    ],
  },
  {
    title: "Akses",
    links: [
      { label: "Masuk sebagai Admin", href: "/login" },
      { label: "Download Aplikasi", href: "#download" },
    ],
  },
  {
    title: "Dibangun dengan",
    links: [
      { label: "React Native", href: "https://reactnative.dev" },
      { label: "Supabase", href: "https://supabase.com" },
      { label: "Next.js", href: "https://nextjs.org" },
    ],
  },
];

const DOT = "radial-gradient(rgba(255,255,255,.85) 1.1px, transparent 1.4px)";

function DotShape({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex w-44 flex-col items-center gap-4 border-l border-white/15 px-6 py-3 text-xs font-medium text-white/80">
      <span>{label}</span>
      <div aria-hidden className={className} style={{ backgroundImage: DOT, backgroundSize: "6px 6px" }} />
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-primary-950 text-white">
      <div className="mx-auto max-w-[96rem] px-6 pt-20 sm:px-10">
        {/* Atas: CTA kiri, kolom link kanan */}
        <div className="grid gap-16 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-24">
          <div>
            <p className="mb-5 flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-primary-400" /> Siap mencoba?
            </p>
            <h2 className="mb-6 text-5xl font-medium leading-[1.02] tracking-tight sm:text-6xl">
              Digitalkan
              <br />
              Layanan BK
            </h2>
            <p className="mb-9 max-w-sm leading-relaxed text-white/75">
              SmartBK membantu Guru BK mengelola asesmen tanpa rekap manual, dan memudahkan
              siswa mengerjakannya langsung dari HP.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link
                href="/login"
                className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-medium text-primary-950 transition hover:bg-primary-100"
              >
                Masuk Admin <ArrowUpRight size={16} />
              </Link>
              <a href="#download" className="inline-flex items-center gap-1.5 text-sm text-white/90 transition hover:text-primary-300">
                Download Aplikasi <ArrowUpRight size={14} />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h3 className="mb-10 text-sm font-semibold">{col.title}</h3>
                <ul className="space-y-4">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-white/85 transition hover:text-primary-300">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Tengah: tentang + dua platform */}
        <div className="mt-24 flex flex-col justify-between gap-10 border-y border-white/15 py-8 md:flex-row md:items-center">
          <div className="max-w-md">
            <p className="mb-5 text-[11px] text-white/70">Tentang SmartBK</p>
            <p className="mb-5 text-sm leading-relaxed text-white/85">
              Satu aplikasi untuk semua layanan BK: dashboard web untuk Guru BK, aplikasi Android
              untuk siswa, semuanya digital dan tanpa kertas.
            </p>
            <div className="flex gap-5 text-[11px] underline underline-offset-2">
              <Link href="/login">Masuk sebagai Admin</Link>
              <a href="#">Kembali ke atas</a>
            </div>
          </div>
          <div className="flex shrink-0">
            <DotShape label="Admin · Web" className="h-[4.5rem] w-28 rounded-md" />
            <DotShape label="Siswa · Android" className="h-[4.5rem] w-12 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Wordmark raksasa, terpotong di bawah */}
      <div className="mx-auto mt-12 max-w-[96rem] px-6 sm:px-10">
        <div className="flex items-end gap-[1.5vw] overflow-hidden">
          <img src="/logo.png" alt="" aria-hidden className="mb-[-1vw] h-[15vw] w-[15vw] max-h-52 max-w-52 translate-y-[8%] rounded-[2vw] object-cover" />
          <p aria-hidden className="select-none whitespace-nowrap text-[19vw] font-extrabold leading-[0.78] tracking-tighter translate-y-[14%]">
            SmartBK
          </p>
        </div>
      </div>
      <p className="sr-only">© {new Date().getFullYear()} SmartBK</p>
    </footer>
  );
}