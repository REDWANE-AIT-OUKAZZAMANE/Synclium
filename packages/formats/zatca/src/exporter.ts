import type { CanonicalInvoice } from "@synclium-com/core";
import { export as exportUBL } from "@synclium-com/ubl";

function injectZATCAExtensions(xml: string, invoice: CanonicalInvoice): string {
  const uuid = (invoice.extensions?.["zatca:uuid"] as string) ?? cryptoRandomUUID();
  const icv = (invoice.extensions?.["zatca:ICV"] as string) ?? "1";
  const pih = (invoice.extensions?.["zatca:PIH"] as string) ?? "NWZlY2ViNjZmZmM4NmYzZjE0NmJhZmZhNzA0YzQ2YzI=";

  // Inject UBLExtensions after opening Invoice tag if not already present
  if (!xml.includes("UBLExtensions") && !xml.includes("ext:UBLExtensions")) {
    const ublExtensions = `
  <ext:UBLExtensions xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
    <ext:UBLExtension>
      <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>
      <ext:ExtensionContent>
        <sig:UBLDocumentSignatures xmlns:sig="urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2" xmlns:sac="urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2" xmlns:sbc="urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2">
          <sac:SignatureInformation>
            <cbc:ID>urn:oasis:names:specification:ubl:signature:1</cbc:ID>
            <sbc:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>
          </sac:SignatureInformation>
        </sig:UBLDocumentSignatures>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>`.trim();

    // Insert after <Invoice ...>
    xml = xml.replace(/(<Invoice[^>]*>)/, `$1
  ${ublExtensions}`);
  }

  // Ensure UUID, ProfileID are ZATCA-compliant
  // Replace ProfileID with ZATCA profile if generic PEPPOL
  const zatcaProfile = (invoice.extensions?.["zatca:profileId"] as string) ?? invoice.profileId ?? "reporting:1.0";
  if (zatcaProfile === "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0" || zatcaProfile.includes("peppol")) {
    xml = xml.replace(/<cbc:ProfileID>[^<]*<\/cbc:ProfileID>/, `<cbc:ProfileID>reporting:1.0</cbc:ProfileID>`);
  } else if (zatcaProfile) {
    xml = xml.replace(/<cbc:ProfileID>[^<]*<\/cbc:ProfileID>/, `<cbc:ProfileID>${zatcaProfile}</cbc:ProfileID>`);
  } else {
    xml = xml.replace(/(<cbc:ID>[^<]*<\/cbc:ID>)/, `$1
  <cbc:UUID>${uuid}</cbc:UUID>`);
  }

  // Inject UUID if missing
  if (!xml.includes("<cbc:UUID>")) {
    xml = xml.replace(/(<cbc:ID>[^<]*<\/cbc:ID>)/, `$1
  <cbc:UUID>${uuid}</cbc:UUID>`);
  }

  // Ensure InvoiceTypeCode has name attribute for ZATCA (simplified vs standard)
  // ZATCA NNPNESB spec: 7-digit bitmask where positions 1-2 encode the subtype:
  //   01 = Standard (B2B), 02 = Simplified (B2C)
  //   Positions 3-7 (P/N/E/S/B) are flags for 3rd-party/nominal/export/summary/self-billed.
  // The document type (invoice 388, credit note 381, debit note 383) is the element body value,
  // NOT encoded in the name attribute. All standard documents use 0100000, all simplified use 0200000.
  xml = xml.replace(/<cbc:InvoiceTypeCode(?:\s+name="[^"]*")?>([^<]+)<\/cbc:InvoiceTypeCode>/, (_match, code) => {
    const subtype = invoice.invoiceSubtype ?? "standard";
    const name = subtype === "simplified" ? "0200000" : "0100000";
    return `<cbc:InvoiceTypeCode name="${name}">${code}</cbc:InvoiceTypeCode>`;
  });

  // Inject AdditionalDocumentReference for ICV/PIH if needed for simplified?
  // Add QR-related structure if missing and not already there
  if (!xml.includes("AdditionalDocumentReference") || !xml.includes("ICV")) {
    const additionalDocs = `
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>${icv}</cbc:UUID>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${pih}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>`.trim();
    // Insert before LegalMonetaryTotal
    xml = xml.replace(/(<cac:LegalMonetaryTotal>)/, `${additionalDocs}
  $1`);
  }

  // Ensure xmlns:ext declared in root
  if (!xml.includes("xmlns:ext")) {
    xml = xml.replace("<Invoice", `<Invoice xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"`);
  }

  // ZATCA documents do not use the PEPPOL/EN16931 CustomizationID injected by the
  // base UBL exporter — remove it.
  xml = xml.replace(/[ \t]*<cbc:CustomizationID>[^<]*<\/cbc:CustomizationID>\r?\n/, "");

  return xml;
}

function cryptoRandomUUID(): string {
  // Simple UUID v4 generator for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function exportZATCA(invoice: CanonicalInvoice): string {
  // Start from UBL export then inject ZATCA specifics
  const ublXml = exportUBL({
    ...invoice,
    // Ensure currency is SAR if no specific, but keep original currency if invoice has it (e.g., USD export invoices are allowed)
    // Keep as-is; only default to SAR if missing � but canonical always has currency
    profileId: (invoice.extensions?.["zatca:profileId"] as string) ?? invoice.profileId ?? "reporting:1.0",
  });

  return injectZATCAExtensions(ublXml, invoice);
}
