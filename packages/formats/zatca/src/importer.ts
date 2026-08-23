import { XMLParser } from "fast-xml-parser";
import type { CanonicalInvoice } from "@openinvoicebridge/core";
import { import as importUBL } from "@openinvoicebridge/ubl";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: false,
  trimValues: true,
  processEntities: false,
  htmlEntities: false,
});

function getText(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "object" && "#text" in v) return String(v["#text"]);
  return String(v);
}

export function importZATCA(xml: string): CanonicalInvoice {
  // Leverage UBL importer for base mapping
  const base = importUBL(xml);

  // Extract ZATCA-specific extensions via raw parse
  const parsed: any = parser.parse(xml);
  let inv: any = parsed["Invoice"] ?? Object.values(parsed).find((v: any) => v && typeof v === "object" && (v["cbc:ID"] || v["cbc:UUID"])) ?? {};
  // Try to find by key containing Invoice
  if (!inv || typeof inv !== "object") {
    const key = Object.keys(parsed).find((k) => k.includes("Invoice"));
    if (key) inv = parsed[key];
  }

  const extensions: Record<string, unknown> = { ...(base.extensions ?? {}) };

  // UUID
  const uuid = getText(inv["cbc:UUID"]);
  if (uuid) extensions["zatca:uuid"] = uuid;

  // Profile
  const profile = getText(inv["cbc:ProfileID"]);
  if (profile) extensions["zatca:profileId"] = profile;

  // InvoiceCounter - look in UBLExtensions or custom
  const ublExt = inv["ext:UBLExtensions"] ?? inv["UBLExtensions"];
  if (ublExt) {
    const extStr = JSON.stringify(ublExt);
    if (extStr.includes("InvoiceCounter")) extensions["zatca:hasInvoiceCounter"] = true;
    if (extStr.includes("PreviousInvoiceHash")) extensions["zatca:hasPreviousInvoiceHash"] = true;
    if (extStr.includes("zatca")) extensions["zatca:rawExtensions"] = ublExt;
  }

  // AdditionalDocumentReference for KSA
  const addDocs = inv["cac:AdditionalDocumentReference"];
  if (addDocs) {
    const arr = Array.isArray(addDocs) ? addDocs : [addDocs];
    for (const doc of arr) {
      const id = getText(doc["cbc:ID"]);
      if (id === "ICV" || id === "PIH" || id === "QR") {
        const val = getText(doc["cbc:UUID"]) ?? getText(doc["cac:Attachment"]?.["cbc:EmbeddedDocumentBinaryObject"]);
        if (val) extensions[`zatca:${id}`] = val;
      }
    }
  }

  return {
    ...base,
    profileId: (extensions["zatca:profileId"] as string) ?? base.profileId ?? "reporting:1.0",
    extensions: Object.keys(extensions).length ? extensions : undefined,
  };
}