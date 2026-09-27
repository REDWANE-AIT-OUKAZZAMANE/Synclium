"use client";

import { useState } from "react";
import { SectionHead } from "./Shell";
import { MANDATES } from "./data";

/* Mandate clock: jurisdictions as events on a temporal rail. */
export function Mandates() {
  const [sel, setSel] = useState<(typeof MANDATES)[number]>(MANDATES[3]);

  return (
    <section id="mandates" className="border-b border-ink-700" aria-label="Mandate clock">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:py-20">
        <SectionHead
          n="07"
          kicker="MANDATE CLOCK // 2025 → 2028"
          title={<>The deadlines are real. The engine is ready.</>}
          lede="Select a jurisdiction. The chamber reconfigures to its standard, clearance model, and Synclium support state."
        />

        {/* temporal rail */}
        <div className="syn-reveal mt-10 border border-ink-700 bg-ink-900 p-4 sm:p-6" role="tablist" aria-label="Jurisdictions">
          <div className="relative">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-ink-600" aria-hidden />
            <div className="relative flex justify-between gap-2 overflow-x-auto pb-1">
              {MANDATES.map((m) => (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={sel.id === m.id}
                  onClick={() => setSel(m)}
                  className={`flex min-w-[130px] flex-col items-center gap-2 px-2 py-1 ${
                    sel.id === m.id ? "text-signal" : "text-paper-faint hover:text-paper"
                  }`}
                >
                  <span
                    className={`h-3 w-3 border-2 ${sel.id === m.id ? "border-signal bg-signal" : "border-ink-600 bg-ink-950"}`}
                    aria-hidden
                  />
                  <span className="font-mono text-[10px] font-bold tracking-[0.12em]">{m.country}</span>
                  <span className="font-mono text-[9px]">{m.date}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-px border border-ink-700 bg-ink-700 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
            {[
              ["JURISDICTION", sel.country],
              ["MANDATE TIMING", sel.date],
              ["STANDARD", sel.standard],
              ["CLEARANCE MODEL", sel.clearance],
            ].map(([k, v]) => (
              <div key={k} className="bg-ink-950 px-4 py-3 font-mono text-[11px]">
                <p className="tracking-[0.2em] text-paper-faint">{k}</p>
                <p className="mt-1 text-paper">{v}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-[11px]">
            <span className={`syn-stamp ${sel.ready ? "text-protocol border-protocol" : "text-signal border-signal"}`}>
              {sel.ready ? "✓ SYNCLIUM READY" : "! " + sel.support}
            </span>
            <span className="text-paper-dim">{sel.note}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
