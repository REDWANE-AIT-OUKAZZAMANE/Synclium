"use client";

import React from "react";

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
    <div className="space-y-3 font-mono text-xs text-paper">
      {/* Header Metadata Bar */}
      <div className="grid grid-cols-2 gap-px border border-ink-700 bg-ink-700 sm:grid-cols-4">
        {[
          ["INVOICE ID", data.id || "N/A", "text-paper"],
          ["ISSUE DATE", data.issueDate || "N/A", "text-paper"],
          ["DUE DATE", data.dueDate || "N/A", "text-paper"],
          ["CURRENCY", currency, "text-signal"],
        ].map(([k, v, tone]) => (
          <div key={k as string} className="bg-ink-950 p-3">
            <span className="block text-[10px] tracking-[0.18em] text-paper-faint">{k}</span>
            <span className={`font-bold ${tone}`}>{v}</span>
          </div>
        ))}
      </div>

      {/* Parties Grid */}
      <div className="grid grid-cols-1 gap-px border border-ink-700 bg-ink-700 md:grid-cols-2">
        {[
          { role: "SELLER PARTY", party: data.seller, name: data.seller?.name || "Unspecified Seller" },
          { role: "BUYER PARTY", party: data.buyer, name: data.buyer?.name || "Unspecified Buyer" },
        ].map(({ role, party, name }) => (
          <div key={role} className="bg-ink-950 p-4">
            <div className="mb-2 flex items-center justify-between border-b border-ink-700 pb-2">
              <span className="text-[11px] font-bold tracking-[0.18em] text-paper-faint">{role}</span>
              {party?.address?.countryCode && (
                <span className="border border-protocol px-1.5 py-0.5 text-[10px] font-bold text-protocol">
                  {party.address.countryCode}
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-paper">{name}</p>
            <p className="mt-1 text-[11px] text-paper-faint">
              TAX ID <span className="font-semibold text-paper-dim">{party?.taxId || "N/A"}</span>
            </p>
            {party?.address && (
              <p className="mt-0.5 text-[11px] text-paper-faint">
                {[party.address.streetName, party.address.cityName, party.address.postalZone]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Line Items Table */}
      {data.lineItems && data.lineItems.length > 0 && (
        <div className="overflow-hidden border border-ink-700">
          <div className="border-b border-ink-700 bg-ink-900 p-2.5 font-bold text-paper-dim">
            LINE ITEMS ({data.lineItems.length})
          </div>
          <table className="w-full text-left text-[11px]">
            <thead className="border-b border-ink-700 bg-ink-950 tracking-[0.14em] text-paper-faint">
              <tr>
                <th className="p-2.5 font-normal">ITEM DESCRIPTION</th>
                <th className="p-2.5 text-right font-normal">QTY</th>
                <th className="p-2.5 text-right font-normal">UNIT PRICE</th>
                <th className="p-2.5 text-right font-normal">TAX RATE</th>
                <th className="p-2.5 text-right font-normal">LINE TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700 bg-ink-950">
              {data.lineItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-ink-900">
                  <td className="p-2.5 font-medium text-paper">
                    {item.name || `Item ${idx + 1}`}
                  </td>
                  <td className="p-2.5 text-right text-paper-dim">
                    {item.quantity ?? 1} {item.unitCode || ""}
                  </td>
                  <td className="p-2.5 text-right text-paper-dim">
                    {currency} {Number(item.unitPriceAmount ?? 0).toFixed(2)}
                  </td>
                  <td className="p-2.5 text-right text-paper-dim">
                    {item.taxes?.[0]?.rate != null ? `${item.taxes[0].rate}%` : "—"}
                  </td>
                  <td className="p-2.5 text-right font-bold text-paper">
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
        <div className="flex flex-wrap items-center justify-between gap-4 border border-signal/60 bg-signal/5 p-4">
          <div>
            <span className="block text-[10px] tracking-[0.18em] text-paper-faint">NET TAXABLE</span>
            <span className="text-sm font-bold text-paper">
              {currency} {Number(data.totals.lineExtensionAmount ?? data.totals.taxExclusiveAmount ?? 0).toFixed(2)}
            </span>
          </div>

          <div>
            <span className="block text-[10px] tracking-[0.18em] text-paper-faint">VAT / TAX TOTAL</span>
            <span className="text-sm font-bold text-protocol">
              {currency} {Number(data.totals.taxTotalAmount ?? 0).toFixed(2)}
            </span>
          </div>

          <div className="text-right">
            <span className="block text-[10px] tracking-[0.18em] text-paper-faint">TOTAL DUE</span>
            <span className="text-base font-extrabold text-signal">
              {currency} {Number(data.totals.payableAmount ?? data.totals.taxInclusiveAmount ?? 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Payment Information */}
      {data.paymentTerms && (
        <div className="flex flex-wrap items-center justify-between gap-2 border border-ink-700 bg-ink-950 p-3 text-[11px] text-paper-dim">
          <div>
            <span className="font-bold text-paper">PAYMENT TERMS </span>
            <span>{data.paymentTerms.note || "Standard terms apply"}</span>
          </div>
          {data.paymentTerms.payeeFinancialAccount && (
            <div className="border border-ink-600 px-2 py-0.5 font-mono text-[10px] text-paper-dim">
              IBAN {data.paymentTerms.payeeFinancialAccount}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
