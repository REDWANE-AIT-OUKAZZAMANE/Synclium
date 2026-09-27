"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
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
  ShieldCheckIcon,
  GaugeIcon,
  LayersIcon,
  ExternalLinkIcon,
  EyeIcon,
  Code2Icon,
  TableIcon,
  LockIcon,
} from "@/components/Icons";
import { CustomDropdown, DropdownOption } from "@/components/CustomDropdown";
import { InvoiceSummaryView } from "@/components/InvoiceSummaryView";
import { ConfidenceTable } from "@/components/ConfidenceTable";

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
  invoice: any;
  remaining?: number;
  tier?: "anon" | "auth";
}

const SOURCE_OPTIONS: DropdownOption<"auto" | FormatId>[] = [
  {
    value: "auto",
    label: "Auto-Detect Schema Signature",
    sublabel: "Inspects root XML namespace or JSON structure",
    tag: "AUTO",
    tagColor: "border-ink-600 text-paper-dim",
  },
  {
    value: "ubl",
    label: "UBL 2.1 / PEPPOL BIS Billing 3.0",
    sublabel: "ISO/IEC 19845 · European standard e-invoice",
    tag: "UBL",
    tagColor: "border-paper-dim text-paper",
  },
  {
    value: "facturx",
    label: "Factur-X / ZUGFeRD 2.2 (CII)",
    sublabel: "EN16931 · France & Germany CrossIndustryInvoice",
    tag: "CII",
    tagColor: "border-protocol text-protocol",
  },
  {
    value: "zatca",
    label: "ZATCA Fatoora Phase 2 (KSA)",
    sublabel: "Saudi Arabia Tax and Customs Clearance XML",
    tag: "KSA",
    tagColor: "border-signal text-signal",
  },
  {
    value: "canonical",
    label: "Canonical JSON AST",
    sublabel: "Universal intermediate invoice hub schema",
    tag: "JSON",
    tagColor: "border-signal text-signal",
  },
];

const TARGET_OPTIONS: DropdownOption<FormatId>[] = [
  {
    value: "ubl",
    label: "UBL 2.1 (PEPPOL BIS Billing 3.0)",
    sublabel: "Compile to ISO/IEC 19845 XML",
    tag: "UBL",
    tagColor: "border-paper-dim text-paper",
  },
  {
    value: "facturx",
    label: "Factur-X / ZUGFeRD (CII)",
    sublabel: "Compile to EN16931 CrossIndustryInvoice XML",
    tag: "CII",
    tagColor: "border-protocol text-protocol",
  },
  {
    value: "zatca",
    label: "Saudi ZATCA Phase 2 XML",
    sublabel: "Compile to KSA VAT compliant electronic invoice",
    tag: "KSA",
    tagColor: "border-signal text-signal",
  },
  {
    value: "canonical",
    label: "Canonical JSON (Hub)",
    sublabel: "Generate intermediate unified JSON object",
    tag: "JSON",
    tagColor: "border-signal text-signal",
  },
];

// Fictional production test cases
const REAL_WORLD_SAMPLES = [
  {
    id: "de-rail",
    format: "facturx",
    label: "Nordwind Transit Systems GmbH ➔ Europa Rail Networks AG",
    desc: "German EN16931 / CII cross-border rail infrastructure invoice (€142,500.00)",
  },
  {
    id: "fr-energy",
    format: "ubl",
    label: "Voltrix Energy Solutions SAS ➔ TransHexagone Rail SA",
    desc: "French PEPPOL BIS Billing 3.0 commercial electricity dispatch (€84,200.00)",
  },
  {
    id: "sa-dairy",
    format: "zatca",
    label: "Al-Manar Agro-Industries CJSC ➔ HyperGulf Retail LLC",
    desc: "Saudi ZATCA Phase 2 standard tax invoice with 15% VAT (SAR 218,500.00)",
  },
];

