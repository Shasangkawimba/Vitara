// ============================================================
// client/src/pages/Dashboard/components/CorrelationChart.jsx
// Grafik korelasi jam kerja vs keluhan (Recharts).
// Palet mengikuti design system Stitch: pine untuk jam kerja,
// terracotta untuk keluhan, grid hairline.
// ============================================================
import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Cell,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import useDarkMode from "../../../hooks/useDarkMode";

const gunakanPalet = (isDark) =>
  isDark
    ? {
        grid: "#263834",
        tick: "#9db0ab",
        axisLine: "#263834",
        dotStroke: "#12201d",
        tooltipBg: "rgba(18, 32, 29, 0.97)",
        tooltipBorder: "#263834",
        tooltipTitle: "#f3f8f6",
        tooltipLabel: "#a3b5b0",
        tooltipValue: "#f8fafc",
        bar: "#a9cec7",
        barOvertime: "#f59e0b",
        line: "#de6b48",
      }
    : {
        grid: "#e3eae7",
        tick: "#6e827f",
        axisLine: "#e3eae7",
        dotStroke: "#ffffff",
        tooltipBg: "rgba(255, 255, 255, 0.98)",
        tooltipBorder: "#e3eae7",
        tooltipTitle: "#0d1c1b",
        tooltipLabel: "#6e827f",
        tooltipValue: "#0d1c1b",
        bar: "#183b38",
        barOvertime: "#e0a33a",
        line: "#de6b48",
      };

const CustomTooltip = ({ active, payload, label, palet }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-2xl border p-3 shadow-card"
        style={{ backgroundColor: palet.tooltipBg, borderColor: palet.tooltipBorder }}
      >
        <p className="mb-1.5 text-xs font-bold" style={{ color: palet.tooltipTitle }}>
          {label}
        </p>
        <div className="space-y-1 text-xs">
          {payload.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span
                className="flex items-center gap-1.5"
                style={{ color: palet.tooltipLabel }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}:
              </span>
              <span className="font-bold" style={{ color: palet.tooltipValue }}>
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

// "2026-11-23" -> "23/11" agar sumbu X 30 hari tidak berulang "Sen, Sel, ...".
const labelTanggal = (tanggal) => {
  const [tahun, bulan, hari] = String(tanggal).split("-");
  return tahun && bulan && hari ? `${Number(hari)}/${Number(bulan)}` : tanggal;
};

export const CorrelationChart = ({ data, loading }) => {
  const isDark = useDarkMode();
  const palet = gunakanPalet(isDark);

  // Lebih dari 14 titik: label diganti tanggal & tick dijarangkan supaya terbaca.
  const panjang = data?.length ?? 0;
  const rapat = panjang > 14;
  const grafik = (data || []).map((titik, index) => {
    let label = titik.hari;
    if (rapat && titik.tanggal) label = labelTanggal(titik.tanggal);
    // Layar sempit: label bersebelahan saling menindih, kosongkan selang-seling.
    if (panjang > 5 && index % 2 !== 0) label = "";
    return { ...titik, label };
  });
  const jarakTick = rapat ? Math.ceil(panjang / 7) - 1 : 0;

  // Skala kiri dihitung sendiri agar bisa ditampilkan di luar area scroll (sticky).
  const maksJam = Math.max(8, ...(data || []).map((d) => Number(d.jamKerja) || 0));
  const atasJam = Math.max(8, Math.ceil(maksJam / 4) * 4);
  const tickJam = [0, 1, 2, 3, 4].map((i) => Math.round((atasJam / 4) * i));

  if (loading) {
    return (
      <div className="flex h-72 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-xs text-text-muted">
            Memuat visualisasi grafik...
          </span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-xs text-text-muted">
        Belum ada data aktivitas log untuk divisualisasikan.
      </div>
    );
  }

  // Sumbu Y kiri dibuat sebagai kolom tetap di luar area scroll agar
  // angkanya tidak ikut bergeser saat chart digeser horizontal.
  return (
    /* Mobile: chart lebih lebar dari layar dan bisa digeser horizontal. */
    <div className="flex pt-4">
      <div className="relative h-[240px] w-9 shrink-0 lg:h-80" aria-hidden="true">
        {tickJam.map((nilai) => (
          <span
            key={nilai}
            className="absolute right-1 -translate-y-1/2 text-[11px] leading-none"
            style={{
              top: `calc(12px + (100% - 40px) * ${1 - nilai / atasJam})`,
              color: palet.tick,
              fontFamily: "Inter",
            }}
          >
            {nilai}j
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1 overflow-x-auto pb-2">
        <div className="h-[240px] min-w-[560px] lg:min-w-0 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={grafik}
              margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={palet.grid} />
              <XAxis
                dataKey="label"
                height={28}
                interval={jarakTick}
                tickMargin={6}
                tick={{ fontSize: 11, fill: palet.tick, fontFamily: "Inter" }}
                axisLine={{ stroke: palet.axisLine }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                hide
                domain={[0, atasJam]}
                ticks={tickJam}
              />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: palet.tick, fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={<CustomTooltip palet={palet} />}
            cursor={{ fill: isDark ? "rgba(148,163,184,0.08)" : "rgba(24,59,56,0.05)" }}
          />

          <ReferenceLine
            yAxisId="left"
            y={8}
            stroke={palet.tick}
            strokeDasharray="6 4"
            strokeWidth={1}
            label={{
              value: "Batas 8 jam",
              position: "insideTopRight",
              fontSize: 10,
              fill: palet.tick,
            }}
          />

          <Bar
            yAxisId="left"
            dataKey="jamKerja"
            name="Jam Kerja"
            fill={palet.bar}
            radius={rapat ? [4, 4, 0, 0] : [10, 10, 0, 0]}
            maxBarSize={34}
          >
            {(grafik || []).map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.jamKerja > 8 ? palet.barOvertime : palet.bar}
              />
            ))}
          </Bar>

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="keluhan"
            name="Keluhan Fisik"
            stroke={palet.line}
            strokeWidth={2.5}
            dot={
              rapat
                ? false
                : { r: 2.5, fill: palet.line, stroke: "none" }
            }
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CorrelationChart;
