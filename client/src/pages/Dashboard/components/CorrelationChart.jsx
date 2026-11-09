// ============================================================
// client/src/pages/Dashboard/components/CorrelationChart.jsx
// Komponen Visualisasi Grafik Korelasi Jam Kerja vs Keluhan
// Menggunakan library Recharts (Milestone Minggu 3 - Milik P3)
// ============================================================
import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/**
 * Custom Tooltip dengan styling Tailwind CSS
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-xs">
        <p className="font-bold text-slate-800 text-xs mb-1.5">{label}</p>
        <div className="space-y-1 text-xs">
          {payload.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}:
              </span>
              <span className="font-bold text-slate-900">
                {item.name === "Pendapatan"
                  ? `Rp ${item.value.toLocaleString("id-ID")}`
                  : item.name === "Jam Kerja"
                  ? `${item.value} Jam`
                  : `${item.value} Keluhan`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const CorrelationChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="flex h-72 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <span className="text-xs text-slate-500">Memuat visualisasi grafik...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center text-xs text-slate-400">
        Belum ada data aktivitas log untuk divisualisasikan.
      </div>
    );
  }

  return (
    <div className="h-80 w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="hari"
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          {/* Axis Kiri: Jam Kerja */}
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
            unit=" j"
          />
          {/* Axis Kanan: Jumlah Keluhan */}
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: 15, fontSize: "12px" }}
          />

          {/* Bar Chart: Jam Kerja (Cyan / Industrial Teal) */}
          <Bar
            yAxisId="left"
            dataKey="jamKerja"
            name="Jam Kerja"
            fill="#0e7490"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />

          {/* Line Chart: Jumlah Keluhan (Amber Alert) */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="keluhan"
            name="Keluhan Fisik"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CorrelationChart;
