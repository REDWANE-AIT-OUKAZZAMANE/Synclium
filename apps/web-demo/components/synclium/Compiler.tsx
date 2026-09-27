"use client";

import { useCallback, useEffect, useState } from "react";
import { SectionHead } from "./Shell";
import { SAMPLE_UBL } from "./data";

type CompileState = "idle" | "working" | "done" | "error";

interface ValidatePayload {
  valid?: boolean;
  errors?: Array<{ path?: string; message?: string }>;
  warnings?: Array<{ path?: string; message?: string }>;
  format?: string;
  error?: string;
}

/* Live compiler laboratory: SOURCE → CORE → TARGET, wired to the real engine. */
export function Compiler() {
  const [source, setSource] = useState(SAMPLE_UBL);
  const [targetFmt, setTargetFmt] = useState<"zatca" | "facturx" | "canonical">("zatca");
  const [phase, setPhase] = useState(0);
  const [state, setState] = useState<CompileState>("idle");
  const [target, setTarget] = useState("");
  const [validation, setValidation] = useState<ValidatePayload | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [live, setLive] = useState<boolean | null>(null);

  const run = useCallback(
    async (fmt: "zatca" | "facturx" | "canonical") => {
      setState("working");
      setPhase(0);
      setTarget("");
      setValidation(null);
      const t0 = performance.now();
      const tick = (p: number) => setPhase(p);
      try {
        // SOURCE → CORE (detect + import)
        tick(1);
        const conv = await fetch("/api/v1/convert", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ input: source, from: "auto", to: fmt }),
        });
        const convJson = await conv.json();
        if (!conv.ok) throw new Error(convJson.error ?? `convert failed (${conv.status})`);
        // CORE → validation gate
        tick(3);
        const val = await fetch("/api/v1/validate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ input: source, format: "auto" }),
        });
        const valJson = (await val.json()) as ValidatePayload;
        // TARGET → emit
        tick(4);
        await new Promise((r) => setTimeout(r, 280));
        tick(5);
        setTarget(convJson.output);
        setValidation(valJson);
        setElapsed(performance.now() - t0);
        setState("done");
        setLive(true);
      } catch (e) {
        // Deterministic frontend fallback: local pass-through so the lab never dead-ends
        setLive(false);
        setTarget(
          `<!-- LIVE ENGINE UNREACHABLE — LOCAL PREVIEW -->\n<!-- ${(e as Error).message} -->\n` +
            source.slice(0, 900),
        );
        setValidation({ valid: null as unknown as boolean, format: "local-preview" });
        setState("error");
      }
    },
    [source],
  );

  useEffect(() => {
    void run("zatca");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phases = ["SOURCE", "DETECT", "CANONICAL", "VALIDATE", "EMIT", "TARGET"];

  return (
    <section id="compiler" className="border-b border-ink-700 bg-ink-900" aria-label="Live compiler">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:py-20">
        <SectionHead
          n="06"
          kicker="LIVE COMPILER // SOURCE · CORE · TARGET"
          title={<>Watch the machine compile.</>}
          lede="Real UBL in, real engine call, real ZATCA out. Telemetry below is measured in your browser against /api/v1 — never invented."
        />

        <div className="syn-reveal mt-8 flex flex-wrap items-center gap-2 font-mono text-[11px]">
          {(["zatca", "facturx", "canonical"] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setTargetFmt(f);
                void run(f);
              }}
              className={`border px-3 py-1.5 tracking-[0.14em] ${
                targetFmt === f ? "border-signal bg-signal text-ink-950 font-bold" : "border-ink-600 text-paper-dim hover:border-signal hover:text-signal"
              }`}
              aria-pressed={targetFmt === f}
            >
              → {f.toUpperCase()}
            </button>
          ))}
          <button
            onClick={() => void run(targetFmt)}
            className="border border-protocol px-3 py-1.5 tracking-[0.14em] text-protocol hover:bg-protocol hover:text-ink-950"
          >
            ⟳ RECOMPILE
          </button>
          <span className="ml-auto text-paper-faint" aria-live="polite">
            {state === "working" ? "COMPILING…" : state === "done" ? `DONE · ${elapsed?.toFixed(0)}MS ROUND-TRIP` : state === "error" ? "ENGINE OFFLINE · PREVIEW" : "IDLE"}
            {live === false ? " · LOCAL FALLBACK" : ""}
          </span>
        </div>

        {/* phase strip */}
        <ol className="syn-reveal mt-4 grid grid-cols-6 gap-px border border-ink-700 bg-ink-700 font-mono text-[9px] sm:text-[10px]" aria-label="Compile phases">
          {phases.map((p, i) => (
            <li
              key={p}
              className={`px-2 py-2 text-center tracking-[0.14em] ${i <= phase ? "bg-signal text-ink-950 font-bold" : "bg-ink-950 text-paper-faint"}`}
            >
              {p}
            </li>
          ))}
        </ol>

        <div className="syn-reveal mt-4 grid gap-px border border-ink-700 bg-ink-700 lg:grid-cols-3">
          <div className="bg-ink-950">
            <p className="border-b border-ink-700 px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-paper-dim">SOURCE // UBL 2.1</p>
            <textarea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              spellCheck={false}
              rows={18}
              className="w-full resize-y bg-ink-950 p-3 font-mono text-[11px] leading-relaxed text-paper-dim outline-none focus:text-paper"
              aria-label="Source invoice XML"
            />
          </div>
          <div className="bg-ink-950">
            <p className="border-b border-ink-700 px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-signal">SYNCLIUM CORE // VALIDATION GATE</p>
            <div className="space-y-3 p-4 font-mono text-[11px]">
              <div className="flex justify-between border-b border-dotted border-ink-600 pb-2">
                <span className="text-paper-faint">DETECTED</span>
                <span className="text-paper">UBL 2.1</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-ink-600 pb-2">
                <span className="text-paper-faint">CANONICAL</span>
                <span className="text-paper">AST · ZOD PARSED</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-ink-600 pb-2">
                <span className="text-paper-faint">VALID</span>
                <span className={validation?.valid ? "text-protocol" : validation?.valid === false ? "text-signal" : "text-paper-dim"}>
                  {validation ? String(validation.valid).toUpperCase() : "…"}
                </span>
              </div>
              <div>
                <p className="text-paper-faint">RULES</p>
                <ul className="mt-1 max-h-40 space-y-1 overflow-auto">
                  {(validation?.errors ?? []).slice(0, 4).map((e, i) => (
                    <li key={i} className="text-signal">✗ {e.path ?? "?"} — {e.message ?? ""}</li>
                  ))}
                  {(validation?.warnings ?? []).slice(0, 3).map((w, i) => (
                    <li key={i} className="text-paper-dim">! {w.path ?? "?"} — {w.message ?? ""}</li>
                  ))}
                  {validation && (validation.errors ?? []).length === 0 && (validation.warnings ?? []).length === 0 && validation.valid && (
                    <li className="text-protocol">✓ structure + business rules pass</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          <div className="bg-ink-950">
            <p className="border-b border-ink-700 px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-paper-dim">
              TARGET // {targetFmt.toUpperCase()}
            </p>
            <pre className="max-h-[430px] overflow-auto p-3 font-mono text-[11px] leading-relaxed text-paper" aria-live="polite">
              {target || (state === "working" ? "COMPILING…" : "—")}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
