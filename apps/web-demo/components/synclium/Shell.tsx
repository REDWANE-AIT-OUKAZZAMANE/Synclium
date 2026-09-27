"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

export const SECTIONS = [
  { n: "01", id: "arrival", label: "ARRIVAL" },
  { n: "02", id: "border", label: "BORDER" },
  { n: "03", id: "translation", label: "TRANSLATION" },
  { n: "04", id: "topology", label: "TOPOLOGY" },
  { n: "05", id: "passport", label: "PASSPORT" },
  { n: "06", id: "compiler", label: "COMPILER" },
  { n: "07", id: "mandates", label: "MANDATES" },
  { n: "08", id: "collapse", label: "O(N²)" },
  { n: "09", id: "zerodata", label: "ZERO DATA" },
  { n: "10", id: "machine", label: "MACHINE" },
  { n: "11", id: "cross", label: "CROSS" },
] as const;

export function SystemBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink-700 bg-ink-950/95 backdrop-blur-none">
      <div className="mx-auto flex h-11 max-w-[1200px] items-center gap-3 px-4 font-mono text-[11px]">
        <Link href="/" className="flex items-center gap-2" aria-label="Synclium home">
          <img src="/logo.png" alt="Synclium" className="h-6 w-auto" />
          <span className="font-bold tracking-[0.18em] text-paper">SYNCLIUM</span>
        </Link>
        <span className="hidden text-paper-faint sm:inline">THE BORDERLESS INVOICE</span>
        <span className="ml-auto hidden items-center gap-2 text-protocol md:flex">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-protocol" aria-hidden />
          SYSTEM NOMINAL
        </span>
        <nav className="ml-auto flex items-center gap-3 text-paper-dim md:ml-4" aria-label="Product">
          <Link href="/console" className="hover:text-signal">CONSOLE</Link>
          <Link href="/docs" className="hover:text-signal">DOCS</Link>
          <a
            href="https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium"
            target="_blank"
            rel="noreferrer"
            className="border border-ink-600 px-2 py-0.5 text-paper hover:border-signal hover:text-signal"
          >
            MIT ↗
          </a>
        </nav>
      </div>
    </header>
  );
}

export function Spine() {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState("arrival");

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        setProgress(max > 0 ? h.scrollTop / max : 0);
        let current = "arrival";
        for (const s of SECTIONS) {
          const el = document.getElementById(s.id);
          if (el && el.getBoundingClientRect().top < window.innerHeight * 0.45) current = s.id;
        }
        setActive(current);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <nav
      className="fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
      aria-label="Journey progress"
    >
      <div className="relative flex flex-col gap-2.5">
        <div className="absolute bottom-1 left-[3px] top-1 w-px bg-ink-700" aria-hidden />
        <div
          className="syn-spine-fill absolute left-[3px] top-1 w-px bg-signal"
          style={{ height: `calc(${(progress * 100).toFixed(1)}% - 8px)`, transform: `scaleY(1)` }}
          aria-hidden
        />
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`group relative flex items-center gap-2 pl-3 font-mono text-[9px] tracking-[0.14em] ${
              active === s.id ? "text-signal" : "text-paper-faint hover:text-paper-dim"
            }`}
          >
            <span
              className={`absolute left-0 h-[7px] w-[7px] border ${
                active === s.id ? "border-signal bg-signal" : "border-ink-600 bg-ink-950"
              }`}
              aria-hidden
            />
            {s.n}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function SectionHead({
  n,
  kicker,
  title,
  lede,
}: {
  n: string;
  kicker: string;
  title: ReactNode;
  lede?: string;
}) {
  return (
    <div className="syn-reveal">
      <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.22em] text-protocol">
        <span className="border border-protocol-faint bg-protocol-faint/20 px-1.5 py-0.5">{n}</span>
        <span>{kicker}</span>
        <span className="h-px flex-1 bg-ink-700" aria-hidden />
      </div>
      <h2 className="mt-5 max-w-3xl font-editorial text-4xl leading-[1.04] text-paper sm:text-5xl">
        {title}
      </h2>
      {lede ? <p className="mt-4 max-w-2xl font-mono text-[13px] leading-relaxed text-paper-dim">{lede}</p> : null}
    </div>
  );
}

export function Telemetry({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="grid grid-cols-2 gap-px border border-ink-700 bg-ink-700 font-mono text-[11px] sm:grid-cols-4">
      {items.map(([k, v]) => (
        <div key={k} className="bg-ink-950 px-3 py-2.5">
          <dt className="tracking-[0.18em] text-paper-faint">{k}</dt>
          <dd className="mt-1 text-paper">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