export default function WorkbenchPage() {
  const { data: session, status: authStatus } = useSession();
  const isAuth = !!session?.user;
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [input, setInput] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [from, setFrom] = useState<"auto" | FormatId>("auto");
  const [to, setTo] = useState<FormatId>("ubl");
  const [dragging, setDragging] = useState(false);

  const [canonicalOut, setCanonicalOut] = useState<string>("");
  const [convertedOut, setConvertedOut] = useState<string>("");
  const [parsedInvoiceObj, setParsedInvoiceObj] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "canonical" | "compiled">("editor");
  const [viewMode, setViewMode] = useState<"code" | "visual">("code");

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

  // Rate-limiting state
  const [quotaRemaining, setQuotaRemaining] = useState<number>(1);
  const [quotaLimit, setQuotaLimit] = useState<number>(1);
  const [quotaTier, setQuotaTier] = useState<"anon" | "auth">("anon");
  const [resetTargetTime, setResetTargetTime] = useState<number | null>(null);
  const [resetCountdown, setResetCountdown] = useState<string>("");
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  // Turnstile challenge token & ref
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";
  const fileRef = useRef<HTMLInputElement>(null);

  // Console is dark-only: the Synclium identity lives on #07090C.
  useEffect(() => {
    setTheme("dark");
    localStorage.setItem("synclium-theme", "dark");
    document.documentElement.classList.add("dark");
  }, []);

  // Fetch initial sample data and query rate-limit status
  const refreshQuota = useCallback(() => {
    fetch("/api/extract", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.remaining === "number") {
          setQuotaRemaining(d.remaining);
          setQuotaLimit(d.limit || 1);
          setQuotaTier(d.tier || "anon");
          if (typeof d.resetInSec === "number" && d.resetInSec > 0 && (d.used > 0 || d.remaining < (d.limit || 1) || d.resetInSec < 14400)) {
            setResetTargetTime(Date.now() + d.resetInSec * 1000);
          } else {
            setResetTargetTime(null);
            setResetCountdown("");
          }
        }
      })
      .catch(() => { });
  }, []);

  // Live 1-second countdown ticker
  useEffect(() => {
    if (!resetTargetTime) {
      setResetCountdown("");
      return;
    }

    const tick = () => {
      const now = Date.now();
      const diffMs = resetTargetTime - now;
      const diffSec = Math.max(0, Math.ceil(diffMs / 1000));

      if (diffSec <= 0) {
        setResetCountdown("");
        setResetTargetTime(null);
        refreshQuota();
        return;
      }

      const h = Math.floor(diffSec / 3600);
      const m = Math.floor((diffSec % 3600) / 60);
      const s = diffSec % 60;

      if (h > 0) {
        setResetCountdown(`${h}h ${m}m ${s < 10 ? "0" : ""}${s}s`);
      } else if (m > 0) {
        setResetCountdown(`${m}m ${s < 10 ? "0" : ""}${s}s`);
      } else {
        setResetCountdown(`${s}s`);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [resetTargetTime, refreshQuota]);

  useEffect(() => {
    fetch("/api/samples")
      .then((r) => r.json())
      .then((d) => setSamples(d.samples ?? {}))
      .catch(() => { });

    refreshQuota();
  }, [refreshQuota, session]);

  // Update parsed object whenever canonical output changes
  useEffect(() => {
    if (canonicalOut) {
      try {
        setParsedInvoiceObj(JSON.parse(canonicalOut));
      } catch {
        setParsedInvoiceObj(null);
      }
    } else {
      setParsedInvoiceObj(null);
    }
  }, [canonicalOut]);

  const reset = () => {
    setError("");
    setValidation(null);
    setExtractReport(null);
  };

  const loadFile = useCallback(
    async (file: File) => {
      if (!isAuth) {
        signIn("github");
        return;
      }
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
      setActiveTab("editor");
    },
    [isAuth],
  );

  const runExtract = async (fileOrText?: File | string) => {
    if (!isAuth) {
      signIn("github");
      return;
    }
    setBusy("extract");
    reset();
    try {
      let contentBase64: string;
      let mimeType: string;
      let filename: string;
      if (typeof fileOrText === "string") {
        contentBase64 = btoa(unescape(encodeURIComponent(fileOrText)));
        mimeType = "text/plain";
        filename = fileName || "input-stream.txt";
      } else if (fileOrText instanceof File) {
        const buf = await fileOrText.arrayBuffer();
        let binary = "";
        const bytes = new Uint8Array(buf);
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        contentBase64 = btoa(binary);
        mimeType = fileOrText.type || guessMime(fileOrText.name);
        filename = fileOrText.name;
      } else {
        throw new Error("No payload provided for extraction");
      }

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(turnstileToken ? { "x-turnstile-token": turnstileToken } : {}),
        },
        body: JSON.stringify({
          contentBase64,
          mimeType,
          filename,
          turnstileToken,
        }),
      });

      const data = await res.json();
      if (typeof data.remaining === "number") {
        setQuotaRemaining(data.remaining);
        setQuotaLimit(data.limit || 1);
        setQuotaTier(data.tier || "anon");
        if (typeof data.resetInSec === "number" && data.resetInSec > 0) {
          setResetTargetTime(Date.now() + data.resetInSec * 1000);
        }
      }

      if (res.status === 429) {
        if (data.upgradeAvailable) {
          setShowUpgradeModal(true);
        }
        throw new Error(data.error || "Rate limit reached for today.");
      }

      if (res.status === 503) {
        throw new Error(data.error || "Rate limit service temporarily unavailable. Please retry.");
      }

      if (!res.ok) throw new Error(data.error || `Extraction failed (${res.status})`);

      setExtractReport(data);
      const canon = JSON.stringify(data.invoice, null, 2);
      setCanonicalOut(canon);
      setInput(canon);
      setParsedInvoiceObj(data.invoice);
      setFileName(`${filename} -> Parsed Canonical AST`);
      setTo("ubl");
      setActiveTab("canonical");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
      try {
        turnstileRef.current?.reset();
      } catch { }
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
      setActiveTab("compiled");
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

  const handleDownload = () => {
    if (!activeContent) return;

    let ext = "xml";
    let mime = "application/xml;charset=utf-8";

    if (activeTab === "canonical") {
      ext = "json";
      mime = "application/json;charset=utf-8";
    } else if (activeTab === "compiled") {
      if (to === "canonical") {
        ext = "json";
        mime = "application/json;charset=utf-8";
      } else {
        ext = "xml";
        mime = "application/xml;charset=utf-8";
      }
    } else {
      // Raw Ingestion Buffer tab
      const trimmed = activeContent.trimStart();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        ext = "json";
        mime = "application/json;charset=utf-8";
      } else if (trimmed.startsWith("<")) {
        ext = "xml";
        mime = "application/xml;charset=utf-8";
      } else {
        ext = "txt";
        mime = "text/plain;charset=utf-8";
      }
    }

    const cleanBase = (fileName || "invoice")
      .replace(/\s*->\s*.*$/, "")
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_");

    const downloadName = `synclium-${cleanBase}-${activeTab}.${ext}`;

    const blob = new Blob([activeContent], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const activeContent =
    activeTab === "editor" ? input : activeTab === "canonical" ? canonicalOut : convertedOut;
  const lineCount = activeContent ? activeContent.split("\n").length : 0;
  const byteSize = activeContent ? new Blob([activeContent]).size : 0;

  return (
    <div className="min-h-screen bg-ink-950 pt-11 font-mono text-paper">
      {/* System bar — border-control chrome, auth + quota preserved */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-ink-700 bg-ink-950">
        <div className="mx-auto flex h-11 max-w-[1200px] items-center gap-3 px-4 text-[11px]">
          <Link href="/" className="flex items-center gap-2" aria-label="Synclium home">
            <img src="/logo.png" alt="Synclium" className="h-6 w-auto" />
            <span className="font-bold tracking-[0.18em] text-paper">SYNCLIUM</span>
            <span className="border border-ink-600 px-1.5 py-px text-[9px] tracking-[0.18em] text-paper-dim">CONSOLE</span>
          </Link>

          <nav className="ml-2 hidden items-center gap-3 text-paper-dim md:flex" aria-label="Console">
            <Link href="/" className="hover:text-signal">← JOURNEY</Link>
            <Link href="/docs" className="hover:text-signal">DOCS</Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Authenticated scan quota */}
            {isAuth && (
              <div className="inline-flex h-7 items-center gap-2 border border-ink-600 px-2.5 text-[11px] text-paper-dim">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-protocol" />
                <span>SCANS</span>
                <span className="font-bold text-paper">
                  {quotaRemaining}/{quotaLimit}
                </span>
                {resetCountdown ? (
                  <span className="hidden text-[10px] text-paper-faint md:inline">
                    ({resetCountdown})
                  </span>
                ) : (
                  <span className="hidden text-[10px] text-paper-faint md:inline">(4H WINDOW)</span>
                )}
              </div>
            )}

            {/* GitHub Authentication Controls */}
            {authStatus === "loading" ? (
              <div className="inline-flex h-7 items-center border border-ink-600 px-3 text-[11px] text-paper-faint">
                …
              </div>
            ) : isAuth ? (
              <div className="inline-flex h-7 items-center gap-2 border border-ink-600 px-2">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={20}
                    height={20}
                    className="h-5 w-5 shrink-0 border border-ink-600 object-cover"
                  />
                ) : null}
                <span className="hidden font-mono text-[11px] font-semibold text-paper sm:inline">
                  {(session.user as any).login || session.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="inline-flex h-5 items-center px-1.5 font-mono text-[10px] text-paper-dim hover:text-signal"
                >
                  SIGN OUT
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("github")}
                className="inline-flex h-7 items-center bg-signal px-3 text-[11px] font-bold text-ink-950 hover:bg-signal-hot"
              >
                SIGN IN · 3 SCANS / 4H
              </button>
            )}

            {/* Repository Link */}
            <a
              href="https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium"
              target="_blank"
              rel="noreferrer"
              className="hidden h-7 items-center border border-ink-600 px-2.5 text-[11px] text-paper-dim hover:border-signal hover:text-signal sm:inline-flex"
            >
              <span>GITHUB</span>
              <ExternalLinkIcon className="h-3 w-3 opacity-75" />
            </a>
          </div>
        </div>
      </header>

      {/* Quota strip for anonymous users at limit */}
      {showUpgradeModal && !isAuth && (
        <div className="border-b border-signal bg-signal/10 px-4 py-3 text-center font-mono text-xs text-paper">
          <span>QUOTA EXHAUSTED — 1 FREE SCAN USED. SIGN IN WITH GITHUB FOR 3 SCANS / 4H.</span>
          <button
            onClick={() => signIn("github")}
            className="ml-3 bg-signal px-3 py-1 font-bold text-ink-950 hover:bg-signal-hot"
          >
            SIGN IN
          </button>
          <button
            onClick={() => setShowUpgradeModal(false)}
            className="ml-2 text-paper-dim underline hover:text-paper"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Inspection deck */}
      <main className="px-4 pb-6 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
        <div className="mt-6 border border-ink-700 bg-ink-900 px-6 py-10">
          <div className="h-[3px] w-24 bg-signal" aria-hidden />
          <p className="mt-4 font-mono text-[11px] tracking-[0.28em] text-protocol">BORDER INSPECTION DECK // IN-MEMORY · ZERO DISK WRITE</p>
          <h1 className="mt-3 font-editorial text-4xl leading-[1.0] text-paper sm:text-6xl">
            Drop an invoice. Watch it clear.
          </h1>
          <p className="mt-3 max-w-2xl font-mono text-[13px] leading-relaxed text-paper-dim">
            Convert, validate, and AI-extract across UBL 2.1, Factur-X CII, and ZATCA Phase 2 —
            through the canonical hub, inside this chamber.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-12 gap-px border border-ink-700 bg-ink-700">
        {/* Left Column: Ingestion Pipeline & Execution Controls (5 Cols) */}
        <section className="flex flex-col gap-px bg-ink-950 xl:col-span-5">
          {/* Ingestion Box */}
          <div className="syn-panel p-5">
            <div className="flex items-center justify-between border-b border-ink-700 pb-3">
              <div className="flex items-center gap-2">
                <FileCodeIcon className="h-4 w-4 text-signal" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper">
                  Ingestion Payload
                </h2>
              </div>
              <span className="border border-ink-600 px-2 py-0.5 font-mono text-[10px] text-paper-faint">
                IN-MEMORY STREAM
              </span>
            </div>

            {/* Precision Drop Target */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (!isAuth) {
                  signIn("github");
                  return;
                }
                const f = e.dataTransfer.files?.[0];
                if (f) void loadFile(f);
              }}
              onClick={() => {
                if (!isAuth) {
                  signIn("github");
                  return;
                }
                fileRef.current?.click();
              }}
              className={`mt-4 cursor-pointer border-2 border-dashed p-6 text-center transition-colors ${dragging
                  ? "border-signal bg-signal/10"
                  : !isAuth
                    ? "border-signal/60 bg-signal/5 hover:border-signal hover:bg-signal/10"
                    : "border-ink-600 bg-ink-950 hover:border-signal"
                }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xml,.json,.txt,.pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => {
                  if (!isAuth) {
                    signIn("github");
                    return;
                  }
                  const f = e.target.files?.[0];
                  if (f) void loadFile(f);
                }}
              />

              {!isAuth ? (
                <>
                  <div className="mx-auto flex h-10 w-10 items-center justify-center border border-signal/60 bg-signal/10 text-signal">
                    <LockIcon className="h-5 w-5" />
                  </div>

                  <p className="mt-3 font-mono text-xs font-bold text-paper">
                    SIGN IN TO UPLOAD + EXTRACT
                  </p>
                  <p className="mt-1 font-mono text-[11px] font-semibold text-signal">
                    GitHub sign-in · 3 free scans / 4h
                  </p>
                </>
              ) : (
                <>
                  <div className="mx-auto flex h-10 w-10 items-center justify-center border border-ink-600 bg-ink-950 text-signal">
                    {busy ? (
                      <RefreshCwIcon className="h-5 w-5 animate-spin text-signal" />
                    ) : (
                      <UploadCloudIcon className="h-5 w-5" />
                    )}
                  </div>

                  <p className="mt-3 font-mono text-xs font-bold text-paper">
                    {busy === "extract"
                      ? "EXTRACTING DOCUMENT…"
                      : busy === "convert"
                        ? "TRANSPILING DIALECT…"
                        : busy === "validate"
                          ? "RUNNING VALIDATION GATES…"
                          : "DROP INVOICE PAYLOAD · PDF XML JSON TXT"}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-paper-faint">
                    Binary PDF + scan ingestion · XML / JSON signature sniffing
                  </p>
                </>
              )}
            </div>

            {/* Active Payload Tag */}
            {fileName && (
              <div className="mt-3 flex items-center justify-between border border-ink-600 bg-ink-950 p-2 font-mono text-xs">
                <div className="flex items-center gap-2 truncate text-paper">
                  <FileTextIcon className="h-3.5 w-3.5 flex-shrink-0 text-signal" />
                  <span className="truncate">{fileName}</span>
                </div>
                <button
                  onClick={() => {
                    setInput("");
                    setFileName("");
                    reset();
                  }}
                  className="ml-2 flex-shrink-0 text-[11px] text-signal hover:underline"
                >
                  CLEAR
                </button>
              </div>
            )}
          </div>

          {/* Border test fixtures */}
          <div className="syn-panel p-5">
            <div className="flex items-center gap-2 border-b border-ink-700 pb-3">
              <LayersIcon className="h-4 w-4 text-protocol" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper">
                Border Test Cases
              </h2>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {REAL_WORLD_SAMPLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    const sampleList = samples[s.format] ?? [];
                    const found = sampleList[0];
                    if (found) {
                      reset();
                      setInput(found.content);
                      setFileName(s.label);
                      setCanonicalOut("");
                      setConvertedOut("");
                      setActiveTab("editor");
                    }
                  }}
                  className="w-full border border-ink-700 bg-ink-950 p-3 text-left transition-colors hover:border-signal"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-paper">
                      {s.label}
                    </span>
                    <span className="border border-ink-600 px-1.5 py-0.5 font-mono text-[10px] uppercase text-paper-dim">
                      {s.format}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-paper-faint">
                    {s.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Pipeline Transformation Controls with Custom Dropdowns */}
          <div className="syn-panel p-5">
            <div className="flex items-center gap-2 border-b border-ink-700 pb-3">
              <GaugeIcon className="h-4 w-4 text-signal" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper">
                Crossing Controls
              </h2>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomDropdown<"auto" | FormatId>
                label="Source Dialect"
                value={from}
                options={SOURCE_OPTIONS}
                onChange={(val) => setFrom(val)}
              />

              <CustomDropdown<FormatId>
                label="Target Export"
                value={to}
                options={TARGET_OPTIONS}
                onChange={(val) => setTo(val)}
              />
            </div>

            {/* Cloudflare Turnstile Bot Challenge */}
            <div className="mt-4 flex min-h-[65px] flex-col items-center justify-center border-t border-ink-700 pt-3">
              <Turnstile
                ref={turnstileRef}
                siteKey={turnstileSiteKey}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken("")}
                onExpire={() => setTurnstileToken("")}
                options={{
                  theme: theme === "dark" ? "dark" : "light",
                  size: "flexible",
                }}
              />
            </div>

            {/* Action Bar */}
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <button
                onClick={() => {
                  if (!isAuth) {
                    signIn("github");
                    return;
                  }
                  void runExtract(input);
                }}
                disabled={isAuth ? ((!input.trim() && !fileRef.current?.value) || busy !== "") : false}
                className="flex cursor-pointer items-center justify-center gap-1.5 border border-ink-600 bg-ink-950 p-2.5 font-mono text-xs font-bold text-paper transition-colors hover:border-paper disabled:cursor-not-allowed disabled:opacity-40"
              >
                {!isAuth ? (
                  <>
                    <LockIcon className="w-3.5 h-3.5" />
                    <span>Sign in to Extract</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span>AI Extract</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (!isAuth) {
                    signIn("github");
                    return;
                  }
                  void runValidate();
                }}
                disabled={isAuth ? (!input.trim() || busy !== "") : false}
                className="flex cursor-pointer items-center justify-center gap-1.5 border border-protocol/60 bg-ink-950 p-2.5 font-mono text-xs font-bold text-protocol transition-colors hover:bg-protocol hover:text-ink-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {!isAuth ? (
                  <>
                    <LockIcon className="w-3.5 h-3.5" />
                    <span>Sign in to Validate</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2Icon className="w-3.5 h-3.5" />
                    <span>Validate</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (!isAuth) {
                    signIn("github");
                    return;
                  }
                  void runConvert();
                }}
                disabled={isAuth ? (!input.trim() || busy !== "") : false}
                className="flex cursor-pointer items-center justify-center gap-1.5 border border-signal bg-signal p-2.5 font-mono text-xs font-bold text-ink-950 transition-colors hover:bg-signal-hot disabled:cursor-not-allowed disabled:opacity-40"
              >
                {!isAuth ? (
                  <>
                    <LockIcon className="w-3.5 h-3.5 text-white/90" />
                    <span>Sign in to Transpile</span>
                  </>
                ) : (
                  <>
                    <ArrowRightLeftIcon className="w-3.5 h-3.5" />
                    <span>Transpile</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Operational Errors */}
          {error && (
            <div className="flex items-start gap-2.5 border border-red-500/60 bg-red-500/5 p-4 font-mono text-xs text-red-300">
              <XCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
              <div>
                <p className="font-bold tracking-[0.16em]">ENGINE FAULT</p>
                <p className="mt-1 opacity-90">{error}</p>
                {!isAuth && (
                  <button
                    onClick={() => signIn("github")}
                    className="mt-2 inline-flex items-center gap-1 bg-signal px-2.5 py-1 font-bold text-ink-950 hover:bg-signal-hot"
                  >
                    Sign in with GitHub for 3 Scans / 4h
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Validation Diagnostics */}
          {validation && (
            <div
              className={`border p-4 font-mono text-xs ${validation.valid
                  ? "border-protocol/60 bg-protocol/5 text-paper"
                  : "border-red-500/60 bg-red-500/5 text-red-200"
                }`}
            >
              <div className="flex items-center justify-between border-b border-ink-700 pb-2">
                <div className="flex items-center gap-2 font-bold tracking-[0.16em]">
                  {validation.valid ? (
                    <CheckCircle2Icon className="h-4 w-4 text-protocol" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-red-400" />
                  )}
                  <span>{validation.valid ? "GATES PASS — CLEARED" : "GATES FAIL — HELD"}</span>
                </div>
                {validation.format && <span className="text-paper-faint">SCHEMA {validation.format}</span>}
              </div>

              {validation.errors.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {validation.errors.map((e, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">[{e.path}]</span>
                      <span>{e.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* AI Extraction Confidence Matrix Component */}
          {extractReport && (
            <ConfidenceTable
              fieldConfidence={extractReport.fieldConfidence}
              overallConfidence={extractReport.overallConfidence}
              provider={extractReport.provider}
            />
          )}
        </section>

        {/* Right Column: Code Matrix & Executive Summary Inspector (7 Cols) */}
        <section className="flex flex-col gap-px bg-ink-950 xl:col-span-7">
          <div className="syn-panel flex h-full min-h-[660px] flex-col overflow-hidden">
            {/* Editor Workspace Tab Bar */}
            <div className="flex items-center justify-between border-b border-ink-700 bg-ink-900 px-3 pt-2">
              <div className="flex items-center gap-1 font-mono text-xs" role="tablist" aria-label="Buffer views">
                <button
                  onClick={() => setActiveTab("editor")}
                  role="tab"
                  aria-selected={activeTab === "editor"}
                  className={`px-3.5 py-2 font-bold transition-colors ${activeTab === "editor"
                      ? "bg-ink-950 text-signal border-t-2 border-t-signal border-x border-ink-700"
                      : "text-paper-faint hover:text-paper"
                    }`}
                >
                  INTAKE BUFFER
                </button>

                <button
                  onClick={() => setActiveTab("canonical")}
                  disabled={!canonicalOut}
                  role="tab"
                  aria-selected={activeTab === "canonical"}
                  className={`px-3.5 py-2 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${activeTab === "canonical"
                      ? "bg-ink-950 text-signal border-t-2 border-t-signal border-x border-ink-700"
                      : "text-paper-faint hover:text-paper"
                    }`}
                >
                  CANONICAL AST
                </button>

                <button
                  onClick={() => setActiveTab("compiled")}
                  disabled={!convertedOut}
                  role="tab"
                  aria-selected={activeTab === "compiled"}
                  className={`px-3.5 py-2 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${activeTab === "compiled"
                      ? "bg-ink-950 text-signal border-t-2 border-t-signal border-x border-ink-700"
                      : "text-paper-faint hover:text-paper"
                    }`}
                >
                  COMPILED {to.toUpperCase()}
                </button>
              </div>

              {/* View Switcher & Action Toolbar */}
              <div className="flex items-center gap-2 pb-2">
                {/* View Mode Switcher (Code vs Visual Summary) */}
                {parsedInvoiceObj && (
                  <div className="flex items-center border border-ink-600 bg-ink-950 p-0.5">
                    <button
                      onClick={() => setViewMode("code")}
                      className={`flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] font-bold transition-colors ${viewMode === "code"
                          ? "bg-ink-700 text-signal"
                          : "text-paper-faint hover:text-paper"
                        }`}
                    >
                      <Code2Icon className="h-3 w-3" /> CODE
                    </button>
                    <button
                      onClick={() => setViewMode("visual")}
                      className={`flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] font-bold transition-colors ${viewMode === "visual"
                          ? "bg-ink-700 text-signal"
                          : "text-paper-faint hover:text-paper"
                        }`}
                    >
                      <EyeIcon className="h-3 w-3" /> LEDGER
                    </button>
                  </div>
                )}

                <CopyButton content={activeContent} />

                <button
                  onClick={handleDownload}
                  disabled={!activeContent}
                  className="flex items-center gap-1 border border-ink-600 bg-ink-950 px-2.5 py-1 font-mono text-[11px] text-paper-dim hover:border-signal hover:text-signal disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <DownloadIcon className="h-3 w-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Code Matrix Body or Visual Inspection Summary */}
            <div className="flex flex-1 flex-col justify-between bg-ink-950 p-4">
              {viewMode === "visual" && parsedInvoiceObj ? (
                <div className="max-h-[580px] overflow-auto">
                  <InvoiceSummaryView data={parsedInvoiceObj} />
                </div>
              ) : activeTab === "editor" ? (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste or drop invoice XML, canonical JSON, or OCR text…"
                  className="h-full min-h-[560px] w-full resize-none bg-transparent font-mono text-xs leading-relaxed text-paper-dim outline-none placeholder:text-paper-faint focus:text-paper"
                  spellCheck={false}
                />
              ) : activeTab === "canonical" ? (
                <pre className="h-full min-h-[560px] w-full overflow-auto font-mono text-xs leading-relaxed text-protocol">
                  {canonicalOut || "// Run extraction or conversion to populate the canonical AST"}
                </pre>
              ) : (
                <pre className="h-full min-h-[560px] w-full overflow-auto font-mono text-xs leading-relaxed text-paper">
                  {convertedOut || "// Transpile to emit the target dialect"}
                </pre>
              )}

              {/* Editor Telemetry Status Footer */}
              <div className="mt-3 flex items-center justify-between border-t border-ink-700 pt-2 font-mono text-[10px] tracking-[0.12em] text-paper-faint">
                <div className="flex items-center gap-4">
                  <span>LINES {lineCount}</span>
                  <span>BYTES {byteSize.toLocaleString()}</span>
                  <span>UTF-8</span>
                </div>
                <div>
                  <span>DIALECT {activeTab === "editor" ? from.toUpperCase() : activeTab === "canonical" ? "CANONICAL" : to.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        </div>
        </div>
      </main>

      {/* Industrial Footer */}
      <footer className="mt-6 border border-ink-700 bg-ink-900 py-5 font-mono text-xs text-paper-faint">
        <div className="flex flex-col items-center justify-between gap-3 px-5 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Synclium" className="h-5 w-auto" />
            <span className="font-bold tracking-[0.18em] text-paper">SYNCLIUM</span>
            <span>— BORDER INSPECTION DECK</span>
          </div>

          <div className="flex items-center gap-3 text-[10px] tracking-[0.12em]">
            <span>UBL 2.1</span>
            <span className="text-signal">·</span>
            <span>EN16931 CII</span>
            <span className="text-signal">·</span>
            <span>ZATCA PHASE 2</span>
            <span className="text-signal">·</span>
            <a
              href="https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium"
              target="_blank"
              rel="noreferrer"
              className="text-protocol hover:underline"
            >
              MIT
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      disabled={!content}
      className="flex items-center gap-1 border border-ink-600 bg-ink-950 px-2.5 py-1 font-mono text-[11px] text-paper-dim hover:border-signal hover:text-signal disabled:opacity-40"
    >
      {copied ? <CheckIcon className="h-3 w-3 text-protocol" /> : <CopyIcon className="h-3 w-3" />}
      <span>{copied ? "COPIED" : "COPY"}</span>
    </button>
  );
}

function guessMime(name: string): string {
  if (name.toLowerCase().endsWith(".pdf")) return "application/pdf";
  if (name.toLowerCase().endsWith(".png")) return "image/png";
  if (name.toLowerCase().endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
