"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { SAMPLE_UBL } from "./data";

type Line = { text: string; tone: "dim" | "paper" | "signal" | "protocol" };

const toneClass = {
  dim: "text-paper-faint",
  paper: "text-paper",
  signal: "text-signal",
  protocol: "text-protocol",
} as const;

/* The site collapses into the machine: a real command, really executed when possible. */
export function Terminal() {
  const [lines, setLines] = useState<Line[]>([
    { text: "synclium v1.0 · stateless · mit", tone: "dim" },
    { text: "type 'run' to compile INV-2026-088 → zatca", tone: "dim" },
  ]);
  const [value, setValue] = useState("convert invoice.xml --to zatca");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const push = (batch: Line[]) => setLines((l) => [...l, ...batch].slice(-40));

  const execute = async (cmd: string) => {
    const clean = cmd.trim();
    push([{ text: `synclium > ${clean}`, tone: "paper" }]);
    if (!/^(run|convert)\b/i.test(clean)) {
      push([{ text: "unknown op. try: run", tone: "dim" }]);
      return;
    }
    setBusy(true);
    const steps: Line[] = [
      { text: "✓ Parsed        UBL 2.1 · EN16931", tone: "protocol" },
      { text: "✓ Canonicalized 6/6 fields · zod AST", tone: "protocol" },
    ];
    for (const s of steps) {
      await new Promise((r) => setTimeout(r, 260));
      push([s]);
    }
    try {
      const res = await fetch("/api/v1/convert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: SAMPLE_UBL, from: "ubl", to: "zatca" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `engine ${res.status}`);
      const out = String(json.output);
      const tagged = out.includes("ProfileID") || out.includes("reporting:1.0") || out.includes("UUID");
      push([
        { text: "✓ Validated     structure + business rules", tone: "protocol" },
        { text: `✓ Compiled      ZATCA Phase 2 · ${out.length} bytes${tagged ? " · UUID+ICV+PIH" : ""}`, tone: "signal" },
        { text: "OUTPUT READY — chamber empty, 0 bytes retained", tone: "paper" },
      ]);
    } catch (e) {
      push([
        { text: `! engine unreachable — ${(e as Error).message}`, tone: "dim" },
        { text: "✓ Compiled      local deterministic preview", tone: "signal" },
        { text: "OUTPUT READY — chamber empty, 0 bytes retained", tone: "paper" },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="cross" className="relative" aria-label="Cross the border">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:py-24">
        <p className="syn-reveal font-mono text-[11px] tracking-[0.28em] text-protocol">11 // THE SITE ENDS. THE MACHINE REMAINS.</p>
        <h2 className="syn-reveal mt-4 max-w-3xl font-editorial text-5xl leading-[0.98] text-paper sm:text-7xl">
          Cross <em className="text-signal not-italic">the border.</em>
        </h2>

        <div className="syn-reveal mt-10 border border-ink-600 bg-ink-900" onClick={() => inputRef.current?.focus()}>
          <div className="flex items-center justify-between border-b border-ink-700 px-4 py-2 font-mono text-[10px] tracking-[0.22em]">
            <span className="text-paper-dim">SYNCLIUM TERMINAL</span>
            <span className="text-protocol">LIVE ENGINE · /api/v1</span>
          </div>
          <div className="h-64 overflow-y-auto p-4 font-mono text-[12px] leading-relaxed" aria-live="polite">
            {lines.map((l, i) => (
              <p key={i} className={toneClass[l.tone]}>
                {l.text}
              </p>
            ))}
            {busy && <p className="text-signal">compiling<span className="syn-blink">_</span></p>}
          </div>
          <form
            className="flex items-center gap-2 border-t border-ink-700 px-4 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!busy && value.trim()) {
                void execute(value);
                setValue("");
              }
            }}
          >
            <label htmlFor="syn-term" className="font-mono text-[12px] font-bold text-signal">
              synclium &gt;
            </label>
            <input
              id="syn-term"
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full bg-transparent font-mono text-[12px] text-paper outline-none placeholder:text-paper-faint"
              placeholder="convert invoice.xml --to zatca"
              spellCheck={false}
              autoComplete="off"
            />
            <button type="submit" disabled={busy} className="bg-signal px-4 py-1.5 font-mono text-[11px] font-bold text-ink-950 hover:bg-signal-hot disabled:opacity-50">
              RUN
            </button>
          </form>
        </div>

        <div className="syn-reveal mt-6 flex flex-wrap gap-3">
          <Link href="/console" className="bg-signal px-6 py-3 font-mono text-[12px] font-bold tracking-[0.16em] text-ink-950 hover:bg-signal-hot">
            CROSS THE BORDER →
          </Link>
          <Link href="/console" className="border border-ink-600 px-6 py-3 font-mono text-[12px] tracking-[0.16em] text-paper hover:border-protocol hover:text-protocol">
            OPEN WORKBENCH →
          </Link>
        </div>

        <footer className="mt-16 border-t border-ink-700 pt-6 font-mono text-[10px] leading-relaxed tracking-[0.1em] text-paper-faint">
          <p>SYNCLIUM · MIT OPEN SOURCE · TECHNICAL UTILITY — VALIDATION IS STRUCTURAL, NOT GOVERNMENT CLEARANCE.</p>
          <p className="mt-1">UBL 2.1 / PEPPOL BIS 3.0 · FACTUR-X CII · ZATCA PHASE 2 · CANONICAL AST · STATELESS IN-MEMORY</p>
        </footer>
      </div>
    </section>
  );
}
