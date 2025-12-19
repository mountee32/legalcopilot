import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";

async function createTestPDF() {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { height } = page.getSize();

  // Title
  page.drawText("CONTRACT FOR SALE OF PROPERTY", {
    x: 100,
    y: height - 80,
    size: 18,
    font: timesBold,
    color: rgb(0, 0, 0),
  });

  // Date
  page.drawText("Date: 15 January 2024", {
    x: 50,
    y: height - 120,
    size: 12,
    font: timesRoman,
  });

  // Parties section
  page.drawText("PARTIES", {
    x: 50,
    y: height - 160,
    size: 14,
    font: timesBold,
  });

  page.drawText("1. SELLER: Margaret Thompson of 15 Willow Lane, Richmond, Surrey TW9 1AA", {
    x: 50,
    y: height - 185,
    size: 11,
    font: timesRoman,
  });

  page.drawText("2. BUYER: John Smith of 42 Oak Road, London SW15 2BB", {
    x: 50,
    y: height - 205,
    size: 11,
    font: timesRoman,
  });

  // Property section
  page.drawText("PROPERTY", {
    x: 50,
    y: height - 245,
    size: 14,
    font: timesBold,
  });

  page.drawText("The freehold property known as 15 Willow Lane, Richmond, Surrey TW9 1AA", {
    x: 50,
    y: height - 270,
    size: 11,
    font: timesRoman,
  });

  page.drawText("registered at HM Land Registry under title number SY123456.", {
    x: 50,
    y: height - 290,
    size: 11,
    font: timesRoman,
  });

  // Purchase Price
  page.drawText("PURCHASE PRICE", {
    x: 50,
    y: height - 330,
    size: 14,
    font: timesBold,
  });

  page.drawText("The purchase price is GBP 750,000 (Seven Hundred and Fifty Thousand Pounds).", {
    x: 50,
    y: height - 355,
    size: 11,
    font: timesRoman,
  });

  // Key Dates
  page.drawText("KEY DATES", {
    x: 50,
    y: height - 395,
    size: 14,
    font: timesBold,
  });

  page.drawText("Exchange Date: 1 February 2024", {
    x: 50,
    y: height - 420,
    size: 11,
    font: timesRoman,
  });

  page.drawText("Completion Date: 28 February 2024", {
    x: 50,
    y: height - 440,
    size: 11,
    font: timesRoman,
  });

  // Terms
  page.drawText("TERMS AND CONDITIONS", {
    x: 50,
    y: height - 480,
    size: 14,
    font: timesBold,
  });

  const terms = [
    "1. The Seller agrees to sell and the Buyer agrees to purchase the Property.",
    "2. The Property is sold with vacant possession on completion.",
    "3. A deposit of 10% shall be paid on exchange of contracts.",
    "4. The sale is subject to the Standard Conditions of Sale (5th Edition).",
    "5. The Buyer has inspected the Property and purchases with full knowledge",
    "   of its condition.",
  ];

  let yPos = height - 505;
  for (const term of terms) {
    page.drawText(term, {
      x: 50,
      y: yPos,
      size: 10,
      font: timesRoman,
    });
    yPos -= 18;
  }

  // Signatures
  page.drawText("SIGNED by the parties:", {
    x: 50,
    y: height - 650,
    size: 12,
    font: timesBold,
  });

  page.drawText("_______________________          _______________________", {
    x: 50,
    y: height - 700,
    size: 11,
    font: timesRoman,
  });

  page.drawText("Margaret Thompson (Seller)          John Smith (Buyer)", {
    x: 50,
    y: height - 720,
    size: 10,
    font: timesRoman,
  });

  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(__dirname, "test-contract.pdf");
  fs.writeFileSync(outputPath, pdfBytes);
  console.log("Created:", outputPath);
}

createTestPDF().catch(console.error);
