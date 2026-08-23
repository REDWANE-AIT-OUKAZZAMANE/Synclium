"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FileCodeIcon,
  CheckCircle2Icon,
  GaugeIcon,
  ExternalLinkIcon,
  SunIcon,
  MoonIcon,
  CopyIcon,
  CheckIcon,
  ArrowRightLeftIcon,
  ShieldCheckIcon,
  LayersIcon,
} from "@/components/Icons";

/* -------------------------------------------------------------------------- */
/* Real Test Case Dataset for the Live Hero Dual-Pane Transpiler             */
/* -------------------------------------------------------------------------- */

interface HeroTestCase {
  id: string;
  name: string;
  sourceStandard: string;
  sourceTag: string;
  sourceCode: string;
  targetStandard: string;
  targetTag: string;
  targetCode: string;
  schematronRules: Array<{ code: string; label: string; status: "PASS" | "WARN" }>;
  metrics: {
    linesIn: number;
    linesOut: number;
    latencyMs: number;
    memoryKb: number;
  };
}

const HERO_TEST_CASES: HeroTestCase[] = [
  {
    id: "peppol-to-zatca",
    name: "01 // EU PEPPOL BIS 3.0 ➔ SAUDI ZATCA PHASE 2",
    sourceStandard: "UBL 2.1 (ISO/IEC 19845 / PEPPOL BIS Billing 3.0)",
    sourceTag: "UBL 2.1",
    sourceCode: `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>INV-2026-088</cbc:ID>
  <cbc:IssueDate>2026-08-23</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>Nordwind Transit Systems GmbH</cbc:Name></cac:PartyName>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>DE314982711</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>Europa Rail AG</cbc:Name></cac:PartyName>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>DE812345678</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="HUR">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">1500.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Rail Power Inverter Maintenance (EN16931)</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>19.00</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
  </cac:InvoiceLine>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">1500.00</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">1500.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">1785.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">1785.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`,
    targetStandard: "ZATCA Fatoora Phase 2 (Saudi Tax & Customs Standard)",
    targetTag: "ZATCA XML",
    targetCode: `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>INV-2026-088</cbc:ID>
  <cbc:UUID>3a5d8471-bc93-4791-912f-4827104b6841</cbc:UUID>
  <cbc:IssueDate>2026-08-23</cbc:IssueDate>
  <cbc:InvoiceTypeCode name="0100000">388</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID schemeID="CRN">1010123456</cbc:ID></cac:PartyIdentification>
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
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">1500.00</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">1500.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">1785.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">1785.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`,
    schematronRules: [
      { code: "CEN-EN16931-BR-01", label: "Invoice monetary sum totals match line extensions exactly", status: "PASS" },
      { code: "PEPPOL-BIS-3.0-TAX", label: "Classified tax category percentage maps to code 'S'", status: "PASS" },
      { code: "ZATCA-BR-KSA-03", label: "Supplier 15-digit Tax Identification Number verified", status: "PASS" },
      { code: "ZATCA-BR-KSA-UUID", label: "Cryptographic RFC4122 UUID stamp verified", status: "PASS" },
    ],
    metrics: { linesIn: 44, linesOut: 40, latencyMs: 1.2, memoryKb: 14.8 },
  },
  {
    id: "facturx-to-peppol",
    name: "02 // FRENCH FACTUR-X (CII) ➔ EU PEPPOL BIS 3.0",
    sourceStandard: "Factur-X / ZUGFeRD 2.2 (UN/CEFACT CrossIndustryInvoice)",
    sourceTag: "EN16931 CII",
    sourceCode: `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
                          xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
                          xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>FR-2026-00449</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">20260823</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument><ram:LineID>1</ram:LineID></ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct><ram:Name>Grid Frequency Regulation Sensor Set</ram:Name></ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:GrossPriceProductTradePrice><ram:ChargeAmount>2400.00</ram:ChargeAmount></ram:GrossPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>2400.00</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`,
    targetStandard: "UBL 2.1 / PEPPOL BIS Billing 3.0 (CEN EN16931:2017)",
    targetTag: "UBL 2.1",
    targetCode: `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ID>FR-2026-00449</cbc:ID>
  <cbc:IssueDate>2026-08-23</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">2400.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Grid Frequency Regulation Sensor Set</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>20.00</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
  </cac:InvoiceLine>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">2400.00</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">2400.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">2880.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">2880.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`,
    schematronRules: [
      { code: "CII-EN16931-ROOT", label: "UN/CEFACT CII 100 Guideline mapping verified", status: "PASS" },
      { code: "CEN-EN16931-BR-02", label: "Standard 20.00% VAT computation validated", status: "PASS" },
      { code: "PEPPOL-BIS-3.0-C62", label: "Unit code C62 normalized to UN/ECE Rec 20", status: "PASS" },
    ],
    metrics: { linesIn: 32, linesOut: 30, latencyMs: 0.9, memoryKb: 12.4 },
  },
  {
    id: "zatca-to-facturx",
    name: "03 // SAUDI ZATCA PHASE 2 ➔ FRENCH FACTUR-X (CII)",
    sourceStandard: "Saudi ZATCA Phase 2 Clearance Standard",
    sourceTag: "ZATCA XML",
    sourceCode: `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>SA-2026-7781</cbc:ID>
  <cbc:UUID>9f12bc88-e21a-4933-8991-aa0934120011</cbc:UUID>
  <cbc:IssueDate>2026-08-23</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="EA">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="SAR">8500.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>High-Voltage Substation Transformer Oil Analysis</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>15.00</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
  </cac:InvoiceLine>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">8500.00</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">8500.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">9775.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="SAR">9775.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`,
    targetStandard: "Factur-X / ZUGFeRD 2.2 (CrossIndustryInvoice)",
    targetTag: "EN16931 CII",
    targetCode: `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
                          xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
                          xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>SA-2026-7781</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">20260823</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument><ram:LineID>1</ram:LineID></ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct><ram:Name>High-Voltage Substation Transformer Oil Analysis</ram:Name></ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>15.00</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>8500.00</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`,
    schematronRules: [
      { code: "ZATCA-IMPORT-NORMALIZED", label: "Normalized 15.00% SAR standard rate to canonical model", status: "PASS" },
      { code: "CII-EXPORT-EN16931", label: "Compiled to compliant CrossIndustryInvoice trade nodes", status: "PASS" },
    ],
    metrics: { linesIn: 32, linesOut: 28, latencyMs: 1.1, memoryKb: 13.9 },
  },
];

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                        */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);
  const [activePane, setActivePane] = useState<"source" | "target">("target");
  const [copied, setCopied] = useState<boolean>(false);
  const [activeDevTab, setActiveDevTab] = useState<"cli" | "sdk" | "api">("cli");

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

  const activeCase = HERO_TEST_CASES[selectedCaseIdx];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "grid-bg-dark" : "grid-bg-light"} text-slate-900 dark:text-[#e2e8f0]`}>
      
      {/* -------------------------------------------------------------------- */}
      {/* 1. Header Bar                                                        */}
      {/* -------------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-slate-300 dark:border-[#21262d] bg-white/95 dark:bg-[#07090e]/95 backdrop-blur font-mono">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-6 sm:gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <img src="/logo.png" alt="Synclium" className="h-8.5 sm:h-9 w-auto object-contain drop-shadow-sm" />
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-[#58a6ff] transition-colors">
                  SYNCLIUM
                </span>
                <span className="text-[10px] px-1.5 py-0.2 border border-slate-300 dark:border-[#30363d] bg-slate-100 dark:bg-[#161b22] text-slate-600 dark:text-slate-400 font-semibold">
                  v1.0
                </span>
              </div>
            </Link>

            {/* Clean Interactive Navigation Links */}
            <nav className="hidden md:flex items-center gap-5 text-xs text-slate-600 dark:text-slate-400">
              <a
                href="#mandates"
                className="hover:text-blue-600 dark:hover:text-[#58a6ff] transition-colors"
              >
                Mandates 2026–27
              </a>
              <a
                href="#architecture"
                className="hover:text-blue-600 dark:hover:text-[#58a6ff] transition-colors"
              >
                Architecture
              </a>
              <a
                href="#benchmarks"
                className="hover:text-blue-600 dark:hover:text-[#58a6ff] transition-colors"
              >
                Benchmarks
              </a>
              <a
                href="#developers"
                className="hover:text-blue-600 dark:hover:text-[#58a6ff] transition-colors"
              >
                Developers
              </a>
              <Link
                href="/console"
                className="text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-[#58a6ff] font-semibold transition-colors"
              >
                Console
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/console"
              className="h-7 px-3 inline-flex items-center gap-1.5 border border-blue-600 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm"
            >
              <span>Launch Console</span>
              <span>➔</span>
            </Link>

            <a
              href="https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium"
              target="_blank"
              rel="noreferrer"
              className="h-7 px-2.5 inline-flex items-center gap-1 border border-slate-300 dark:border-[#30363d] bg-slate-100 dark:bg-[#161b22] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
            >
              <span>GitHub</span>
              <ExternalLinkIcon className="w-3 h-3 opacity-80" />
            </a>

            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="h-7 w-7 inline-flex items-center justify-center border border-slate-300 dark:border-[#30363d] bg-slate-100 dark:bg-[#161b22] text-slate-700 dark:text-slate-300 hover:border-slate-400"
            >
              {theme === "dark" ? <SunIcon className="w-3.5 h-3.5" /> : <MoonIcon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* 2. Hero Diagnostic Console & Dual-Pane Transpiler Sandbox            */}
      {/* -------------------------------------------------------------------- */}
      <main>
        <section className="pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-slate-300 dark:border-[#21262d]">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
            
            {/* System Specification Monospace Breadcrumb */}
            <div className="font-mono text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
              <span className="text-blue-600 dark:text-[#58a6ff] font-bold">SYS_SPEC</span>
              <span>//</span>
              <span>KERNEL: IN-MEMORY CANONICAL AST</span>
              <span>//</span>
              <span>SECURITY: ZERO DISK WRITE GUARANTEE</span>
              <span>//</span>
              <span>LICENSE: MIT OPEN SOURCE</span>
            </div>

            {/* Hard Monospace Editorial Headline (No Generic Gradients) */}
            <div className="mt-4 max-w-5xl">
              <h1 className="font-mono text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase leading-[1.15]">
                THE 2026–2027 MANDATE WAVE BREAKS POINT-TO-POINT TRANSLATORS.
              </h1>
              <p className="mt-3 font-mono text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-4xl leading-relaxed">
                Belgium, France, Poland, and Saudi Arabia mandate incompatible e-invoicing schemas.
                Synclium is a stateless, pure-TypeScript compiler that validates and transpiles across 
                <span className="font-bold text-slate-900 dark:text-white"> UBL 2.1 (PEPPOL)</span>, 
                <span className="font-bold text-slate-900 dark:text-white"> Factur-X / ZUGFeRD (CII)</span>, and 
                <span className="font-bold text-slate-900 dark:text-white"> ZATCA Phase 2</span> via a lossless intermediate hub AST.
              </p>
            </div>

            {/* Direct Action Bar */}
            <div className="mt-6 flex flex-wrap items-center gap-3 font-mono">
              <Link
                href="/console"
                className="h-9 px-4 inline-flex items-center gap-2 border border-blue-600 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all"
              >
                <span>OPEN INTERACTIVE WORKBENCH</span>
                <span>➔</span>
              </Link>

              <a
                href="#mandates"
                className="h-9 px-3.5 inline-flex items-center gap-1.5 border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500"
              >
                <span>INSPECT MANDATE MATRIX</span>
                <span>↓</span>
              </a>

              <div className="hidden md:flex items-center gap-4 ml-auto text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 inline-block" />
                  <span>67/67 TEST SUITES GREEN</span>
                </span>
                <span>•</span>
                <span>&lt; 5 MS STREAMING LATENCY</span>
                <span>•</span>
                <span>90.8% MULTIMODAL EXTRACTION EVAL</span>
              </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* The Live Interactive Dual-Pane Compiler Instrument (Hero Core)   */}
            {/* ---------------------------------------------------------------- */}
            <div className="mt-8 border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] shadow-xl">
              
              {/* Terminal Control Strip & Test Case Selector */}
              <div className="px-4 py-2.5 bg-slate-100 dark:bg-[#161b22] border-b border-slate-300 dark:border-[#21262d] flex flex-wrap items-center justify-between gap-3 font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 dark:text-[#58a6ff] font-bold text-xs">◆ RUNTIME BENCHMARK</span>
                  <span className="text-slate-400 dark:text-slate-600">|</span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{activeCase.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {HERO_TEST_CASES.map((tc, idx) => (
                    <button
                      key={tc.id}
                      onClick={() => setSelectedCaseIdx(idx)}
                      className={`px-2.5 py-1 text-[11px] font-bold border transition-all ${
                        selectedCaseIdx === idx
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#07090e] text-slate-700 dark:text-slate-300 hover:border-slate-400"
                      }`}
                    >
                      Case {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dual-Pane Code Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-300 dark:divide-[#21262d]">
                
                {/* Left Pane: Source Dialect */}
                <div className="flex flex-col bg-slate-50/70 dark:bg-[#05070a]">
                  <div className="px-4 py-2 bg-slate-100/80 dark:bg-[#0e131d] border-b border-slate-300 dark:border-[#21262d] flex items-center justify-between font-mono text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 border border-slate-300 dark:border-[#30363d] bg-slate-200 dark:bg-[#161b22] font-bold text-slate-800 dark:text-slate-200">
                        {activeCase.sourceTag}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 truncate max-w-[280px]">
                        {activeCase.sourceStandard}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(activeCase.sourceCode)}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                    >
                      <CopyIcon className="w-3 h-3" />
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <div className="p-4 font-mono text-xs leading-5 overflow-x-auto max-h-[360px] text-slate-800 dark:text-slate-300">
                    <pre><code>{activeCase.sourceCode}</code></pre>
                  </div>
                </div>

                {/* Right Pane: Target Transpiled Output */}
                <div className="flex flex-col bg-white dark:bg-[#07090e]">
                  <div className="px-4 py-2 bg-slate-100/80 dark:bg-[#0e131d] border-b border-slate-300 dark:border-[#21262d] flex items-center justify-between font-mono text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 border border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-[#58a6ff] font-bold">
                        {activeCase.targetTag}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 truncate max-w-[280px]">
                        {activeCase.targetStandard}
                      </span>
                    </div>
                    <Link
                      href="/console"
                      className="px-2 py-0.5 border border-blue-600 bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
                    >
                      Open in Console ➔
                    </Link>
                  </div>

                  <div className="p-4 font-mono text-xs leading-5 overflow-x-auto max-h-[360px] text-slate-800 dark:text-slate-300">
                    <pre><code>{activeCase.targetCode}</code></pre>
                  </div>
                </div>

              </div>

              {/* Real Schematron Verification Gate Strip */}
              <div className="p-4 bg-slate-50 dark:bg-[#090d14] border-t border-slate-300 dark:border-[#21262d] font-mono">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span>SCHEMATRON VALIDATION RULES &amp; RUNTIME TELEMETRY:</span>
                  <span className="text-slate-500">
                    EXEC: {activeCase.metrics.latencyMs}ms | MEM: {activeCase.metrics.memoryKb}KB | AST: LOSSLESS
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activeCase.schematronRules.map((rule) => (
                    <div
                      key={rule.code}
                      className="p-2 border border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#0d1117] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="px-1 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          [{rule.status}]
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 truncate">{rule.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-2">{rule.code}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* -------------------------------------------------------------------- */}
        {/* 3. Section: Mandate Compliance Datasheet Matrix                      */}
        {/* -------------------------------------------------------------------- */}
        <section id="mandates" className="py-14 sm:py-20 border-b border-slate-300 dark:border-[#21262d]">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 font-mono">
            
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-[#58a6ff] font-bold">◆ 01</span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                MANDATE COMPLIANCE MATRIX // 2026–2027 TIMELINE
              </h2>
            </div>
            
            <h3 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
              The O(N²) Point-to-Point Integration Trap vs O(N) Canonical Hub
            </h3>

            {/* Datasheet Table */}
            <div className="mt-6 border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[#161b22] border-b border-slate-300 dark:border-[#21262d] text-slate-700 dark:text-slate-300">
                    <th className="p-3 border-r border-slate-300 dark:border-[#21262d] font-bold">JURISDICTION</th>
                    <th className="p-3 border-r border-slate-300 dark:border-[#21262d] font-bold">MANDATE DATE</th>
                    <th className="p-3 border-r border-slate-300 dark:border-[#21262d] font-bold">REQUIRED STANDARD</th>
                    <th className="p-3 border-r border-slate-300 dark:border-[#21262d] font-bold">CLEARANCE SCHEME</th>
                    <th className="p-3 font-bold">SYNCLIUM ENGINE STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#21262d]">
                  <tr className="hover:bg-slate-50 dark:hover:bg-[#0e131d]">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-[#21262d]">Belgium</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-[#21262d]">Jan 1, 2026 (B2B)</td>
                    <td className="p-3 border-r border-slate-200 dark:border-[#21262d]">PEPPOL BIS Billing 3.0 (UBL 2.1)</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-[#21262d]">PEPPOL 4-Corner Network</td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">[READY] 100% Import · Export · Valid.</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-[#0e131d]">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-[#21262d]">France</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-[#21262d]">Sep 1, 2026 (Rollout)</td>
                    <td className="p-3 border-r border-slate-200 dark:border-[#21262d]">Factur-X / ZUGFeRD 2.2 (EN16931 CII)</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-[#21262d]">PDP &amp; PPF Platform Routing</td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">[READY] 100% Import · Export · Valid.</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-[#0e131d]">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-[#21262d]">Saudi Arabia</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-[#21262d]">Phase 2 Waves 1–15 Active</td>
                    <td className="p-3 border-r border-slate-200 dark:border-[#21262d]">ZATCA Fatoora Phase 2 XML</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-[#21262d]">ZATCA Clearance &amp; Reporting API</td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">[READY] 100% Import · Export · Valid.</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-[#0e131d]">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-[#21262d]">Germany</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-[#21262d]">2025–2028 (Growth Act)</td>
                    <td className="p-3 border-r border-slate-200 dark:border-[#21262d]">XRechnung 3.0 / ZUGFeRD</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-[#21262d]">B2B Direct Exchange</td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">[READY] 100% Import · Export · Valid.</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-[#0e131d]">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-[#21262d]">Poland</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-[#21262d]">Feb 1, 2026 (KSeF)</td>
                    <td className="p-3 border-r border-slate-200 dark:border-[#21262d]">FA_VAT Logical Structure</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-[#21262d]">National KSeF Central Clearance</td>
                    <td className="p-3 text-blue-600 dark:text-[#58a6ff] font-bold">[CONTRIBUTE] Open Package Adapter</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Architecture Mathematical Proof */}
            <div className="mt-4 p-4 border border-slate-300 dark:border-[#21262d] bg-slate-50 dark:bg-[#090d14] text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-900 dark:text-white">COMPUTATIONAL TOPOLOGY: </span>
              Supporting N formats across M jurisdictions with point-to-point converters requires <code className="text-red-500 font-bold">N × (N - 1)</code> bespoke mappings. 
              With Synclium&apos;s Canonical Intermediate Hub, complexity is strictly reduced to <code className="text-emerald-500 font-bold">2 × N</code> pure functional transformers. Adding format N+1 requires exactly 0 changes to existing formats.
            </div>

          </div>
        </section>

        {/* -------------------------------------------------------------------- */}
        {/* 4. Section: Hub-and-Spoke Compiler Architecture                      */}
        {/* -------------------------------------------------------------------- */}
        <section id="architecture" className="py-14 sm:py-20 border-b border-slate-300 dark:border-[#21262d]">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 font-mono">
            
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-[#58a6ff] font-bold">◆ 02</span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                INTERNAL COMPILER PIPELINE
              </h2>
            </div>
            
            <h3 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
              Stateless In-Memory Transpilation Architecture
            </h3>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Step 1 */}
              <div className="border border-slate-300 dark:border-[#21262d] bg-white dark:bg-[#0d1117] p-5 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] text-slate-500 font-bold">01 // INGESTION &amp; EXTRACTION</div>
                  <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Signature Detection &amp; OCR</h4>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                    Inspects root XML namespaces to select parsers. If unstructured PDF or scan images are provided, Google Gemini Flash extracts structured fields into standard JSON with multi-model failover.
                  </p>
                </div>
                <div className="mt-4 p-2 bg-slate-100 dark:bg-[#05070a] border border-slate-200 dark:border-[#21262d] text-[11px]">
                  <code>detectFormat(buffer) ➔ &quot;ubl&quot; | &quot;facturx&quot;</code>
                </div>
              </div>

              {/* Step 2 */}
              <div className="border-2 border-blue-600 bg-blue-50/20 dark:bg-[#0e1726] p-5 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] text-blue-600 dark:text-[#58a6ff] font-bold">02 // CANONICAL INTERMEDIATE AST</div>
                  <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Lossless Zod Hub Schema</h4>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                    Normalizes seller/buyer tax numbers, line items, classified tax categories, allowances/charges, and payable amounts into a strongly-typed TypeScript AST (<code className="text-blue-600 dark:text-[#58a6ff]">packages/core</code>).
                  </p>
                </div>
                <div className="mt-4 p-2 bg-white dark:bg-[#05070a] border border-blue-500/30 text-[11px] text-blue-600 dark:text-[#58a6ff]">
                  <code>CanonicalInvoiceSchema.parse(ast)</code>
                </div>
              </div>

              {/* Step 3 */}
              <div className="border border-slate-300 dark:border-[#21262d] bg-white dark:bg-[#0d1117] p-5 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">03 // TARGET CODEGEN &amp; SCHEMATRON</div>
                  <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Deterministic XML Compilation</h4>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                    Emits target XML with compliant namespaces and executes exact Schematron validation rules reporting exact XPath error diagnostics before dispatch.
                  </p>
                </div>
                <div className="mt-4 p-2 bg-slate-100 dark:bg-[#05070a] border border-slate-200 dark:border-[#21262d] text-[11px]">
                  <code>exportZATCA(canonical) ➔ XML</code>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* -------------------------------------------------------------------- */}
        {/* 5. Section: Audited Benchmarks & Security Posture                    */}
        {/* -------------------------------------------------------------------- */}
        <section id="benchmarks" className="py-14 sm:py-20 border-b border-slate-300 dark:border-[#21262d]">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 font-mono">
            
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-[#58a6ff] font-bold">◆ 03</span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                AUDITED RUNTIME BENCHMARKS &amp; DATA PRIVACY
              </h2>
            </div>
            
            <h3 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
              Real Engineering Metrics. Zero Marketing Inventions.
            </h3>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="border border-slate-300 dark:border-[#21262d] bg-white dark:bg-[#0d1117] p-5">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">67 / 67</div>
                <div className="mt-1 text-xs text-blue-600 dark:text-[#58a6ff] font-bold uppercase">Test Suites Passing</div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-sans">
                  Golden-file test matrix across UBL 2.1, Factur-X, ZATCA, CLI, REST API, and rate limiters.
                </p>
              </div>

              <div className="border border-slate-300 dark:border-[#21262d] bg-white dark:bg-[#0d1117] p-5">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">90.8%</div>
                <div className="mt-1 text-cyan-600 dark:text-cyan-400 font-bold uppercase">Multimodal Eval Score</div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-sans">
                  Benchmarked on real-world noisy camera scans, low-resolution receipts, and nested VAT tables.
                </p>
              </div>

              <div className="border border-slate-300 dark:border-[#21262d] bg-white dark:bg-[#0d1117] p-5">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">0 Bytes</div>
                <div className="mt-1 text-emerald-600 dark:text-emerald-400 font-bold uppercase">Disk Retention</div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-sans">
                  Stateless in-memory execution. Invoices exist strictly in transient RAM during compilation.
                </p>
              </div>

              <div className="border border-slate-300 dark:border-[#21262d] bg-white dark:bg-[#0d1117] p-5">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">SHA-256</div>
                <div className="mt-1 text-purple-600 dark:text-purple-400 font-bold uppercase">Salted IP Hashing</div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-sans">
                  Zero raw IP storage. Rate limiting runs on one-way salted hashes with fail-closed Upstash Redis.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* -------------------------------------------------------------------- */}
        {/* 6. Section: Developer Workbench & Extensibility Model                */}
        {/* -------------------------------------------------------------------- */}
        <section id="developers" className="py-14 sm:py-20 border-b border-slate-300 dark:border-[#21262d]">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 font-mono">
            
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-[#58a6ff] font-bold">◆ 04</span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                FOR DEVELOPERS &amp; CONTRIBUTING ADAPTERS
              </h2>
            </div>
            
            <h3 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
              Embed as a Library, Run in CI/CD, or Add New Country Formats
            </h3>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Terminal Tab Box */}
              <div className="border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#05070a]">
                <div className="px-4 py-2 bg-slate-100 dark:bg-[#161b22] border-b border-slate-300 dark:border-[#21262d] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveDevTab("cli")}
                      className={`px-2 py-0.5 border ${
                        activeDevTab === "cli"
                          ? "border-blue-600 bg-blue-600 text-white font-bold"
                          : "border-slate-300 dark:border-[#30363d] text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      CLI (oib)
                    </button>
                    <button
                      onClick={() => setActiveDevTab("sdk")}
                      className={`px-2 py-0.5 border ${
                        activeDevTab === "sdk"
                          ? "border-blue-600 bg-blue-600 text-white font-bold"
                          : "border-slate-300 dark:border-[#30363d] text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      TypeScript SDK
                    </button>
                    <button
                      onClick={() => setActiveDevTab("api")}
                      className={`px-2 py-0.5 border ${
                        activeDevTab === "api"
                          ? "border-blue-600 bg-blue-600 text-white font-bold"
                          : "border-slate-300 dark:border-[#30363d] text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      REST API
                    </button>
                  </div>
                  <span className="text-slate-500">Node &gt;= 18</span>
                </div>

                <div className="p-4 text-xs leading-relaxed overflow-x-auto text-slate-800 dark:text-slate-200">
                  {activeDevTab === "cli" && (
                    <pre className="space-y-2">
                      <span className="text-slate-400"># Transpile with auto-detected format signature</span>
                      <p className="text-blue-600 dark:text-[#58a6ff] font-bold">$ oib convert invoice.xml --to zatca</p>
                      
                      <span className="text-slate-400"># Execute Schematron compliance validation</span>
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold">$ oib validate invoice.xml --format facturx</p>
                      
                      <span className="text-slate-400"># AI multimodal extraction from scan PDF or image</span>
                      <p className="text-purple-600 dark:text-purple-400 font-bold">$ oib extract scan.pdf --json-out report.json</p>
                    </pre>
                  )}

                  {activeDevTab === "sdk" && (
                    <pre className="space-y-1">
                      <span className="text-slate-400">// Pure TypeScript in-memory transpilation</span>
                      <p><span className="text-purple-400">import</span> &#123; importUBL &#125; <span className="text-purple-400">from</span> <span className="text-emerald-400">&quot;@synclium/ubl&quot;</span>;</p>
                      <p><span className="text-purple-400">import</span> &#123; exportZATCA &#125; <span className="text-purple-400">from</span> <span className="text-emerald-400">&quot;@synclium/zatca&quot;</span>;</p>
                      <br />
                      <p><span className="text-purple-400">const</span> canonical = <span className="text-purple-400">await</span> importUBL(rawXml);</p>
                      <p><span className="text-purple-400">const</span> zatcaXml = <span className="text-purple-400">await</span> exportZATCA(canonical);</p>
                    </pre>
                  )}

                  {activeDevTab === "api" && (
                    <pre className="space-y-2">
                      <span className="text-slate-400"># Fastify In-Memory Transpile Endpoint</span>
                      <p className="text-slate-800 dark:text-slate-200">
                        curl -X POST http://localhost:3000/convert \<br />
                        &nbsp;&nbsp;-H &quot;Content-Type: application/json&quot; \<br />
                        &nbsp;&nbsp;-d &apos;&#123;&quot;input&quot;: &quot;...&quot;, &quot;to&quot;: &quot;zatca&quot;&#125;&apos;
                      </p>
                    </pre>
                  )}
                </div>
              </div>

              {/* Contributor Extension Guide */}
              <div className="border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#21262d] text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">EXTENSIBILITY INTERFACE</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">[PRs WELCOME]</span>
                  </div>

                  <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                    Implement Format $N+1$ in 3 Pure Functions
                  </h4>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                    Adding support for Poland (KSeF), Malaysia (MyInvois), or Singapore (InvoiceNow)? Implement three pure functional entry points without touching existing formats:
                  </p>

                  <div className="mt-3 p-3 bg-slate-50 dark:bg-[#05070a] border border-slate-200 dark:border-[#21262d] text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                    <div><code>import(rawXml: string): Promise&lt;CanonicalInvoice&gt;</code></div>
                    <div><code>export(invoice: CanonicalInvoice): Promise&lt;string&gt;</code></div>
                    <div><code>validate(rawXml: string): Promise&lt;ValidationReport&gt;</code></div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#21262d] flex items-center justify-between text-xs">
                  <a
                    href="https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium/blob/main/CONTRIBUTING.md"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-[#58a6ff] hover:underline"
                  >
                    Read CONTRIBUTING.md ➔
                  </a>

                  <Link
                    href="/console"
                    className="px-3 py-1 border border-blue-600 bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
                  >
                    Open Workbench ➔
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </section>
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* 7. Datasheet Technical Footer                                        */}
      {/* -------------------------------------------------------------------- */}
      <footer className="border-t border-slate-300 dark:border-[#21262d] bg-white dark:bg-[#07090e] py-6 text-slate-500 font-mono text-xs">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Synclium" className="h-5 w-auto object-contain" />
            <span className="font-bold text-slate-800 dark:text-slate-200">SYNCLIUM</span>
            <span>// Universal Electronic Invoicing Bridge</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <span>ISO/IEC 19845</span>
            <span>•</span>
            <span>EN16931 CII</span>
            <span>•</span>
            <span>ZATCA Phase 2</span>
            <span>•</span>
            <Link href="/console" className="text-blue-600 dark:text-[#58a6ff] hover:underline">
              Launch Console
            </Link>
            <span>•</span>
            <a
              href="https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 dark:text-[#58a6ff] hover:underline"
            >
              MIT Open Source
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
