import { create } from "xmlbuilder2";
import type { CanonicalInvoice, Party, TaxBreakdown } from "@synclium/core";

function partyToXml(party: Party, tagName: string, builder: any) {
  const partyEl = builder.ele(tagName).ele("cac:Party");
  if (party.endpointId) {
    partyEl.ele("cbc:EndpointID", { schemeID: party.endpointScheme ?? "0088" }).txt(party.endpointId).up();
  }
  if (party.identifiers) {
    for (const id of party.identifiers) {
      partyEl.ele("cac:PartyIdentification").ele("cbc:ID", { schemeID: id.schemeID }).txt(id.value).up().up();
    }
  }
  partyEl.ele("cac:PartyName").ele("cbc:Name").txt(party.name).up().up();
  const addr = partyEl.ele("cac:PostalAddress");
  if (party.address.streetName) addr.ele("cbc:StreetName").txt(party.address.streetName).up();
  if (party.address.cityName) addr.ele("cbc:CityName").txt(party.address.cityName).up();
  if (party.address.postalZone) addr.ele("cbc:PostalZone").txt(party.address.postalZone).up();
  if (party.address.countrySubentity) addr.ele("cbc:CountrySubentity").txt(party.address.countrySubentity).up();
  addr.ele("cac:Country").ele("cbc:IdentificationCode").txt(party.address.countryCode).up().up().up();
  if (party.taxId) {
    partyEl.ele("cac:PartyTaxScheme").ele("cbc:CompanyID").txt(party.taxId).up().ele("cac:TaxScheme").ele("cbc:ID").txt(party.taxScheme ?? "VAT").up().up().up();
  }
  if (party.legalEntity || party.companyId) {
    const legal = partyEl.ele("cac:PartyLegalEntity");
    legal.ele("cbc:RegistrationName").txt(party.legalEntity ?? party.name).up();
    if (party.companyId) {
      legal.ele("cbc:CompanyID", { schemeID: "0002" }).txt(party.companyId).up();
    }
    legal.up();
  }
  if (party.contact) {
    const c = partyEl.ele("cac:Contact");
    if (party.contact.name) c.ele("cbc:Name").txt(party.contact.name).up();
    if (party.contact.telephone) c.ele("cbc:Telephone").txt(party.contact.telephone).up();
    if (party.contact.electronicMail) c.ele("cbc:ElectronicMail").txt(party.contact.electronicMail).up();
    c.up();
  }
  partyEl.up();
  builder.up();
}

