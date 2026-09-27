"use client";

import { Arrival } from "@/components/synclium/Arrival";
import { Collapse } from "@/components/synclium/Collapse";
import { Compiler } from "@/components/synclium/Compiler";
import { Corridor } from "@/components/synclium/Corridor";
import { Chamber } from "@/components/synclium/Chamber";
import { Mandates } from "@/components/synclium/Mandates";
import { OpenMachine } from "@/components/synclium/OpenMachine";
import { Passport } from "@/components/synclium/Passport";
import { Spine, SystemBar } from "@/components/synclium/Shell";
import { Terminal } from "@/components/synclium/Terminal";
import { Topology } from "@/components/synclium/Topology";
import { Translation } from "@/components/synclium/Translation";
import { useRevealRoot } from "@/components/synclium/useReveal";

function RouteTicker({ flip = false }: { flip?: boolean }) {
  const seq = "UBL 2.1 → CANONICAL AST → FACTUR-X CII → ZATCA PHASE 2 → ";
  return (
    <div className="overflow-hidden border-y border-ink-700 bg-ink-900 py-2" aria-hidden>
      <div className={`syn-marquee-track font-mono text-[10px] tracking-[0.3em] ${flip ? "[animation-direction:reverse]" : ""}`}>
        {[0, 1].map((half) => (
          <span key={half} className={half === 0 ? "text-paper-faint" : "text-protocol"}>
            {seq.repeat(6)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SyncliumJourney() {
  const root = useRevealRoot<HTMLDivElement>();

  return (
    <div ref={root} className="min-h-screen bg-ink-950 text-paper">
      <SystemBar />
      <Spine />
      <main>
        <Arrival />
        <Corridor />
        <RouteTicker />
        <Translation />
        <Topology />
        <RouteTicker flip />
        <Passport />
        <Compiler />
        <Mandates />
        <Collapse />
        <RouteTicker />
        <Chamber />
        <OpenMachine />
        <Terminal />
      </main>
    </div>
  );
}
