"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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
  TerminalIcon,
  BookOpenIcon,
  PlayIcon,
  CpuIcon,
  NetworkIcon,
  SendIcon,
  SlidersIcon,
  ServerIcon,
  BracesIcon,
  CompassIcon,
  FileJsonIcon,
  DatabaseIcon,
  WorkflowIcon,
  SearchIcon,
  AlertTriangleIcon,
  DownloadIcon,
} from "@/components/Icons";

/* -------------------------------------------------------------------------- */
/* Types & Presets for the Interactive Playground                             */
/* -------------------------------------------------------------------------- */

type MainTab = "playground" | "recipes" | "sdk" | "matrix" | "openapi";
type ErpTab = "odoo" | "sap" | "netsuite" | "quickbooks";
type CodeLang = "curl" | "typescript" | "python" | "go" | "csharp" | "php" | "rust";
type EndpointId = "convert" | "validate" | "extract" | "samples" | "openapi";

interface PlaygroundPreset {
  id: string;
  name: string;
  endpoint: EndpointId;
  method: "POST" | "GET";
  path: string;
  from?: string;
  to?: string;
  description: string;
  bodyPayload: string;
}

const SAMPLE_UBL = `<?xml version="1.0" encoding="UTF-8"?>
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
  <cac:AllowanceCharge>
    <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
    <cbc:AllowanceChargeReason>Annual Partner Discount</cbc:AllowanceChargeReason>
    <cbc:Amount currencyID="EUR">100.00</cbc:Amount>
    <cac:TaxCategory>
      <cbc:ID>S</cbc:ID>
      <cbc:Percent>19.00</cbc:Percent>
      <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
    </cac:TaxCategory>
  </cac:AllowanceCharge>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">266.00</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="EUR">1400.00</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="EUR">266.00</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>19.00</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">1500.00</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">1400.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">1666.00</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="EUR">100.00</cbc:AllowanceTotalAmount>
    <cbc:PayableAmount currencyID="EUR">1666.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="HUR">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">1500.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>High-Speed Inverter Diagnostics (EN16931 Compliant)</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>19.00</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="EUR">1500.00</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>
</Invoice>`;

const SAMPLE_CANONICAL = `{
  "id": "INV-2026-904",
  "issueDate": "2026-08-23",
  "currency": "EUR",
  "typeCode": "388",
  "supplier": {
    "name": "Nordwind Transit Systems GmbH",
    "vatId": "DE314982711",
    "taxScheme": "VAT"
  },
  "customer": {
    "name": "Europa Rail AG",
    "vatId": "DE812345678",
    "taxScheme": "VAT"
  },
  "lines": [
    {
      "id": "1",
      "name": "Bogie Calibration Service",
      "quantity": 2,
      "unitCode": "HUR",
      "unitPrice": 450.00,
      "lineExtensionAmount": 900.00,
      "taxCategory": "S",
      "taxRate": 19.00
    }
  ],
  "totals": {
    "lineExtensionAmount": 900.00,
    "taxExclusiveAmount": 900.00,
    "taxInclusiveAmount": 1071.00,
    "taxAmount": 171.00,
    "payableAmount": 1071.00
  }
}`;

const PLAYGROUND_PRESETS: PlaygroundPreset[] = [
  {
    id: "ubl-to-zatca",
    name: "01 // PEPPOL BIS 3.0 ➔ ZATCA Phase 2",
    endpoint: "convert",
    method: "POST",
    path: "/api/convert",
    from: "auto",
    to: "zatca",
    description: "Transpiles European UBL 2.1 into Saudi ZATCA Phase 2 XML with compliant NNPNESB type codes.",
    bodyPayload: JSON.stringify(
      {
        input: SAMPLE_UBL,
        from: "auto",
        to: "zatca",
      },
      null,
      2
    ),
  },
  {
    id: "ubl-to-facturx",
    name: "02 // PEPPOL BIS 3.0 ➔ Factur-X / ZUGFeRD",
    endpoint: "convert",
    method: "POST",
    path: "/api/convert",
    from: "auto",
    to: "facturx",
    description: "Transpiles UBL 2.1 into Franco-German Factur-X / ZUGFeRD 2.2 CII XML (EN16931 profile).",
    bodyPayload: JSON.stringify(
      {
        input: SAMPLE_UBL,
        from: "auto",
        to: "facturx",
      },
      null,
      2
    ),
  },
  {
    id: "validate-en16931",
    name: "03 // Validate Schematron Rules (BR-S-08)",
    endpoint: "validate",
    method: "POST",
    path: "/api/validate",
    description: "Executes EN16931 business rules and reconciles document-level allowances with tax subtotals.",
    bodyPayload: JSON.stringify(
      {
        input: SAMPLE_UBL,
        format: "auto",
      },
      null,
      2
    ),
  },
  {
    id: "canonical-to-ubl",
    name: "04 // Canonical AST ➔ PEPPOL BIS 3.0",
    endpoint: "convert",
    method: "POST",
    path: "/api/convert",
    from: "canonical",
    to: "ubl",
    description: "Compiles pure Canonical JSON AST into certified UBL 2.1 XML structure.",
    bodyPayload: JSON.stringify(
      {
        input: SAMPLE_CANONICAL,
        from: "canonical",
        to: "ubl",
      },
      null,
      2
    ),
  },
  {
    id: "extract-scan",
    name: "05 // Multimodal AI Extraction (Mock Scan)",
    endpoint: "extract",
    method: "POST",
    path: "/api/extract",
    description: "Sends base64 scanned invoice payload to multimodal extractor and retrieves Canonical AST with field confidence.",
    bodyPayload: JSON.stringify(
      {
        contentBase64: "JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeAEr5HIKWTAwUEgoLS5RSEvMTS0uTk1VyMwvLSpWSElNSkzMUQDJFAIAh7EKGQplbmRzdHJlYW0KZW5kb2JqCg==",
        mimeType: "application/pdf",
        provider: "mock",
        filename: "vendor-invoice-2026.pdf",
      },
      null,
      2
    ),
  },
  {
    id: "get-samples",
    name: "06 // GET /api/samples",
    endpoint: "samples",
    method: "GET",
    path: "/api/samples",
    description: "Fetches all preloaded sample XML datasets across UBL, Factur-X, and ZATCA standards.",
    bodyPayload: "",
  },
];

