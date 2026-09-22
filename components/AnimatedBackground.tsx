// Background dekoratif: blob gradient yang melayang pelan + partikel kecil
// yang naik ke atas. Fixed di belakang seluruh halaman (pointer-events-none
// biar tidak menghalangi klik), murni CSS animation — tidak perlu hooks,
// jadi aman dipakai sebagai Server Component.

interface Particle {
  left: string;
  size: number;
  duration: number;
  delay: number;
}

// Posisi & timing partikel dibuat tetap (bukan Math.random()) supaya hasil
// render di server dan di client sama persis — menghindari hydration mismatch.
const PARTICLES: Particle[] = [
  { left: "4%", size: 5, duration: 16, delay: 0 },
  { left: "12%", size: 3, duration: 21, delay: 3 },
  { left: "21%", size: 6, duration: 18, delay: 1.5 },
  { left: "30%", size: 4, duration: 24, delay: 5 },
  { left: "39%", size: 3, duration: 19, delay: 2 },
  { left: "48%", size: 5, duration: 22, delay: 6 },
  { left: "57%", size: 4, duration: 17, delay: 0.5 },
  { left: "66%", size: 6, duration: 25, delay: 4 },
  { left: "74%", size: 3, duration: 20, delay: 2.5 },
  { left: "83%", size: 5, duration: 23, delay: 7 },
  { left: "91%", size: 4, duration: 18, delay: 1 },
  { left: "97%", size: 3, duration: 26, delay: 4.5 },
];

export default function AnimatedBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#FBF8F2]"
      aria-hidden="true"
    >
      {/* Blob besar yang melayang pelan */}
      <div className="absolute -top-32 -left-24 w-[32rem] h-[32rem] rounded-full bg-primary-700/10 blur-3xl bg-drift-a" />
      <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-[#F4A93B]/15 blur-3xl bg-drift-b" />
      <div className="absolute bottom-0 left-1/4 w-[26rem] h-[26rem] rounded-full bg-primary-500/10 blur-3xl bg-drift-c" />
      <div className="absolute top-2/3 right-1/4 w-[20rem] h-[20rem] rounded-full bg-primary-700/10 blur-3xl bg-drift-b" />

      {/* Partikel kecil naik dari bawah ke atas */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute bottom-0 rounded-full bg-primary-700/25 bg-particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
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
        @keyframes bg-drift-c {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -40px) scale(1.05); }
        }
        @keyframes bg-particle {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.25; }
          100% { transform: translateY(-105vh) scale(1.4); opacity: 0; }
        }
        .bg-drift-a { animation: bg-drift-a 22s ease-in-out infinite; }
        .bg-drift-b { animation: bg-drift-b 26s ease-in-out infinite; }
        .bg-drift-c { animation: bg-drift-c 30s ease-in-out infinite; }
        .bg-particle {
          animation-name: bg-particle;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .bg-drift-a, .bg-drift-b, .bg-drift-c, .bg-particle {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}