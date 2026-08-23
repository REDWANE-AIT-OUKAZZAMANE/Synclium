"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, CheckIcon } from "./Icons";

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  sublabel?: string;
  tag?: string;
  tagColor?: string;
}

interface CustomDropdownProps<T extends string> {
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (val: T) => void;
  disabled?: boolean;
}

export function CustomDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: CustomDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!open) return;
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <span className="block font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
        {label}
      </span>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#05070a] hover:border-blue-500 dark:hover:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedOption.tag && (
            <span
              className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                selectedOption.tagColor || "bg-slate-200 dark:bg-[#161b22] text-slate-700 dark:text-slate-300"
              }`}
            >
              {selectedOption.tag}
            </span>
          )}
          <div className="truncate">
            <p className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {selectedOption.label}
            </p>
            {selectedOption.sublabel && (
              <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {selectedOption.sublabel}
              </p>
            )}
          </div>
        </div>

        <ChevronDownIcon
          className={`w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-blue-500" : ""
          }`}
        />
      </button>

      {/* Dropdown Options Flyout */}
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-72 overflow-auto rounded-lg border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] shadow-xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-md font-mono text-left transition-colors ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                    : "hover:bg-slate-100 dark:hover:bg-[#161b22] text-slate-800 dark:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {opt.tag && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        opt.tagColor || "bg-slate-200 dark:bg-[#161b22] text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {opt.tag}
                    </span>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-bold truncate">{opt.label}</p>
                    {opt.sublabel && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{opt.sublabel}</p>
                    )}
                  </div>
                </div>

                {isSelected && <CheckIcon className="w-4 h-4 text-blue-500 flex-shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
