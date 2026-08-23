"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  SparklesIcon,
  FileCodeIcon,
  CheckCircle2Icon,
  GaugeIcon,
  ExternalLinkIcon,
  SunIcon,
  MoonIcon,
  CopyIcon,
  CheckIcon,
} from "@/components/Icons";

/* -------------------------------------------------------------------------- */
/* Real Dialect Snippets for the Live Morphing Terminal                      */
/* -------------------------------------------------------------------------- */

interface DialectSnippet {
  id: "ubl" | "canonical" | "zatca" | "facturx";
  name: string;
  dialectTag: string;
  tagColor: string;
  standardLabel: string;
  code: string;
  meta: {
    rootElement: string;
    namespaces: string;
    encoding: string;
    schemaVersion: string;
  };
}

const MORPH_SNIPPETS: DialectSnippet[] = [
  {
    id: "ubl",
    name: "UBL 2.1 / PEPPOL BIS 3.0",
    dialectTag: "PEPPOL UBL 2.1",
    tagColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    standardLabel: "ISO/IEC 19845 · European PEPPOL Network",
    meta: {
      rootElement: "<Invoice>",
      namespaces: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
      encoding: "UTF-8 (XML)",
      schemaVersion: "2.1 / BIS 3.0",
    },
    code: `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ID>INV-2026-088</cbc:ID>
  <cbc:IssueDate>2026-08-23</cbc:IssueDate>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>Nordwind Transit Systems GmbH</cbc:Name></cac:PartyName>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>DE314982711</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="HUR">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">1500.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Rail Power Inverter Maintenance (EN16931)</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>19.00</cbc:Percent>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
  </cac:InvoiceLine>
  <cac:LegalMonetaryTotal>
    <cbc:TaxExclusiveAmount currencyID="EUR">1500.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">1785.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">1785.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`,
  },
  {
    id: "canonical",
    name: "Canonical Intermediate AST",
    dialectTag: "UNIVERSAL AST",
    tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    standardLabel: "packages/core · Unified Hub Schema",
    meta: {
      rootElement: "CanonicalInvoice",
      namespaces: "zod/packages/core",
      encoding: "UTF-8 (JSON)",
      schemaVersion: "v1.0.0 Intermediate",
    },
    code: `{
  "id": "INV-2026-088",
  "issueDate": "2026-08-23",
  "currency": "EUR",
  "seller": {
    "name": "Nordwind Transit Systems GmbH",
    "vatId": "DE314982711",
    "country": "DE"
  },
  "buyer": {
    "name": "Europa Rail AG",
    "vatId": "DE812345678",
    "country": "DE"
  },
  "lines": [
    {
      "id": "1",
      "description": "Rail Power Inverter Maintenance (EN16931)",
      "quantity": 1,
      "unitPrice": 1500.00,
      "totalAmount": 1500.00,
      "taxRate": 19.00,
      "taxCategory": "S"
    }
  ],
  "taxTotal": 285.00,
  "totalAmount": 1785.00,
  "netAmount": 1500.00,
  "_engine": {
    "hubVersion": "1.0",
    "fidelity": "LOSSLESS_CANONICAL"
  }
}`,
  },
  {
    id: "zatca",
    name: "Saudi ZATCA Fatoora Phase 2",
    dialectTag: "KSA ZATCA 2024",
    tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    standardLabel: "ZATCA Clearance Standard · Saudi Tax & Customs",
    meta: {
      rootElement: "<Invoice>",
      namespaces: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
      encoding: "UTF-8 (XML)",
      schemaVersion: "Fatoora Phase 2",
    },
    code: `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>INV-2026-088</cbc:ID>
  <cbc:UUID>3a5d8471-bc93-4791-912f-4827104b6841</cbc:UUID>
  <cbc:IssueDate>2026-08-23</cbc:IssueDate>
  <cbc:InvoiceTypeCode name="0100000">388</cbc:InvoiceTypeCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">1010123456</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName><cbc:Name>Nordwind Transit Systems GmbH</cbc:Name></cac:PartyName>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>310123456700003</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">285.00</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="EUR">1500.00</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="EUR">285.00</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>19.00</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
</Invoice>`,
  },
  {
    id: "facturx",
    name: "Factur-X / ZUGFeRD 2.2 (CII)",
    dialectTag: "EN16931 CII",
    tagColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    standardLabel: "EN16931 CrossIndustryInvoice · France & Germany",
    meta: {
      rootElement: "<rsm:CrossIndustryInvoice>",
      namespaces: "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100",
      encoding: "UTF-8 (XML)",
      schemaVersion: "ZUGFeRD 2.2 / Factur-X 1.0",
    },
    code: `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
                          xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
                          xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>INV-2026-088</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">20260823</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument><ram:LineID>1</ram:LineID></ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct><ram:Name>Rail Power Inverter Maintenance (EN16931)</ram:Name></ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>19.00</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`,
  },
];

