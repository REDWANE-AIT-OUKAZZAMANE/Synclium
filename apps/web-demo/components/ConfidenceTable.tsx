"use client";

import React, { useState } from "react";
import { CheckCircle2Icon, AlertTriangleIcon, SparklesIcon } from "./Icons";

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
    <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 dark:bg-purple-500/10 p-4 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-purple-500" />
          <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            AI Extraction Confidence Matrix
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 uppercase">
            {provider}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Filter fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-2.5 py-1 rounded bg-white dark:bg-[#05070a] border border-purple-500/30 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-[11px] outline-none focus:border-purple-500"
          />
          <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold">
            Avg: {(overallConfidence * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Fields Matrix Table */}
      <div className="mt-3 max-h-60 overflow-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="text-slate-500 border-b border-purple-500/20">
            <tr>
              <th className="pb-2">Canonical Field Path</th>
              <th className="pb-2 text-right">Confidence</th>
              <th className="pb-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-500/10">
            {entries.map(([field, score]) => {
              const isHigh = score >= 0.95;
              const isMed = score >= 0.85;
              return (
                <tr key={field} className="hover:bg-purple-500/5">
                  <td className="py-1.5 font-bold text-slate-700 dark:text-slate-300">{field}</td>
                  <td className="py-1.5 text-right font-semibold">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-black/40 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isHigh ? "bg-emerald-500" : isMed ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(10, score * 100))}%` }}
                        />
                      </div>
                      <span
                        className={
                          isHigh
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isMed
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {(score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-1.5 text-right">
                    {isHigh ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2Icon className="w-3 h-3" /> Auto
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                        <AlertTriangleIcon className="w-3 h-3" /> Check
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
