"use client";

import { SectionHead } from "./Shell";
import { TRANSLATION_ROWS } from "./data";

/* Same meaning, different representation — the syntax changes, values hold. */
export function Translation() {
  return (
    <section id="translation" className="border-b border-ink-700" aria-label="Translation">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:py-20">
        <SectionHead
          n="03"
          kicker="TRANSLATION // ONE INVOICE, FOUR LANGUAGES"
          title={<>Same meaning. Different representation.</>}
          lede="UBL → canonical AST → CII → ZATCA. Semantic values stay pinned while the syntax around them is rewritten. That is the whole product."
        />

        <div className="syn-reveal mt-10 overflow-x-auto border border-ink-700">
          <table className="w-full min-w-[760px] border-collapse bg-ink-900 font-mono text-[11px]">
            <thead>
              <tr className="border-b border-ink-700 text-left">
                <th className="px-3 py-2.5 font-normal tracking-[0.18em] text-paper-faint">FIELD</th>
                <th className="border-l border-ink-700 px-3 py-2.5 font-normal tracking-[0.18em] text-paper">UBL 2.1</th>
                <th className="border-l border-signal/50 bg-signal/10 px-3 py-2.5 font-normal tracking-[0.18em] text-signal">CANONICAL AST</th>
                <th className="border-l border-ink-700 px-3 py-2.5 font-normal tracking-[0.18em] text-paper">CII</th>
                <th className="border-l border-ink-700 px-3 py-2.5 font-normal tracking-[0.18em] text-paper">ZATCA</th>
              </tr>
            </thead>
            <tbody>
              {TRANSLATION_ROWS.map((r) => (
                <tr key={r.field} className="border-b border-ink-700 last:border-0 hover:bg-ink-850">
                  <td className="px-3 py-2.5 text-protocol">{r.field}</td>
                  <td className="border-l border-ink-700 px-3 py-2.5 text-paper-dim">{r.ubl}</td>
                  <td className="border-l border-signal/50 bg-signal/10 px-3 py-2.5 font-bold text-paper">{r.canonical}</td>
                  <td className="border-l border-ink-700 px-3 py-2.5 text-paper-dim">{r.cii}</td>
                  <td className="border-l border-ink-700 px-3 py-2.5 text-paper-dim">{r.zatca}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="syn-reveal mt-4 font-mono text-[11px] tracking-[0.1em] text-paper-faint">
          THE ORANGE COLUMN IS THE PRODUCT. EVERYTHING ELSE IS A DIALECT.
        </p>
      </div>
    </section>
  );
}
