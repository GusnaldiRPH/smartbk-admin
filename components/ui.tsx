"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  SearchX,
} from "lucide-react";

export const labelCls = "text-xs font-bold text-ink mb-1.5 block uppercase tracking-wider";
export const controlCls =
  "w-full bg-white border border-primary-100 rounded-xl px-3.5 py-2.5 text-sm outline-none hover:border-primary-300 disabled:bg-surface disabled:text-muted disabled:cursor-not-allowed";

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 animate-fadeUp">
      <div className="flex items-center gap-3.5">
        {Icon && (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-800 flex items-center justify-center shadow-lg shadow-primary-700/25">
            <Icon size={22} color="#fff" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const AVATAR_GRADIENTS = [
  "from-primary-400 to-primary-700",
  "from-teal-400 to-teal-700",
  "from-lime-400 to-lime-700",
  "from-emerald-400 to-emerald-700",
  "from-green-400 to-green-700",
];

export function Avatar({ name, size = 36 }: { name?: string | null; size?: number }) {
  const text = (name ?? "?").trim() || "?";
  const initials =
    text
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";
  const hash = Array.from(text).reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <div
      className={`shrink-0 rounded-full bg-gradient-to-br ${
        AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]
      } text-white font-bold flex items-center justify-center shadow-sm`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

export function SortTh({
  label,
  active,
  dir,
  onClick,
  className = "",
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  className?: string;
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={`px-5 py-3 ${className}`}>
      <button
        onClick={onClick}
        className={`flex items-center gap-1.5 transition-colors hover:text-primary-700 ${
          active ? "text-primary-700" : ""
        }`}
      >
        {label}
        <Icon size={13} className={active ? "" : "opacity-40"} />
      </button>
    </th>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="p-5 flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-11 rounded-xl bg-gradient-to-r from-primary-50 via-primary-100 to-primary-50 bg-[length:200%_100%] animate-shimmer"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = SearchX, text }: { icon?: LucideIcon; text: string }) {
  return (
    <div className="px-5 py-12 flex flex-col items-center gap-3 text-center animate-fadeUp">
      <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
        <Icon size={24} className="text-primary-500" />
      </div>
      <p className="text-muted text-sm max-w-xs">{text}</p>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  noun,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  noun: string;
  onChange: (p: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const btn =
    "w-8 h-8 rounded-lg border border-primary-100 bg-white flex items-center justify-center text-ink disabled:opacity-40 disabled:pointer-events-none hover:bg-primary-50 hover:border-primary-300 transition-colors";
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-t border-primary-50 text-xs text-muted">
      <span>
        Menampilkan{" "}
        <b className="text-ink">
          {from}-{to}
        </b>{" "}
        dari <b className="text-ink">{total}</b> {noun}
      </span>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} className={btn}>
          <ChevronLeft size={15} />
        </button>
        <span className="px-3 py-1 rounded-lg bg-primary-50 font-semibold text-primary-800">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className={btn}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}