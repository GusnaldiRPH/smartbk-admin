"use client";

import { useEffect, useRef, useState } from "react";

interface StatCounterProps {
  value: string;
  duration?: number;
}

/**
 * StatCounter
 * Menerima value string seperti "5+", "100%", "2", "1", lalu
 * menganimasikan bagian angkanya dari 0 -> target ketika elemen
 * pertama kali terlihat di layar. Prefix/suffix non-angka (+, %, dst)
 * tetap dipertahankan apa adanya.
 */
export default function StatCounter({ value, duration = 900 }: StatCounterProps) {
  const match = value.match(/\d+/);
  const target = match ? parseInt(match[0], 10) : null;
  const suffix = target !== null && match ? value.slice(match.index! + match[0].length) : "";
  const prefix = target !== null && match ? value.slice(0, match.index!) : "";

  const [count, setCount] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (target === null) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();

          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            // easeOutQuad biar terasa "landing" di akhir, bukan flat
            const eased = 1 - (1 - progress) * (1 - progress);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };

          requestAnimationFrame(step);
          observer.unobserve(el);
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  if (target === null) {
    return <span ref={ref}>{value}</span>;
  }

  return (
    <span ref={ref}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}