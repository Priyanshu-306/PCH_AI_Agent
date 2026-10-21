import "server-only";
import PDFDocument from "pdfkit";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { getSetting } from "./settings";
import { fmtDate } from "./format";

// Helvetica has no ₹ glyph, so amounts are printed as "Rs." on the PDF.
const rs = (n: number) => `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** GST tax invoice. Intra-state sales split GST into CGST + SGST; inter-state use IGST. */
export async function renderInvoice(number: string) {
  const [o] = await db.select().from(orders).where(eq(orders.number, number));
  if (!o) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
  const biz = await getSetting("business");
  const intra = o.shippingAddress.state.trim().toLowerCase() === biz.state.trim().toLowerCase();

  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((r) => doc.on("end", () => r(Buffer.concat(chunks))));

  const plum = "#5b3e8c";
  doc.rect(0, 0, doc.page.width, 96).fill(plum);
  doc.fillColor("#fff").fontSize(20).font("Helvetica-Bold").text("Pure Crystal Hub", 48, 30);
  doc.fontSize(9).font("Helvetica").text(`by ${biz.legalName}`, 48, 56);
  doc.fontSize(14).font("Helvetica-Bold").text("TAX INVOICE", 0, 34, { align: "right", width: doc.page.width - 48 });
  doc.fontSize(9).font("Helvetica").text(`${biz.invoicePrefix}/${o.number}`, 0, 54, { align: "right", width: doc.page.width - 48 });

  doc.fillColor("#2a2140").fontSize(9);
  let y = 116;
  doc.font("Helvetica-Bold").text("Sold by", 48, y).font("Helvetica");
  doc.text(biz.legalName, 48, y + 14).text(biz.address, 48, y + 26, { width: 230 });
  doc.text(`State: ${biz.state}`, 48, doc.y + 2).text(`GSTIN: ${biz.gstin || "Not provided"}`, 48, doc.y + 2);
  const a = o.shippingAddress;
  doc.font("Helvetica-Bold").text("Bill / Ship to", 320, y).font("Helvetica");
  doc.text(a.name, 320, y + 14).text([a.line1, a.line2, `${a.city}, ${a.state} ${a.pincode}`].filter(Boolean).join("\n"), 320, y + 26, { width: 230 });
  doc.text(`Phone: ${a.phone}`, 320, doc.y + 2);
  doc.text(`Invoice date: ${fmtDate(o.createdAt)}`, 320, doc.y + 8).text(`Payment: ${o.paymentMethod.toUpperCase()} (${o.paymentStatus})`, 320, doc.y + 2);

  y = Math.max(doc.y, 230) + 20;
  // x and width of each column; the page body spans 48 → 547pt.
  const cols: [number, number][] = [[48, 150], [200, 44], [246, 30], [278, 66], [346, 66], [414, 74], [490, 57]];
  const head = ["Item", "HSN", "Qty", "Rate", "Taxable", intra ? "CGST+SGST" : "IGST", "Amount"];
  doc.rect(48, y - 6, doc.page.width - 96, 22).fill("#f1ebf9");
  doc.fillColor(plum).font("Helvetica-Bold");
  head.forEach((h, i) => doc.text(h, cols[i][0], y, { width: cols[i][1], align: i === 0 ? "left" : "right" }));
  doc.fillColor("#2a2140").font("Helvetica");
  y += 24;

  const discountRatio = o.subtotal ? Number(o.discount) / Number(o.subtotal) : 0;
  let taxableSum = 0;
  let taxSum = 0;
  for (const i of items) {
    const gross = Number(i.unitPrice) * i.qty * (1 - discountRatio);
    const g = Number(i.gstPercent);
    const taxable = gross / (1 + g / 100);
    const tax = gross - taxable;
    taxableSum += taxable;
    taxSum += tax;
    const row = [i.name, i.hsnCode ?? "-", String(i.qty), rs(Number(i.unitPrice)), rs(taxable), `${rs(tax)}\n@ ${g}%`, rs(gross)];
    let bottom = y;
    row.forEach((v, k) => {
      doc.text(v, cols[k][0], y, { width: cols[k][1], align: k === 0 ? "left" : "right" });
      bottom = Math.max(bottom, doc.y);
    });
    y = bottom + 8;
  }

  y += 8;
  doc.moveTo(300, y).lineTo(doc.page.width - 48, y).strokeColor("#d9cfe8").stroke();
  y += 10;
  const line = (label: string, value: string, bold = false) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").text(label, 300, y, { width: 165 }).text(value, 465, y, { width: 82, align: "right" });
    y += 16;
  };
  line("Taxable value", rs(taxableSum));
  if (intra) {
    line("CGST", rs(taxSum / 2));
    line("SGST", rs(taxSum / 2));
  } else line("IGST", rs(taxSum));
  if (Number(o.discount)) line(`Discount${o.couponCode ? ` (${o.couponCode})` : ""}*`, `- ${rs(Number(o.discount))}`);
  if (Number(o.shipping)) line("Shipping", rs(Number(o.shipping)));
  if (Number(o.codFee)) line("COD fee", rs(Number(o.codFee)));
  line("Total", rs(Number(o.total)), true);

  if (Number(o.discount)) doc.fontSize(8).fillColor("#7a6f8a").text("* Discount is already reflected in the taxable value and GST above.", 300, y + 4, { width: 247 });
  doc.fontSize(8).fillColor("#7a6f8a").text("This is a computer-generated invoice. Prices are inclusive of GST.", 48, 760, { align: "center", width: doc.page.width - 96 });
  doc.end();
  return done;
}
