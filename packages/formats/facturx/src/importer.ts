import { XMLParser } from "fast-xml-parser";
import type { CanonicalInvoice, Party, LineItem, Tax, Totals, TaxBreakdown } from "@synclium-com/core";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
  processEntities: false,
  htmlEntities: false,
});

function getText(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "object" && "#text" in v) return String(v["#text"]);
  if (typeof v === "object" && "value" in v) return String(v["value"]);
  return String(v);
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function extractAmount(node: any): string | undefined {
  if (!node) return undefined;
  if (typeof node === "string") return node;
  if (typeof node === "object" && "#text" in node) return String(node["#text"]);
  return getText(node);
}

function parseParty(tradeParty: any): Party {
  if (!tradeParty) return { name: "Unknown", address: { countryCode: "FR" } };
  const name = getText(tradeParty["ram:Name"]) ?? "Unknown";
  const tradingName = getText(tradeParty["ram:TradingBusinessName"]);
  // IDs
  const ids: { schemeID: string; value: string }[] = [];
  for (const idNode of asArray(tradeParty["ram:ID"])) {
    const v = getText(idNode);
    const scheme = idNode?.["@_schemeID"] ?? "UNKNOWN";
    if (v) ids.push({ schemeID: scheme, value: v });
  }
  // GlobalID fallback
  for (const gid of asArray(tradeParty["ram:GlobalID"])) {
    const v = getText(gid);
    const scheme = gid?.["@_schemeID"] ?? "0088";
    if (v) ids.push({ schemeID: scheme, value: v });
  }
  const taxIdNode = asArray(tradeParty["ram:SpecifiedTaxRegistration"])[0];
  const taxId = getText(taxIdNode?.["ram:ID"]);
  const addrNode = tradeParty["ram:PostalTradeAddress"];
  let address: any = { countryCode: "FR" };
  if (addrNode) {
    address = {
      streetName: getText(addrNode["ram:LineOne"]),
      additionalStreetName: getText(addrNode["ram:LineTwo"]),
      cityName: getText(addrNode["ram:CityName"]),
      postalZone: getText(addrNode["ram:PostcodeCode"]),
      countryCode: getText(addrNode["ram:CountryID"]) ?? "FR",
    };
    Object.keys(address).forEach(k => address[k] === undefined && delete address[k]);
    if (!address.countryCode) address.countryCode = "FR";
  }
  return {
    name,
    tradingName: tradingName ?? undefined,
    identifiers: ids.length ? ids : undefined,
    taxId: taxId ?? undefined,
    taxScheme: "VAT",
    address,
    legalEntity: name,
  };
}

