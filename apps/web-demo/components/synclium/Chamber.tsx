"use client";

import { useEffect, useState } from "react";
import { SectionHead } from "./Shell";

const PHASES = ["BUFFER", "PARSE", "TRANSFORM", "VALIDATE", "EMIT"] as const;

/* Zero-data chamber: the document exists only inside the active flow. */
export function Chamber() {
  const [cycle, setCycle] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setCycle((c) => (c + 1) % (PHASES.length + 2)), 900);
    return () => clearInterval(id);
  }, [running]);

  const active = cycle < PHASES.length ? cycle : -1;
  const empty = cycle >= PHASES.length;

  return (
    <section id="zerodata" className="border-b border-ink-700" aria-label="Zero data chamber">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:py-20">
        <SectionHead
          n="09"
          kicker="ZERO DATA // THE CHAMBER EMPTIES ITSELF"
          title={<>Nothing is stored. Watch it leave.</>}
          lede="Invoices live in transient RAM for the duration of one compilation — then the chamber is empty. No disk, no database, no retention."
        />

        <div className="syn-reveal mt-10 border border-ink-700 bg-ink-900 p-5 sm:p-8">
          <div className="grid gap-px border border-ink-700 bg-ink-700 sm:grid-cols-5" aria-live="polite">
            {PHASES.map((p, i) => (
              <div key={p} className={`px-3 py-4 font-mono text-[11px] tracking-[0.16em] ${i === active ? "bg-signal text-ink-950 font-bold" : i < active || empty ? "bg-ink-950 text-protocol" : "bg-ink-950 text-paper-faint"}`}>
                {i < active || empty ? "✓ " : ""}{p}
                <span className="mt-2 block h-1 bg-ink-700" aria-hidden>
                  <span className={`block h-full ${i === active ? "bg-ink-950" : i < active || empty ? "bg-protocol" : "bg-transparent"}`} style={{ width: i === active ? "100%" : i < active || empty ? "100%" : "0%" }} />
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className={`flex-1 border px-4 py-3 font-mono text-[12px] tracking-[0.14em] ${empty ? "border-protocol text-protocol" : "border-signal text-signal"}`}>
              {empty ? "CHAMBER EMPTY — 0 BYTES RETAINED" : "DOCUMENT IN FLIGHT — HELD IN RAM ONLY"}
            </div>
            <button
              onClick={() => {
                setRunning((r) => !r);
                setCycle(0);
              }}
              className="border border-ink-600 px-4 py-3 font-mono text-[11px] tracking-[0.14em] text-paper-dim hover:border-signal hover:text-signal"
              aria-pressed={running}
            >
              {running ? "❚❚ PAUSE CYCLE" : "▶ RUN CYCLE"}
            </button>
          </div>

          <p className="mt-4 font-mono text-[10px] leading-relaxed tracking-[0.08em] text-paper-faint">
            SCOPE HONESTY: “ZERO DATA” COVERS SYNCLIUM ITSELF. RATE-LIMIT COUNTERS (SALTED HASHES, 24H TTL) AND ANY UPSTREAM AI
            PROVIDER RETENTION APPLY PER THEIR OWN POLICIES — SEE DOCS.
          </p>
        </div>
      </div>
    </section>
  );
}
