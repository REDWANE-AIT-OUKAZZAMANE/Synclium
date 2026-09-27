"use client";

import { useState } from "react";
import { SectionHead } from "./Shell";

const NAMES = ["UBL", "CII", "ZATCA", "KSeF", "PINT", "DGI", "XRE", "CFDI"];

/* Scroll-driven math: add formats, watch edges explode, then route all through the hub. */
export function Collapse() {
  const [n, setN] = useState(3);
  const [hub, setHub] = useState(false);
  const edges = n * (n - 1);
  const hubbed = 2 * n;

  return (
    <section id="collapse" className="border-b border-ink-700 bg-ink-900" aria-label="O of N squared collapse">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:py-20">
        <SectionHead
          n="08"
          kicker="O(N²) COLLAPSE // THE MATH THAT KILLS CONVERTERS"
          title={<>Add a format. Count the damage.</>}
          lede="Every new dialect multiplies point-to-point work. The hub divides it."
        />

        <div className="syn-reveal mt-10 border border-ink-700 bg-ink-950 p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Format count">
            {NAMES.map((f, i) => (
              <button
                key={f}
                onClick={() => {
                  setN(i + 1);
                  setHub(false);
                }}
                className={`border px-3 py-1.5 font-mono text-[11px] tracking-[0.12em] ${
                  i < n ? "border-signal bg-signal/15 text-signal" : "border-ink-600 text-paper-faint hover:border-paper-dim"
                }`}
                aria-pressed={i < n}
              >
                {f}
              </button>
            ))}
            <span className="ml-auto font-mono text-[11px] text-paper-faint">N = {n}</span>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2" aria-live="polite">
            <div className={`border p-5 ${hub ? "border-ink-700 opacity-50" : "border-signal"}`}>
              <p className="font-mono text-[10px] tracking-[0.24em] text-paper-faint">POINT-TO-POINT</p>
              <p className="mt-2 font-editorial text-6xl text-paper">N×(N−1)</p>
              <p className="mt-2 font-mono text-2xl text-signal">= {edges} converters</p>
              <div className="mt-4 h-2 border border-ink-600" aria-hidden>
                <div className="h-full bg-signal transition-all duration-500" style={{ width: `${Math.min(100, (edges / 56) * 100)}%` }} />
              </div>
            </div>
            <div className={`border p-5 ${hub ? "border-signal" : "border-ink-700"}`}>
              <p className="font-mono text-[10px] tracking-[0.24em] text-paper-faint">SYNCLIUM HUB</p>
              <p className="mt-2 font-editorial text-6xl text-paper">2×N</p>
              <p className="mt-2 font-mono text-2xl text-protocol">= {hubbed} adapters</p>
              <div className="mt-4 h-2 border border-ink-600" aria-hidden>
                <div className="h-full bg-protocol transition-all duration-500" style={{ width: `${Math.min(100, (hubbed / 56) * 100)}%` }} />
              </div>
            </div>
          </div>

          <button
            onClick={() => setHub(true)}
            className="mt-6 w-full bg-signal px-4 py-3 font-mono text-[12px] font-bold tracking-[0.2em] text-ink-950 hover:bg-signal-hot"
            aria-pressed={hub}
          >
            {hub ? "ONE HUB. EVERY FORMAT." : "ROUTE EVERYTHING THROUGH SYNCLIUM →"}
          </button>
        </div>
      </div>
    </section>
  );
}
