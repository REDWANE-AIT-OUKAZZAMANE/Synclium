import { XMLParser } from "fast-xml-parser";
import type { CanonicalInvoice, Party, LineItem, Tax, Totals, TaxBreakdown, AllowanceCharge } from "@synclium-com/core";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
  removeNSPrefix: false,
  processEntities: false,
  htmlEntities: false,
});

function getText(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "object" && "#text" in (v as any)) return String((v as any)["#text"]);
  if (typeof v === "object" && "value" in (v as any)) return String((v as any)["value"]);
  return String(v);
}

function getAttr(obj: any, attr: string): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  return obj[`@_${attr}`];
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function parseParty(partyNode: any): Party {
  if (!partyNode) {
    return {
      name: "Unknown",
      address: { countryCode: "BE" },
    };
  }
  const party = partyNode["cac:Party"] ?? partyNode;
  // Name
  let name = getText(party["cac:PartyName"]?.["cbc:Name"]);
  if (!name) name = getText(party["cac:PartyLegalEntity"]?.["cbc:RegistrationName"]);
  if (!name) name = getText(party["cbc:Name"]) ?? "Unknown";

  const tradingName = getText(party["cac:PartyLegalEntity"]?.["cbc:CompanyLegalForm"]);
  const endpointId = getText(party["cbc:EndpointID"]);
  const endpointScheme = getAttr(party["cbc:EndpointID"], "schemeID");

  const identifiers: { schemeID: string; value: string }[] = [];
  for (const pid of asArray(party["cac:PartyIdentification"])) {
    const idVal = getText(pid["cbc:ID"]);
    const scheme = getAttr(pid["cbc:ID"], "schemeID") ?? "UNKNOWN";
    if (idVal) identifiers.push({ schemeID: scheme, value: idVal });
  }

  const taxSchemeNode = asArray(party["cac:PartyTaxScheme"])[0];
  const taxId = getText(taxSchemeNode?.["cbc:CompanyID"]);
  const taxScheme = getAttr(taxSchemeNode?.["cbc:CompanyID"], "schemeID");
  const companyId = getText(party["cac:PartyLegalEntity"]?.["cbc:CompanyID"]);

  const addrNode = party["cac:PostalAddress"];
  let address: any = { countryCode: "BE" };
  if (addrNode) {
    address = {
      streetName: getText(addrNode["cbc:StreetName"]),
      additionalStreetName: getText(addrNode["cbc:AdditionalStreetName"]),
      cityName: getText(addrNode["cbc:CityName"]),
      postalZone: getText(addrNode["cbc:PostalZone"]),
      countrySubentity: getText(addrNode["cbc:CountrySubentity"]),
      countryCode: getText(addrNode["cac:Country"]?.["cbc:IdentificationCode"]) ?? getText(addrNode["cbc:CountryCode"]) ?? "BE",
    };
    // prune undefined / empty strings
    Object.keys(address).forEach((k) => {
      const v = (address as any)[k];
      if (v === undefined || v === "") delete (address as any)[k];
    });
    if (!address.countryCode) address.countryCode = "BE";
  }

  const contactNode = party["cac:Contact"];
  let contact = undefined;
  if (contactNode) {
    contact = {
      name: getText(contactNode["cbc:Name"]),
      telephone: getText(contactNode["cbc:Telephone"]),
      electronicMail: getText(contactNode["cbc:ElectronicMail"]),
    };
    if (!contact.name && !contact.telephone && !contact.electronicMail) contact = undefined;
  }

  return {
    name,
    tradingName: tradingName ?? undefined,
    identifiers: identifiers.length ? identifiers : undefined,
    taxId: taxId ?? undefined,
    taxScheme: taxScheme ?? undefined,
    companyId: companyId ?? undefined,
    endpointId: endpointId ?? undefined,
    endpointScheme: endpointScheme ?? undefined,
    address,
    contact,
    legalEntity: getText(party["cac:PartyLegalEntity"]?.["cbc:RegistrationName"]) ?? undefined,
  };
}