export function exportUBL(invoice: CanonicalInvoice): string {
  const root = create({ version: "1.0", encoding: "UTF-8" })
    .ele("Invoice", {
      xmlns: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
      "xmlns:cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
      "xmlns:cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
    });

  root.ele("cbc:CustomizationID").txt(invoice.customizationId ?? "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0").up();
  root.ele("cbc:ProfileID").txt(invoice.profileId ?? "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0").up();
  root.ele("cbc:ID").txt(invoice.id).up();
  root.ele("cbc:IssueDate").txt(invoice.issueDate).up();
  if (invoice.dueDate) root.ele("cbc:DueDate").txt(invoice.dueDate).up();
  root.ele("cbc:InvoiceTypeCode").txt(invoice.typeCode).up();
  if (invoice.notes) {
    for (const n of invoice.notes) root.ele("cbc:Note").txt(n).up();
  }
  root.ele("cbc:DocumentCurrencyCode").txt(invoice.currencyCode).up();
  if (invoice.buyerReference) root.ele("cbc:BuyerReference").txt(invoice.buyerReference).up();

  // Supplier
  partyToXml(invoice.seller, "cac:AccountingSupplierParty", root);
  // Customer
  partyToXml(invoice.buyer, "cac:AccountingCustomerParty", root);
  if (invoice.payee) partyToXml(invoice.payee, "cac:PayeeParty", root);

  if (invoice.deliveryDate) {
    root.ele("cac:Delivery").ele("cbc:ActualDeliveryDate").txt(invoice.deliveryDate).up().up();
  }

  if (invoice.references?.orderReference) {
    root.ele("cac:OrderReference").ele("cbc:ID").txt(invoice.references.orderReference).up().up();
  }
  if (invoice.references?.contractReference) {
    root.ele("cac:ContractDocumentReference").ele("cbc:ID").txt(invoice.references.contractReference).up().up();
  }
  if (invoice.references?.despatchDocumentReference) {
    root.ele("cac:DespatchDocumentReference").ele("cbc:ID").txt(invoice.references.despatchDocumentReference).up().up();
  }
  if (invoice.references?.billingReference) {
    root.ele("cac:BillingReference")
      .ele("cac:InvoiceDocumentReference")
      .ele("cbc:ID").txt(invoice.references.billingReference).up().up().up();
  }

  if (invoice.paymentTerms || invoice.references) {
    // PaymentTerms
    if (invoice.paymentTerms) {
      const pt = root.ele("cac:PaymentTerms");
      if (invoice.paymentTerms.note) pt.ele("cbc:Note").txt(invoice.paymentTerms.note).up();
      if (invoice.paymentTerms.paymentDueDate) pt.ele("cbc:PaymentDueDate").txt(invoice.paymentTerms.paymentDueDate).up();
      pt.up();
    }
    if (invoice.paymentTerms?.paymentMeansCode || invoice.paymentTerms?.payeeFinancialAccount) {
      const pm = root.ele("cac:PaymentMeans");
      pm.ele("cbc:PaymentMeansCode").txt(invoice.paymentTerms.paymentMeansCode ?? "30").up();
      if (invoice.paymentTerms.payeeFinancialAccount) {
        pm.ele("cac:PayeeFinancialAccount").ele("cbc:ID").txt(invoice.paymentTerms.payeeFinancialAccount).up().up();
      }
      pm.up();
    }
  }

  if (invoice.allowanceCharges) {
    for (const ac of invoice.allowanceCharges) {
      const acEl = root.ele("cac:AllowanceCharge");
      acEl.ele("cbc:ChargeIndicator").txt(String(ac.chargeIndicator)).up();
      if (ac.reason) acEl.ele("cbc:AllowanceChargeReason").txt(ac.reason).up();
      if (ac.reasonCode) acEl.ele("cbc:AllowanceChargeReasonCode").txt(ac.reasonCode).up();
      acEl.ele("cbc:Amount", { currencyID: invoice.currencyCode }).txt(ac.amount).up();
      if (ac.baseAmount) acEl.ele("cbc:BaseAmount", { currencyID: invoice.currencyCode }).txt(ac.baseAmount).up();
      acEl.up();
    }
  }

  // TaxTotal — one block containing all subtotals, TaxAmount = sum (document total)
  const taxTotals: TaxBreakdown[] = invoice.taxBreakdowns ?? (() => {
    // Synthesize a breakdown from line taxes and document-level allowances/charges.
    // Out-of-scope lines ("O", no VAT treatment) do not get a TaxTotal — mirroring EN 16931 semantics.
    const hasTaxableLines = invoice.lineItems.some((li) =>
      li.taxes.some((t) => t.categoryCode !== "O"),
    );
    if (!hasTaxableLines) return [];
    const map = new Map<string, { taxable: number; rate: number; code: string; exemptionReason?: string; exemptionReasonCode?: string }>();
    for (const li of invoice.lineItems) {
      for (const t of li.taxes) {
        if (t.categoryCode === "O") continue;
        const key = `${t.categoryCode}:${t.rate}`;
        const existing = map.get(key) ?? {
          taxable: 0,
          rate: t.rate,
          code: t.categoryCode,
          exemptionReason: t.exemptionReason,
          exemptionReasonCode: t.exemptionReasonCode,
        };
        const taxable = parseFloat(li.lineExtensionAmount);
        existing.taxable += taxable;
        map.set(key, existing);
      }
    }

    // BR-S-08 / BR-Z-08 / BR-E-08: Reconcile document-level allowances and charges into the category taxable base
    if (invoice.allowanceCharges) {
      for (const ac of invoice.allowanceCharges) {
        let key = ac.taxCategory ? `${ac.taxCategory.categoryCode}:${ac.taxCategory.rate}` : undefined;
        if (!key && map.size === 1) {
          key = Array.from(map.keys())[0];
        }
        if (key) {
          const existing = map.get(key) ?? (ac.taxCategory ? {
            taxable: 0,
            rate: ac.taxCategory.rate,
            code: ac.taxCategory.categoryCode,
            exemptionReason: ac.taxCategory.exemptionReason,
            exemptionReasonCode: ac.taxCategory.exemptionReasonCode,
          } : undefined);
          if (existing) {
            const amt = parseFloat(ac.amount);
            if (ac.chargeIndicator) {
              existing.taxable += amt;
            } else {
              existing.taxable -= amt;
            }
            map.set(key, existing);
          }
        }
      }
    }

    return Array.from(map.values()).map<TaxBreakdown>((v) => ({
      categoryCode: v.code as any,
      rate: v.rate,
      taxableAmount: v.taxable.toFixed(2),
      taxAmount: (v.taxable * (v.rate / 100)).toFixed(2),
      exemptionReason: v.exemptionReason,
      exemptionReasonCode: v.exemptionReasonCode,
    }));
  })();

  if (taxTotals.length > 0) {
    const totalTax = invoice.totals.taxTotalAmount ?? taxTotals
      .reduce((a, tb) => a + parseFloat(tb.taxAmount), 0)
      .toFixed(2);
    const tt = root.ele("cac:TaxTotal");
    tt.ele("cbc:TaxAmount", { currencyID: invoice.currencyCode }).txt(totalTax).up();
    for (const tb of taxTotals) {
      const sub = tt.ele("cac:TaxSubtotal");
      sub.ele("cbc:TaxableAmount", { currencyID: invoice.currencyCode }).txt(tb.taxableAmount).up();
      sub.ele("cbc:TaxAmount", { currencyID: invoice.currencyCode }).txt(tb.taxAmount).up();
      const cat = sub.ele("cac:TaxCategory");
      cat.ele("cbc:ID").txt(tb.categoryCode).up();
      cat.ele("cbc:Percent").txt(String(tb.rate)).up();
      if (tb.exemptionReason) cat.ele("cbc:TaxExemptionReason").txt(tb.exemptionReason).up();
      if (tb.exemptionReasonCode) cat.ele("cbc:TaxExemptionReasonCode").txt(tb.exemptionReasonCode).up();
      cat.ele("cac:TaxScheme").ele("cbc:ID").txt("VAT").up().up().up();
      sub.up();
    }
    tt.up();
  }

  // LegalMonetaryTotal
  const mt = root.ele("cac:LegalMonetaryTotal");
  mt.ele("cbc:LineExtensionAmount", { currencyID: invoice.currencyCode }).txt(invoice.totals.lineExtensionAmount).up();
  mt.ele("cbc:TaxExclusiveAmount", { currencyID: invoice.currencyCode }).txt(invoice.totals.taxExclusiveAmount).up();
  mt.ele("cbc:TaxInclusiveAmount", { currencyID: invoice.currencyCode }).txt(invoice.totals.taxInclusiveAmount).up();
  if (invoice.totals.allowanceTotalAmount) mt.ele("cbc:AllowanceTotalAmount", { currencyID: invoice.currencyCode }).txt(invoice.totals.allowanceTotalAmount).up();
  if (invoice.totals.chargeTotalAmount) mt.ele("cbc:ChargeTotalAmount", { currencyID: invoice.currencyCode }).txt(invoice.totals.chargeTotalAmount).up();
  if (invoice.totals.prepaidAmount) mt.ele("cbc:PrepaidAmount", { currencyID: invoice.currencyCode }).txt(invoice.totals.prepaidAmount).up();
  mt.ele("cbc:PayableAmount", { currencyID: invoice.currencyCode }).txt(invoice.totals.payableAmount).up();
  mt.up();

  // Lines
  invoice.lineItems.forEach((li, idx) => {
    const line = root.ele("cac:InvoiceLine");
    line.ele("cbc:ID").txt(li.id).up();
    line.ele("cbc:InvoicedQuantity", { unitCode: li.unitCode ?? "C62" }).txt(String(li.quantity)).up();
    line.ele("cbc:LineExtensionAmount", { currencyID: invoice.currencyCode }).txt(li.lineExtensionAmount).up();
    if (li.note) line.ele("cbc:Note").txt(li.note).up();
    const item = line.ele("cac:Item");
    if (li.name) item.ele("cbc:Name").txt(li.name).up();
    if (li.description) item.ele("cbc:Description").txt(li.description).up();
    if (li.itemCode) item.ele("cac:SellersItemIdentification").ele("cbc:ID").txt(li.itemCode).up().up();
    for (const tax of li.taxes) {
      const cat = item.ele("cac:ClassifiedTaxCategory");
      cat.ele("cbc:ID").txt(tax.categoryCode).up();
      cat.ele("cbc:Percent").txt(String(tax.rate)).up();
      cat.ele("cac:TaxScheme").ele("cbc:ID").txt(tax.scheme ?? "VAT").up().up();
      cat.up();
    }
    item.up();
    const price = line.ele("cac:Price");
    price.ele("cbc:PriceAmount", { currencyID: invoice.currencyCode }).txt(li.unitPriceAmount).up();
    price.up();
    if (li.allowanceCharges) {
      for (const ac of li.allowanceCharges) {
        const acEl = line.ele("cac:AllowanceCharge");
        acEl.ele("cbc:ChargeIndicator").txt(String(ac.chargeIndicator)).up();
        if (ac.reason) acEl.ele("cbc:AllowanceChargeReason").txt(ac.reason).up();
        if (ac.reasonCode) acEl.ele("cbc:AllowanceChargeReasonCode").txt(ac.reasonCode).up();
        if (ac.multiplierFactor !== undefined) {
          acEl.ele("cbc:MultiplierFactorNumeric").txt(String(ac.multiplierFactor)).up();
        }
        acEl.ele("cbc:Amount", { currencyID: invoice.currencyCode }).txt(ac.amount).up();
        acEl.up();
      }
    }
    line.up();
  });

  return root.end({ prettyPrint: true });
}
