"use client";

import React from "react";
import { FileTextIcon, ShieldCheckIcon } from "./Icons";

interface InvoiceData {
  id?: string;
  typeCode?: string;
  issueDate?: string;
  dueDate?: string;
  currencyCode?: string;
  seller?: {
    name?: string;
    taxId?: string;
    address?: {
      streetName?: string;
      cityName?: string;
      postalZone?: string;
      countryCode?: string;
    };
  };
  buyer?: {
    name?: string;
    taxId?: string;
    address?: {
      streetName?: string;
      cityName?: string;
      postalZone?: string;
      countryCode?: string;
    };
  };
  lineItems?: Array<{
    id?: string;
    name?: string;
    quantity?: number;
    unitCode?: string;
    unitPriceAmount?: string | number;
    lineExtensionAmount?: string | number;
    taxes?: Array<{ categoryCode?: string; rate?: number }>;
  }>;
  totals?: {
    lineExtensionAmount?: string | number;
    taxExclusiveAmount?: string | number;
    taxInclusiveAmount?: string | number;
    payableAmount?: string | number;
    taxTotalAmount?: string | number;
  };
  taxBreakdowns?: Array<{
    categoryCode?: string;
    rate?: number;
    taxableAmount?: string | number;
    taxAmount?: string | number;
  }>;
  paymentTerms?: {
    note?: string;
    paymentDueDate?: string;
    payeeFinancialAccount?: string;
  };
}

export function InvoiceSummaryView({ data }: { data: InvoiceData }) {
  if (!data || Object.keys(data).length === 0) return null;

  const currency = data.currencyCode || "EUR";

  return (
    <div className="space-y-4 font-mono text-xs text-slate-800 dark:text-slate-200">
      {/* Header Metadata Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg border border-slate-200 dark:border-[#21262d] bg-slate-50/50 dark:bg-[#05070a]">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Invoice ID</span>
          <span className="font-bold text-slate-900 dark:text-white">{data.id || "N/A"}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Issue Date</span>
          <span className="font-bold text-slate-900 dark:text-white">{data.issueDate || "N/A"}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Due Date</span>
          <span className="font-bold text-slate-900 dark:text-white">{data.dueDate || "N/A"}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Currency</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">{currency}</span>
        </div>
      </div>

      {/* Parties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Seller Card */}
        <div className="p-4 rounded-lg border border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#090d14]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#21262d] mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Seller Party</span>
            {data.seller?.address?.countryCode && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold">
                {data.seller.address.countryCode}
              </span>
            )}
          </div>
          <p className="font-bold text-sm text-slate-900 dark:text-white">{data.seller?.name || "Unspecified Seller"}</p>
          <p className="text-slate-500 text-[11px] mt-1">
            Tax ID: <span className="text-slate-700 dark:text-slate-300 font-semibold">{data.seller?.taxId || "N/A"}</span>
          </p>
          {data.seller?.address && (
            <p className="text-slate-500 text-[11px] mt-0.5">
              {[data.seller.address.streetName, data.seller.address.cityName, data.seller.address.postalZone]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
        </div>

        {/* Buyer Card */}
        <div className="p-4 rounded-lg border border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#090d14]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#21262d] mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Buyer Party</span>
            {data.buyer?.address?.countryCode && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 font-bold">
                {data.buyer.address.countryCode}
              </span>
            )}
          </div>
          <p className="font-bold text-sm text-slate-900 dark:text-white">{data.buyer?.name || "Unspecified Buyer"}</p>
          <p className="text-slate-500 text-[11px] mt-1">
            Tax ID: <span className="text-slate-700 dark:text-slate-300 font-semibold">{data.buyer?.taxId || "N/A"}</span>
          </p>
          {data.buyer?.address && (
            <p className="text-slate-500 text-[11px] mt-0.5">
              {[data.buyer.address.streetName, data.buyer.address.cityName, data.buyer.address.postalZone]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Line Items Table */}
      {data.lineItems && data.lineItems.length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-[#21262d] overflow-hidden">
          <div className="p-2.5 bg-slate-100 dark:bg-[#161b22] border-b border-slate-200 dark:border-[#21262d] font-bold text-slate-700 dark:text-slate-300">
            Line Items ({data.lineItems.length})
          </div>
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-50 dark:bg-[#05070a] text-slate-500 border-b border-slate-200 dark:border-[#21262d]">
              <tr>
                <th className="p-2.5">Item Description</th>
                <th className="p-2.5 text-right">Qty</th>
                <th className="p-2.5 text-right">Unit Price</th>
                <th className="p-2.5 text-right">Tax Rate</th>
                <th className="p-2.5 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#21262d] bg-white dark:bg-[#090d14]">
              {data.lineItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#161b22]/50">
                  <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                    {item.name || `Item ${idx + 1}`}
                  </td>
                  <td className="p-2.5 text-right text-slate-600 dark:text-slate-400">
                    {item.quantity ?? 1} {item.unitCode || ""}
                  </td>
                  <td className="p-2.5 text-right text-slate-600 dark:text-slate-400">
                    {currency} {Number(item.unitPriceAmount ?? 0).toFixed(2)}
                  </td>
                  <td className="p-2.5 text-right text-slate-600 dark:text-slate-400">
                    {item.taxes?.[0]?.rate != null ? `${item.taxes[0].rate}%` : "—"}
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                    {currency} {Number(item.lineExtensionAmount ?? 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Financial Totals & Reconciliation Bar */}
      {data.totals && (
        <div className="p-4 rounded-lg border border-slate-200 dark:border-[#21262d] bg-slate-50 dark:bg-[#090d14] flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Net Taxable Amount</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {currency} {Number(data.totals.lineExtensionAmount ?? data.totals.taxExclusiveAmount ?? 0).toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase block">VAT / Tax Total</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
              {currency} {Number(data.totals.taxTotalAmount ?? 0).toFixed(2)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase block">Total Due (Gross Payable)</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
              {currency} {Number(data.totals.payableAmount ?? data.totals.taxInclusiveAmount ?? 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Payment Information */}
      {data.paymentTerms && (
        <div className="p-3 rounded-lg border border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#090d14] text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200">Payment Terms: </span>
            <span>{data.paymentTerms.note || "Standard terms apply"}</span>
          </div>
          {data.paymentTerms.payeeFinancialAccount && (
            <div className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#161b22] text-slate-700 dark:text-slate-300">
              IBAN: {data.paymentTerms.payeeFinancialAccount}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
