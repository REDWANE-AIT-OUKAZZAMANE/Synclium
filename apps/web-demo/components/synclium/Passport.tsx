"use client";

import { useEffect, useRef, useState } from "react";
import { SectionHead } from "./Shell";
import { PASSPORT_STAMPS } from "./data";

const ROWS: Array<[string, string]> = [
  ["DOCUMENT ID", "INV-2026-088"],
  ["ORIGIN", "EU / PEPPOL"],
  ["DESTINATION", "SAUDI ARABIA"],
  ["SOURCE FORMAT", "UBL 2.1 · BIS 3.0"],
  ["TARGET FORMAT", "ZATCA PHASE 2"],
  ["SEMANTIC INTEGRITY", "LOSSLESS · 6/6 FIELDS"],
  ["VALIDATION STATE", "STRUCTURE + RULES PASS"],
  ["CLEARANCE STATUS", "NOT SUBMITTED · TECHNICAL ONLY"],
];

/* The transit record: stamps land as validation passes. */
export function Passport() {
  const [stamped, setStamped] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        let i = 0;
        const tick = () => {
          i += 1;
          setStamped(i);
          if (i < PASSPORT_STAMPS.length) setTimeout(tick, 420);
        };
        setTimeout(tick, 350);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const tone = (t: string) =>
    t === "signal" ? "text-signal border-signal" : t === "protocol" ? "text-protocol border-protocol" : "text-paper border-paper-dim";

  return (
    <section id="passport" className="border-b border-ink-700" aria-label="Invoice passport">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:py-20">
        <SectionHead
          n="05"
          kicker="INVOICE PASSPORT // SYNCLIUM TRANSIT RECORD"
          title={<>Cleared to cross.</>}
          lede="One document, stamped at every gate. Clearance status stays honest: validated technically, never submitted to any authority."
        />

        <div ref={ref} className="syn-reveal syn-ticket mt-10 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700 pb-4">
            <p className="font-mono text-[11px] tracking-[0.24em] text-paper-dim">SYNCLIUM TRANSIT RECORD</p>
            <p className="font-mono text-[11px] tracking-[0.24em] text-signal">Nº 088-2026-EU-SA</p>
          </div>
          <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {ROWS.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-b border-dotted border-ink-600 pb-2">
                <dt className="font-mono text-[10px] tracking-[0.2em] text-paper-faint">{k}</dt>
                <dd className="text-right font-mono text-[12px] text-paper">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex min-h-[44px] flex-wrap gap-3" aria-live="polite">
            {PASSPORT_STAMPS.slice(0, stamped).map((s) => (
              <span key={s.code} className={`syn-stamp syn-stamp-live ${tone(s.tone)}`} title={s.label}>
                ✓ {s.code}
              </span>
            ))}
            {stamped === 0 && <span className="font-mono text-[11px] text-paper-faint">AWAITING INSPECTION…</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
