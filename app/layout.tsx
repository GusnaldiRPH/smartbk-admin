import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartBK Admin",
  description: "Panel admin Guru BK — kelola soal, siswa, dan hasil asesmen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
