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
      <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-paper-faint">
        {label}
      </span>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between border border-ink-600 bg-ink-950 p-3 text-left transition-colors hover:border-signal focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedOption.tag && (
            <span
              className={`border px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                selectedOption.tagColor || "border-ink-600 text-paper-dim"
              }`}
            >
              {selectedOption.tag}
            </span>
          )}
          <div className="truncate">
            <p className="truncate font-mono text-xs font-bold text-paper">
              {selectedOption.label}
            </p>
            {selectedOption.sublabel && (
              <p className="truncate font-mono text-[10px] text-paper-faint">
                {selectedOption.sublabel}
              </p>
            )}
          </div>
        </div>

        <ChevronDownIcon
          className={`h-4 w-4 flex-shrink-0 text-paper-faint transition-transform duration-200 ${
            open ? "rotate-180 text-signal" : ""
          }`}
        />
      </button>

      {/* Dropdown Options Flyout */}
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-72 overflow-auto border border-ink-600 bg-ink-900 p-1.5">
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
                className={`flex w-full items-center justify-between p-2.5 text-left font-mono transition-colors ${
                  isSelected
                    ? "bg-signal/15 text-signal"
                    : "text-paper hover:bg-ink-800"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {opt.tag && (
                    <span
                      className={`border px-1.5 py-0.5 text-[10px] font-bold ${
                        opt.tagColor || "border-ink-600 text-paper-dim"
                      }`}
                    >
                      {opt.tag}
                    </span>
                  )}
                  <div className="truncate">
                    <p className="truncate text-xs font-bold">{opt.label}</p>
                    {opt.sublabel && (
                      <p className="truncate text-[10px] text-paper-faint">{opt.sublabel}</p>
                    )}
                  </div>
                </div>

                {isSelected && <CheckIcon className="ml-2 h-4 w-4 flex-shrink-0 text-signal" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
