"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Props {
  data: { title: string; count: number }[];
}

const COLORS = ["#0e6f4c", "#2563eb", "#dd7c05", "#7c3aed", "#dc2626", "#0891b2"];

export default function ResultsByAssessmentChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-muted text-sm px-5 py-10 text-center">
        Belum ada hasil asesmen masuk.
      </p>
    );
  }

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 48 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EFF5F1" vertical={false} />
          <XAxis
            dataKey="title"
            tick={{ fontSize: 12, fill: "#6b7c76" }}
            angle={-25}
            textAnchor="end"
            interval={0}
            height={60}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6b7c76" }} width={30} />
          <Tooltip
            cursor={{ fill: "#F0FAF4" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #DCEFE4",
              fontSize: 13,
            }}
            formatter={(value: number) => [`${value} hasil`, "Jumlah"]}
          />
          <Bar dataKey="count" name="Jumlah Hasil" radius={[8, 8, 0, 0]} maxBarSize={56}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}