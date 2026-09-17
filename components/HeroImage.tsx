"use client";

import { useState } from "react";
import ImagePlaceholder from "./ImagePlaceholder";

export default function HeroImage() {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-primary-100/60 rounded-[2.5rem] -z-10 rotate-2" />
      <div className="relative rounded-[2rem] overflow-hidden bg-white border border-primary-100 shadow-[0_25px_60px_-25px_rgba(14,111,76,0.4)] aspect-square">
        {failed ? (
          <ImagePlaceholder label="Ilustrasi Hero AI: guru BK + siswa, taruh di public/hero-illustration.png" />
        ) : (
          <img
            src="/hero-illustration.png"
            alt="Ilustrasi guru BK dan siswa menggunakan SmartBK"
            className="w-full h-full object-cover"
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </div>
  );
}