export function importFacturX(xml: string): CanonicalInvoice {
  const parsed: any = parser.parse(xml);
  let root: any = parsed["rsm:CrossIndustryInvoice"] ?? parsed["CrossIndustryInvoice"];
  if (!root) {
    const key = Object.keys(parsed).find(k => k.includes("CrossIndustryInvoice"));
    if (key) root = parsed[key];
  }
  if (!root) throw new Error("Invalid Factur-X: CrossIndustryInvoice not found");

  const exchangedDoc = root["rsm:ExchangedDocument"] ?? root["ExchangedDocument"] ?? {};
  const transaction = root["rsm:SupplyChainTradeTransaction"] ?? root["SupplyChainTradeTransaction"] ?? {};
  const agreement = transaction["ram:ApplicableHeaderTradeAgreement"] ?? {};
  const delivery = transaction["ram:ApplicableHeaderTradeDelivery"] ?? {};
  const settlement = transaction["ram:ApplicableHeaderTradeSettlement"] ?? {};
  const summation = settlement["ram:SpecifiedTradeSettlementHeaderMonetarySummation"] ?? {};

  const id = getText(exchangedDoc["ram:ID"]) ?? "UNKNOWN";
  const typeCode = getText(exchangedDoc["ram:TypeCode"]) ?? "380";
  // IssueDateTime may be 102 format YYYYMMDD or date string
  let issueDate = "2024-01-01";
  const dtNode = exchangedDoc["ram:IssueDateTime"];
  if (dtNode) {
    const dt = dtNode["udt:DateTimeString"] ?? dtNode["ram:DateTimeString"] ?? dtNode;
    const val = getText(dt);
    const format = dt?.["@_format"] ?? dt?.["@_formatCode"];
    if (val) {
      if (format === "102" && /^\d{8}$/.test(val)) {
        issueDate = `${val.slice(0,4)}-${val.slice(4,6)}-${val.slice(6,8)}`;
      } else if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
        issueDate = val.slice(0,10);
      } else {
        issueDate = val;
      }
    }
  }
  const currencyCode = getText(settlement["ram:InvoiceCurrencyCode"]) ?? "EUR";
  const buyerReference =
    getText(agreement["ram:BuyerReference"]) ??
    getText(settlement["ram:BuyerReference"]);
  const notes = asArray(exchangedDoc["ram:IncludedNote"]).map(n => getText(n["ram:Content"]) ?? getText(n)).filter(Boolean) as string[];

  const sellerParty = agreement["ram:SellerTradeParty"];
  const buyerParty = agreement["ram:BuyerTradeParty"];
  const seller = parseParty(sellerParty);
  const buyer = parseParty(buyerParty);
  const payeeParty = agreement["ram:PayeeTradeParty"];
  const payee = payeeParty ? parseParty(payeeParty) : undefined;

  // Delivery date
  let deliveryDate: string | undefined;
  const deliveryDateNode = delivery["ram:ActualDeliverySupplyChainEvent"]?.["ram:OccurrenceDateTime"]?.["udt:DateTimeString"];
  if (deliveryDateNode) {
    const v = getText(deliveryDateNode);
    if (v && /^\d{8}$/.test(v)) deliveryDate = `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}`;
    else if (v) deliveryDate = v.slice(0,10);
  }

  // Line items
  const lineNodes = asArray(transaction["ram:IncludedSupplyChainTradeLineItem"]);
  const lineItems: LineItem[] = lineNodes.map((ln: any, idx: number) => {
    const doc = ln["ram:AssociatedDocumentLineDocument"] ?? {};
    const product = ln["ram:SpecifiedTradeProduct"] ?? {};
    const agreementLine = ln["ram:SpecifiedLineTradeAgreement"] ?? {};
    const deliveryLine = ln["ram:SpecifiedLineTradeDelivery"] ?? {};
    const settlementLine = ln["ram:SpecifiedLineTradeSettlement"] ?? {};

    const lineId = getText(doc["ram:LineID"]) ?? String(idx + 1);
    const qtyNode = deliveryLine["ram:BilledQuantity"];
    const quantity = qtyNode ? parseFloat(getText(qtyNode) ?? "1") : 1;
    const unitCode = qtyNode?.["@_unitCode"];

    const netPriceNode = agreementLine["ram:NetPriceProductTradePrice"] ?? agreementLine["ram:GrossPriceProductTradePrice"];
    const unitPriceAmount = extractAmount(netPriceNode?.["ram:ChargeAmount"]) ?? "0.00";

    const monetarySummation = settlementLine["ram:SpecifiedTradeSettlementLineMonetarySummation"] ?? {};
    const lineExtensionAmount = extractAmount(monetarySummation["ram:LineTotalAmount"]) ?? "0.00";

    const taxes: Tax[] = [];
    for (const taxNode of asArray(settlementLine["ram:ApplicableTradeTax"])) {
      const cat = getText(taxNode["ram:CategoryCode"]) ?? "S";
      const rate = taxNode["ram:RateApplicablePercent"] ? parseFloat(getText(taxNode["ram:RateApplicablePercent"])!) : 0;
      taxes.push({ categoryCode: cat, rate });
    }
    if (taxes.length === 0) taxes.push({ categoryCode: "S", rate: 20 });

    return {
      id: lineId,
      quantity,
      unitCode: unitCode ?? undefined,
      unitPriceAmount,
      lineExtensionAmount,
      name: getText(product["ram:Name"]),
      description: getText(product["ram:Description"]),
      taxes,
    };
  });

  // Tax breakdowns
  let taxBreakdowns: TaxBreakdown[] | undefined;
  const taxNodes = asArray(settlement["ram:ApplicableTradeTax"]);
  if (taxNodes.length > 0) {
    taxBreakdowns = taxNodes.map((t: any) => ({
      categoryCode: getText(t["ram:CategoryCode"]) ?? "S",
      rate: t["ram:RateApplicablePercent"] ? parseFloat(getText(t["ram:RateApplicablePercent"])!) : 0,
      taxableAmount: extractAmount(t["ram:BasisAmount"]) ?? "0.00",
      taxAmount: extractAmount(t["ram:CalculatedAmount"]) ?? "0.00",
      exemptionReason: getText(t["ram:ExemptionReason"]),
    }));
  }

  // Totals
  const totals: Totals = {
    lineExtensionAmount: extractAmount(summation["ram:LineTotalAmount"]) ?? "0.00",
    taxExclusiveAmount: extractAmount(summation["ram:TaxBasisTotalAmount"]) ?? "0.00",
    taxInclusiveAmount: extractAmount(summation["ram:GrandTotalAmount"]) ?? "0.00",
    allowanceTotalAmount: extractAmount(summation["ram:AllowanceTotalAmount"]),
    chargeTotalAmount: extractAmount(summation["ram:ChargeTotalAmount"]),
    prepaidAmount: extractAmount(summation["ram:TotalPrepaidAmount"]),
    payableAmount: extractAmount(summation["ram:DuePayableAmount"]) ?? extractAmount(summation["ram:GrandTotalAmount"]) ?? "0.00",
    roundingAmount: extractAmount(summation["ram:RoundingAmount"]),
    taxTotalAmount: extractAmount(summation["ram:TaxTotalAmount"])?.replace(/[^\d.-]/g,"") ?? taxBreakdowns?.reduce((a,b)=>a+parseFloat(b.taxAmount),0).toFixed(2),
  };

  // Payment terms
  let paymentTerms = undefined;
  const ptNode = asArray(settlement["ram:SpecifiedTradePaymentTerms"])[0];
  const pmNode = asArray(settlement["ram:SpecifiedTradeSettlementPaymentMeans"])[0];
  if (ptNode || pmNode) {
    paymentTerms = {
      note: getText(ptNode?.["ram:Description"]),
      paymentDueDate: (() => {
        const d = ptNode?.["ram:DueDateDateTime"]?.["udt:DateTimeString"];
        const v = getText(d);
        if (!v) return undefined;
        if (/^\d{8}$/.test(v)) return `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}`;
        return v.slice(0,10);
      })(),
      paymentMeansCode: getText(pmNode?.["ram:TypeCode"]),
      payeeFinancialAccount: getText(pmNode?.["ram:PayeePartyCreditorFinancialAccount"]?.["ram:IBANID"]),
    };
    if (!paymentTerms.note && !paymentTerms.paymentDueDate && !paymentTerms.paymentMeansCode) paymentTerms = undefined;
  }

  // References
  const refs: any = {};
  const orderRef = getText(agreement["ram:BuyerOrderReferencedDocument"]?.["ram:IssuerAssignedID"]);
  if (orderRef) refs.orderReference = orderRef;
  const contractRef = getText(agreement["ram:ContractReferencedDocument"]?.["ram:IssuerAssignedID"]);
  if (contractRef) refs.contractReference = contractRef;
  const references = Object.keys(refs).length ? refs : undefined;

  // Factur-X profile is in ExchangedDocument Context Guideline
  const context = root["rsm:ExchangedDocumentContext"] ?? {};
  const guidelineParam = context["ram:GuidelineSpecifiedDocumentContextParameter"] ?? {};
  const profileId = getText(guidelineParam["ram:ID"]) ?? "urn:factur-x.eu:1p0:basic";

  return {
    schemaVersion: "1.0",
    id,
    typeCode,
    issueDate,
    dueDate: paymentTerms?.paymentDueDate,
    deliveryDate,
    currencyCode,
    buyerReference: buyerReference ?? undefined,
    seller,
    buyer,
    payee,
    lineItems: lineItems.length ? lineItems : [{ id: "1", quantity: 1, unitPriceAmount: totals.payableAmount, lineExtensionAmount: totals.payableAmount, taxes: [{ categoryCode: "S", rate: 20 }] }],
    taxBreakdowns,
    totals,
    paymentTerms,
    references,
    notes: notes.length ? notes : undefined,
    profileId,
  };
}
