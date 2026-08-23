"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
}

const FORMAT_LABELS: Record<FormatId, string> = {
  ubl: "UBL / PEPPOL BIS",
  facturx: "Factur-X (CII)",
  zatca: "ZATCA (Saudi)",
  canonical: "Canonical JSON",
};

export default function DemoPage() {
  const [input, setInput] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [from, setFrom] = useState<"auto" | FormatId>("auto");
  const [to, setTo] = useState<FormatId>("canonical");
  const [dragging, setDragging] = useState(false);

  const [canonicalOut, setCanonicalOut] = useState<string>("");
  const [convertedOut, setConvertedOut] = useState<string>("");
  const [validation, setValidation] = useState<{ valid: boolean; errors: ValidationIssue[]; warnings: ValidationIssue[]; format?: string } | null>(null);
  const [extractReport, setExtractReport] = useState<ExtractReport | null>(null);
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState<"" | "convert" | "validate" | "extract">("");
  const [samples, setSamples] = useState<Record<string, { name: string; label: string; content: string }[]>>({});
  const fileRef = useRef<HTMLInputElement>(null);

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
      // Binary → straight to AI extraction
      setInput("");
      await runExtract(file);
      return;
    }
    const text = await file.text();
    setInput(text);
    // Auto-select sensible source format
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
        throw new Error("Nothing to extract");
      }

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentBase64, mimeType, filename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Extraction failed (${res.status})`);
      setExtractReport(data);
      const canon = JSON.stringify(data.invoice, null, 2);
      setCanonicalOut(canon);
      setInput(canon);
      setFileName(`${filename} → extracted`);
      // Preselect conversion target
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-ink-700/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(47,150,255,0.18),transparent_55%)]" />
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 font-bold text-white shadow-lg shadow-brand-500/30">
              ⇄
            </span>
            <span className="text-lg font-semibold tracking-tight text-white">
              OpenInvoiceBridge
            </span>
            <a
              href="https://github.com/openinvoicebridge/openinvoicebridge"
              className="ml-auto rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-brand-500 hover:text-white"
              target="_blank"
              rel="noreferrer"
            >
              GitHub ↗
            </a>
          </div>
          <h1 className="mt-8 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            One invoice in.{" "}
            <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
              Any e-invoicing standard out.
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-400">
            Convert and validate between UBL/PEPPOL BIS, Factur-X/ZUGFeRD and ZATCA — with AI extraction
            for messy PDFs. Everything runs server-side in memory; <strong className="text-slate-300">nothing is stored</strong>.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Technical interoperability utility — not certified legal compliance software.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        {/* Dropzone */}
        <section
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
          className={`mt-[-2rem] cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center backdrop-blur transition ${
            dragging
              ? "border-brand-400 bg-brand-500/10"
              : "border-ink-700 bg-ink-900/80 hover:border-brand-500/60"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xml,.json,.txt,.pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void loadFile(f);
            }}
          />
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ink-800 text-xl">📄</div>
          <p className="mt-3 font-medium text-white">
            {busy === "extract"
              ? "Extracting with AI…"
              : busy === "convert"
                ? "Converting…"
                : busy === "validate"
                  ? "Validating…"
                  : "Drop an invoice here, or click to browse"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            XML (UBL · Factur-X · ZATCA), canonical JSON, plain text or PDF/image for AI extraction
          </p>
          {fileName && !busy ? (
            <p className="mt-2 inline-block rounded-md bg-ink-800 px-3 py-1 font-mono text-xs text-brand-300">
              {fileName}
            </p>
          ) : null}
        </section>

        {/* Samples */}
        <section className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Try a sample:</span>
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
                className="rounded-full border border-ink-700 px-3 py-1 text-xs text-slate-300 transition hover:border-brand-500 hover:text-white"
              >
                <span className="mr-1 opacity-50">{fmt}</span>
                {s.label}
              </button>
            )),
          )}
          {Object.keys(samples).length === 0 ? (
            <span className="text-xs text-slate-600">(run the repo locally to load sample invoices)</span>
          ) : null}
        </section>

        {/* Controls */}
        <section className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-ink-700/60 bg-ink-900/60 p-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-slate-500">Source</span>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value as any)}
              className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
            >
              <option value="auto">Auto-detect</option>
              {(Object.keys(FORMAT_LABELS) as FormatId[]).map((f) => (
                <option key={f} value={f}>
                  {FORMAT_LABELS[f]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-slate-500">Target</span>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value as any)}
              className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
            >
              {(Object.keys(FORMAT_LABELS) as FormatId[]).map((f) => (
                <option key={f} value={f}>
                  {FORMAT_LABELS[f]}
                </option>
              ))}
            </select>
          </label>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              onClick={() => void runExtract(input)}
              disabled={!input.trim() && !fileRef.current?.value}
              className="rounded-lg border border-ink-700 bg-ink-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-purple-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              ✦ AI Extract
            </button>
            <button
              onClick={() => void runValidate()}
              disabled={!input.trim()}
              className="rounded-lg border border-ink-700 bg-ink-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-amber-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Validate
            </button>
            <button
              onClick={() => void runConvert()}
              disabled={!input.trim()}
              className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Convert →
            </button>
          </div>
        </section>

        {/* Editor */}
        {!input && (
          <textarea
            placeholder={"…or paste invoice XML / canonical JSON here"}
            onChange={(e) => setInput(e.target.value)}
            className="mt-4 h-40 w-full rounded-2xl border border-ink-700 bg-ink-900/60 p-4 font-mono text-sm text-slate-300 outline-none focus:border-brand-500"
          />
        )}

        {/* Errors */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            ✖ {error}
          </div>
        )}

        {/* Extraction report */}
        {extractReport && (
          <div className="mt-4 rounded-2xl border border-purple-400/30 bg-purple-500/5 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-semibold text-white">AI extraction report</h3>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                extractReport.needsReview
                  ? "bg-amber-400/15 text-amber-300"
                  : "bg-emerald-400/15 text-emerald-300"
              }`}>
                {(extractReport.overallConfidence * 100).toFixed(1)}% confidence
              </span>
              {extractReport.needsReview && (
                <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                  ⚠ needs human review
                </span>
              )}
              <span className="ml-auto text-xs text-slate-500">provider: {extractReport.provider}</span>
            </div>
            {extractReport.reviewReasons.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-amber-300/90">
                {extractReport.reviewReasons.slice(0, 6).map((r) => (
                  <li key={r}>· {r}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Validation report */}
        {validation && (
          <div className={`mt-4 rounded-2xl border p-5 ${validation.valid ? "border-emerald-400/30 bg-emerald-400/5" : "border-red-400/30 bg-red-400/5"}`}>
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-white">
                {validation.valid ? "✔ Valid" : "✖ Invalid"}
              </h3>
              {validation.format && (
                <span className="rounded-full bg-ink-800 px-2.5 py-0.5 text-xs text-slate-400">{validation.format}</span>
              )}
            </div>
            {validation.errors.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm text-red-300">
                {validation.errors.map((e, i) => (
                  <li key={i}>
                    <code className="text-red-400">[{e.path}]</code> {e.message}
                  </li>
                ))}
              </ul>
            )}
            {validation.warnings.length > 0 && (
              <ul className="mt-2 space-y-1.5 text-sm text-amber-300/90">
                {validation.warnings.map((w, i) => (
                  <li key={i}>
                    <code className="text-amber-400">[{w.path}]</code> {w.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Results */}
        {hasResult && (
          <div className={`mt-6 grid gap-4 ${convertedOut ? "lg:grid-cols-2" : ""}`}>
            <Panel
              title="Canonical JSON (the hub)"
              content={canonicalOut}
              onDownload={() => download("invoice.canonical.json", canonicalOut)}
            />
            {convertedOut && (
              <Panel
                title={`${FORMAT_LABELS[to]} output`}
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

      <footer className="border-t border-ink-700/60 py-10 text-center text-sm text-slate-500">
        <p>
          OpenInvoiceBridge — open source under MIT.{" "}
          <a className="text-brand-300 hover:underline" href="https://github.com/openinvoicebridge/openinvoicebridge">
            Add your country&apos;s format →
          </a>
        </p>
        <p className="mt-2 text-xs text-slate-600">
          Not legal compliance software · No invoice data is stored · Built with UBL 2.1, CII &amp; ZATCA schemas
        </p>
      </footer>
    </div>
  );
}

function Panel({ title, content, onDownload }: { title: string; content: string; onDownload: () => void }) {
  if (!content) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-700/60 bg-ink-900/70">
      <div className="flex items-center justify-between border-b border-ink-700/60 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <button
          onClick={onDownload}
          className="rounded-md border border-ink-700 px-2.5 py-1 text-xs text-slate-400 transition hover:border-brand-500 hover:text-white"
        >
          ↓ Download
        </button>
      </div>
      <pre className="max-h-[28rem] overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-300">
        {content}
      </pre>
    </div>
  );
}

function guessMime(name: string): string {
  if (name.toLowerCase().endsWith(".pdf")) return "application/pdf";
  if (name.toLowerCase().endsWith(".png")) return "image/png";
  return "image/jpeg";
}
