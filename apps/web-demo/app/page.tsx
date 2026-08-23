"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SparklesIcon,
  UploadCloudIcon,
  FileTextIcon,
  FileCodeIcon,
  RefreshCwIcon,
  ArrowRightLeftIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  XCircleIcon,
  CopyIcon,
  CheckIcon,
  DownloadIcon,
  SunIcon,
  MoonIcon,
  ShieldCheckIcon,
  ZapIcon,
  GaugeIcon,
  LayersIcon,
  ExternalLinkIcon,
} from "@/components/Icons";

type FormatId = "ubl" | "facturx" | "zatca" | "canonical";

interface ValidationIssue {
  path: string;
  message: string;
  severity?: string;
  code?: string;
}

interface ExtractReport {
  needsReview: boolean;
  overallConfidence: number;
  reviewReasons: string[];
  fieldConfidence: Record<string, number>;
  provider: string;
  invoice: unknown;
  remaining?: number;
}

const FORMAT_LABELS: Record<FormatId, string> = {
  ubl: "UBL 2.1 / PEPPOL BIS",
  facturx: "Factur-X / ZUGFeRD (CII)",
  zatca: "ZATCA (Saudi Arabia)",
  canonical: "Canonical JSON (Hub)",
};

const FORMAT_BADGES: Record<FormatId, { label: string; bg: string }> = {
  ubl: { label: "EU / PEPPOL", bg: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  facturx: { label: "FR / DE (CII)", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  zatca: { label: "KSA Phase 2", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  canonical: { label: "Intermediate", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

export default function DemoPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [input, setInput] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [from, setFrom] = useState<"auto" | FormatId>("auto");
  const [to, setTo] = useState<FormatId>("canonical");
  const [dragging, setDragging] = useState(false);

  const [canonicalOut, setCanonicalOut] = useState<string>("");
  const [convertedOut, setConvertedOut] = useState<string>("");
  const [validation, setValidation] = useState<{
    valid: boolean;
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
    format?: string;
  } | null>(null);
  const [extractReport, setExtractReport] = useState<ExtractReport | null>(null);
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState<"" | "convert" | "validate" | "extract">("");
  const [samples, setSamples] = useState<Record<string, { name: string; label: string; content: string }[]>>({});
  const [quotaRemaining, setQuotaRemaining] = useState<number>(10);
  const fileRef = useRef<HTMLInputElement>(null);

  // Initialize theme
  useEffect(() => {
    const saved = localStorage.getItem("synclium-theme") as "dark" | "light" | null;
    const initialTheme = saved ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("synclium-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  useEffect(() => {
    fetch("/api/samples")
      .then((r) => r.json())
      .then((d) => setSamples(d.samples ?? {}))
      .catch(() => {});
  }, []);

  const reset = () => {
    setError("");
    setValidation(null);
    setExtractReport(null);
  };

  const loadFile = useCallback(async (file: File) => {
    reset();
    setFileName(file.name);
    if (file.name.toLowerCase().endsWith(".pdf") || /\.(png|jpe?g|webp)$/i.test(file.name)) {
      setInput("");
      await runExtract(file);
      return;
    }
    const text = await file.text();
    setInput(text);
    const t = text.trimStart();
    if (t.startsWith("{")) setFrom("auto");
    else if (t.includes("CrossIndustryInvoice")) setFrom("facturx");
    else setFrom("auto");
  }, []);

  const runExtract = async (fileOrText?: File | string) => {
    setBusy("extract");
    reset();
    try {
      let contentBase64: string;
      let mimeType: string;
      let filename: string;
      if (typeof fileOrText === "string") {
        contentBase64 = btoa(unescape(encodeURIComponent(fileOrText)));
        mimeType = "text/plain";
        filename = fileName || "pasted.txt";
      } else if (fileOrText instanceof File) {
        const buf = await fileOrText.arrayBuffer();
        let binary = "";
        const bytes = new Uint8Array(buf);
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        contentBase64 = btoa(binary);
        mimeType = fileOrText.type || guessMime(fileOrText.name);
        filename = fileOrText.name;
      } else {
        throw new Error("No file or text payload selected for extraction");
      }

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentBase64, mimeType, filename }),
      });
      const data = await res.json();
      if (typeof data.remaining === "number") setQuotaRemaining(data.remaining);
      if (!res.ok) throw new Error(data.error || `Extraction failed (${res.status})`);
      
      setExtractReport(data);
      const canon = JSON.stringify(data.invoice, null, 2);
      setCanonicalOut(canon);
      setInput(canon);
      setFileName(`${filename} → Extracted Canonical`);
      setTo("ubl");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const runConvert = async () => {
    if (!input.trim()) return;
    setBusy("convert");
    reset();
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input, from, to }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Conversion failed (${res.status})`);
      setConvertedOut(data.output);
      if (!canonicalOut && to === "canonical") setCanonicalOut(data.output);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const runValidate = async () => {
    if (!input.trim()) return;
    setBusy("validate");
    reset();
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input, format: from }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Validation failed (${res.status})`);
      setValidation(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  function download(name: string, content: string) {
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const hasResult = !!(convertedOut || validation || extractReport);

  return (
    <div className={`min-h-screen ${theme === "dark" ? "antigravity-bg-dark" : "antigravity-bg-light"}`}>
      {/* Background Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float" />
      </div>

      {/* Navigation & Header */}
      <header className="relative z-10 border-b border-slate-200/80 dark:border-white/10 glass-panel">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <img
                src="/logo.png"
                alt="Synclium Logo"
                className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-brand-500/20 ring-1 ring-brand-500/30 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 rounded-xl bg-brand-400/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Synclium
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                  v1.0
                </span>
              </div>
              <span className="text-[11px] font-medium tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                Universal E-Invoice Bridge
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* AI Rate Limit / Shield Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-ink-800/80 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-600 dark:text-slate-300">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
              <span>Token Shield:</span>
              <span className="text-brand-600 dark:text-brand-400 font-semibold">{quotaRemaining} / 10 Free AI Scans</span>
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl bg-slate-100 dark:bg-ink-800/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
            >
              {theme === "dark" ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>

            {/* GitHub Repo */}
            <a
              href="https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-ink-950 text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
            >
              <span>GitHub</span>
              <ExternalLinkIcon className="w-3.5 h-3.5 opacity-75" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-semibold tracking-wide uppercase mb-6 animate-pulse-subtle">
          <SparklesIcon className="w-3.5 h-3.5" />
          <span>Multimodal AI Extraction with Google Gemini Flash Free Tier</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
          One invoice in.{" "}
          <span className="bg-gradient-to-r from-brand-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
            Any e-invoicing standard out.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Convert and validate across <strong className="font-semibold text-slate-900 dark:text-white">UBL 2.1 (PEPPOL)</strong>,{" "}
          <strong className="font-semibold text-slate-900 dark:text-white">Factur-X (CII)</strong>, and{" "}
          <strong className="font-semibold text-slate-900 dark:text-white">Saudi ZATCA</strong> — with instant AI extraction for messy PDFs, scans, and images.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <ZapIcon className="w-4 h-4 text-amber-500" /> Zero-knowledge serverless execution
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-500" /> In-memory only (Never stored)
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <GaugeIcon className="w-4 h-4 text-brand-500" /> Open source under MIT
          </span>
        </div>
      </section>

      {/* Main Interactive Workspace */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        {/* Spatial Dropzone */}
        <div className="spatial-container">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void loadFile(f);
            }}
            onClick={() => fileRef.current?.click()}
            className={`spatial-card cursor-pointer rounded-3xl border-2 border-dashed p-10 sm:p-14 text-center transition-all duration-300 ${
              dragging
                ? "border-brand-500 bg-brand-500/10 scale-[1.01] shadow-glow-brand"
                : "border-slate-300/80 dark:border-white/15 glass-panel hover:border-brand-500/70 hover:shadow-float"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xml,.json,.txt,.pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void loadFile(f);
              }}
            />

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shadow-inner">
              {busy ? (
                <RefreshCwIcon className="w-8 h-8 animate-spin text-brand-500" />
              ) : (
                <UploadCloudIcon className="w-8 h-8" />
              )}
            </div>

            <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
              {busy === "extract"
                ? "Extracting with Gemini Flash AI…"
                : busy === "convert"
                ? "Converting Format…"
                : busy === "validate"
                ? "Validating Schema & Rules…"
                : "Drop an invoice document here, or browse files"}
            </h3>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              Accepts <span className="font-semibold text-slate-700 dark:text-slate-300">PDFs, Scans (.png, .jpg), XML (UBL, Factur-X, ZATCA)</span>, Canonical JSON, or raw text.
            </p>

            {fileName && !busy && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500/10 border border-brand-500/20 px-3.5 py-1.5 text-xs font-mono font-medium text-brand-600 dark:text-brand-300">
                <FileTextIcon className="w-3.5 h-3.5" />
                <span>{fileName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Sample Selector */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 px-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <LayersIcon className="w-3.5 h-3.5" /> Quick Samples:
            </span>
            {["ubl", "facturx", "zatca"].flatMap((fmt) =>
              (samples[fmt] ?? []).slice(0, 2).map((s) => (
                <button
                  key={`${fmt}-${s.name}`}
                  onClick={() => {
                    reset();
                    setInput(s.content);
                    setFileName(`examples/${fmt}/${s.name}`);
                    setCanonicalOut("");
                    setConvertedOut("");
                    setExtractReport(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-ink-900/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-brand-500 hover:text-brand-600 dark:hover:text-white transition-all shadow-sm"
                >
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${FORMAT_BADGES[fmt as FormatId]?.bg}`}>
                    {fmt.toUpperCase()}
                  </span>
                  <span>{s.label}</span>
                </button>
              )),
            )}
          </div>

          <button
            onClick={() => {
              setInput("");
              setFileName("");
              reset();
            }}
            className="text-xs text-slate-500 hover:text-red-500 transition-colors"
          >
            Clear Editor
          </button>
        </div>

        {/* Action Controls & Format Selectors */}
        <div className="mt-6 rounded-3xl glass-panel-elevated p-6 shadow-glass-light dark:shadow-glass">
          <div className="flex flex-wrap items-end gap-6">
            {/* Source Dialect */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Source Format
              </label>
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value as any)}
                className="w-full rounded-xl glass-input px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white"
              >
                <option value="auto" className="bg-white dark:bg-ink-900">✦ Auto-Detect Dialect</option>
                {(Object.keys(FORMAT_LABELS) as FormatId[]).map((f) => (
                  <option key={f} value={f} className="bg-white dark:bg-ink-900">
                    {FORMAT_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Dialect */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Target Format
              </label>
              <select
                value={to}
                onChange={(e) => setTo(e.target.value as any)}
                className="w-full rounded-xl glass-input px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white"
              >
                {(Object.keys(FORMAT_LABELS) as FormatId[]).map((f) => (
                  <option key={f} value={f} className="bg-white dark:bg-ink-900">
                    {FORMAT_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void runExtract(input)}
                disabled={!input.trim() && !fileRef.current?.value || busy !== ""}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 hover:border-purple-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <SparklesIcon className="w-4 h-4 text-purple-500" />
                <span>AI Extract</span>
              </button>

              <button
                onClick={() => void runValidate()}
                disabled={!input.trim() || busy !== ""}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold bg-slate-100 dark:bg-ink-800 border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <CheckCircle2Icon className="w-4 h-4 text-amber-500" />
                <span>Validate</span>
              </button>

              <button
                onClick={() => void runConvert()}
                disabled={!input.trim() || busy !== ""}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white shadow-lg shadow-brand-500/25 transition-all transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowRightLeftIcon className="w-4 h-4" />
                <span>Convert</span>
              </button>
            </div>
          </div>
        </div>

        {/* Input Text Area if no file */}
        {!input && (
          <div className="mt-6">
            <textarea
              placeholder="…or paste raw invoice XML (UBL, Factur-X, ZATCA), Canonical JSON, or messy plaintext here"
              onChange={(e) => setInput(e.target.value)}
              className="h-44 w-full rounded-3xl glass-panel p-5 font-mono text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
            />
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-sm text-red-600 dark:text-red-300 backdrop-blur-md">
            <XCircleIcon className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold">Operation Error</p>
              <p className="mt-1 opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Extraction Report Breakdown */}
        {extractReport && (
          <div className="mt-6 rounded-3xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-500/10 p-6 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  <SparklesIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    AI Extraction Report
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Engine: <span className="font-mono text-purple-600 dark:text-purple-300 uppercase">{extractReport.provider}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    extractReport.needsReview
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {extractReport.needsReview ? (
                    <AlertTriangleIcon className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2Icon className="w-3.5 h-3.5" />
                  )}
                  {(extractReport.overallConfidence * 100).toFixed(1)}% Confidence
                </span>
                {extractReport.needsReview && (
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    Human review recommended
                  </span>
                )}
              </div>
            </div>

            {/* Field Confidence Breakdown Chips */}
            {extractReport.fieldConfidence && Object.keys(extractReport.fieldConfidence).length > 0 && (
              <div className="mt-4 pt-4 border-t border-purple-500/20">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Field-Level Confidence:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(extractReport.fieldConfidence).map(([f, score]) => (
                    <span
                      key={f}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono ${
                        score >= 0.95
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20"
                          : score >= 0.85
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20"
                          : "bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/20"
                      }`}
                    >
                      <span>{f}</span>
                      <span className="font-bold">{(score * 100).toFixed(0)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Validation Report */}
        {validation && (
          <div
            className={`mt-6 rounded-3xl border p-6 backdrop-blur-xl ${
              validation.valid
                ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10"
                : "border-red-500/40 bg-red-500/5 dark:bg-red-500/10"
            }`}
          >
            <div className="flex items-center gap-3">
              {validation.valid ? (
                <CheckCircle2Icon className="w-6 h-6 text-emerald-500" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-red-500" />
              )}
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {validation.valid ? "Validation Passed" : "Validation Issues Detected"}
                </h3>
                {validation.format && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Target schema: <span className="font-mono">{validation.format}</span>
                  </p>
                )}
              </div>
            </div>

            {validation.errors.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm text-red-600 dark:text-red-300">
                {validation.errors.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 bg-red-500/10 p-3 rounded-xl">
                    <code className="text-red-500 font-semibold">[{e.path}]</code>
                    <span>{e.message}</span>
                  </li>
                ))}
              </ul>
            )}

            {validation.warnings.length > 0 && (
              <ul className="mt-3 space-y-2 text-sm text-amber-600 dark:text-amber-300">
                {validation.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 bg-amber-500/10 p-3 rounded-xl">
                    <code className="text-amber-500 font-semibold">[{w.path}]</code>
                    <span>{w.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Dual Code Panel Output */}
        {hasResult && (
          <div className={`mt-8 grid gap-6 ${convertedOut ? "lg:grid-cols-2" : ""}`}>
            <Panel
              title="Canonical JSON (Unified Intermediate Hub)"
              content={canonicalOut}
              onDownload={() => download("invoice.canonical.json", canonicalOut)}
            />
            {convertedOut && (
              <Panel
                title={`${FORMAT_LABELS[to]} Output`}
                content={convertedOut}
                onDownload={() =>
                  download(
                    `invoice.${to}.${to === "canonical" ? "json" : "xml"}`,
                    convertedOut,
                  )
                }
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/80 dark:border-white/10 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Synclium" className="h-6 w-6 rounded-md object-cover" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Synclium</span>
            <span>— Open source under MIT License</span>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <a
              href="https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium"
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand-500 transition-colors"
            >
              GitHub Repository
            </a>
            <a
              href="https://aistudio.google.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand-500 transition-colors"
            >
              Google AI Studio (Free API Key)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Panel({
  title,
  content,
  onDownload,
}: {
  title: string;
  content: string;
  onDownload: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!content) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-3xl glass-panel-elevated border border-slate-200/80 dark:border-white/15 shadow-glass-light dark:shadow-glass flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 px-5 py-3.5 bg-slate-50/50 dark:bg-ink-950/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <FileCodeIcon className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-brand-500 hover:text-brand-500 dark:hover:text-white transition-all bg-white/50 dark:bg-ink-900/50"
          >
            {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>

          <button
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-brand-500 hover:text-brand-500 dark:hover:text-white transition-all bg-white/50 dark:bg-ink-900/50"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      <pre className="max-h-[32rem] overflow-auto p-5 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 bg-transparent selection:bg-brand-500/20">
        {content}
      </pre>
    </div>
  );
}

function guessMime(name: string): string {
  if (name.toLowerCase().endsWith(".pdf")) return "application/pdf";
  if (name.toLowerCase().endsWith(".png")) return "image/png";
  if (name.toLowerCase().endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