function parseAllowanceCharge(nodes: any): AllowanceCharge[] | undefined {
  const arr = asArray(nodes);
  if (arr.length === 0) return undefined;
  return arr.map(n => ({
    chargeIndicator: getText(n["cbc:ChargeIndicator"]) === "true",
    reason: getText(n["cbc:AllowanceChargeReason"]),
    reasonCode: getText(n["cbc:AllowanceChargeReasonCode"]),
    amount: getText(n["cbc:Amount"]) ?? "0.00",
    baseAmount: getText(n["cbc:BaseAmount"]),
    multiplierFactor: n["cbc:MultiplierFactorNumeric"] ? parseFloat(getText(n["cbc:MultiplierFactorNumeric"])!) : undefined,
  }));
}

export function importUBL(xml: string): CanonicalInvoice {
  const parsed: any = parser.parse(xml);
  // Find Invoice node - may be at top level with key "Invoice" or with namespace
  let inv: any = parsed["Invoice"] ?? parsed["ubl:Invoice"] ?? parsed["inv:Invoice"];
  // fallback: first key that contains "Invoice"
  if (!inv) {
    const key = Object.keys(parsed).find(k => k.includes("Invoice"));
    if (key) inv = parsed[key];
  }
  if (!inv) throw new Error("Invalid UBL: root Invoice element not found");

  const id = getText(inv["cbc:ID"]) ?? getText(inv["cbc:InvoiceNumber"]) ?? "UNKNOWN";
  const issueDate = getText(inv["cbc:IssueDate"]) ?? "2024-01-01";
  const dueDate = getText(inv["cbc:DueDate"]);
  const deliveryDate = getText(inv["cac:Delivery"]?.["cbc:ActualDeliveryDate"]);
  const typeCode = getText(inv["cbc:InvoiceTypeCode"]) ?? "380";
  const currencyCode = getText(inv["cbc:DocumentCurrencyCode"]) ?? getText(inv["cbc:CurrencyCode"]) ?? "EUR";
  const buyerReference = getText(inv["cbc:BuyerReference"]);
  const profileId = getText(inv["cbc:ProfileID"]);
  const customizationId = getText(inv["cbc:CustomizationID"]);

  const seller = parseParty(inv["cac:AccountingSupplierParty"]);
  const buyer = parseParty(inv["cac:AccountingCustomerParty"]);
  const payeeNode = inv["cac:PayeeParty"];
  const payee = payeeNode ? parseParty(payeeNode) : undefined;

  // notes
  const notesRaw = asArray(inv["cbc:Note"]);
  const notes = notesRaw.map(getText).filter(Boolean) as string[];
  const notesFinal = notes.length ? notes : undefined;

  // line items
  const lineNodes = asArray(inv["cac:InvoiceLine"]);
  const lineItems: LineItem[] = lineNodes.map((ln: any) => {
    const qtyNode = ln["cbc:InvoicedQuantity"];
    const quantity = qtyNode ? parseFloat(getText(qtyNode) ?? "1") : 1;
    const unitCode = getAttr(qtyNode, "unitCode");

    const itemNode = ln["cac:Item"] ?? {};
    const name = getText(itemNode["cbc:Name"]);
    const description = getText(itemNode["cbc:Description"]);
    const itemCode = getText(itemNode["cac:SellersItemIdentification"]?.["cbc:ID"]) ?? getText(itemNode["cac:StandardItemIdentification"]?.["cbc:ID"]);

    // tax category per line
    let taxes: Tax[] = [];
    const taxCategoryNodes = asArray(itemNode["cac:ClassifiedTaxCategory"]);
    // fallback to InvoiceLine TaxTotal
    const lineTaxNodes = asArray(ln["cac:TaxTotal"]);
    if (taxCategoryNodes.length > 0) {
      taxes = taxCategoryNodes.map((tc: any) => ({
        categoryCode: getText(tc["cbc:ID"]) ?? getText(tc["cbc:TaxCategoryCode"]) ?? "S",
        rate: tc["cbc:Percent"] ? parseFloat(getText(tc["cbc:Percent"])!) : 0,
        scheme: getText(tc["cac:TaxScheme"]?.["cbc:ID"]),
      }));
    } else if (lineTaxNodes.length > 0) {
      for (const tt of lineTaxNodes) {
        for (const sub of asArray(tt["cac:TaxSubtotal"])) {
          const cat = sub["cac:TaxCategory"];
          taxes.push({
            categoryCode: getText(cat?.["cbc:ID"]) ?? "S",
            rate: cat?.["cbc:Percent"] ? parseFloat(getText(cat["cbc:Percent"])!) : 0,
            amount: getText(sub["cbc:TaxAmount"]),
            taxableAmount: getText(sub["cbc:TaxableAmount"]),
          });
        }
      }
    }
    if (taxes.length === 0) taxes = [{ categoryCode: "S", rate: 21 }];

    return {
      id: getText(ln["cbc:ID"]) ?? "1",
      quantity,
      unitCode: unitCode ?? undefined,
      unitPriceAmount: getText(ln["cac:Price"]?.["cbc:PriceAmount"]) ?? "0.00",
      lineExtensionAmount: getText(ln["cbc:LineExtensionAmount"]) ?? "0.00",
      name: name ?? undefined,
      description: description ?? undefined,
      note: getText(ln["cbc:Note"]),
      itemCode: itemCode ?? undefined,
      taxes,
      allowanceCharges: parseAllowanceCharge(ln["cac:AllowanceCharge"]),
    };
  });

  // Totals
  const monetary = inv["cac:LegalMonetaryTotal"] ?? {};
  const totals: Totals = {
    lineExtensionAmount: getText(monetary["cbc:LineExtensionAmount"]) ?? "0.00",
    taxExclusiveAmount: getText(monetary["cbc:TaxExclusiveAmount"]) ?? getText(monetary["cbc:LineExtensionAmount"]) ?? "0.00",
    taxInclusiveAmount: getText(monetary["cbc:TaxInclusiveAmount"]) ?? "0.00",
    allowanceTotalAmount: getText(monetary["cbc:AllowanceTotalAmount"]),
    chargeTotalAmount: getText(monetary["cbc:ChargeTotalAmount"]),
    prepaidAmount: getText(monetary["cbc:PrepaidAmount"]),
    payableAmount: getText(monetary["cbc:PayableAmount"]) ?? getText(monetary["cbc:TaxInclusiveAmount"]) ?? "0.00",
    roundingAmount: undefined,
    taxTotalAmount: undefined,
  };

  // Tax breakdowns at document level
  let taxBreakdowns: TaxBreakdown[] | undefined;
  const taxTotals = asArray(inv["cac:TaxTotal"]);
  if (taxTotals.length > 0) {
    const breakdowns: TaxBreakdown[] = [];
    for (const tt of taxTotals) {
      const subs = asArray(tt["cac:TaxSubtotal"]);
      if (subs.length > 0) {
        for (const sub of subs) {
          const cat = sub["cac:TaxCategory"] ?? {};
          breakdowns.push({
            categoryCode: getText(cat["cbc:ID"]) ?? "S",
            rate: cat["cbc:Percent"] ? parseFloat(getText(cat["cbc:Percent"])!) : 0,
            taxableAmount: getText(sub["cbc:TaxableAmount"]) ?? "0.00",
            taxAmount: getText(sub["cbc:TaxAmount"]) ?? "0.00",
            exemptionReason: getText(cat["cbc:TaxExemptionReason"]),
            exemptionReasonCode: getText(cat["cbc:TaxExemptionReasonCode"]),
          });
        }
      } else {
        // Direct TaxTotal without subtotals
        const amt = getText(tt["cbc:TaxAmount"]);
        if (amt) {
          breakdowns.push({
            categoryCode: "S",
            rate: 0,
            taxableAmount: totals.taxExclusiveAmount,
            taxAmount: amt,
          });
        }
      }
      // Capture overall tax amount
      if (!totals.taxTotalAmount) {
        const tAmt = getText(tt["cbc:TaxAmount"]);
        if (tAmt) totals.taxTotalAmount = tAmt;
      }
    }
    if (breakdowns.length > 0) taxBreakdowns = breakdowns;
  }

  // Payment terms
  let paymentTerms = undefined;
  const ptNode = inv["cac:PaymentTerms"];
  const pmNode = inv["cac:PaymentMeans"];
  if (ptNode || pmNode) {
    const pt = asArray(ptNode)[0] ?? {};
    const pm = asArray(pmNode)[0] ?? {};
    paymentTerms = {
      note: getText(pt["cbc:Note"]) ?? getText(pt["cbc:PaymentTermsDetails"]),
      paymentDueDate: getText(pt["cbc:PaymentDueDate"]),
      paymentMeansCode: getText(pm["cbc:PaymentMeansCode"]),
      payeeFinancialAccount: getText(pm["cac:PayeeFinancialAccount"]?.["cbc:ID"]),
    };
    if (!paymentTerms.note && !paymentTerms.paymentDueDate && !paymentTerms.paymentMeansCode) paymentTerms = undefined;
  }

  // References
  const refs: any = {};
  const orderRef = getText(inv["cac:OrderReference"]?.["cbc:ID"]);
  if (orderRef) refs.orderReference = orderRef;
  const contractRef = getText(inv["cac:ContractDocumentReference"]?.["cbc:ID"]);
  if (contractRef) refs.contractReference = contractRef;
  const despatchRef = getText(inv["cac:DespatchDocumentReference"]?.["cbc:ID"]);
  if (despatchRef) refs.despatchDocumentReference = despatchRef;
  const billingRef = getText(inv["cac:BillingReference"]?.["cac:InvoiceDocumentReference"]?.["cbc:ID"]);
  if (billingRef) refs.billingReference = billingRef;
  const projectRef = getText(inv["cac:ProjectReference"]?.["cbc:ID"]);
  if (projectRef) refs.projectReference = projectRef;
  const references = Object.keys(refs).length ? refs : undefined;

  // Document-level allowanceCharges
  const docAC = parseAllowanceCharge(inv["cac:AllowanceCharge"]);

  // Extensions: capture any unknown top-level keys as extensions
  const knownKeys = new Set([
    "cbc:ID","cbc:IssueDate","cbc:DueDate","cbc:InvoiceTypeCode","cbc:DocumentCurrencyCode","cbc:BuyerReference","cbc:ProfileID","cbc:CustomizationID","cbc:Note",
    "cac:AccountingSupplierParty","cac:AccountingCustomerParty","cac:PayeeParty","cac:InvoiceLine","cac:LegalMonetaryTotal","cac:TaxTotal","cac:PaymentTerms","cac:PaymentMeans","cac:OrderReference","cac:ContractDocumentReference","cac:DespatchDocumentReference","cac:BillingReference","cac:ProjectReference","cac:AllowanceCharge","cac:Delivery","@_xmlns","@_xmlns:cac","@_xmlns:cbc","@_xmlns:ccts","@_xmlns:qdt","@_xmlns:udt"
  ]);
  const extensions: Record<string, unknown> = {};
  for (const k of Object.keys(inv)) {
    if (!knownKeys.has(k) && !k.startsWith("@_")) {
      extensions[`ubl:${k}`] = inv[k];
    }
  }
  const extensionsFinal = Object.keys(extensions).length ? extensions : undefined;

  return {
    schemaVersion: "1.0",
    id,
    typeCode,
    issueDate,
    dueDate: dueDate ?? undefined,
    deliveryDate: deliveryDate ?? undefined,
    currencyCode,
    buyerReference: buyerReference ?? undefined,
    seller,
    buyer,
    payee,
    lineItems: lineItems.length ? lineItems : [{ id: "1", quantity: 1, unitPriceAmount: totals.payableAmount, lineExtensionAmount: totals.payableAmount, taxes: [{ categoryCode: "S", rate: 21 }] }],
    taxBreakdowns,
    totals,
    paymentTerms,
    references,
    notes: notesFinal,
    allowanceCharges: docAC,
    extensions: extensionsFinal,
    profileId: profileId ?? undefined,
    customizationId: customizationId ?? undefined,
  };
}
