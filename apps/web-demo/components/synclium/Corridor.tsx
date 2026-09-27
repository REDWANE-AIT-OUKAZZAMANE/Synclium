"use client";

import { useEffect, useRef, useState } from "react";
import { SectionHead } from "./Shell";
import { STAGES } from "./data";

const STAGE_NOTE: Record<string, string> = {
  ingest: "raw bytes in · namespace sniffed",
  detect: "dialect locked: UBL 2.1",
  normalize: "fields → canonical AST",
  validate: "structure + business rules",
  compile: "ZATCA nodes generated",
  emit: "UUID · ICV · PIH stamped",
};

/* The processing corridor: a document that physically travels the pipeline. */
export function Corridor() {
  const [t, setT] = useState(0); // 0..1 journey progress, loops
  const [paused, setPaused] = useState(false);
  const raf = useRef(0);
  const last = useRef(0);

  useEffect(() => {
    last.current = performance.now();
    const tick = (now: number) => {
      // rAF timestamps mark frame start and can predate performance.now()
      // captured above — clamp so journey time never goes negative/NaN.
      const dt = Math.max(0, (now - last.current) / 1000);
      last.current = now;
      if (!paused && !document.hidden) {
        setT((v) => (v + dt / 9) % 1);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [paused]);

  // Belt-and-braces: index can never escape the stage array, whatever t holds.
  const stageIdx = Math.min(
    STAGES.length - 1,
    Math.max(0, Number.isFinite(t) ? Math.floor(t * STAGES.length) : 0),
  );
  const stage = STAGES[stageIdx] ?? STAGES[0];
  const lanePct = t * 100;

  return (
    <section id="border" className="border-b border-ink-700" aria-label="Border corridor">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:py-20">
        <SectionHead
          n="02"
          kicker="THE BORDER // PROCESSING CORRIDOR"
          title={<>Six gates. One document. No queues.</>}
          lede="INGEST → DETECT → NORMALIZE → VALIDATE → COMPILE → EMIT. Each gate visibly rewrites the document; watch the seal change as it travels."
        />

        <div className="syn-reveal mt-10 border border-ink-700 bg-ink-900">
          {/* corridor lane — intelligent mobile composition: horizontal gate rail */}
          <div className="overflow-x-auto">
          <div className="relative min-w-[620px] px-4 pb-2 pt-8 sm:px-8">
            <div className="absolute left-4 right-4 top-1/2 h-px bg-ink-600 sm:left-8 sm:right-8" aria-hidden />
            <div
              className="absolute left-4 top-1/2 h-[2px] bg-signal sm:left-8"
              style={{ width: `calc(${lanePct.toFixed(1)}% - 2rem)` }}
              aria-hidden
            />
            <div className="relative grid grid-cols-6">
              {STAGES.map((s, i) => (
                <div key={s.id} className="flex flex-col items-center gap-2">
                  <span
                    className={`grid h-7 w-7 place-items-center border font-mono text-[10px] font-bold ${
                      i <= stageIdx ? "border-signal bg-signal text-ink-950" : "border-ink-600 bg-ink-950 text-paper-faint"
                    }`}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <span className={`font-mono text-[9px] tracking-[0.12em] sm:text-[10px] ${i <= stageIdx ? "text-paper" : "text-paper-faint"}`}>
                    {s.label}
                  </span>
                  <span className="hidden font-mono text-[9px] text-paper-faint md:block">{s.detail}</span>
                </div>
              ))}
            </div>
            {/* travelling document seal */}
            <div
              className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `calc(${lanePct.toFixed(1)}% )` }}
              aria-hidden
            >
              <span className="grid h-9 w-9 place-items-center border-2 border-signal bg-ink-950 font-mono text-[10px] font-bold text-signal shadow-[0_0_22px_rgba(255,92,0,0.5)]">
                INV
              </span>
            </div>
          </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-ink-700 px-4 py-3 font-mono text-[11px] sm:px-8">
            <span className="text-signal">GATE {stageIdx + 1}/6 — {stage.label}</span>
            <span className="text-paper-dim">{STAGE_NOTE[stage.id]}</span>
            <button
              onClick={() => setPaused((p) => !p)}
              className="ml-auto border border-ink-600 px-2.5 py-1 text-paper-dim hover:border-signal hover:text-signal"
              aria-pressed={paused}
            >
              {paused ? "RESUME FLOW" : "HOLD FLOW"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
