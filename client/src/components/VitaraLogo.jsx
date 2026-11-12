// ============================================================
// client/src/components/VitaraLogo.jsx
// Logo Resmi VITARA (Spine & Pulse) dari rancangan Stitch UI/UX.
// Batang kiri: ruas tulang belakang (Ergonomi Kerja)
// Batang kanan: denyut nadi ECG (Kesehatan & Vitalitas)
// ============================================================
import React from "react";

export default function VitaraLogo({ className = "w-10 h-10", showText = false, textClassName = "" }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <div className={`shrink-0 ${className}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-xs"
        >
          <g>
            {/* Segment 1 (Cervical / Top) */}
            <path
              d="M 22 14 L 38 14 C 36 21, 33 22, 28 22 L 20 22 C 20 18, 21 15, 22 14 Z"
              fill="#0E7490"
            />
            <rect x="26" y="21" width="7" height="3" rx="1.5" fill="#0E7490" opacity="0.6" />

            {/* Segment 2 (Thoracic) */}
            <path
              d="M 27 24 L 43 24 C 41 31, 38 32, 33 32 L 25 32 C 25 28, 26 25, 27 24 Z"
              fill="#0E7490"
            />
            <rect x="30" y="31" width="7" height="3" rx="1.5" fill="#0E7490" opacity="0.6" />

            {/* Segment 3 (Thoracic) */}
            <path
              d="M 32 34 L 47 34 C 45 41, 42 42, 38 42 L 30 42 C 30 38, 31 35, 32 34 Z"
              fill="#0E7490"
            />
            <rect x="34" y="41" width="7" height="3" rx="1.5" fill="#0E7490" opacity="0.6" />

            {/* Segment 4 (Lumbar) */}
            <path
              d="M 37 44 L 51 44 C 49 51, 46 52, 42 52 L 35 52 C 35 48, 36 45, 37 44 Z"
              fill="#0E7490"
            />
            <rect x="38" y="51" width="7" height="3" rx="1.5" fill="#0E7490" opacity="0.6" />

            {/* Segment 5 (Lumbar) */}
            <path
              d="M 41 54 L 54 54 C 52 61, 50 62, 46 62 L 40 62 C 40 58, 41 55, 41 54 Z"
              fill="#0E7490"
            />

            {/* Sacrum / Apex Base */}
            <path d="M 44 64 L 56 64 L 49 84 L 44 84 Z" fill="#0E7490" />

            {/* Right diagonal stem: Vivid Cyan/Blue pillar */}
            <path d="M 78 14 L 66 14 L 54 46 L 61 46 Z" fill="#0284C7" />
            <path d="M 57 56 L 49 84 L 44 84 L 52 64 Z" fill="#0284C7" />

            {/* Vibrant ECG Cardiac / Pulse Wave */}
            <path
              d="M 44 44 L 53 44 L 58 22 L 65 62 L 71 34 L 75 44 L 84 44"
              fill="none"
              stroke="#00BAE6"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-display font-extrabold tracking-tight text-text-main text-lg leading-none ${textClassName}`}>
            VITARA
          </span>
          <span className="text-[10px] font-semibold text-text-soft tracking-wider uppercase mt-0.5">
            Health & Recovery
          </span>
        </div>
      )}
    </div>
  );
}

