import { Compass, BookOpen, GraduationCap, HeartPulse, FileCheck2 } from "lucide-react";
import ConstellationCanvas from "@/components/ConstellationCanvas";

// Background dekoratif untuk seluruh halaman:
// 1. Warna dasar cream (dibundel di sini, bukan di wrapper halaman, supaya
//    tidak menutupi layer ini — lihat catatan di page.tsx).
// 2. Jaringan titik yang bergerak & saling terhubung (ConstellationCanvas),
//    kesan "data/analitik" yang nyambung ke tema aplikasi asesmen.
// 3. Ikon-ikon tema BK yang melayang pelan — Compass-nya berputar seperti
//    kompas asli, menyambung ke fitur Asesmen Minat RMIB.
// Semuanya fixed di belakang konten, pointer-events-none, dan otomatis
// nonaktif kalau user mengaktifkan "reduce motion".

interface FloatingIcon {
  Icon: typeof Compass;
  top: string;
  left: string;
  size: number;
  duration: number;
  motion: "spin" | "drift-a" | "drift-b" | "drift-c";
}

const FLOATING_ICONS: FloatingIcon[] = [
  { Icon: Compass, top: "10%", left: "6%", size: 72, duration: 46, motion: "spin" },
  { Icon: BookOpen, top: "68%", left: "10%", size: 46, duration: 24, motion: "drift-a" },
  { Icon: GraduationCap, top: "16%", left: "88%", size: 58, duration: 28, motion: "drift-b" },
  { Icon: HeartPulse, top: "58%", left: "92%", size: 42, duration: 22, motion: "drift-c" },
  { Icon: FileCheck2, top: "86%", left: "48%", size: 40, duration: 26, motion: "drift-a" },
];

export default function AnimatedBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#FBF8F2]"
      aria-hidden="true"
    >
      {/* Aksen warna halus di belakang, cuma sebagai lapisan kedalaman */}
      <div className="absolute -top-32 -left-24 w-[30rem] h-[30rem] rounded-full bg-primary-700/[0.06] blur-3xl bg-drift-a" />
      <div className="absolute bottom-0 -right-24 w-[26rem] h-[26rem] rounded-full bg-[#F4A93B]/[0.08] blur-3xl bg-drift-b" />

      {/* Jaringan titik bergerak */}
      <ConstellationCanvas />

      {/* Ikon tema BK melayang pelan */}
      {FLOATING_ICONS.map(({ Icon, top, left, size, duration, motion }, i) => (
        <div
          key={i}
          className={`absolute text-primary-700/[0.09] icon-${motion}`}
          style={{ top, left, animationDuration: `${duration}s` }}
        >
          <Icon size={size} strokeWidth={1.1} />
        </div>
      ))}

      <style>{`
        @keyframes bg-drift-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, 60px) scale(1.08); }
          66% { transform: translate(-30px, 20px) scale(0.95); }
        }
        @keyframes bg-drift-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 40px) scale(1.1); }
        }
        @keyframes icon-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes icon-drift-a {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(18px, -22px) rotate(6deg); }
        }
        @keyframes icon-drift-b {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-20px, 18px) rotate(-8deg); }
        }
        @keyframes icon-drift-c {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(16px, 20px) rotate(5deg); }
        }
        .bg-drift-a { animation: bg-drift-a 22s ease-in-out infinite; }
        .bg-drift-b { animation: bg-drift-b 26s ease-in-out infinite; }
        .icon-spin { animation-name: icon-spin; animation-timing-function: linear; animation-iteration-count: infinite; }
        .icon-drift-a { animation-name: icon-drift-a; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        .icon-drift-b { animation-name: icon-drift-b; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        .icon-drift-c { animation-name: icon-drift-c; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        @media (prefers-reduced-motion: reduce) {
          .bg-drift-a, .bg-drift-b, .icon-spin, .icon-drift-a, .icon-drift-b, .icon-drift-c {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}