export default function DocsPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<MainTab>("playground");
  const [activeErp, setActiveErp] = useState<ErpTab>("odoo");
  const [activeLang, setActiveLang] = useState<CodeLang>("typescript");

  // Playground state
  const [selectedPreset, setSelectedPreset] = useState<PlaygroundPreset>(PLAYGROUND_PRESETS[0]);
  const [requestMethod, setRequestMethod] = useState<"POST" | "GET">("POST");
  const [requestPath, setRequestPath] = useState<string>("/api/convert");
  const [requestBody, setRequestBody] = useState<string>(PLAYGROUND_PRESETS[0].bodyPayload);
  const [responseOutput, setResponseOutput] = useState<string>("");
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedResponse, setCopiedResponse] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

  // Synchronize theme with localStorage / document
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const selectPreset = (preset: PlaygroundPreset) => {
    setSelectedPreset(preset);
    setRequestMethod(preset.method);
    setRequestPath(preset.path);
    setRequestBody(preset.bodyPayload);
    setResponseOutput("");
    setResponseStatus(null);
    setLatencyMs(null);
  };

  // Execute Playground Request
  const executePlaygroundRequest = async () => {
    setIsLoading(true);
    setResponseOutput("");
    setResponseStatus(null);
    const start = performance.now();

    try {
      const opts: RequestInit = {
        method: requestMethod,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };

      if (requestMethod === "POST") {
        opts.body = requestBody;
      }

      const res = await fetch(requestPath, opts);
      const elapsed = performance.now() - start;
      setLatencyMs(Math.round(elapsed * 10) / 10);
      setResponseStatus(res.status);

      const hdrs: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        hdrs[k] = v;
      });
      setResponseHeaders(hdrs);

      const data = await res.json();
      setResponseOutput(JSON.stringify(data, null, 2));
    } catch (err: any) {
      const elapsed = performance.now() - start;
      setLatencyMs(Math.round(elapsed * 10) / 10);
      setResponseStatus(500);
      setResponseOutput(
        JSON.stringify(
          {
            error: err.message || "Network request failed",
          },
          null,
          2
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (!responseOutput) return;
    navigator.clipboard.writeText(responseOutput);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const handleCopySnippet = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  /* -------------------------------------------------------------------------- */
  /* Multi-Language Code Snippet Generator                                      */
  /* -------------------------------------------------------------------------- */

  const generateSnippet = (lang: CodeLang): string => {
    const url = `https://synclium.com${requestPath}`;

    if (lang === "curl") {
      if (requestMethod === "GET") {
        return `curl -X GET "${url}" \\
  -H "Accept: application/json"`;
      }
      return `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '${requestBody.replace(/'/g, "'\\''")}'`;
    }

    if (lang === "typescript") {
      if (requestPath.includes("/convert")) {
        return `// 1. Direct SDK Usage (Fastest, In-Memory)
import { convert } from "synclium";

const rawXml = \`...\`; // Your invoice XML or JSON AST
const outputXml = convert(rawXml, "auto", "zatca");
console.log("Transpiled Output:", outputXml);

// 2. Or via HTTP REST API
const res = await fetch("${url}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${requestBody || "{}"}),
});
const result = await res.json();
console.log(result);`;
      }
      return `import { validateFormat } from "synclium";

const res = await fetch("${url}", {
  method: "${requestMethod}",
  headers: { "Content-Type": "application/json" },
  ${requestMethod === "POST" ? `body: JSON.stringify(${requestBody || "{}"}),` : ""}
});
const result = await res.json();
console.log(result);`;
    }

    if (lang === "python") {
      if (requestMethod === "GET") {
        return `import requests

url = "${url}"
headers = {"Accept": "application/json"}

response = requests.get(url, headers=headers)
print(response.status_code)
print(response.json())`;
      }
      return `import requests
import json

url = "${url}"
payload = ${requestBody ? JSON.stringify(JSON.parse(requestBody), null, 4) : "{}"}
headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}

response = requests.post(url, json=payload, headers=headers)
print(f"Status: {response.status_code}")
print(response.json())`;
    }

    if (lang === "go") {
      return `package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "${url}"
	payload := []byte(\`${requestBody}\`)

	req, _ := http.NewRequest("${requestMethod}", url, bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println("Status:", resp.StatusCode)
	fmt.Println("Response:", string(body))
}`;
    }

    if (lang === "csharp") {
      return `using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        using var client = new HttpClient();
        var url = "${url}";
        var content = new StringContent(
            @${JSON.stringify(requestBody)},
            Encoding.UTF8,
            "application/json"
        );

        var response = await client.${requestMethod === "POST" ? "PostAsync(url, content)" : "GetAsync(url)"};
        var responseString = await response.Content.ReadAsStringAsync();

        Console.WriteLine($"Status: {response.StatusCode}");
        Console.WriteLine(responseString);
    }
}`;
    }

    if (lang === "php") {
      return `<?php

$url = "${url}";
$data = ${requestBody ? JSON.stringify(requestBody) : "''"};

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${requestMethod}");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
${requestMethod === "POST" ? "curl_setopt($ch, CURLOPT_POSTFIELDS, $data);" : ""}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Status: " . $httpCode . "\\n";
echo $response;
`;
    }

    if (lang === "rust") {
      return `use reqwest::Client;
use serde_json::Value;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std.error::Error>> {
    let client = Client::new();
    let url = "${url}";
    let payload: Value = serde_json::from_str(r#"${requestBody.replace(/"/g, '\\"')}"#)?;

    let res = client.${requestMethod.toLowerCase()}(url)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        ${requestMethod === "POST" ? ".json(&payload)" : ""}
        .send()
        .await?;

    println!("Status: {}", res.status());
    let body = res.text().await?;
    println!("Response: {}", body);

    Ok(())
}`;
    }

    return "";
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "dark bg-[#05070a] text-slate-100" : "bg-slate-50 text-slate-900"} font-sans transition-colors duration-200`}>
      
      {/* -------------------------------------------------------------------- */}
      {/* 1. Global Navigation Header                                          */}
      {/* -------------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-slate-300 dark:border-[#21262d] bg-white/95 dark:bg-[#07090e]/95 backdrop-blur font-mono">
        <div className="mx-auto max-w-[1700px] px-4 sm:px-6 py-2.5 flex items-center justify-between">
          
          <div className="flex items-center gap-6 sm:gap-8">
            <Link href="/" className="flex items-center group">
              <img src="/logo.png" alt="Synclium" className="h-11 sm:h-11 w-auto object-contain drop-shadow-sm" />
              <div className="flex items-baseline gap-1.5 ml-1">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-[#58a6ff] transition-colors">
                  SYNCLIUM
                </span>
                <span className="text-[10px] px-1.5 py-0.2 border border-slate-300 dark:border-[#30363d] bg-slate-100 dark:bg-[#161b22] text-slate-600 dark:text-slate-400 font-semibold">
                  DOCS &amp; PLAYGROUND
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-xs text-slate-600 dark:text-slate-400">
              <Link href="/#mandates" className="hover:text-blue-600 dark:hover:text-[#58a6ff] transition-colors">
                Mandates
              </Link>
              <Link href="/#architecture" className="hover:text-blue-600 dark:hover:text-[#58a6ff] transition-colors">
                Architecture
              </Link>
              <Link href="/#benchmarks" className="hover:text-blue-600 dark:hover:text-[#58a6ff] transition-colors">
                Benchmarks
              </Link>
              <Link href="/docs" className="text-blue-600 dark:text-[#58a6ff] font-bold border-b-2 border-blue-600 dark:border-[#58a6ff] pb-0.5">
                API Docs
              </Link>
              <Link href="/console" className="text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-[#58a6ff] font-semibold transition-colors">
                Console
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/console"
              className="h-7 px-3 inline-flex items-center gap-1.5 border border-blue-600 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm"
            >
              <span>Workbench</span>
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
              className="h-7 w-7 flex items-center justify-center border border-slate-300 dark:border-[#30363d] bg-slate-100 dark:bg-[#161b22] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#21262d] transition-colors"
            >
              {theme === "dark" ? <SunIcon className="w-3.5 h-3.5" /> : <MoonIcon className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* 2. Hero & Sub-Navigation Tabs                                        */}
      {/* -------------------------------------------------------------------- */}
      <div className="border-b border-slate-300 dark:border-[#21262d] bg-slate-100/60 dark:bg-[#090d14] font-mono">
        <div className="mx-auto max-w-[1700px] px-4 sm:px-6 py-6 sm:py-8">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-[#58a6ff] font-bold uppercase tracking-wider">
                <TerminalIcon className="w-4 h-4" />
                <span>DEVELOPER PORTAL &amp; COMPILER SUITE</span>
              </div>
              <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                Developer Docs &amp; Live API Playground
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                Test transpilation endpoints live in your browser, generate copy-paste SDK code in 7 languages, inspect Schematron business rules, and integrate enterprise ERP systems (Odoo, SAP, NetSuite, QuickBooks).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/api/openapi.json"
                target="_blank"
                rel="noreferrer"
                className="h-8 px-3 inline-flex items-center gap-1.5 border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#161b22] text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-blue-500 transition-colors shadow-sm"
              >
                <FileJsonIcon className="w-3.5 h-3.5 text-blue-500" />
                <span>OpenAPI 3.1 Spec</span>
                <ExternalLinkIcon className="w-3 h-3 opacity-60" />
              </a>

              <div className="h-8 px-3 inline-flex items-center gap-2 border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#161b22] text-xs font-mono text-slate-800 dark:text-slate-300 shadow-sm">
                <span className="text-slate-400">$</span>
                <span className="font-semibold text-blue-600 dark:text-[#58a6ff]">npm install synclium</span>
              </div>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="mt-6 flex flex-wrap gap-1 border-b border-slate-300 dark:border-[#21262d] -mb-px">
            <button
              onClick={() => setActiveTab("playground")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === "playground"
                  ? "border-blue-600 text-blue-600 dark:border-[#58a6ff] dark:text-[#58a6ff] bg-white dark:bg-[#05070a]"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <PlayIcon className="w-3.5 h-3.5" />
              <span>Interactive Playground</span>
            </button>

            <button
              onClick={() => setActiveTab("recipes")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === "recipes"
                  ? "border-blue-600 text-blue-600 dark:border-[#58a6ff] dark:text-[#58a6ff] bg-white dark:bg-[#05070a]"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <WorkflowIcon className="w-3.5 h-3.5" />
              <span>ERP Recipes (Odoo / SAP / NetSuite)</span>
            </button>

            <button
              onClick={() => setActiveTab("sdk")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === "sdk"
                  ? "border-blue-600 text-blue-600 dark:border-[#58a6ff] dark:text-[#58a6ff] bg-white dark:bg-[#05070a]"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <BookOpenIcon className="w-3.5 h-3.5" />
              <span>TypeScript SDK Reference</span>
            </button>

            <button
              onClick={() => setActiveTab("matrix")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === "matrix"
                  ? "border-blue-600 text-blue-600 dark:border-[#58a6ff] dark:text-[#58a6ff] bg-white dark:bg-[#05070a]"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <LayersIcon className="w-3.5 h-3.5" />
              <span>Format &amp; Schematron Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab("openapi")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === "openapi"
                  ? "border-blue-600 text-blue-600 dark:border-[#58a6ff] dark:text-[#58a6ff] bg-white dark:bg-[#05070a]"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <BracesIcon className="w-3.5 h-3.5" />
              <span>OpenAPI 3.1 Explorer</span>
            </button>
          </div>

        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 3. Main Content Area by Tab                                          */}
      {/* -------------------------------------------------------------------- */}
      <main className="mx-auto max-w-[1700px] px-4 sm:px-6 py-8">
        
        {/* ================================================================== */}
        {/* TAB 1: INTERACTIVE API PLAYGROUND                                   */}
        {/* ================================================================== */}
        {activeTab === "playground" && (
          <div className="space-y-8 font-mono">
            
            {/* Presets Bar */}
            <div className="border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-4">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase">
                  <SlidersIcon className="w-4 h-4 text-blue-600 dark:text-[#58a6ff]" />
                  <span>PRE-CONFIGURED REQUEST SCENARIOS</span>
                </div>
                <span className="text-[11px] text-slate-500">Select a scenario to auto-populate request headers, method, and payload</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {PLAYGROUND_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => selectPreset(preset)}
                    className={`p-2.5 text-left border transition-all text-xs flex flex-col justify-between ${
                      selectedPreset.id === preset.id
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 shadow-sm"
                        : "border-slate-200 dark:border-[#21262d] bg-slate-50 dark:bg-[#161b22] text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold truncate">{preset.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 font-bold ${
                          preset.method === "POST"
                            ? "bg-emerald-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {preset.method}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Dual-Pane Request & Response Sandbox */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* LEFT: Request Builder */}
              <div className="border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] flex flex-col">
                <div className="px-4 py-2.5 bg-slate-100 dark:bg-[#161b22] border-b border-slate-300 dark:border-[#21262d] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                      REQUEST BUILDER
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Stateless Execution // Memory-Isolated
                  </span>
                </div>

                <div className="p-4 space-y-4 flex-1 flex flex-col">
                  {/* URL Bar & Send Button */}
                  <div className="flex items-stretch gap-2">
                    <div className="h-9 px-3 flex items-center bg-slate-200 dark:bg-[#21262d] text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-[#30363d]">
                      {requestMethod}
                    </div>
                    <input
                      type="text"
                      value={requestPath}
                      onChange={(e) => setRequestPath(e.target.value)}
                      className="flex-1 h-9 px-3 text-xs bg-slate-50 dark:bg-[#05070a] border border-slate-300 dark:border-[#30363d] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={executePlaygroundRequest}
                      disabled={isLoading}
                      className="h-9 px-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      {isLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        <SendIcon className="w-3.5 h-3.5" />
                      )}
                      <span>Execute</span>
                    </button>
                  </div>

                  {/* Headers Preview */}
                  <div className="text-[11px] p-2.5 bg-slate-50 dark:bg-[#05070a] border border-slate-200 dark:border-[#21262d] text-slate-600 dark:text-slate-400 space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Content-Type:</span>
                      <span className="text-slate-700 dark:text-slate-300">application/json</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Accept:</span>
                      <span className="text-slate-700 dark:text-slate-300">application/json</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Engine:</span>
                      <span className="text-blue-600 dark:text-[#58a6ff]">Synclium Canonical Transpiler v0.1.0</span>
                    </div>
                  </div>

                  {/* Request Body JSON Editor */}
                  {requestMethod === "POST" && (
                    <div className="flex-1 flex flex-col min-h-[340px]">
                      <div className="flex items-center justify-between pb-1.5 text-xs text-slate-500">
                        <span>Payload Body (JSON):</span>
                        <span>{requestBody.length} characters</span>
                      </div>
                      <textarea
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        className="w-full flex-1 p-3 text-xs leading-relaxed bg-slate-50 dark:bg-[#05070a] border border-slate-300 dark:border-[#30363d] text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 resize-y"
                        spellCheck={false}
                        rows={16}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Live Response & Telemetry */}
              <div className="border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] flex flex-col">
                <div className="px-4 py-2.5 bg-slate-100 dark:bg-[#161b22] border-b border-slate-300 dark:border-[#21262d] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                      RESPONSE &amp; TELEMETRY
                    </span>
                    {responseStatus !== null && (
                      <span
                        className={`text-[10px] px-2 py-0.5 font-bold ${
                          responseStatus >= 200 && responseStatus < 300
                            ? "bg-emerald-600 text-white"
                            : responseStatus === 429
                            ? "bg-amber-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {responseStatus} {responseStatus === 200 ? "OK" : responseStatus === 422 ? "UNPROCESSABLE" : responseStatus === 429 ? "TOO MANY REQUESTS" : "ERROR"}
                      </span>
                    )}
                  </div>

                  {latencyMs !== null && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      <GaugeIcon className="w-3.5 h-3.5" />
                      <span>{latencyMs} ms</span>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  {/* Action Bar */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Formatted JSON / Transpiled Output:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyResponse}
                        disabled={!responseOutput}
                        className="px-2.5 py-1 inline-flex items-center gap-1 border border-slate-300 dark:border-[#30363d] bg-slate-100 dark:bg-[#161b22] text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-400 disabled:opacity-40 transition-colors"
                      >
                        {copiedResponse ? <CheckIcon className="w-3 h-3 text-emerald-500" /> : <CopyIcon className="w-3 h-3" />}
                        <span>{copiedResponse ? "Copied" : "Copy"}</span>
                      </button>

                      <Link
                        href="/console"
                        className="px-2.5 py-1 inline-flex items-center gap-1 border border-blue-600 text-blue-600 dark:text-[#58a6ff] hover:bg-blue-50 dark:hover:bg-blue-950/40 text-[11px] font-semibold transition-colors"
                      >
                        <span>Open in Console</span>
                        <span>➔</span>
                      </Link>
                    </div>
                  </div>

                  {/* Response Text Box */}
                  <div className="flex-1 bg-slate-50 dark:bg-[#05070a] border border-slate-300 dark:border-[#30363d] p-3 overflow-x-auto min-h-[380px] max-h-[580px] text-xs leading-relaxed">
                    {responseOutput ? (
                      <pre className="text-slate-900 dark:text-slate-200">{responseOutput}</pre>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-center py-16 space-y-2">
                        <ServerIcon className="w-8 h-8 opacity-40" />
                        <p className="text-xs">No request executed yet.</p>
                        <p className="text-[11px] text-slate-500">Click &quot;Execute&quot; above to dispatch the test payload to the live server.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Multi-Language Code Snippet Generator */}
            <div className="border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117]">
              <div className="px-4 py-2.5 bg-slate-100 dark:bg-[#161b22] border-b border-slate-300 dark:border-[#21262d] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-blue-600 dark:text-[#58a6ff]" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                    CODE GENERATOR // EXECUTABLE CLIENT SNIPPETS (7 LANGUAGES)
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {(["curl", "typescript", "python", "go", "csharp", "php", "rust"] as CodeLang[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`px-2.5 py-1 text-[11px] font-bold uppercase transition-colors border ${
                        activeLang === lang
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 dark:border-[#30363d] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      {lang === "csharp" ? "C# (.NET)" : lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 relative">
                <div className="absolute top-6 right-6">
                  <button
                    onClick={() => handleCopySnippet(generateSnippet(activeLang))}
                    className="px-2.5 py-1 inline-flex items-center gap-1 border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#161b22] text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-400 shadow-sm transition-colors"
                  >
                    {copiedSnippet ? <CheckIcon className="w-3 h-3 text-emerald-500" /> : <CopyIcon className="w-3 h-3" />}
                    <span>{copiedSnippet ? "Copied" : "Copy Code"}</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-[#05070a] border border-slate-300 dark:border-[#30363d] overflow-x-auto text-xs leading-relaxed text-slate-900 dark:text-slate-200">
                  <pre>{generateSnippet(activeLang)}</pre>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: ENTERPRISE ERP INTEGRATION RECIPES                          */}
        {/* ================================================================== */}
        {activeTab === "recipes" && (
          <div className="space-y-8 font-mono">
            
            <div className="border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-6">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-[#58a6ff] uppercase">
                <WorkflowIcon className="w-4 h-4" />
                <span>PRODUCTION ERP INTEGRATION ARCHITECTURES</span>
              </div>
              <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white uppercase">
                Direct Ingestion &amp; Clearance Bridges for Leading ERP Systems
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-4xl leading-relaxed">
                Connect your core accounting system directly to Synclium without altering database schemas or writing custom XML serializers. Synclium standardizes invoice outputs into certified EN16931 PEPPOL BIS 3.0, Factur-X / ZUGFeRD, and Saudi ZATCA Phase 2 formats.
              </p>

              {/* ERP Tab Switcher */}
              <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-300 dark:border-[#21262d] pb-3">
                <button
                  onClick={() => setActiveErp("odoo")}
                  className={`px-3.5 py-1.5 text-xs font-bold uppercase transition-colors border ${
                    activeErp === "odoo"
                      ? "border-purple-600 bg-purple-600 text-white"
                      : "border-slate-300 dark:border-[#30363d] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  01 // Odoo ERP (Python / XML-RPC)
                </button>
                <button
                  onClick={() => setActiveErp("sap")}
                  className={`px-3.5 py-1.5 text-xs font-bold uppercase transition-colors border ${
                    activeErp === "sap"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 dark:border-[#30363d] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  02 // SAP S/4HANA (BAPI / IDoc Bridge)
                </button>
                <button
                  onClick={() => setActiveErp("netsuite")}
                  className={`px-3.5 py-1.5 text-xs font-bold uppercase transition-colors border ${
                    activeErp === "netsuite"
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-300 dark:border-[#30363d] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  03 // Oracle NetSuite (SuiteScript 2.1)
                </button>
                <button
                  onClick={() => setActiveErp("quickbooks")}
                  className={`px-3.5 py-1.5 text-xs font-bold uppercase transition-colors border ${
                    activeErp === "quickbooks"
                      ? "border-amber-600 bg-amber-600 text-white"
                      : "border-slate-300 dark:border-[#30363d] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  04 // QuickBooks &amp; Xero (Webhooks)
                </button>
              </div>

              {/* Recipe Content */}
              <div className="mt-6">
                
                {/* ODOO RECIPE */}
                {activeErp === "odoo" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                        Odoo 16 / 17 / 18 Automated Invoicing Hook
                      </h3>
                      <span className="text-[11px] text-slate-500">Python 3.10+ // Odoo Community &amp; Enterprise</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Override the standard `account.move` model `action_post()` method to intercept newly posted invoices, export standard UBL 2.1 from Odoo, dispatch the payload to Synclium, and attach the verified ZATCA / Factur-X XML to the chatter.
                    </p>

                    <div className="p-4 bg-slate-50 dark:bg-[#05070a] border border-slate-300 dark:border-[#30363d] overflow-x-auto text-xs leading-relaxed text-slate-900 dark:text-slate-200">
                      <pre>{`# -*- coding: utf-8 -*-
# custom_synclium_bridge/models/account_move.py

import requests
import base64
from odoo import models, fields, api, _
from odoo.exceptions import UserError

SYNCLIUM_ENDPOINT = "https://synclium.com/api/convert"

class AccountMove(models.Model):
    _inherit = "account.move"

    synclium_zatca_xml = fields.Binary("ZATCA Phase 2 XML", readonly=True, copy=False)
    synclium_cleared = fields.Boolean("E-Invoice Cleared", default=False, copy=False)

    def action_post(self):
        # 1. Execute default Odoo posting workflow
        res = super(AccountMove, self).action_post()

        for move in self.filtered(lambda m: m.is_invoice(include_receipts=True)):
            # 2. Extract standard UBL 2.1 raw bytes generated by Odoo EDI
            ubl_content = move._export_as_ubl() if hasattr(move, "_export_as_ubl") else None
            if not ubl_content:
                continue

            # 3. Transpile via Synclium API into target mandate (e.g. Saudi ZATCA Phase 2)
            try:
                response = requests.post(
                    SYNCLIUM_ENDPOINT,
                    json={
                        "input": ubl_content.decode("utf-8"),
                        "from": "ubl",
                        "to": "zatca"
                    },
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                if response.status_code == 200:
                    data = response.json()
                    zatca_xml_str = data.get("output", "")
                    
                    # 4. Attach compliant XML to Odoo record
                    move.write({
                        "synclium_zatca_xml": base64.b64encode(zatca_xml_str.encode("utf-8")),
                        "synclium_cleared": True
                    })
                    move.message_post(body=_("Successfully transpiled and cleared via Synclium Engine."))
                else:
                    move.message_post(body=_("Synclium Warning: %s") % response.text)
            except Exception as e:
                # Log without blocking transaction or raise if mandatory clearance is required
                move.message_post(body=_("Synclium Transpilation Failed: %s") % str(e))

        return res`}</pre>
                    </div>
                  </div>
                )}

                {/* SAP S/4HANA RECIPE */}
                {activeErp === "sap" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                        SAP S/4HANA INVOIC02 IDoc / OData Middleware Connector
                      </h3>
                      <span className="text-[11px] text-slate-500">Node.js TypeScript Connector // SAP BTP / On-Prem Gateway</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Transform SAP IDoc segments (`E1EDK01`, `E1EDP01`, `E1EDS01`) into Synclium Canonical AST, execute Schematron validation, and output compliant PEPPOL BIS 3.0 UBL.
                    </p>

                    <div className="p-4 bg-slate-50 dark:bg-[#05070a] border border-slate-300 dark:border-[#30363d] overflow-x-auto text-xs leading-relaxed text-slate-900 dark:text-slate-200">
                      <pre>{`// sap-synclium-bridge.ts
import { convert, validateCanonicalInvoice, type CanonicalInvoice } from "synclium";

interface SapIdocPayload {
  IDOC: {
    EDI_DC40: { DOCNUM: string; SNDPRN: string };
    E1EDK01: { BELNR: string; CURCY: string; REC_DATE: string };
    E1EDKA1: Array<{ PARVW: string; PARTN: string; NAME1: string; STCEG: string }>;
    E1EDP01: Array<{ POSEX: string; MENGE: string; MENEE: string; NETWR: string; ARKTX: string; MWSKZ: string }>;
    E1EDS01: Array<{ SUMID: string; SUMME: string }>;
  };
}

export function transpileSapIdocToPeppol(idoc: SapIdocPayload): string {
  const k01 = idoc.IDOC.E1EDK01;
  const supplierPart = idoc.IDOC.E1EDKA1.find(p => p.PARVW === "LF")!;
  const customerPart = idoc.IDOC.E1EDKA1.find(p => p.PARVW === "WE")!;

  // 1. Construct Synclium Canonical AST
  const canonical: CanonicalInvoice = {
    id: k01.BELNR,
    issueDate: k01.REC_DATE || new Date().toISOString().split("T")[0],
    currency: k01.CURCY || "EUR",
    typeCode: "388",
    supplier: {
      name: supplierPart.NAME1,
      vatId: supplierPart.STCEG,
      taxScheme: "VAT",
    },
    customer: {
      name: customerPart.NAME1,
      vatId: customerPart.STCEG,
      taxScheme: "VAT",
    },
    lines: idoc.IDOC.E1EDP01.map((item, idx) => ({
      id: String(idx + 1),
      name: item.ARKTX || "Material Item",
      quantity: parseFloat(item.MENGE),
      unitCode: item.MENEE === "ST" ? "H87" : "C62",
      unitPrice: parseFloat(item.NETWR) / parseFloat(item.MENGE),
      lineExtensionAmount: parseFloat(item.NETWR),
      taxCategory: "S",
      taxRate: 19.00,
    })),
    totals: {
      lineExtensionAmount: parseFloat(idoc.IDOC.E1EDS01.find(s => s.SUMID === "020")?.SUMME || "0"),
      taxExclusiveAmount: parseFloat(idoc.IDOC.E1EDS01.find(s => s.SUMID === "020")?.SUMME || "0"),
      taxInclusiveAmount: parseFloat(idoc.IDOC.E1EDS01.find(s => s.SUMID === "011")?.SUMME || "0"),
      taxAmount: parseFloat(idoc.IDOC.E1EDS01.find(s => s.SUMID === "005")?.SUMME || "0"),
      payableAmount: parseFloat(idoc.IDOC.E1EDS01.find(s => s.SUMID === "011")?.SUMME || "0"),
    },
  };

  // 2. Validate against EN16931 rules
  const validation = validateCanonicalInvoice(canonical);
  if (!validation.valid) {
    throw new Error(\`SAP Canonical Validation Failed: \${JSON.stringify(validation.errors)}\`);
  }

  // 3. Compile directly into PEPPOL BIS 3.0 UBL XML
  return convert(JSON.stringify(canonical), "canonical", "ubl");
}`}</pre>
                    </div>
                  </div>
                )}

                {/* NETSUITE RECIPE */}
                {activeErp === "netsuite" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                        Oracle NetSuite SuiteScript 2.1 UserEvent Script
                      </h3>
                      <span className="text-[11px] text-slate-500">SuiteScript 2.1 // Server-Side Trigger</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Dispatches invoice record data to the Synclium Transpiler on `afterSubmit` event and stores the generated Factur-X CII XML in NetSuite File Cabinet.
                    </p>

                    <div className="p-4 bg-slate-50 dark:bg-[#05070a] border border-slate-300 dark:border-[#30363d] overflow-x-auto text-xs leading-relaxed text-slate-900 dark:text-slate-200">
                      <pre>{`/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/https', 'N/file', 'N/record', 'N/log'], (https, file, record, log) => {

  const SYNCLIUM_API_URL = 'https://synclium.com/api/convert';

  const afterSubmit = (scriptContext) => {
    if (scriptContext.type !== scriptContext.UserEventType.CREATE && scriptContext.type !== scriptContext.UserEventType.EDIT) {
      return;
    }

    const newRecord = scriptContext.newRecord;
    const invoiceId = newRecord.getValue({ fieldId: 'tranid' });
    const lineCount = newRecord.getLineCount({ sublistId: 'item' });

    // 1. Build Canonical AST from NetSuite record
    const lines = [];
    for (let i = 0; i < lineCount; i++) {
      lines.push({
        id: String(i + 1),
        name: newRecord.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i }) || 'Line Item',
        quantity: Number(newRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }) || 1),
        unitCode: 'C62',
        unitPrice: Number(newRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }) || 0),
        lineExtensionAmount: Number(newRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }) || 0),
        taxCategory: 'S',
        taxRate: 20.0
      });
    }

    const payload = {
      input: JSON.stringify({
        id: invoiceId,
        issueDate: new Date().toISOString().split('T')[0],
        currency: newRecord.getText({ fieldId: 'currency' }) || 'EUR',
        typeCode: '388',
        supplier: { name: 'Acme Enterprise Ltd', vatId: 'FR12345678901', taxScheme: 'VAT' },
        customer: { name: newRecord.getText({ fieldId: 'entity' }), vatId: 'FR98765432109', taxScheme: 'VAT' },
        lines: lines,
        totals: {
          lineExtensionAmount: Number(newRecord.getValue({ fieldId: 'subtotal' }) || 0),
          taxExclusiveAmount: Number(newRecord.getValue({ fieldId: 'subtotal' }) || 0),
          taxInclusiveAmount: Number(newRecord.getValue({ fieldId: 'total' }) || 0),
          taxAmount: Number(newRecord.getValue({ fieldId: 'taxtotal' }) || 0),
          payableAmount: Number(newRecord.getValue({ fieldId: 'total' }) || 0)
        }
      }),
      from: 'canonical',
      to: 'facturx'
    };

    // 2. Call Synclium API
    const response = https.post({
      url: SYNCLIUM_API_URL,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.code === 200) {
      const resData = JSON.parse(response.body);
      const xmlFile = file.create({
        name: \`\${invoiceId}_facturx.xml\`,
        fileType: file.Type.XMLDOC,
        contents: resData.output,
        folder: -15 // NetSuite File Cabinet Attachment Folder ID
      });
      const fileId = xmlFile.save();
      log.audit('Synclium Clearance Success', \`Attached XML File ID: \${fileId}\`);
    }
  };

  return { afterSubmit };
});`}</pre>
                    </div>
                  </div>
                )}

                {/* QUICKBOOKS & XERO RECIPE */}
                {activeErp === "quickbooks" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                        QuickBooks Online &amp; Xero Webhook Handler
                      </h3>
                      <span className="text-[11px] text-slate-500">Node.js Express / Next.js Serverless Route</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Listen for `Invoice.Create` webhook notifications, fetch full invoice payloads via OAuth2, normalize into Synclium Canonical AST, and publish clearance XML to customer endpoints.
                    </p>

                    <div className="p-4 bg-slate-50 dark:bg-[#05070a] border border-slate-300 dark:border-[#30363d] overflow-x-auto text-xs leading-relaxed text-slate-900 dark:text-slate-200">
                      <pre>{`// webhook-handler.ts
import { convert, validateFormat } from "synclium";
import type { Request, Response } from "express";

export async function handleQuickBooksWebhook(req: Request, res: Response) {
  const event = req.body;
  
  // 1. Verify QuickBooks webhook signature
  // ... crypto verification ...

  const qbInvoice = event.entities[0]; // Sample QB Invoice Object
  
  // 2. Map QuickBooks Invoice lines to Canonical AST
  const canonicalPayload = {
    id: qbInvoice.DocNumber,
    issueDate: qbInvoice.TxnDate,
    currency: qbInvoice.CurrencyRef?.value || "USD",
    typeCode: "388",
    supplier: {
      name: "Global Digital Corp",
      vatId: "US987654321",
      taxScheme: "VAT"
    },
    customer: {
      name: qbInvoice.CustomerRef.name,
      vatId: "DE812345678",
      taxScheme: "VAT"
    },
    lines: qbInvoice.Line.filter((l: any) => l.DetailType === "SalesItemLineDetail").map((l: any, idx: number) => ({
      id: String(idx + 1),
      name: l.Description || "Service Item",
      quantity: l.SalesItemLineDetail.Qty || 1,
      unitCode: "C62",
      unitPrice: l.SalesItemLineDetail.UnitPrice || 0,
      lineExtensionAmount: l.Amount || 0,
      taxCategory: "S",
      taxRate: 19.0
    })),
    totals: {
      lineExtensionAmount: qbInvoice.TotalAmt,
      taxExclusiveAmount: qbInvoice.TotalAmt,
      taxInclusiveAmount: qbInvoice.TotalAmt,
      taxAmount: 0.0,
      payableAmount: qbInvoice.TotalAmt
    }
  };

  // 3. Multi-transpile into both European UBL (PEPPOL) and Factur-X
  const ublXml = convert(JSON.stringify(canonicalPayload), "canonical", "ubl");
  const facturxXml = convert(JSON.stringify(canonicalPayload), "canonical", "facturx");

  // 4. Validate output
  const validation = validateFormat(ublXml, "ubl");
  console.log(\`PEPPOL Validation Status: \${validation.valid ? "PASSED" : "FAILED"}\`);

  res.status(200).json({ status: "cleared", ublXml, facturxXml });
}`}</pre>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: TYPESCRIPT SDK REFERENCE                                   */}
        {/* ================================================================== */}
        {activeTab === "sdk" && (
          <div className="space-y-8 font-mono">
            
            <div className="border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-6 space-y-6">
              
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-[#58a6ff] uppercase">
                  <BookOpenIcon className="w-4 h-4" />
                  <span>SYNCLIUM SDK API REFERENCE</span>
                </div>
                <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white uppercase">
                  TypeScript &amp; Node.js Native Transpiler (`synclium@0.1.0`)
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-4xl leading-relaxed">
                  The `synclium` SDK provides high-performance, synchronous, zero-dependency in-memory conversion across national electronic invoicing specifications. It runs seamlessly on Node.js 18+, Bun, Deno, and modern Edge runtimes.
                </p>
              </div>

              {/* Install box */}
              <div className="p-4 bg-slate-50 dark:bg-[#05070a] border border-slate-300 dark:border-[#30363d]">
                <span className="text-xs text-slate-500 font-bold uppercase">Package Installation:</span>
                <div className="mt-2 flex items-center justify-between gap-4 text-xs font-mono">
                  <code className="text-blue-600 dark:text-[#58a6ff] font-bold">
                    npm install synclium
                  </code>
                  <span className="text-[11px] text-slate-500">Dual ESM / CJS Native Exports</span>
                </div>
              </div>

              {/* Core Methods Grid */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-300 dark:border-[#21262d] pb-2">
                  PRIMARY SDK METHODS &amp; SCHEMAS
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  
                  <div className="p-4 border border-slate-200 dark:border-[#21262d] bg-slate-50 dark:bg-[#161b22] space-y-2">
                    <div className="flex items-center justify-between">
                      <code className="font-bold text-blue-600 dark:text-[#58a6ff]">convert(input, from, to)</code>
                      <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">Synchronous</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      The universal entry point. Accepts raw XML string or JSON string. If `from` is &quot;auto&quot;, inspects XML namespace and root tag signatures automatically.
                    </p>
                  </div>

                  <div className="p-4 border border-slate-200 dark:border-[#21262d] bg-slate-50 dark:bg-[#161b22] space-y-2">
                    <div className="flex items-center justify-between">
                      <code className="font-bold text-blue-600 dark:text-[#58a6ff]">validateFormat(input, format)</code>
                      <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">Schematron</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Executes full EN16931 rules, ZATCA Phase 2 structural tags, and allowance/charge reconciliation (BR-S-08). Returns `{` valid, errors, warnings `}`.
                    </p>
                  </div>

                  <div className="p-4 border border-slate-200 dark:border-[#21262d] bg-slate-50 dark:bg-[#161b22] space-y-2">
                    <div className="flex items-center justify-between">
                      <code className="font-bold text-blue-600 dark:text-[#58a6ff]">validateCanonicalInvoice(ast)</code>
                      <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">Zod Schema</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Verifies runtime AST integrity against `CanonicalInvoiceSchema`. Validates tax subtotals, rounding precision, and mandatory ISO 3166 country codes.
                    </p>
                  </div>

                  <div className="p-4 border border-slate-200 dark:border-[#21262d] bg-slate-50 dark:bg-[#161b22] space-y-2">
                    <div className="flex items-center justify-between">
                      <code className="font-bold text-blue-600 dark:text-[#58a6ff]">importUBL / exportZATCA / ...</code>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Direct Adapters</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Fine-grained format modules (`@synclium-com/ubl`, `@synclium-com/facturx`, `@synclium-com/zatca`) allowing modular tree-shaking in custom bundlers.
                    </p>
                  </div>

                </div>
              </div>

              {/* Complete Code Example */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">Complete End-to-End TypeScript Example:</span>
                <div className="p-4 bg-slate-50 dark:bg-[#05070a] border border-slate-300 dark:border-[#30363d] overflow-x-auto text-xs leading-relaxed text-slate-900 dark:text-slate-200">
                  <pre>{`import { convert, validateFormat, FormatError } from "synclium";
import { readFileSync, writeFileSync } from "node:fs";

try {
  // 1. Read input invoice (e.g. EU PEPPOL UBL 2.1 XML)
  const rawXml = readFileSync("invoice-peppol.xml", "utf-8");

  // 2. Validate source document compliance before transpile
  const sourceCheck = validateFormat(rawXml, "ubl");
  if (!sourceCheck.valid) {
    console.error("Schematron Issues in Source:", sourceCheck.errors);
  }

  // 3. Transpile to Saudi ZATCA Phase 2 format
  const zatcaXml = convert(rawXml, "ubl", "zatca");

  // 4. Validate output structure against ZATCA rules
  const targetCheck = validateFormat(zatcaXml, "zatca");
  console.log("ZATCA Valid:", targetCheck.valid);

  // 5. Save transpiled clearance XML
  writeFileSync("invoice-zatca-phase2.xml", zatcaXml, "utf-8");
  console.log("Transpilation Complete (0 allocations outside heap).");

} catch (err) {
  if (err instanceof FormatError) {
    console.error(\`Transpilation Error [Code \${err.code}]: \${err.message}\`);
  } else {
    console.error("Fatal Error:", err);
  }
}`}</pre>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 4: FORMAT & SCHEMATRON MATRIX                                 */}
        {/* ================================================================== */}
        {activeTab === "matrix" && (
          <div className="space-y-8 font-mono">
            
            <div className="border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-6 space-y-6">
              
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-[#58a6ff] uppercase">
                  <LayersIcon className="w-4 h-4" />
                  <span>COMPLIANCE &amp; SCHEMATRON SPECIFICATION MATRIX</span>
                </div>
                <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white uppercase">
                  Cross-Border Format Capabilities &amp; Business Rules
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-4xl leading-relaxed">
                  Detailed architectural comparison across European, Franco-German, Saudi Arabian, and international electronic invoicing standards enforced by Synclium.
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-300 dark:border-[#30363d]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-[#161b22] border-b border-slate-300 dark:border-[#21262d] text-slate-900 dark:text-white">
                    <tr>
                      <th className="p-3 font-bold">Standard Identifier</th>
                      <th className="p-3 font-bold">Root Tag &amp; Namespace</th>
                      <th className="p-3 font-bold">Tax Authority / Jurisdiction</th>
                      <th className="p-3 font-bold">Compliance Model</th>
                      <th className="p-3 font-bold">Customization / Profile ID</th>
                      <th className="p-3 font-bold">Key Schematron Rules</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#21262d] text-slate-700 dark:text-slate-300">
                    
                    <tr className="hover:bg-slate-50 dark:hover:bg-[#161b22]/50">
                      <td className="p-3 font-bold text-blue-600 dark:text-[#58a6ff]">
                        UBL 2.1 / PEPPOL BIS Billing 3.0
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        urn:oasis:names:specification:ubl:schema:xsd:Invoice-2
                      </td>
                      <td className="p-3">European Union (OpenPeppol)</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold text-[10px]">
                          4-Corner Network
                        </span>
                      </td>
                      <td className="p-3 text-[11px] font-mono">
                        urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0
                      </td>
                      <td className="p-3 text-[11px]">
                        BR-S-08, BR-CO-10, BR-16 (VAT breakdowns)
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 dark:hover:bg-[#161b22]/50">
                      <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                        Factur-X 1.0.06 / ZUGFeRD 2.2
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100
                      </td>
                      <td className="p-3">France (Chorus Pro) / Germany (XRechnung)</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold text-[10px]">
                          Hybrid PDF/A-3 + XML
                        </span>
                      </td>
                      <td className="p-3 text-[11px] font-mono">
                        urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931
                      </td>
                      <td className="p-3 text-[11px]">
                        CalculatedTaxTotal reconciliation, LineExtensionAmount
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 dark:hover:bg-[#161b22]/50">
                      <td className="p-3 font-bold text-purple-600 dark:text-purple-400">
                        ZATCA Phase 2 (Fatoora)
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        urn:oasis:names:specification:ubl:schema:xsd:Invoice-2 (ZATCA UBL)
                      </td>
                      <td className="p-3">Saudi Arabia (ZATCA Tax Authority)</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-semibold text-[10px]">
                          Real-Time Clearance
                        </span>
                      </td>
                      <td className="p-3 text-[11px] font-mono">
                        reporting:1.0 (NNPNESB subtype @name=&quot;0100000&quot; | &quot;0200000&quot;)
                      </td>
                      <td className="p-3 text-[11px]">
                        ECDSA secp256k1 Signature, SHA-256 Digest, Base64 QR Code
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 dark:hover:bg-[#161b22]/50">
                      <td className="p-3 font-bold text-amber-600 dark:text-amber-400">
                        Canonical JSON AST (Synclium)
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        https://synclium.com/schemas/canonical-invoice.json
                      </td>
                      <td className="p-3">Universal Canonical Hub</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold text-[10px]">
                          In-Memory Intermediate
                        </span>
                      </td>
                      <td className="p-3 text-[11px] font-mono">
                        canonical:v1.0
                      </td>
                      <td className="p-3 text-[11px]">
                        Lossless bi-directional transpilation, Zod runtime validation
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 5: OPENAPI 3.1 EXPLORER                                        */}
        {/* ================================================================== */}
        {activeTab === "openapi" && (
          <div className="space-y-8 font-mono">
            
            <div className="border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-[#58a6ff] uppercase">
                    <BracesIcon className="w-4 h-4" />
                    <span>OPENAPI 3.1.0 SPECIFICATION</span>
                  </div>
                  <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white uppercase">
                    Machine-Readable Schema Definition
                  </h2>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Import directly into Postman, Insomnia, Swagger UI, or code generation toolchains (openapi-generator, kiota, fern).
                  </p>
                </div>

                <a
                  href="/api/openapi.json"
                  target="_blank"
                  rel="noreferrer"
                  download="synclium-openapi-3.1.json"
                  className="h-8 px-3 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <DownloadIcon className="w-3.5 h-3.5" />
                  <span>Download OpenAPI JSON</span>
                </a>
              </div>

              {/* Endpoints List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  REGISTERED PATHS &amp; CONTRACTS
                </h3>

                {/* POST /convert */}
                <div className="border border-slate-300 dark:border-[#21262d] bg-slate-50 dark:bg-[#161b22] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold">POST</span>
                      <code className="text-xs font-bold text-slate-900 dark:text-white">/api/convert</code>
                    </div>
                    <span className="text-[11px] text-slate-500">Transpilation Engine</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Converts invoice XML or Canonical AST between UBL, Factur-X, ZATCA, and Canonical JSON formats.
                  </p>
                  <div className="pt-2 text-[11px] text-slate-500 flex flex-wrap gap-4">
                    <span><strong>Request:</strong> <code>ConvertRequest</code> (input, from, to)</span>
                    <span><strong>Response 200:</strong> <code>ConvertResponse</code> (output, from, to)</span>
                    <span><strong>Error 422:</strong> <code>ErrorResponse</code> (Schematron failure)</span>
                  </div>
                </div>

                {/* POST /validate */}
                <div className="border border-slate-300 dark:border-[#21262d] bg-slate-50 dark:bg-[#161b22] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold">POST</span>
                      <code className="text-xs font-bold text-slate-900 dark:text-white">/api/validate</code>
                    </div>
                    <span className="text-[11px] text-slate-500">Validation Engine</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Runs structural XSD checks and Schematron business rules (e.g. BR-S-08 tax breakdown allowances).
                  </p>
                  <div className="pt-2 text-[11px] text-slate-500 flex flex-wrap gap-4">
                    <span><strong>Request:</strong> <code>ValidateRequest</code> (input, format)</span>
                    <span><strong>Response 200:</strong> <code>ValidateResponse</code> (valid, format, errors, warnings)</span>
                  </div>
                </div>

                {/* POST /extract */}
                <div className="border border-slate-300 dark:border-[#21262d] bg-slate-50 dark:bg-[#161b22] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold">POST</span>
                      <code className="text-xs font-bold text-slate-900 dark:text-white">/api/extract</code>
                    </div>
                    <span className="text-[11px] text-slate-500">Multimodal AI Extraction</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Extracts unstructured PDF/image invoices into validated Canonical AST with per-field confidence metrics.
                  </p>
                  <div className="pt-2 text-[11px] text-slate-500 flex flex-wrap gap-4">
                    <span><strong>Request:</strong> <code>ExtractRequest</code> (contentBase64, mimeType, provider)</span>
                    <span><strong>Response 200:</strong> <code>ExtractResponse</code> (needsReview, overallConfidence, invoice)</span>
                  </div>
                </div>

                {/* GET /samples */}
                <div className="border border-slate-300 dark:border-[#21262d] bg-slate-50 dark:bg-[#161b22] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold">GET</span>
                      <code className="text-xs font-bold text-slate-900 dark:text-white">/api/samples</code>
                    </div>
                    <span className="text-[11px] text-slate-500">Metadata Dataset</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Returns verified example XML invoices across UBL, Factur-X, and ZATCA Phase 2 for testing.
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* -------------------------------------------------------------------- */}
      {/* 4. Footer Bar                                                        */}
      {/* -------------------------------------------------------------------- */}
      <footer className="mt-16 border-t border-slate-300 dark:border-[#21262d] bg-white dark:bg-[#07090e] py-8 font-mono">
        <div className="mx-auto max-w-[1700px] px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">SYNCLIUM</span>
            <span>// Open-Source E-Invoicing Transpiler &amp; Validation Engine</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-[#58a6ff]">Home</Link>
            <Link href="/console" className="hover:text-blue-600 dark:hover:text-[#58a6ff]">Console</Link>
            <Link href="/docs" className="text-blue-600 dark:text-[#58a6ff] font-bold">API Docs</Link>
            <a href="https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium" target="_blank" rel="noreferrer" className="hover:text-blue-600 dark:hover:text-[#58a6ff]">
              GitHub
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
