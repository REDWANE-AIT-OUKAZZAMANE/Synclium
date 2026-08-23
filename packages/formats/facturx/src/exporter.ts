import { create } from "xmlbuilder2";
import type { CanonicalInvoice, TaxBreakdown } from "@openinvoicebridge/core";

function formatDate102(dateStr: string): string {
  // YYYY-MM-DD -> YYYYMMDD
  return dateStr.replace(/-/g, "");
}

/** Only pass through genuine Factur-X/ZUGFeRD guidelines; ignore foreign profiles. */
function resolveGuideline(profileId?: string): string {
  if (profileId && /factur-x\.eu|zugferd|urn:cen\.eu:en16931/i.test(profileId)) return profileId;
  return "urn:factur-x.eu:1p0:en16931";
}

export function exportFacturX(invoice: CanonicalInvoice): string {
  const root = create({ version: "1.0", encoding: "UTF-8" })
    .ele("rsm:CrossIndustryInvoice", {
      xmlns: "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100",
      "xmlns:rsm": "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100",
      "xmlns:ram": "urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100",
      "xmlns:udt": "urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100",
      "xmlns:qdt": "urn:un:unece:uncefact:data:standard:QualifiedDataType:100",
    });

  // Context
  const ctx = root.ele("rsm:ExchangedDocumentContext");
  ctx.ele("ram:GuidelineSpecifiedDocumentContextParameter").ele("ram:ID").txt(resolveGuideline(invoice.profileId)).up().up();
  ctx.up();

  // ExchangedDocument
  const doc = root.ele("rsm:ExchangedDocument");
  doc.ele("ram:ID").txt(invoice.id).up();
  doc.ele("ram:TypeCode").txt(invoice.typeCode).up();
  doc.ele("ram:IssueDateTime").ele("udt:DateTimeString", { format: "102" }).txt(formatDate102(invoice.issueDate)).up().up();
  if (invoice.notes) {
    for (const n of invoice.notes) {
      doc.ele("ram:IncludedNote").ele("ram:Content").txt(n).up().up();
    }
  }
  doc.up();

  const txn = root.ele("rsm:SupplyChainTradeTransaction");

  // Line items
  invoice.lineItems.forEach((li, idx) => {
    const line = txn.ele("ram:IncludedSupplyChainTradeLineItem");
    line.ele("ram:AssociatedDocumentLineDocument").ele("ram:LineID").txt(li.id).up().up();
    const product = line.ele("ram:SpecifiedTradeProduct");
    if (li.name) product.ele("ram:Name").txt(li.name).up();
    if (li.description) product.ele("ram:Description").txt(li.description).up();
    if (li.itemCode) product.ele("ram:SellerAssignedID").txt(li.itemCode).up();
    product.up();

    const agreement = line.ele("ram:SpecifiedLineTradeAgreement");
    const netPrice = agreement.ele("ram:NetPriceProductTradePrice");
    netPrice.ele("ram:ChargeAmount").txt(li.unitPriceAmount).up();
    netPrice.up();
    agreement.up();

    const delivery = line.ele("ram:SpecifiedLineTradeDelivery");
    delivery.ele("ram:BilledQuantity", { unitCode: li.unitCode ?? "C62" }).txt(String(li.quantity)).up();
    delivery.up();

    const settlement = line.ele("ram:SpecifiedLineTradeSettlement");
    for (const tax of li.taxes) {
      const t = settlement.ele("ram:ApplicableTradeTax");
      t.ele("ram:TypeCode").txt("VAT").up();
      t.ele("ram:CategoryCode").txt(tax.categoryCode).up();
      t.ele("ram:RateApplicablePercent").txt(String(tax.rate)).up();
      t.up();
    }
    const sum = settlement.ele("ram:SpecifiedTradeSettlementLineMonetarySummation");
    sum.ele("ram:LineTotalAmount").txt(li.lineExtensionAmount).up();
    sum.up();
    settlement.up();
    line.up();
  });

  // Header Agreement
  const agreement = txn.ele("ram:ApplicableHeaderTradeAgreement");
  if (invoice.buyerReference) agreement.ele("ram:BuyerReference").txt(invoice.buyerReference).up();
  // Seller
  const sellerParty = agreement.ele("ram:SellerTradeParty");
  sellerParty.ele("ram:Name").txt(invoice.seller.name).up();
  if (invoice.seller.identifiers) {
    for (const id of invoice.seller.identifiers) {
      sellerParty.ele("ram:ID", { schemeID: id.schemeID }).txt(id.value).up();
    }
  }
  if (invoice.seller.tradingName) sellerParty.ele("ram:TradingBusinessName").txt(invoice.seller.tradingName).up();
  const sellerAddr = sellerParty.ele("ram:PostalTradeAddress");
  if (invoice.seller.address.streetName) sellerAddr.ele("ram:LineOne").txt(invoice.seller.address.streetName).up();
  if (invoice.seller.address.additionalStreetName) sellerAddr.ele("ram:LineTwo").txt(invoice.seller.address.additionalStreetName).up();
  if (invoice.seller.address.cityName) sellerAddr.ele("ram:CityName").txt(invoice.seller.address.cityName).up();
  if (invoice.seller.address.postalZone) sellerAddr.ele("ram:PostcodeCode").txt(invoice.seller.address.postalZone).up();
  sellerAddr.ele("ram:CountryID").txt(invoice.seller.address.countryCode).up();
  sellerAddr.up();
  if (invoice.seller.taxId) {
    sellerParty.ele("ram:SpecifiedTaxRegistration").ele("ram:ID", { schemeID: "VA" }).txt(invoice.seller.taxId).up().up();
  }
  sellerParty.up();

  // Buyer
  const buyerParty = agreement.ele("ram:BuyerTradeParty");
  buyerParty.ele("ram:Name").txt(invoice.buyer.name).up();
  if (invoice.buyer.identifiers) {
    for (const id of invoice.buyer.identifiers) {
      buyerParty.ele("ram:ID", { schemeID: id.schemeID }).txt(id.value).up();
    }
  }
  const buyerAddr = buyerParty.ele("ram:PostalTradeAddress");
  if (invoice.buyer.address.streetName) buyerAddr.ele("ram:LineOne").txt(invoice.buyer.address.streetName).up();
  if (invoice.buyer.address.cityName) buyerAddr.ele("ram:CityName").txt(invoice.buyer.address.cityName).up();
  if (invoice.buyer.address.postalZone) buyerAddr.ele("ram:PostcodeCode").txt(invoice.buyer.address.postalZone).up();
  buyerAddr.ele("ram:CountryID").txt(invoice.buyer.address.countryCode).up();
  buyerAddr.up();
  if (invoice.buyer.taxId) {
    buyerParty.ele("ram:SpecifiedTaxRegistration").ele("ram:ID", { schemeID: "VA" }).txt(invoice.buyer.taxId).up().up();
  }
  buyerParty.up();

  if (invoice.payee) {
    const payeeParty = agreement.ele("ram:PayeeTradeParty");
    payeeParty.ele("ram:Name").txt(invoice.payee.name).up();
    payeeParty.up();
  }

  if (invoice.references?.orderReference) {
    agreement.ele("ram:BuyerOrderReferencedDocument").ele("ram:IssuerAssignedID").txt(invoice.references.orderReference).up().up();
  }
  if (invoice.references?.contractReference) {
    agreement.ele("ram:ContractReferencedDocument").ele("ram:IssuerAssignedID").txt(invoice.references.contractReference).up().up();
  }
  agreement.up();

  // Delivery
  const delivery = txn.ele("ram:ApplicableHeaderTradeDelivery");
  if (invoice.deliveryDate) {
    delivery.ele("ram:ActualDeliverySupplyChainEvent").ele("ram:OccurrenceDateTime").ele("udt:DateTimeString", { format: "102" }).txt(formatDate102(invoice.deliveryDate)).up().up().up();
  }
  delivery.up();

  // Settlement
  const settlement = txn.ele("ram:ApplicableHeaderTradeSettlement");
  settlement.ele("ram:InvoiceCurrencyCode").txt(invoice.currencyCode).up();
  if (invoice.buyerReference) settlement.ele("ram:BuyerReference").txt(invoice.buyerReference).up();

  // Payment means
  if (invoice.paymentTerms?.paymentMeansCode || invoice.paymentTerms?.payeeFinancialAccount) {
    const pm = settlement.ele("ram:SpecifiedTradeSettlementPaymentMeans");
    pm.ele("ram:TypeCode").txt(invoice.paymentTerms.paymentMeansCode ?? "30").up();
    if (invoice.paymentTerms.payeeFinancialAccount) {
      pm.ele("ram:PayeePartyCreditorFinancialAccount").ele("ram:IBANID").txt(invoice.paymentTerms.payeeFinancialAccount).up().up();
    }
    pm.up();
  }

  // Tax breakdowns
  const breakdowns: TaxBreakdown[] = invoice.taxBreakdowns ?? (() => {
    // synthesize
    const map = new Map<string, { taxable: number; tax: number; rate: number; code: string }>();
    for (const li of invoice.lineItems) {
      for (const t of li.taxes) {
        const key = `${t.categoryCode}:${t.rate}`;
        const ex = map.get(key) ?? { taxable: 0, tax: 0, rate: t.rate, code: t.categoryCode };
        const taxable = parseFloat(li.lineExtensionAmount);
        ex.taxable += taxable;
        ex.tax += taxable * (t.rate / 100);
        map.set(key, ex);
      }
    }
    return Array.from(map.values()).map<TaxBreakdown>(v => ({
      categoryCode: v.code,
      rate: v.rate,
      taxableAmount: v.taxable.toFixed(2),
      taxAmount: v.tax.toFixed(2),
    }));
  })();

  for (const tb of breakdowns) {
    const tax = settlement.ele("ram:ApplicableTradeTax");
    tax.ele("ram:CalculatedAmount").txt(tb.taxAmount).up();
    tax.ele("ram:TypeCode").txt("VAT").up();
    tax.ele("ram:BasisAmount").txt(tb.taxableAmount).up();
    tax.ele("ram:CategoryCode").txt(tb.categoryCode).up();
    tax.ele("ram:RateApplicablePercent").txt(String(tb.rate)).up();
    if (tb.exemptionReason) tax.ele("ram:ExemptionReason").txt(tb.exemptionReason).up();
    tax.up();
  }

  if (invoice.paymentTerms) {
    const pt = settlement.ele("ram:SpecifiedTradePaymentTerms");
    if (invoice.paymentTerms.note) pt.ele("ram:Description").txt(invoice.paymentTerms.note).up();
    if (invoice.paymentTerms.paymentDueDate) {
      pt.ele("ram:DueDateDateTime").ele("udt:DateTimeString", { format: "102" }).txt(formatDate102(invoice.paymentTerms.paymentDueDate)).up().up();
    }
    pt.up();
  }

  const summation = settlement.ele("ram:SpecifiedTradeSettlementHeaderMonetarySummation");
  summation.ele("ram:LineTotalAmount").txt(invoice.totals.lineExtensionAmount).up();
  summation.ele("ram:TaxBasisTotalAmount").txt(invoice.totals.taxExclusiveAmount).up();
  const taxTotal = invoice.totals.taxTotalAmount ?? breakdowns.reduce((a,b)=>a+parseFloat(b.taxAmount),0).toFixed(2);
  summation.ele("ram:TaxTotalAmount", { currencyID: invoice.currencyCode }).txt(taxTotal).up();
  summation.ele("ram:GrandTotalAmount").txt(invoice.totals.taxInclusiveAmount).up();
  if (invoice.totals.allowanceTotalAmount) summation.ele("ram:AllowanceTotalAmount").txt(invoice.totals.allowanceTotalAmount).up();
  if (invoice.totals.chargeTotalAmount) summation.ele("ram:ChargeTotalAmount").txt(invoice.totals.chargeTotalAmount).up();
  if (invoice.totals.prepaidAmount) summation.ele("ram:TotalPrepaidAmount").txt(invoice.totals.prepaidAmount).up();
  summation.ele("ram:DuePayableAmount").txt(invoice.totals.payableAmount).up();
  summation.up();

  settlement.up();
  txn.up();

  return root.end({ prettyPrint: true });
}
