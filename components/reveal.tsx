"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: Direction;
  duration?: number;
  once?: boolean;
}

/**
 * Reveal
 * Membungkus children dan menganimasikannya (fade + slide) begitu
 * elemen masuk ke viewport. Pakai IntersectionObserver, tanpa
 * dependency tambahan (tidak perlu framer-motion).
 *
 * Props:
 * - delay: ms, jeda sebelum animasi mulai (untuk efek stagger)
 * - direction: "up" | "down" | "left" | "right" | "none"
 * - duration: ms, lama animasi
 * - once: kalau true (default) animasi cuma jalan sekali
 */
export default function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  duration = 700,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const hiddenOffset: Record<Direction, string> = {
    up: "translate-y-8",
    down: "-translate-y-8",
    left: "translate-x-8",
    right: "-translate-x-8",
    none: "",
  };

  return (
    <div
      ref={ref}
      className={[
        "transition-all ease-out will-change-transform",
        "motion-reduce:transition-none motion-reduce:transform-none",
        visible ? "opacity-100 translate-y-0 translate-x-0" : `opacity-0 ${hiddenOffset[direction]}`,
        className,
      ].join(" ")}
      style={{ transitionDuration: `${duration}ms`, transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}