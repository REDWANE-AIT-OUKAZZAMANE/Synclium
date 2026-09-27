"use client";

import React, { useState } from "react";
import { CheckCircle2Icon, AlertTriangleIcon, CpuIcon } from "./Icons";

interface ConfidenceTableProps {
  fieldConfidence: Record<string, number>;
  overallConfidence: number;
  provider: string;
}

export function ConfidenceTable({
  fieldConfidence,
  overallConfidence,
  provider,
}: ConfidenceTableProps) {
  const [search, setSearch] = useState("");

  if (!fieldConfidence || Object.keys(fieldConfidence).length === 0) return null;

  const entries = Object.entries(fieldConfidence).filter(([k]) =>
    k.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="border border-ink-700 bg-ink-900 p-4 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700 pb-3">
        <div className="flex items-center gap-2">
          <CpuIcon className="h-4 w-4 text-protocol" />
          <span className="font-bold uppercase tracking-[0.18em] text-paper">
            Extraction Confidence Ledger
          </span>
          <span className="border border-ink-600 px-2 py-0.5 text-[10px] uppercase text-paper-dim">
            {provider}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Filter fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-ink-600 bg-ink-950 px-2.5 py-1 text-[11px] text-paper outline-none placeholder:text-paper-faint focus:border-protocol"
          />
          <span className="border border-protocol px-2 py-1 font-bold text-protocol">
            AVG {(overallConfidence * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Fields Matrix Table */}
      <div className="mt-3 max-h-60 overflow-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="border-b border-ink-700 text-paper-faint">
            <tr>
              <th className="pb-2 font-normal tracking-[0.16em]">CANONICAL FIELD PATH</th>
              <th className="pb-2 text-right font-normal tracking-[0.16em]">CONFIDENCE</th>
              <th className="pb-2 text-right font-normal tracking-[0.16em]">GATE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700">
            {entries.map(([field, score]) => {
              const isHigh = score >= 0.95;
              const isMed = score >= 0.85;
              return (
                <tr key={field} className="hover:bg-ink-800">
                  <td className="py-1.5 font-bold text-paper-dim">{field}</td>
                  <td className="py-1.5 text-right font-semibold">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-1 w-16 overflow-hidden bg-ink-700">
                        <div
                          className={`h-full ${
                            isHigh ? "bg-protocol" : isMed ? "bg-paper-dim" : "bg-signal"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(10, score * 100))}%` }}
                        />
                      </div>
                      <span
                        className={
                          isHigh
                            ? "text-protocol"
                            : isMed
                            ? "text-paper-dim"
                            : "text-signal"
                        }
                      >
                        {(score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-1.5 text-right">
                    {isHigh ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-protocol">
                        <CheckCircle2Icon className="h-3 w-3" /> PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-signal">
                        <AlertTriangleIcon className="h-3 w-3" /> REVIEW
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
