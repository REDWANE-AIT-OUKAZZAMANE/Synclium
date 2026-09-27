"use client";

import { SectionHead } from "./Shell";
import { EVAL_ROWS, REPO_TREE } from "./data";

/* Open source as control room: the actual repo, exposed. Not a black box. */
export function OpenMachine() {
  return (
    <section id="machine" className="border-b border-ink-700 bg-ink-900" aria-label="Open machine">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:py-20">
        <SectionHead
          n="10"
          kicker="OPEN MACHINE // NOT A BLACK BOX"
          title={<>Read the machine before you trust it.</>}
          lede="Every adapter is three pure functions — import, export, validate — covered by golden-file matrices. MIT licensed. Extend it in a day."
        />

        <div className="syn-reveal mt-10 grid gap-px border border-ink-700 bg-ink-700 lg:grid-cols-2">
          <div className="bg-ink-950 p-5">
            <p className="font-mono text-[10px] tracking-[0.24em] text-paper-faint">REPOSITORY // PACKAGES</p>
            <ul className="mt-3 space-y-1 font-mono text-[12px]">
              {REPO_TREE.map((r) => (
                <li key={r.path} className="flex items-baseline justify-between gap-3 border-b border-dotted border-ink-700 py-1.5">
                  <span className="text-protocol">{r.path}</span>
                  <span className="text-right text-paper-dim">{r.desc}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border border-ink-700 bg-ink-900 p-3 font-mono text-[11px] text-paper-dim">
              <span className="text-paper">import / export / validate</span> — the only interface a new format must implement.
              Copy <span className="text-protocol">packages/formats/ubl</span>, rename, register, ship.
            </div>
          </div>
          <div className="bg-ink-950 p-5">
            <p className="font-mono text-[10px] tracking-[0.24em] text-paper-faint">EVAL // 554 VERIFIED FIELDS</p>
            <ul className="mt-3 space-y-2">
              {EVAL_ROWS.map((e) => (
                <li key={e.provider} className="border border-ink-700 p-3">
                  <div className="flex items-baseline justify-between font-mono text-[12px]">
                    <span className="text-paper">{e.provider}</span>
                    <span className="font-bold text-signal">{e.score}</span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-paper-faint">{e.note}</p>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium"
                target="_blank"
                rel="noreferrer"
                className="bg-paper px-4 py-2.5 font-mono text-[11px] font-bold tracking-[0.14em] text-ink-950 hover:bg-signal"
              >
                READ THE SOURCE ↗
              </a>
              <a
                href="https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noreferrer"
                className="border border-ink-600 px-4 py-2.5 font-mono text-[11px] tracking-[0.14em] text-paper hover:border-signal hover:text-signal"
              >
                ADD A FORMAT
              </a>
              <span className="syn-stamp border-paper-dim text-paper-dim">MIT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
