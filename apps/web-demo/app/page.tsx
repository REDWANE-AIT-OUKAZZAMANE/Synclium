"use client";

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
  SunIcon,
  MoonIcon,
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
    tagColor: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  },
  {
    value: "ubl",
    label: "UBL 2.1 / PEPPOL BIS Billing 3.0",
    sublabel: "ISO/IEC 19845 · European standard e-invoice",
    tag: "UBL",
    tagColor: "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20",
  },
  {
    value: "facturx",
    label: "Factur-X / ZUGFeRD 2.2 (CII)",
    sublabel: "EN16931 · France & Germany CrossIndustryInvoice",
    tag: "CII",
    tagColor: "bg-purple-500/10 text-purple-500 border border-purple-500/20",
  },
  {
    value: "zatca",
    label: "ZATCA Fatoora Phase 2 (KSA)",
    sublabel: "Saudi Arabia Tax and Customs Clearance XML",
    tag: "KSA",
    tagColor: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
  },
  {
    value: "canonical",
    label: "Canonical JSON AST",
    sublabel: "Universal intermediate invoice hub schema",
    tag: "JSON",
    tagColor: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
  },
];

const TARGET_OPTIONS: DropdownOption<FormatId>[] = [
  {
    value: "ubl",
    label: "UBL 2.1 (PEPPOL BIS Billing 3.0)",
    sublabel: "Compile to ISO/IEC 19845 XML",
    tag: "UBL",
    tagColor: "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20",
  },
  {
    value: "facturx",
    label: "Factur-X / ZUGFeRD (CII)",
    sublabel: "Compile to EN16931 CrossIndustryInvoice XML",
    tag: "CII",
    tagColor: "bg-purple-500/10 text-purple-500 border border-purple-500/20",
  },
  {
    value: "zatca",
    label: "Saudi ZATCA Phase 2 XML",
    sublabel: "Compile to KSA VAT compliant electronic invoice",
    tag: "KSA",
    tagColor: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
  },
  {
    value: "canonical",
    label: "Canonical JSON (Hub)",
    sublabel: "Generate intermediate unified JSON object",
    tag: "JSON",
    tagColor: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
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
  const [resetCountdown, setResetCountdown] = useState<string>("");
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  
  // Turnstile challenge token & ref
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";
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

  // Fetch initial sample data and query rate-limit status
  const refreshQuota = useCallback(() => {
    fetch("/api/extract", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.remaining === "number") {
          setQuotaRemaining(d.remaining);
          setQuotaLimit(d.limit || 1);
          setQuotaTier(d.tier || "anon");
          if (d.resetInSec) {
            const h = Math.floor(d.resetInSec / 3600);
            const m = Math.floor((d.resetInSec % 3600) / 60);
            setResetCountdown(h > 0 ? `${h}h ${m}m` : `${m}m`);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/samples")
      .then((r) => r.json())
      .then((d) => setSamples(d.samples ?? {}))
      .catch(() => {});

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
      } catch {}
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
    <div className={`min-h-screen ${theme === "dark" ? "grid-bg-dark" : "grid-bg-light"}`}>
      {/* Top Status & Telemetry Header */}
      <header className="sticky top-0 z-40 border-b border-slate-300 dark:border-[#21262d] bg-white/95 dark:bg-[#07090e]/95 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Synclium Logo"
                className="h-7 w-auto object-contain rounded-md drop-shadow-sm"
              />
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  SYNCLIUM
                </span>
                <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                  BRIDGE_CORE_v1.0
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 border-l border-slate-300 dark:border-[#21262d] pl-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] text-slate-700 dark:text-slate-300">
                PEPPOL BIS 3.0
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] text-slate-700 dark:text-slate-300">
                EN16931 / CII
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] text-slate-700 dark:text-slate-300">
                ZATCA Phase 2
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* GitHub Authenticated Tier Badge */}
            {isAuth && (
              <div className="h-8 px-3 inline-flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] font-mono text-xs text-slate-700 dark:text-slate-300">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-slate-500 dark:text-slate-400">Scans:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {quotaRemaining}/{quotaLimit}
                </span>
                {resetCountdown && (
                  <span className="hidden md:inline text-[10px] text-slate-400">
                    (resets in {resetCountdown})
                  </span>
                )}
              </div>
            )}

            {/* GitHub Authentication Controls */}
            {authStatus === "loading" ? (
              <div className="h-8 px-3 inline-flex items-center rounded-lg bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] font-mono text-xs text-slate-400">
                ...
              </div>
            ) : isAuth ? (
              <div className="h-8 px-2.5 inline-flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d]">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={20}
                    height={20}
                    className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 object-cover shrink-0"
                  />
                ) : null}
                <span className="hidden sm:inline font-mono text-xs text-slate-700 dark:text-slate-300 font-semibold">
                  {(session.user as any).login || session.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="h-5 px-1.5 inline-flex items-center rounded bg-slate-200 dark:bg-[#21262d] hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 font-mono text-[10px] text-slate-600 dark:text-slate-400 transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("github")}
                className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
              >
                <span>Sign in (3 Free Scans)</span>
              </button>
            )}

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] text-slate-700 dark:text-slate-300 hover:text-blue-500 hover:border-blue-500/40 transition-colors"
            >
              {theme === "dark" ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            </button>

            {/* Repository Link */}
            <a
              href="https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium"
              target="_blank"
              rel="noreferrer"
              className="h-8 px-3 hidden sm:inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold hover:border-blue-500 transition-colors"
            >
              <span>GitHub</span>
              <ExternalLinkIcon className="w-3 h-3 opacity-75" />
            </a>
          </div>
        </div>
      </header>

      {/* Upgrade Banner for Anonymous Users Hit Limit */}
      {showUpgradeModal && !isAuth && (
        <div className="bg-gradient-to-r from-blue-900/90 to-purple-900/90 border-b border-blue-500/30 px-4 py-3 text-white text-center font-mono text-xs flex flex-wrap items-center justify-center gap-3">
          <span>You have reached your 1 free daily scan. Sign in with GitHub to unlock 3 scans/day!</span>
          <button
            onClick={() => signIn("github")}
            className="px-3 py-1 rounded bg-white text-slate-900 font-bold hover:bg-slate-100 transition-colors shadow"
          >
            Sign in with GitHub
          </button>
          <button
            onClick={() => setShowUpgradeModal(false)}
            className="text-slate-300 hover:text-white underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split-Screen Technical Workbench */}
      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Ingestion Pipeline & Execution Controls (5 Cols) */}
        <section className="xl:col-span-5 flex flex-col gap-5">
          {/* Ingestion Box */}
          <div className="surface-card rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#21262d]">
              <div className="flex items-center gap-2">
                <FileCodeIcon className="w-4 h-4 text-blue-500" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Ingestion Payload
                </h2>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#161b22] text-slate-500 dark:text-slate-400">
                In-Memory Streaming
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
              className={`mt-4 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all ${
                dragging
                  ? "border-blue-500 bg-blue-500/10"
                  : !isAuth
                  ? "border-blue-500/40 bg-blue-50/40 dark:bg-blue-950/10 hover:border-blue-500 hover:bg-blue-500/5"
                  : "border-slate-300 dark:border-[#30363d] bg-slate-50/50 dark:bg-[#05070a] hover:border-blue-500"
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
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    <LockIcon className="w-5 h-5" />
                  </div>

                  <p className="mt-3 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                    SIGN IN TO UPLOAD & EXTRACT INVOICES
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                    Click to sign in with GitHub for 3 free daily scans
                  </p>
                </>
              ) : (
                <>
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    {busy ? (
                      <RefreshCwIcon className="w-5 h-5 animate-spin text-blue-500" />
                    ) : (
                      <UploadCloudIcon className="w-5 h-5" />
                    )}
                  </div>

                  <p className="mt-3 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                    {busy === "extract"
                      ? "EXTRACTING DOCUMENT..."
                      : busy === "convert"
                      ? "TRANSPILING DIALECT..."
                      : busy === "validate"
                      ? "RUNNING SCHEMATRON VALIDATION..."
                      : "DROP INVOICE PAYLOAD (PDF, XML, JSON, TXT)"}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    Native binary PDF / scan ingestion + XML / JSON schema detection
                  </p>
                </>
              )}
            </div>

            {/* Active Payload Tag */}
            {fileName && (
              <div className="mt-3 flex items-center justify-between p-2 rounded bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] font-mono text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate">
                  <FileTextIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span className="truncate">{fileName}</span>
                </div>
                <button
                  onClick={() => {
                    setInput("");
                    setFileName("");
                    reset();
                  }}
                  className="text-[11px] text-red-500 hover:underline flex-shrink-0 ml-2"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Quick Production Test Payloads */}
          <div className="surface-card rounded-xl p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-[#21262d]">
              <LayersIcon className="w-4 h-4 text-emerald-500" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Production Test Cases
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
                  className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-[#21262d] bg-slate-50/50 dark:bg-[#05070a] hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-500">
                      {s.label}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#161b22] text-slate-600 dark:text-slate-400 uppercase">
                      {s.format}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {s.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Pipeline Transformation Controls with Custom Dropdowns */}
          <div className="surface-card rounded-xl p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-[#21262d]">
              <GaugeIcon className="w-4 h-4 text-blue-500" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Transformation Pipeline
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
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#21262d] flex flex-col items-center justify-center min-h-[65px]">
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
                disabled={isAuth && (!input.trim() && !fileRef.current?.value) || busy !== ""}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 font-mono text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
                onClick={() => void runValidate()}
                disabled={!input.trim() || busy !== ""}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 font-mono text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle2Icon className="w-3.5 h-3.5" />
                <span>Validate</span>
              </button>

              <button
                onClick={() => void runConvert()}
                disabled={!input.trim() || busy !== ""}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg border border-blue-600 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowRightLeftIcon className="w-3.5 h-3.5" />
                <span>Transpile</span>
              </button>
            </div>
          </div>

          {/* Operational Errors */}
          {error && (
            <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300 font-mono text-xs flex items-start gap-2.5">
              <XCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">ENGINE_EXECUTION_ERROR</p>
                <p className="mt-1 opacity-90">{error}</p>
                {!isAuth && (
                  <button
                    onClick={() => signIn("github")}
                    className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-600 text-white font-bold hover:bg-red-500 transition-colors"
                  >
                    Sign in with GitHub for 3 Scans/Day
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Validation Diagnostics */}
          {validation && (
            <div
              className={`p-4 rounded-xl border font-mono text-xs ${
                validation.valid
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-current/20">
                <div className="flex items-center gap-2 font-bold">
                  {validation.valid ? (
                    <CheckCircle2Icon className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircleIcon className="w-4 h-4 text-red-500" />
                  )}
                  <span>{validation.valid ? "PASSED_SCHEMA_VALIDATION" : "VALIDATION_FAILED"}</span>
                </div>
                {validation.format && <span className="opacity-75">SCHEMA: {validation.format}</span>}
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
        <section className="xl:col-span-7 flex flex-col gap-4">
          <div className="surface-card rounded-xl overflow-hidden flex flex-col h-full min-h-[660px]">
            {/* Editor Workspace Tab Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#21262d] bg-slate-50 dark:bg-[#05070a] px-3 pt-2">
              <div className="flex items-center gap-1 font-mono text-xs">
                <button
                  onClick={() => setActiveTab("editor")}
                  className={`px-3.5 py-2 rounded-t-lg font-bold transition-colors ${
                    activeTab === "editor"
                      ? "bg-white dark:bg-[#0d1117] text-blue-600 dark:text-blue-400 border-t-2 border-t-blue-500 border-x border-slate-200 dark:border-[#21262d]"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Raw Ingestion Buffer
                </button>

                <button
                  onClick={() => setActiveTab("canonical")}
                  disabled={!canonicalOut}
                  className={`px-3.5 py-2 rounded-t-lg font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    activeTab === "canonical"
                      ? "bg-white dark:bg-[#0d1117] text-blue-600 dark:text-blue-400 border-t-2 border-t-blue-500 border-x border-slate-200 dark:border-[#21262d]"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Canonical Hub AST
                </button>

                <button
                  onClick={() => setActiveTab("compiled")}
                  disabled={!convertedOut}
                  className={`px-3.5 py-2 rounded-t-lg font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    activeTab === "compiled"
                      ? "bg-white dark:bg-[#0d1117] text-blue-600 dark:text-blue-400 border-t-2 border-t-blue-500 border-x border-slate-200 dark:border-[#21262d]"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Compiled Target ({to.toUpperCase()})
                </button>
              </div>

              {/* View Switcher & Action Toolbar */}
              <div className="flex items-center gap-2 pb-2">
                {/* View Mode Switcher (Code vs Visual Summary) */}
                {parsedInvoiceObj && (
                  <div className="flex items-center rounded-lg border border-slate-300 dark:border-[#30363d] bg-slate-100 dark:bg-[#161b22] p-0.5">
                    <button
                      onClick={() => setViewMode("code")}
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold flex items-center gap-1 transition-all ${
                        viewMode === "code"
                          ? "bg-white dark:bg-[#0d1117] text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      <Code2Icon className="w-3 h-3" /> Code
                    </button>
                    <button
                      onClick={() => setViewMode("visual")}
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold flex items-center gap-1 transition-all ${
                        viewMode === "visual"
                          ? "bg-white dark:bg-[#0d1117] text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      <EyeIcon className="w-3 h-3" /> Visual
                    </button>
                  </div>
                )}

                <CopyButton content={activeContent} />

                <button
                  onClick={handleDownload}
                  disabled={!activeContent}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200 dark:bg-[#161b22] border border-slate-300 dark:border-[#30363d] font-mono text-[11px] text-slate-700 dark:text-slate-300 hover:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <DownloadIcon className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Code Matrix Body or Visual Inspection Summary */}
            <div className="flex-1 p-4 bg-white dark:bg-[#0d1117] flex flex-col justify-between">
              {viewMode === "visual" && parsedInvoiceObj ? (
                <div className="max-h-[580px] overflow-auto">
                  <InvoiceSummaryView data={parsedInvoiceObj} />
                </div>
              ) : activeTab === "editor" ? (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste or drop invoice XML, Canonical JSON, or messy OCR plaintext stream here..."
                  className="w-full h-full min-h-[560px] bg-transparent font-mono text-xs leading-relaxed text-slate-800 dark:text-[#c9d1d9] outline-none resize-none"
                  spellCheck={false}
                />
              ) : activeTab === "canonical" ? (
                <pre className="w-full h-full min-h-[560px] overflow-auto font-mono text-xs leading-relaxed text-slate-800 dark:text-[#58a6ff]">
                  {canonicalOut || "// Run AI Extraction or Conversion to populate Canonical AST"}
                </pre>
              ) : (
                <pre className="w-full h-full min-h-[560px] overflow-auto font-mono text-xs leading-relaxed text-slate-800 dark:text-[#7ee787]">
                  {convertedOut || "// Transpile payload to generate target e-invoicing XML"}
                </pre>
              )}

              {/* Editor Telemetry Status Footer */}
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-[#21262d] flex items-center justify-between font-mono text-[10px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-4">
                  <span>LINES: {lineCount}</span>
                  <span>BYTES: {byteSize.toLocaleString()} B</span>
                  <span>ENCODING: UTF-8</span>
                </div>
                <div>
                  <span>DIALECT: {activeTab === "editor" ? from.toUpperCase() : activeTab === "canonical" ? "CANONICAL_JSON" : to.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-slate-300 dark:border-[#21262d] py-6 bg-slate-100 dark:bg-[#05070a] font-mono text-xs text-slate-500 dark:text-slate-400">
        <div className="mx-auto max-w-[1600px] px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Synclium" className="h-5 w-auto object-contain rounded opacity-80" />
            <span className="font-bold text-slate-800 dark:text-slate-200">SYNCLIUM</span>
            <span>// Universal Electronic Invoicing Bridge</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>UBL 2.1 ISO/IEC 19845</span>
            <span>•</span>
            <span>EN16931 CII</span>
            <span>•</span>
            <span>ZATCA 2024 Phase 2</span>
            <span>•</span>
            <a
              href="https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              MIT Open Source
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
      className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200 dark:bg-[#161b22] border border-slate-300 dark:border-[#30363d] font-mono text-[11px] text-slate-700 dark:text-slate-300 hover:border-blue-500 disabled:opacity-40"
    >
      {copied ? <CheckIcon className="w-3 h-3 text-emerald-500" /> : <CopyIcon className="w-3 h-3" />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function guessMime(name: string): string {
  if (name.toLowerCase().endsWith(".pdf")) return "application/pdf";
  if (name.toLowerCase().endsWith(".png")) return "image/png";
  if (name.toLowerCase().endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
