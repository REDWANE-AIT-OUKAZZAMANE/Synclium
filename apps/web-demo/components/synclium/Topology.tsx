"use client";

import { useMemo, useState } from "react";
import { SectionHead } from "./Shell";

const NODES = [
  { id: "ubl", x: 120, y: 60 },
  { id: "cii", x: 280, y: 40 },
  { id: "zatca", x: 400, y: 90 },
  { id: "ksef", x: 90, y: 170 },
  { id: "pint", x: 250, y: 190 },
  { id: "dgi", x: 410, y: 180 },
];

/* Signature moment: point-to-point chaos collapses into one hub. */
export function Topology() {
  const [collapsed, setCollapsed] = useState(false);

  const chaos = useMemo(() => {
    const edges: Array<[number, number]> = [];
    for (let i = 0; i < NODES.length; i++)
      for (let j = 0; j < NODES.length; j++) if (i !== j) edges.push([i, j]);
    return edges;
  }, []);

  return (
    <section id="topology" className="border-b border-ink-700 bg-ink-900" aria-label="Format topology">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:py-20">
        <SectionHead
          n="04"
          kicker="FORMAT TOPOLOGY // WHY POINT-TO-POINT DIES"
          title={<>N formats don&apos;t need N × (N − 1) converters.</>}
          lede="Six dialects, thirty bespoke mappings — or six adapters into one hub. Toggle the collapse."
        />

        <div className="syn-reveal mt-10 grid gap-px border border-ink-700 bg-ink-700 lg:grid-cols-[1fr_280px]">
          <div className="bg-ink-950 p-4">
            <svg
              viewBox="0 0 500 230"
              className="h-auto w-full"
              role="img"
              aria-label={collapsed ? "Six formats connected through one central hub" : "Six formats with chaotic point-to-point connections"}
            >
              {!collapsed &&
                chaos.map(([a, b], i) => (
                  <line
                    key={i}
                    x1={NODES[a].x}
                    y1={NODES[a].y}
                    x2={NODES[b].x}
                    y2={NODES[b].y}
                    stroke="#2A313B"
                    strokeWidth="1"
                  />
                ))}
              {collapsed &&
                NODES.map((n, i) => (
                  <line key={i} x1={250} y1={118} x2={n.x} y2={n.y} stroke="#FF5C00" strokeWidth="1.5" />
                ))}
              {collapsed && (
                <>
                  <rect x={218} y={100} width={64} height={36} fill="#FF5C00" />
                  <text x={250} y={123} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#07090C" fontFamily="monospace">
                    HUB
                  </text>
                </>
              )}
              {NODES.map((n) => (
                <g key={n.id}>
                  <rect x={n.x - 26} y={n.y - 13} width={52} height={26} fill="#07090C" stroke={collapsed ? "#FF5C00" : "#2A313B"} strokeWidth="1.5" />
                  <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="9" fill="#F2EDE3" fontFamily="monospace">
                    {n.id.toUpperCase()}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="flex flex-col justify-between bg-ink-950 p-5 font-mono text-[12px]">
            <div>
              <p className="tracking-[0.2em] text-paper-faint">CONNECTIONS</p>
              <p className={`mt-2 font-editorial text-5xl ${collapsed ? "text-signal" : "text-paper"}`}>
                {collapsed ? "12" : "30"}
              </p>
              <p className="mt-2 leading-relaxed text-paper-dim">
                {collapsed ? "2 × N adapters. Add a format, touch nothing." : "N × (N − 1) bespoke mappings. Add a format, touch everything."}
              </p>
            </div>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className={`mt-6 px-4 py-3 text-[11px] font-bold tracking-[0.16em] ${
                collapsed ? "border border-signal text-signal hover:bg-signal hover:text-ink-950" : "bg-signal text-ink-950 hover:bg-signal-hot"
              }`}
              aria-pressed={collapsed}
            >
              {collapsed ? "↩ RESTORE CHAOS" : "COLLAPSE TO HUB →"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
