"use client";

import { useEffect, useRef } from "react";

// Efek "constellation": titik-titik kecil melayang pelan, garis tipis
// muncul antar titik yang berdekatan. Kesannya jaringan data/analitik —
// nyambung ke tema aplikasi asesmen digital, bukan sekadar hiasan.

const PARTICLE_COUNT = 42;
const MAX_DISTANCE = 130;
const RGB = "14, 111, 76"; // senada primary-700

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const points: Point[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
    }));

    function handleResize() {
      width = canvas!.width = window.innerWidth;
      height = canvas!.height = window.innerHeight;
    }
    window.addEventListener("resize", handleResize);

    let rafId = 0;

    function renderFrame() {
      ctx!.clearRect(0, 0, width, height);

      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x <= 0 || p.x >= width) p.vx *= -1;
        if (p.y <= 0 || p.y >= height) p.vy *= -1;
      }

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i];
          const b = points[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < MAX_DISTANCE) {
            ctx!.strokeStyle = `rgba(${RGB}, ${0.14 * (1 - dist / MAX_DISTANCE)})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      for (const p of points) {
        ctx!.fillStyle = `rgba(${RGB}, 0.4)`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 1.7, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function loop() {
      renderFrame();
      rafId = requestAnimationFrame(loop);
    }

    if (prefersReduced) {
      renderFrame(); // satu frame statis, tanpa animasi terus-menerus
    } else {
      loop();
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}