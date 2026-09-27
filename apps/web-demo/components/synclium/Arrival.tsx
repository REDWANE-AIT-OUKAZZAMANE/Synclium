"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Telemetry } from "./Shell";

const FIELDS = [
  { k: "cbc:ID", v: "INV-2026-088" },
  { k: "cbc:IssueDate", v: "2026-08-23" },
  { k: "seller.taxId", v: "DE314982711" },
  { k: "line[0].tax", v: "S · 19.00%" },
  { k: "totals.payable", v: "EUR 1785.00" },
  { k: "profile", v: "PEPPOL BIS 3.0" },
];

export function Arrival() {
  const [booted, setBooted] = useState(false);
  const [decomposed, setDecomposed] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setBooted(true), 350);
    const t2 = setTimeout(() => setDecomposed(true), 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <section id="arrival" className="relative overflow-hidden border-b border-ink-700 pt-11" aria-label="Arrival">
      {/* boot telemetry */}
      <div className="border-b border-ink-700 bg-ink-900">
        <div className="mx-auto flex max-w-[1200px] items-center gap-4 overflow-x-auto px-4 py-2 font-mono text-[10px] tracking-[0.2em] text-protocol">
          <span className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-pulse bg-signal" aria-hidden />
            INCOMING DOCUMENT
          </span>
          <span className="text-paper-faint">ORIGIN EU / PEPPOL</span>
          <span className="text-paper-faint">FORMAT UBL 2.1</span>
          <span className="text-paper-faint">DESTINATION SAUDI ARABIA</span>
          <span className="text-signal">TARGET ZATCA PHASE 2</span>
        </div>
        <div className={`h-[2px] bg-signal ${booted ? "syn-bootbar" : "scale-x-0"}`} aria-hidden />
      </div>

      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 pb-16 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16">
        <div className="syn-reveal is-on">
          <p className="font-mono text-[11px] tracking-[0.28em] text-protocol">SYNCLIUM // BORDER CONTROL FOR INVOICES</p>
          <h1 className="mt-5 font-editorial text-5xl leading-[0.98] text-paper sm:text-7xl">
            Every invoice
            <br />
            has <em className="text-signal not-italic underline decoration-signal/60 decoration-2 underline-offset-8">a border.</em>
          </h1>
          <p className="mt-6 max-w-xl font-mono text-[13px] leading-relaxed text-paper-dim">
            Synclium moves it across — UBL 2.1 / PEPPOL, Factur-X CII and ZATCA Phase 2,
            transpiled through one canonical AST. Deterministic. Stateless. MIT open source.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="#compiler"
              className="bg-signal px-5 py-3 font-mono text-[12px] font-bold tracking-[0.14em] text-ink-950 hover:bg-signal-hot"
            >
              TRANSLATE AN INVOICE →
            </Link>
            <Link
              href="#cross"
              className="border border-ink-600 px-5 py-3 font-mono text-[12px] tracking-[0.14em] text-paper hover:border-signal hover:text-signal"
            >
              OPEN TERMINAL
            </Link>
          </div>
          <p className="mt-5 font-mono text-[10px] tracking-[0.14em] text-paper-faint">
            TECHNICAL UTILITY — NOT GOVERNMENT CLEARANCE OR CERTIFICATION
          </p>
        </div>

        {/* decomposing document */}
        <div className="relative" aria-label="Invoice under inspection">
          <div className="syn-ticket overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-700 px-4 py-2 font-mono text-[10px] tracking-[0.2em]">
              <span className="text-paper-dim">DOC // INV-2026-088</span>
              <span className="text-protocol">SCAN ACTIVE</span>
            </div>
            <div className="relative bg-paper px-5 py-5 text-ink-950">
              <div className="syn-scanline" aria-hidden />
              <p className="font-mono text-[10px] tracking-[0.24em] text-ink-950/60">TAX INVOICE — UBL 2.1</p>
              <p className="mt-2 font-editorial text-2xl">Nordwind Transit Systems GmbH</p>
              <div className="mt-3 grid grid-cols-2 gap-3 font-mono text-[11px]">
                <div>ID<br /><strong>INV-2026-088</strong></div>
                <div>ISSUE<br /><strong>2026-08-23</strong></div>
                <div>SELLER VAT<br /><strong>DE314982711</strong></div>
                <div>PAYABLE<br /><strong>EUR 1785.00</strong></div>
              </div>
              <div className="syn-perforation my-4 bg-ink-950/20" aria-hidden />
              <p className="font-mono text-[11px]">LINE 1 — Rail power inverter maintenance · S 19.00%</p>
            </div>
          </div>

          <ul className="mt-4 grid grid-cols-2 gap-px border border-ink-700 bg-ink-700 font-mono text-[10px] sm:grid-cols-3" aria-label="Decomposed semantic fields">
            {FIELDS.map((f, i) => (
              <li
                key={f.k}
                className={`bg-ink-950 px-2.5 py-2 transition-all duration-500 ${
                  decomposed ? "text-paper opacity-100" : "text-paper-faint opacity-40"
                }`}
                style={{ transitionDelay: decomposed ? `${i * 120}ms` : "0ms" }}
              >
                <span className="block text-protocol">{f.k}</span>
                <span className="block truncate text-paper">{f.v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 pb-10">
        <Telemetry
          items={[
            ["ORIGIN", "EU / PEPPOL"],
            ["FORMAT", "UBL 2.1"],
            ["DESTINATION", "SAUDI ARABIA"],
            ["TARGET", "ZATCA PHASE 2"],
          ]}
        />
      </div>
    </section>
  );
}