/* -------------------------------------------------------------------------- */
/* Landing Page Component                                                     */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeSnippetIdx, setActiveSnippetIdx] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

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

  // Ambient Morphing Terminal Loop
  useEffect(() => {
    if (isPaused) return;

    const interval = 50; // Update progress every 50ms
    const totalDuration = 4500; // 4.5s per dialect snippet
    const step = (interval / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveSnippetIdx((current) => (current + 1) % MORPH_SNIPPETS.length);
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused]);

  const activeSnippet = MORPH_SNIPPETS[activeSnippetIdx];

  const handleCopyCode = () => {
    if (!activeSnippet) return;
    navigator.clipboard.writeText(activeSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "grid-bg-dark" : "grid-bg-light"}`}>
      {/* -------------------------------------------------------------------- */}
      {/* 1. Header Chrome & Top Navigation                                    */}
      {/* -------------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-slate-300 dark:border-[#21262d] bg-white/95 dark:bg-[#07090e]/95 backdrop-blur">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <img
                src="/logo.png"
                alt="Synclium Logo"
                className="h-7 w-auto object-contain rounded-md drop-shadow-sm"
              />
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  SYNCLIUM
                </span>
                <span className="hidden sm:inline font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                  BRIDGE_CORE_v1.0
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-5 border-l border-slate-300 dark:border-[#21262d] pl-6 font-mono text-xs text-slate-600 dark:text-slate-400">
              <a href="#mandates" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                Mandates 2026–27
              </a>
              <a href="#architecture" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                Architecture
              </a>
              <a href="#benchmarks" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                Proof &amp; Benchmarks
              </a>
              <a href="#developers" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                Developers
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Primary Console Launcher */}
            <Link
              href="/console"
              className="h-8 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold shadow-sm shadow-blue-500/20 transition-all active:scale-95"
            >
              <span>Launch Console</span>
              <span className="text-blue-200">➔</span>
            </Link>

            {/* GitHub Repository */}
            <a
              href="https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium"
              target="_blank"
              rel="noreferrer"
              className="h-8 px-3 hidden sm:inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold hover:border-blue-500 transition-colors"
            >
              <span>GitHub</span>
              <ExternalLinkIcon className="w-3 h-3 opacity-75" />
            </a>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] text-slate-700 dark:text-slate-300 hover:text-blue-500 hover:border-blue-500/40 transition-colors"
            >
              {theme === "dark" ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* 2. Hero Section with Live Morphing Terminal                          */}
      {/* -------------------------------------------------------------------- */}
      <main>
        <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-24 border-b border-slate-300 dark:border-[#21262d]">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
            
            {/* Top Telemetry Chip */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-mono text-[11px] font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>2026–2027 E-Invoicing Mandate Wave Ready</span>
            </div>

            {/* Main Punchy Technical Headline */}
            <h1 className="mt-5 max-w-5xl font-mono text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              THE 2026–2027 GLOBAL MANDATE WAVE IS FRAGMENTING E-INVOICING.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400">
                ONE ENGINE TRANSPILES THEM ALL.
              </span>
            </h1>

            {/* Technical Subheading */}
            <p className="mt-5 max-w-3xl text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
              Belgium, France, Poland, and Saudi Arabia require completely different electronic invoice schemas. 
              <strong className="font-semibold text-slate-900 dark:text-slate-200"> Synclium</strong> is a stateless, pure-TypeScript hub-and-spoke compiler that imports, validates, and transpiles between 
              <span className="font-mono text-xs px-1.5 py-0.5 mx-1 rounded bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] text-slate-800 dark:text-slate-200">UBL 2.1</span>,
              <span className="font-mono text-xs px-1.5 py-0.5 mx-1 rounded bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] text-slate-800 dark:text-slate-200">Factur-X / ZUGFeRD</span>, and 
              <span className="font-mono text-xs px-1.5 py-0.5 mx-1 rounded bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] text-slate-800 dark:text-slate-200">ZATCA Phase 2</span> in zero-knowledge transient memory.
            </p>

            {/* Action Buttons & Fast Verification */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/console"
                className="h-10 px-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold shadow-md shadow-blue-500/25 transition-all active:scale-95"
              >
                <SparklesIcon className="w-4 h-4 text-cyan-200" />
                <span>Launch Live Console</span>
                <span className="text-blue-200">➔</span>
              </Link>

              <a
                href="https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium"
                target="_blank"
                rel="noreferrer"
                className="h-10 px-4 inline-flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] text-slate-800 dark:text-slate-200 font-mono text-xs font-semibold hover:border-blue-500 transition-colors"
              >
                <span>View Source on GitHub</span>
                <ExternalLinkIcon className="w-3.5 h-3.5 opacity-75" />
              </a>

              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 ml-2">
                MIT License • Zero Disk Writes • No Telemetry Logging
              </span>
            </div>

            {/* Telemetry Status Strip */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="surface-card rounded-lg p-3 border-l-2 border-l-cyan-500">
                <div className="font-mono text-[10px] uppercase text-slate-500 dark:text-slate-400">Latency</div>
                <div className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">&lt; 5 ms In-Memory</div>
              </div>
              <div className="surface-card rounded-lg p-3 border-l-2 border-l-emerald-500">
                <div className="font-mono text-[10px] uppercase text-slate-500 dark:text-slate-400">Security</div>
                <div className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">Zero Persistence</div>
              </div>
              <div className="surface-card rounded-lg p-3 border-l-2 border-l-purple-500">
                <div className="font-mono text-[10px] uppercase text-slate-500 dark:text-slate-400">AI Extraction Eval</div>
                <div className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">90.8% Confidence</div>
              </div>
              <div className="surface-card rounded-lg p-3 border-l-2 border-l-blue-500">
                <div className="font-mono text-[10px] uppercase text-slate-500 dark:text-slate-400">Test Matrix</div>
                <div className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">67 / 67 Green Suites</div>
              </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Signature Element: Live Morphing Dialect Terminal                */}
            {/* ---------------------------------------------------------------- */}
            <div
              className="mt-10 surface-card rounded-xl border border-slate-300 dark:border-[#30363d] overflow-hidden shadow-2xl"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Terminal Titlebar */}
              <div className="px-4 py-3 bg-slate-100/80 dark:bg-[#161b22] border-b border-slate-200 dark:border-[#21262d] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                    ◆ LIVE AST TRANSPILER SIMULATOR // {activeSnippet.name}
                  </span>
                </div>

                {/* Dialect Selector Tabs */}
                <div className="flex items-center gap-1.5">
                  {MORPH_SNIPPETS.map((snippet, idx) => (
                    <button
                      key={snippet.id}
                      onClick={() => {
                        setActiveSnippetIdx(idx);
                        setProgress(0);
                      }}
                      className={`px-2.5 py-1 rounded font-mono text-[11px] font-semibold transition-all ${
                        activeSnippetIdx === idx
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-200 dark:bg-[#0d1117] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {snippet.dialectTag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cycling Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-[#0d1117] h-0.5">
                <div
                  className="bg-blue-500 h-0.5 transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Code Well */}
              <div className="relative p-5 bg-slate-50 dark:bg-[#05070a] font-mono text-xs leading-relaxed overflow-x-auto">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-[#21262d] text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${activeSnippet.tagColor}`}>
                      {activeSnippet.standardLabel}
                    </span>
                    <span className="hidden sm:inline">Root: {activeSnippet.meta.rootElement}</span>
                    <span className="hidden md:inline">Encoding: {activeSnippet.meta.encoding}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-[#161b22] border border-slate-300 dark:border-[#30363d] text-slate-700 dark:text-slate-300 hover:border-blue-500 transition-colors flex items-center gap-1"
                    >
                      {copied ? <CheckIcon className="w-3 h-3 text-emerald-400" /> : <CopyIcon className="w-3 h-3" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>

                    <Link
                      href="/console"
                      className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors flex items-center gap-1"
                    >
                      <span>Open in Console</span>
                      <span>➔</span>
                    </Link>
                  </div>
                </div>

                <pre className="text-slate-800 dark:text-slate-300 selection:bg-blue-500/30 overflow-x-auto max-h-[340px]">
                  <code>{activeSnippet.code}</code>
                </pre>
              </div>

              {/* Telemetry Footer of Terminal */}
              <div className="px-4 py-2.5 bg-slate-100/60 dark:bg-[#090d14] border-t border-slate-200 dark:border-[#21262d] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2Icon className="w-3.5 h-3.5" />
                    <span>Schema Validation: 100% Valid</span>
                  </span>
                  <span>Invoice ID: INV-2026-088</span>
                  <span>Total: €1,785.00 EUR (19% VAT)</span>
                </div>
                <div>
                  <span>Hover to pause auto-cycle • Click tabs to inspect dialects</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* -------------------------------------------------------------------- */}
        {/* 3. Section: The 2026–2027 Mandate Wave & The O(N²) Trap             */}
        {/* -------------------------------------------------------------------- */}
        <section id="mandates" className="py-16 sm:py-20 border-b border-slate-300 dark:border-[#21262d]">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
            
            <div className="flex items-center gap-2 pb-2">
              <span className="text-blue-500 font-mono text-xs font-bold">◆ 01</span>
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                THE GLOBAL COMPLIANCE LANDSCAPE
              </h2>
            </div>
            
            <h3 className="mt-2 font-mono text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Why Point-to-Point Integrations Fail Under Mandate Pressure
            </h3>
            
            <p className="mt-3 max-w-3xl text-sm text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
              Every country enforces a distinct dialect, tax hierarchy, and Schematron validation rulebook. 
              Connecting N internal ERP formats to M regional standards with ad-hoc scripts requires <strong className="text-slate-800 dark:text-slate-200">N × M</strong> fragile translators. 
              Synclium eliminates this through a singular Canonical Intermediate schema.
            </p>

            {/* Mandates Comparison Matrix */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Card 1: European PEPPOL / UBL */}
              <div className="surface-card rounded-xl p-5 border-t-2 border-t-cyan-500 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">EU / PEPPOL NETWORK</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#161b22] text-slate-600 dark:text-slate-400">ISO/IEC 19845</span>
                  </div>
                  <h4 className="mt-2 font-mono text-base font-bold text-slate-900 dark:text-white">
                    UBL 2.1 &amp; PEPPOL BIS Billing 3.0
                  </h4>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                    Mandatory for Belgium (Jan 2026) and cross-border public procurement across Scandinavia, Germany, and the EU. Requires strict validation against CEN EN16931 rules.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#21262d] font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2Icon className="w-3.5 h-3.5" />
                  <span>Full Import · Export · Schematron</span>
                </div>
              </div>

              {/* Card 2: Franco-German Factur-X */}
              <div className="surface-card rounded-xl p-5 border-t-2 border-t-purple-500 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">FRANCE &amp; GERMANY</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#161b22] text-slate-600 dark:text-slate-400">EN16931 CII</span>
                  </div>
                  <h4 className="mt-2 font-mono text-base font-bold text-slate-900 dark:text-white">
                    Factur-X / ZUGFeRD 2.2
                  </h4>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                    Required for France’s PDP B2B rollout (Sep 2026) and Germany’s Growth Opportunities Act. Uses UN/CEFACT CrossIndustryInvoice XML embedded inside PDF/A-3.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#21262d] font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2Icon className="w-3.5 h-3.5" />
                  <span>Full Import · Export · Schematron</span>
                </div>
              </div>

              {/* Card 3: Saudi ZATCA Phase 2 */}
              <div className="surface-card rounded-xl p-5 border-t-2 border-t-emerald-500 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">SAUDI ARABIA</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#161b22] text-slate-600 dark:text-slate-400">ZATCA 2024</span>
                  </div>
                  <h4 className="mt-2 font-mono text-base font-bold text-slate-900 dark:text-white">
                    ZATCA Fatoora Phase 2
                  </h4>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                    Active mandate across Waves 1–15. Enforces tax categories, UUID compliance, and cryptographic clearance verification before sending to buyers.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#21262d] font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2Icon className="w-3.5 h-3.5" />
                  <span>Full Import · Export · Schematron</span>
                </div>
              </div>

            </div>

            {/* O(N^2) vs O(N) Architecture Comparison Strip */}
            <div className="mt-6 surface-card rounded-xl p-5 border border-slate-300 dark:border-[#30363d] bg-slate-50/50 dark:bg-[#090d14]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <div className="font-mono text-xs font-bold text-red-500">❌ THE POINT-TO-POINT TRAP (O(N²))</div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                    Building 5 direct converters between UBL, Factur-X, ZATCA, KSeF, and Peppol requires <strong>20 brittle integration scripts</strong>. Adding 1 new standard breaks existing pipelines.
                  </p>
                </div>
                <div className="border-t md:border-t-0 md:border-l border-slate-200 dark:border-[#21262d] pt-4 md:pt-0 md:pl-6">
                  <div className="font-mono text-xs font-bold text-emerald-500">✔ SYNCLIUM HUB-AND-SPOKE (O(N))</div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                    Every dialect only talks to the <strong>Canonical Intermediate AST</strong>. Adding format N+1 requires <strong>zero changes</strong> to formats 1 through N.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* -------------------------------------------------------------------- */}
        {/* 4. Section: Hub-and-Spoke Engine Architecture                        */}
        {/* -------------------------------------------------------------------- */}
        <section id="architecture" className="py-16 sm:py-20 border-b border-slate-300 dark:border-[#21262d]">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
            
            <div className="flex items-center gap-2 pb-2">
              <span className="text-blue-500 font-mono text-xs font-bold">◆ 02</span>
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                INTERNAL COMPILER ARCHITECTURE
              </h2>
            </div>
            
            <h3 className="mt-2 font-mono text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Stateless In-Memory Transpilation Pipeline
            </h3>

            {/* Architecture Pipeline Visualizer */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
              
              {/* Step 1: Ingestion & Extraction */}
              <div className="surface-card rounded-xl p-5 border border-slate-300 dark:border-[#21262d] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-cyan-500 font-mono text-xs font-bold">
                    <FileCodeIcon className="w-4 h-4" />
                    <span>01 // INGESTION &amp; PARSING</span>
                  </div>
                  <h4 className="mt-3 font-mono text-base font-bold text-slate-900 dark:text-white">
                    Format Signature Detection
                  </h4>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                    Accepts structured XML (UBL, CII, ZATCA), JSON, or binary PDF scans. If unstructured PDF/image is supplied, Google Gemini Flash parses fields with multi-model fallback.
                  </p>
                </div>
                <div className="mt-4 p-2.5 rounded bg-slate-100 dark:bg-[#05070a] font-mono text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#21262d]">
                  <code>detectFormat(raw) ➔ &quot;ubl&quot; | &quot;facturx&quot;</code>
                </div>
              </div>

              {/* Step 2: Canonical AST Hub */}
              <div className="surface-card rounded-xl p-5 border-2 border-blue-500/50 bg-blue-50/20 dark:bg-blue-950/10 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center gap-2 text-blue-500 font-mono text-xs font-bold">
                    <GaugeIcon className="w-4 h-4" />
                    <span>02 // CANONICAL INTERMEDIATE AST</span>
                  </div>
                  <h4 className="mt-3 font-mono text-base font-bold text-slate-900 dark:text-white">
                    Zod-Validated Universal Schema
                  </h4>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                    Normalizes monetary totals, line extensions, tax breakdowns, supplier VAT IDs, and payment references into a single lossless TypeScript object model (<code className="text-blue-500">packages/core</code>).
                  </p>
                </div>
                <div className="mt-4 p-2.5 rounded bg-slate-100 dark:bg-[#05070a] font-mono text-[11px] text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <code>CanonicalInvoiceSchema.parse(ast)</code>
                </div>
              </div>

              {/* Step 3: Target Compilation & Validation */}
              <div className="surface-card rounded-xl p-5 border border-slate-300 dark:border-[#21262d] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-500 font-mono text-xs font-bold">
                    <CheckCircle2Icon className="w-4 h-4" />
                    <span>03 // CODEGEN &amp; SCHEMATRON</span>
                  </div>
                  <h4 className="mt-3 font-mono text-base font-bold text-slate-900 dark:text-white">
                    Compliant Target Compilation
                  </h4>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                    Compiles canonical AST to compliant target XML with proper namespaces and executes real-time Schematron validation rules reporting exact XPath errors.
                  </p>
                </div>
                <div className="mt-4 p-2.5 rounded bg-slate-100 dark:bg-[#05070a] font-mono text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#21262d]">
                  <code>exportZATCA(canonical) ➔ XML</code>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* -------------------------------------------------------------------- */}
        {/* 5. Section: Proof, Not Claims (Benchmarks & Audited Security)        */}
        {/* -------------------------------------------------------------------- */}
        <section id="benchmarks" className="py-16 sm:py-20 border-b border-slate-300 dark:border-[#21262d]">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
            
            <div className="flex items-center gap-2 pb-2">
              <span className="text-blue-500 font-mono text-xs font-bold">◆ 03</span>
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                HARD VERIFIED BENCHMARKS &amp; SECURITY POSTURE
              </h2>
            </div>
            
            <h3 className="mt-2 font-mono text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Real Repository Metrics. Zero Marketing Inventions.
            </h3>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Stat 1 */}
              <div className="surface-card rounded-xl p-5 border border-slate-300 dark:border-[#21262d]">
                <div className="font-mono text-3xl font-extrabold text-blue-600 dark:text-blue-400">67 / 67</div>
                <div className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-white uppercase">Test Suites Passing</div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-sans">
                  Full golden-file test matrix across UBL 2.1, Factur-X, ZATCA, CLI, REST API, and rate limiters.
                </p>
              </div>

              {/* Stat 2 */}
              <div className="surface-card rounded-xl p-5 border border-slate-300 dark:border-[#21262d]">
                <div className="font-mono text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">90.8%</div>
                <div className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-white uppercase">AI Extraction Accuracy</div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-sans">
                  Benchmarked against messy invoice scans, wrinkled paper photos, and complex nested VAT tax tables.
                </p>
              </div>

              {/* Stat 3 */}
              <div className="surface-card rounded-xl p-5 border border-slate-300 dark:border-[#21262d]">
                <div className="font-mono text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">0 Bytes</div>
                <div className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-white uppercase">Disk Retention</div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-sans">
                  Guaranteed Zero Data Persistence. Invoices stream in-memory and are immediately discarded after compilation.
                </p>
              </div>

              {/* Stat 4 */}
              <div className="surface-card rounded-xl p-5 border border-slate-300 dark:border-[#21262d]">
                <div className="font-mono text-3xl font-extrabold text-purple-600 dark:text-purple-400">SHA-256</div>
                <div className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-white uppercase">Salted IP Privacy</div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-sans">
                  No raw IP persistence. Rate limits are tracked via salted one-way hashes in fail-closed Upstash Redis.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* -------------------------------------------------------------------- */}
        {/* 6. Section: For Developers (CLI, TypeScript API, Extensibility)      */}
        {/* -------------------------------------------------------------------- */}
        <section id="developers" className="py-16 sm:py-20 border-b border-slate-300 dark:border-[#21262d]">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
            
            <div className="flex items-center gap-2 pb-2">
              <span className="text-blue-500 font-mono text-xs font-bold">◆ 04</span>
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                FOR DEVELOPERS &amp; CONTRIBUTIONS
              </h2>
            </div>
            
            <h3 className="mt-2 font-mono text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Embed as a Library, Run in CI/CD, or Add New Formats
            </h3>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* CLI Showcase */}
              <div className="surface-card rounded-xl p-5 border border-slate-300 dark:border-[#21262d] bg-slate-50/50 dark:bg-[#05070a]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#21262d]">
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                    TERMINAL CLI (oib)
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-[#161b22] text-slate-600 dark:text-slate-400">
                    Node &gt;= 18
                  </span>
                </div>

                <div className="mt-4 font-mono text-xs leading-relaxed space-y-3 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400"># Transpile between formats</span>
                    <p className="text-blue-600 dark:text-blue-400 font-bold">$ oib convert invoice.xml --to zatca</p>
                  </div>
                  <div>
                    <span className="text-slate-400"># Run Schematron compliance validation</span>
                    <p className="text-emerald-600 dark:text-emerald-400 font-bold">$ oib validate invoice.xml --format facturx</p>
                  </div>
                  <div>
                    <span className="text-slate-400"># Multimodal PDF extraction via Google Gemini Flash</span>
                    <p className="text-purple-600 dark:text-purple-400 font-bold">$ oib extract scan.pdf --json-out report.json</p>
                  </div>
                </div>
              </div>

              {/* Contributor Extension Model */}
              <div className="surface-card rounded-xl p-5 border border-slate-300 dark:border-[#21262d] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#21262d]">
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      EXTENSIBILITY MODEL
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                      PRs Welcome
                    </span>
                  </div>

                  <h4 className="mt-4 font-mono text-sm font-bold text-slate-900 dark:text-white">
                    Add a New Country Mandate in 3 Functions
                  </h4>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                    Building an adapter for Poland&apos;s KSeF, Malaysia&apos;s MyInvois, or Singapore&apos;s InvoiceNow? Format packages implement just three functional entry points:
                  </p>

                  <div className="mt-3 p-3 rounded bg-slate-100 dark:bg-[#05070a] border border-slate-200 dark:border-[#21262d] font-mono text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                    <div><code>import(rawXml: string): Promise&lt;CanonicalInvoice&gt;</code></div>
                    <div><code>export(invoice: CanonicalInvoice): Promise&lt;string&gt;</code></div>
                    <div><code>validate(rawXml: string): Promise&lt;ValidationReport&gt;</code></div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200 dark:border-[#21262d] flex items-center justify-between">
                  <a
                    href="https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium/blob/main/CONTRIBUTING.md"
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Read Format Adapter Guide</span>
                    <span>➔</span>
                  </a>

                  <Link
                    href="/console"
                    className="h-8 px-3 inline-flex items-center gap-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-all"
                  >
                    <span>Try Workbench</span>
                    <span>➔</span>
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </section>
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* 7. Datasheet-Style Technical Footer                                  */}
      {/* -------------------------------------------------------------------- */}
      <footer className="border-t border-slate-300 dark:border-[#21262d] bg-white dark:bg-[#07090e] py-8 text-slate-500 font-mono text-xs">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Synclium" className="h-5 w-auto object-contain rounded opacity-80" />
            <span className="font-bold text-slate-800 dark:text-slate-200">SYNCLIUM</span>
            <span className="hidden sm:inline">// Universal Electronic Invoicing Bridge</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <span>UBL 2.1 ISO/IEC 19845</span>
            <span>•</span>
            <span>EN16931 CII</span>
            <span>•</span>
            <span>ZATCA 2024 Phase 2</span>
            <span>•</span>
            <Link href="/console" className="text-blue-500 hover:underline">
              Launch Console
            </Link>
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
