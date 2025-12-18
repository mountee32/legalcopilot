/**
 * PDF Generator for Demo Documents
 *
 * Generates realistic UK legal documents for demo/testing purposes.
 * All content is fictional and clearly marked as samples.
 */

import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "pdf-lib";

// Firm details for letterhead
const FIRM = {
  name: "Harrison & Clarke Solicitors",
  address: ["14 Temple Court", "Manchester", "M2 4JB"],
  phone: "0161 234 5678",
  email: "info@harrisonclark.co.uk",
  sraNumber: "SRA 123456",
};

// Helper to add text with word wrapping
function addWrappedText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: PDFFont,
  size: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line + (line ? " " : "") + word;
    const testWidth = font.widthOfTextAtSize(testLine, size);

    if (testWidth > maxWidth && line) {
      page.drawText(line, { x, y: currentY, size, font, color: rgb(0, 0, 0) });
      currentY -= lineHeight;
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) {
    page.drawText(line, { x, y: currentY, size, font, color: rgb(0, 0, 0) });
    currentY -= lineHeight;
  }

  return currentY;
}

// Add firm letterhead to page
async function addLetterhead(page: PDFPage, font: PDFFont, boldFont: PDFFont): Promise<number> {
  const { width, height } = page.getSize();
  let y = height - 50;

  // Firm name
  page.drawText(FIRM.name, {
    x: 50,
    y,
    size: 16,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.4),
  });
  y -= 20;

  // Address
  for (const line of FIRM.address) {
    page.drawText(line, { x: 50, y, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
    y -= 14;
  }

  // Contact details
  page.drawText(`Tel: ${FIRM.phone}  |  ${FIRM.email}`, {
    x: 50,
    y,
    size: 9,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 12;
  page.drawText(
    `Authorised and regulated by the Solicitors Regulation Authority (${FIRM.sraNumber})`,
    {
      x: 50,
      y,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    }
  );

  // Horizontal line
  y -= 15;
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  return y - 30;
}

// Add page footer
function addFooter(page: PDFPage, font: PDFFont, pageNum: number, totalPages: number): void {
  const { width } = page.getSize();
  page.drawText("SAMPLE DOCUMENT - FOR DEMONSTRATION PURPOSES ONLY", {
    x: 50,
    y: 30,
    size: 8,
    font,
    color: rgb(0.6, 0.6, 0.6),
  });
  page.drawText(`Page ${pageNum} of ${totalPages}`, {
    x: width - 100,
    y: 30,
    size: 8,
    font,
    color: rgb(0.6, 0.6, 0.6),
  });
}

// ============================================================================
// DOCUMENT GENERATORS
// ============================================================================

/**
 * Generate a client letter
 */
export async function generateClientLetter(options: {
  recipientName: string;
  recipientAddress: string[];
  subject: string;
  body: string[];
  senderName: string;
  senderTitle: string;
  date: string;
  ourRef: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = await addLetterhead(page, font, boldFont);

  // Date and reference
  page.drawText(options.date, { x: 50, y, size: 10, font });
  page.drawText(`Our Ref: ${options.ourRef}`, { x: 400, y, size: 10, font });
  y -= 30;

  // Recipient
  page.drawText(options.recipientName, { x: 50, y, size: 11, font: boldFont });
  y -= 15;
  for (const line of options.recipientAddress) {
    page.drawText(line, { x: 50, y, size: 10, font });
    y -= 14;
  }
  y -= 20;

  // Subject
  page.drawText(`Re: ${options.subject}`, { x: 50, y, size: 11, font: boldFont });
  y -= 25;

  // Salutation
  page.drawText(`Dear ${options.recipientName.split(" ")[0]},`, { x: 50, y, size: 10, font });
  y -= 20;

  // Body paragraphs
  for (const para of options.body) {
    y = addWrappedText(page, para, 50, y, 495, font, 10, 14);
    y -= 10;
  }

  // Closing
  y -= 10;
  page.drawText("Yours sincerely,", { x: 50, y, size: 10, font });
  y -= 40;
  page.drawText(options.senderName, { x: 50, y, size: 10, font: boldFont });
  y -= 14;
  page.drawText(options.senderTitle, { x: 50, y, size: 10, font });

  addFooter(page, font, 1, 1);
  return doc.save();
}

/**
 * Generate a Contract for Sale of Property
 */
export async function generatePropertyContract(options: {
  propertyAddress: string;
  sellerName: string;
  buyerName: string;
  purchasePrice: string;
  completionDate: string;
  contractDate: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await doc.embedFont(StandardFonts.TimesRomanBold);

  // Page 1 - Cover
  const page1 = doc.addPage([595, 842]);
  let y = 700;

  page1.drawText("CONTRACT", { x: 220, y, size: 24, font: boldFont });
  y -= 30;
  page1.drawText("for the sale of freehold property", { x: 190, y, size: 14, font });
  y -= 80;

  page1.drawText("Property:", { x: 100, y, size: 12, font: boldFont });
  page1.drawText(options.propertyAddress, { x: 200, y, size: 12, font });
  y -= 30;

  page1.drawText("Seller:", { x: 100, y, size: 12, font: boldFont });
  page1.drawText(options.sellerName, { x: 200, y, size: 12, font });
  y -= 20;

  page1.drawText("Buyer:", { x: 100, y, size: 12, font: boldFont });
  page1.drawText(options.buyerName, { x: 200, y, size: 12, font });
  y -= 20;

  page1.drawText("Purchase Price:", { x: 100, y, size: 12, font: boldFont });
  page1.drawText(options.purchasePrice, { x: 200, y, size: 12, font });
  y -= 20;

  page1.drawText("Completion Date:", { x: 100, y, size: 12, font: boldFont });
  page1.drawText(options.completionDate, { x: 200, y, size: 12, font });
  y -= 60;

  page1.drawText("Incorporating the Standard Conditions of Sale (5th Edition)", {
    x: 130,
    y,
    size: 10,
    font,
  });

  addFooter(page1, font, 1, 3);

  // Page 2 - Terms
  const page2 = doc.addPage([595, 842]);
  y = 780;

  page2.drawText("STANDARD CONDITIONS", { x: 200, y, size: 14, font: boldFont });
  y -= 40;

  const conditions = [
    "1. DEFINITIONS",
    "1.1 In this contract, unless the context otherwise requires:",
    '"Buyer" means the person(s) named as buyer in this contract',
    '"Completion Date" means the date specified for completion',
    '"Property" means the property described in this contract',
    '"Purchase Price" means the price payable for the Property',
    '"Seller" means the person(s) named as seller in this contract',
    "",
    "2. DEPOSIT",
    "2.1 The buyer is to pay a deposit of 10% of the purchase price on exchange of contracts.",
    "2.2 The deposit is to be held by the seller's solicitor as stakeholder.",
    "",
    "3. TITLE",
    "3.1 The seller is selling the Property with full title guarantee.",
    "3.2 The title is to be deduced in accordance with s.110 of the Land Registration Act 2002.",
    "",
    "4. COMPLETION",
    "4.1 Completion is to take place on the Completion Date.",
    "4.2 The buyer is to pay the balance of the purchase price on completion.",
    "4.3 On completion the seller is to give vacant possession of the Property.",
    "",
    "5. RISK AND INSURANCE",
    "5.1 The Property is at the buyer's risk from exchange of contracts.",
    "5.2 The buyer is advised to arrange buildings insurance from exchange.",
  ];

  for (const line of conditions) {
    if (line.match(/^\d+\./)) {
      page2.drawText(line, { x: 50, y, size: 11, font: boldFont });
    } else {
      page2.drawText(line, { x: 50, y, size: 10, font });
    }
    y -= 16;
  }

  addFooter(page2, font, 2, 3);

  // Page 3 - Signatures
  const page3 = doc.addPage([595, 842]);
  y = 750;

  page3.drawText("EXECUTION", { x: 250, y, size: 14, font: boldFont });
  y -= 50;

  page3.drawText("Signed by the Seller:", { x: 50, y, size: 11, font: boldFont });
  y -= 60;
  page3.drawLine({ start: { x: 50, y }, end: { x: 250, y }, thickness: 1, color: rgb(0, 0, 0) });
  y -= 15;
  page3.drawText(options.sellerName, { x: 50, y, size: 10, font });
  y -= 15;
  page3.drawText(`Date: ${options.contractDate}`, { x: 50, y, size: 10, font });

  y -= 60;
  page3.drawText("Signed by the Buyer:", { x: 50, y, size: 11, font: boldFont });
  y -= 60;
  page3.drawLine({ start: { x: 50, y }, end: { x: 250, y }, thickness: 1, color: rgb(0, 0, 0) });
  y -= 15;
  page3.drawText(options.buyerName, { x: 50, y, size: 10, font });
  y -= 15;
  page3.drawText(`Date: ${options.contractDate}`, { x: 50, y, size: 10, font });

  addFooter(page3, font, 3, 3);

  return doc.save();
}

/**
 * Generate Particulars of Claim (court document)
 */
export async function generateParticularsOfClaim(options: {
  caseNumber: string;
  claimant: string;
  defendant: string;
  claimValue: string;
  particulars: string[];
  reliefSought: string[];
  statementOfTruth: { name: string; date: string };
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await doc.embedFont(StandardFonts.TimesRomanBold);

  const page = doc.addPage([595, 842]);
  let y = 780;

  // Court header
  page.drawText("IN THE COUNTY COURT AT MANCHESTER", { x: 150, y, size: 12, font: boldFont });
  y -= 25;
  page.drawText(`Claim No: ${options.caseNumber}`, { x: 400, y, size: 10, font });
  y -= 30;

  // Parties
  page.drawText("BETWEEN:", { x: 50, y, size: 11, font: boldFont });
  y -= 25;
  page.drawText(options.claimant.toUpperCase(), { x: 250, y, size: 11, font: boldFont });
  y -= 15;
  page.drawText("Claimant", { x: 280, y, size: 10, font });
  y -= 25;
  page.drawText("-and-", { x: 280, y, size: 10, font });
  y -= 25;
  page.drawText(options.defendant.toUpperCase(), { x: 250, y, size: 11, font: boldFont });
  y -= 15;
  page.drawText("Defendant", { x: 275, y, size: 10, font });
  y -= 40;

  // Title
  page.drawLine({
    start: { x: 50, y: y + 10 },
    end: { x: 545, y: y + 10 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  page.drawText("PARTICULARS OF CLAIM", { x: 200, y, size: 14, font: boldFont });
  y -= 10;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0, 0, 0) });
  y -= 30;

  // Particulars
  let paraNum = 1;
  for (const para of options.particulars) {
    page.drawText(`${paraNum}.`, { x: 50, y, size: 10, font });
    y = addWrappedText(page, para, 80, y, 465, font, 10, 14);
    y -= 15;
    paraNum++;
  }

  // Relief sought
  y -= 10;
  page.drawText("AND THE CLAIMANT CLAIMS:", { x: 50, y, size: 11, font: boldFont });
  y -= 20;

  let reliefNum = 1;
  for (const relief of options.reliefSought) {
    page.drawText(`(${reliefNum})`, { x: 50, y, size: 10, font });
    y = addWrappedText(page, relief, 80, y, 465, font, 10, 14);
    y -= 10;
    reliefNum++;
  }

  // Value
  y -= 20;
  page.drawText(`Value: ${options.claimValue}`, { x: 50, y, size: 10, font: boldFont });

  // Statement of truth
  y -= 40;
  page.drawText("STATEMENT OF TRUTH", { x: 50, y, size: 11, font: boldFont });
  y -= 20;
  y = addWrappedText(
    page,
    "I believe that the facts stated in these Particulars of Claim are true. I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.",
    50,
    y,
    495,
    font,
    9,
    12
  );
  y -= 30;

  page.drawText(`Signed: ______________________`, { x: 50, y, size: 10, font });
  y -= 15;
  page.drawText(`(${options.statementOfTruth.name})`, { x: 50, y, size: 10, font });
  y -= 15;
  page.drawText(`Date: ${options.statementOfTruth.date}`, { x: 50, y, size: 10, font });

  addFooter(page, font, 1, 1);

  return doc.save();
}

/**
 * Generate a Witness Statement
 */
export async function generateWitnessStatement(options: {
  caseNumber: string;
  claimant: string;
  defendant: string;
  witnessName: string;
  witnessAddress: string;
  witnessOccupation: string;
  statementNumber: number;
  paragraphs: string[];
  date: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await doc.embedFont(StandardFonts.TimesRomanBold);

  const page = doc.addPage([595, 842]);
  let y = 780;

  // Header
  page.drawText("IN THE COUNTY COURT AT MANCHESTER", { x: 150, y, size: 12, font: boldFont });
  y -= 20;
  page.drawText(`Claim No: ${options.caseNumber}`, { x: 400, y, size: 10, font });
  y -= 30;

  page.drawText("BETWEEN:", { x: 50, y, size: 10, font: boldFont });
  y -= 15;
  page.drawText(`${options.claimant} (Claimant)`, { x: 200, y, size: 10, font });
  y -= 15;
  page.drawText("-and-", { x: 200, y, size: 10, font });
  y -= 15;
  page.drawText(`${options.defendant} (Defendant)`, { x: 200, y, size: 10, font });
  y -= 30;

  // Title
  page.drawText(`WITNESS STATEMENT OF ${options.witnessName.toUpperCase()}`, {
    x: 130,
    y,
    size: 12,
    font: boldFont,
  });
  y -= 30;

  // Witness details
  page.drawText(
    `I, ${options.witnessName}, of ${options.witnessAddress}, ${options.witnessOccupation}, say as follows:`,
    {
      x: 50,
      y,
      size: 10,
      font,
    }
  );
  y -= 30;

  // Paragraphs
  let paraNum = 1;
  for (const para of options.paragraphs) {
    page.drawText(`${paraNum}.`, { x: 50, y, size: 10, font });
    y = addWrappedText(page, para, 80, y, 465, font, 10, 14);
    y -= 15;
    paraNum++;
  }

  // Statement of truth
  y -= 20;
  page.drawText("STATEMENT OF TRUTH", { x: 50, y, size: 11, font: boldFont });
  y -= 20;
  page.drawText("I believe that the facts stated in this witness statement are true.", {
    x: 50,
    y,
    size: 10,
    font,
  });
  y -= 40;

  page.drawText("Signed: ______________________", { x: 50, y, size: 10, font });
  y -= 15;
  page.drawText(`(${options.witnessName})`, { x: 50, y, size: 10, font });
  y -= 15;
  page.drawText(`Dated: ${options.date}`, { x: 50, y, size: 10, font });

  // Footer info
  y -= 40;
  page.drawText(`Witness Statement of ${options.witnessName}`, { x: 50, y, size: 9, font });
  y -= 12;
  page.drawText(
    `${options.statementNumber}${getOrdinalSuffix(options.statementNumber)} statement`,
    { x: 50, y, size: 9, font }
  );
  y -= 12;
  page.drawText(`Dated: ${options.date}`, { x: 50, y, size: 9, font });

  addFooter(page, font, 1, 1);

  return doc.save();
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Generate Form E (Financial Statement for divorce)
 */
export async function generateFormE(options: {
  caseNumber: string;
  applicantName: string;
  respondentName: string;
  assets: { description: string; value: string }[];
  liabilities: { description: string; value: string }[];
  income: { source: string; annual: string }[];
  date: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595, 842]);
  let y = 780;

  // Header
  page.drawText("FORM E", { x: 260, y, size: 18, font: boldFont });
  y -= 20;
  page.drawText("Financial Statement", { x: 220, y, size: 14, font });
  y -= 15;
  page.drawText("(for a financial order under the Matrimonial Causes Act 1973)", {
    x: 130,
    y,
    size: 10,
    font,
  });
  y -= 30;

  // Case details
  page.drawText(`Case Number: ${options.caseNumber}`, { x: 50, y, size: 10, font });
  y -= 15;
  page.drawText(`Applicant: ${options.applicantName}`, { x: 50, y, size: 10, font });
  y -= 15;
  page.drawText(`Respondent: ${options.respondentName}`, { x: 50, y, size: 10, font });
  y -= 30;

  // Assets section
  page.drawText("SECTION 1: ASSETS", { x: 50, y, size: 12, font: boldFont });
  y -= 20;

  page.drawRectangle({ x: 50, y: y - 15, width: 400, height: 20, color: rgb(0.9, 0.9, 0.9) });
  page.drawText("Description", { x: 55, y: y - 10, size: 10, font: boldFont });
  page.drawText("Value", { x: 380, y: y - 10, size: 10, font: boldFont });
  y -= 20;

  for (const asset of options.assets) {
    page.drawText(asset.description, { x: 55, y, size: 9, font });
    page.drawText(asset.value, { x: 380, y, size: 9, font });
    y -= 15;
  }
  y -= 20;

  // Liabilities section
  page.drawText("SECTION 2: LIABILITIES", { x: 50, y, size: 12, font: boldFont });
  y -= 20;

  page.drawRectangle({ x: 50, y: y - 15, width: 400, height: 20, color: rgb(0.9, 0.9, 0.9) });
  page.drawText("Description", { x: 55, y: y - 10, size: 10, font: boldFont });
  page.drawText("Amount Owed", { x: 360, y: y - 10, size: 10, font: boldFont });
  y -= 20;

  for (const liability of options.liabilities) {
    page.drawText(liability.description, { x: 55, y, size: 9, font });
    page.drawText(liability.value, { x: 380, y, size: 9, font });
    y -= 15;
  }
  y -= 20;

  // Income section
  page.drawText("SECTION 3: INCOME", { x: 50, y, size: 12, font: boldFont });
  y -= 20;

  page.drawRectangle({ x: 50, y: y - 15, width: 400, height: 20, color: rgb(0.9, 0.9, 0.9) });
  page.drawText("Source", { x: 55, y: y - 10, size: 10, font: boldFont });
  page.drawText("Annual Amount", { x: 360, y: y - 10, size: 10, font: boldFont });
  y -= 20;

  for (const inc of options.income) {
    page.drawText(inc.source, { x: 55, y, size: 9, font });
    page.drawText(inc.annual, { x: 380, y, size: 9, font });
    y -= 15;
  }

  // Statement of truth
  y -= 40;
  page.drawText("STATEMENT OF TRUTH", { x: 50, y, size: 11, font: boldFont });
  y -= 20;
  y = addWrappedText(
    page,
    "I confirm that I have read this statement and that the information given is a full, frank, clear and accurate disclosure of my financial and other relevant circumstances.",
    50,
    y,
    450,
    font,
    9,
    12
  );
  y -= 30;

  page.drawText("Signed: ______________________", { x: 50, y, size: 10, font });
  page.drawText(`Date: ${options.date}`, { x: 300, y, size: 10, font });

  addFooter(page, font, 1, 1);

  return doc.save();
}

/**
 * Generate ET1 Employment Tribunal Claim Form
 */
export async function generateET1Form(options: {
  claimantName: string;
  claimantAddress: string[];
  respondentName: string;
  respondentAddress: string[];
  employmentDates: { start: string; end: string };
  jobTitle: string;
  salary: string;
  claimType: string;
  claimDetails: string;
  remedySought: string;
  date: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595, 842]);
  let y = 780;

  // Header
  page.drawRectangle({ x: 0, y: 790, width: 595, height: 52, color: rgb(0.2, 0.2, 0.5) });
  page.drawText("ET1 - Claim to an Employment Tribunal", {
    x: 140,
    y: 805,
    size: 16,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  y = 760;

  // Section 1 - Claimant details
  page.drawText("1. YOUR DETAILS (the claimant)", { x: 50, y, size: 12, font: boldFont });
  y -= 20;

  page.drawText("Name:", { x: 50, y, size: 10, font });
  page.drawText(options.claimantName, { x: 150, y, size: 10, font });
  y -= 15;

  page.drawText("Address:", { x: 50, y, size: 10, font });
  for (let i = 0; i < options.claimantAddress.length; i++) {
    page.drawText(options.claimantAddress[i], { x: 150, y, size: 10, font });
    y -= 15;
  }
  y -= 15;

  // Section 2 - Respondent details
  page.drawText("2. RESPONDENT'S DETAILS", { x: 50, y, size: 12, font: boldFont });
  y -= 20;

  page.drawText("Name:", { x: 50, y, size: 10, font });
  page.drawText(options.respondentName, { x: 150, y, size: 10, font });
  y -= 15;

  page.drawText("Address:", { x: 50, y, size: 10, font });
  for (let i = 0; i < options.respondentAddress.length; i++) {
    page.drawText(options.respondentAddress[i], { x: 150, y, size: 10, font });
    y -= 15;
  }
  y -= 15;

  // Section 3 - Employment details
  page.drawText("3. EMPLOYMENT DETAILS", { x: 50, y, size: 12, font: boldFont });
  y -= 20;

  page.drawText("Job title:", { x: 50, y, size: 10, font });
  page.drawText(options.jobTitle, { x: 150, y, size: 10, font });
  y -= 15;

  page.drawText("Employment started:", { x: 50, y, size: 10, font });
  page.drawText(options.employmentDates.start, { x: 150, y, size: 10, font });
  y -= 15;

  page.drawText("Employment ended:", { x: 50, y, size: 10, font });
  page.drawText(options.employmentDates.end, { x: 150, y, size: 10, font });
  y -= 15;

  page.drawText("Salary:", { x: 50, y, size: 10, font });
  page.drawText(options.salary, { x: 150, y, size: 10, font });
  y -= 25;

  // Section 4 - Claim type
  page.drawText("4. TYPE OF CLAIM", { x: 50, y, size: 12, font: boldFont });
  y -= 20;
  page.drawText(options.claimType, { x: 50, y, size: 10, font });
  y -= 25;

  // Section 5 - Details of claim
  page.drawText("5. DETAILS OF YOUR CLAIM", { x: 50, y, size: 12, font: boldFont });
  y -= 20;
  y = addWrappedText(page, options.claimDetails, 50, y, 495, font, 10, 14);
  y -= 25;

  // Section 6 - Remedy sought
  page.drawText("6. WHAT DO YOU WANT IF YOUR CLAIM IS SUCCESSFUL?", {
    x: 50,
    y,
    size: 12,
    font: boldFont,
  });
  y -= 20;
  y = addWrappedText(page, options.remedySought, 50, y, 495, font, 10, 14);

  // Declaration
  y -= 30;
  page.drawText("DECLARATION", { x: 50, y, size: 11, font: boldFont });
  y -= 15;
  page.drawText("I confirm that the information given in this form is true.", {
    x: 50,
    y,
    size: 9,
    font,
  });
  y -= 30;

  page.drawText("Signed: ______________________", { x: 50, y, size: 10, font });
  page.drawText(`Date: ${options.date}`, { x: 300, y, size: 10, font });

  addFooter(page, font, 1, 1);

  return doc.save();
}

/**
 * Generate a simple invoice
 */
export async function generateInvoice(options: {
  invoiceNumber: string;
  clientName: string;
  clientAddress: string[];
  matterRef: string;
  matterDescription: string;
  lineItems: { description: string; hours: number; rate: number; amount: number }[];
  vatRate: number;
  date: string;
  dueDate: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595, 842]);
  let y = await addLetterhead(page, font, boldFont);

  // Invoice title
  page.drawText("TAX INVOICE", {
    x: 430,
    y: 750,
    size: 18,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.4),
  });
  page.drawText(`No: ${options.invoiceNumber}`, { x: 430, y: 730, size: 10, font });

  // Client details
  page.drawText("TO:", { x: 50, y, size: 10, font: boldFont });
  y -= 15;
  page.drawText(options.clientName, { x: 50, y, size: 11, font: boldFont });
  y -= 15;
  for (const line of options.clientAddress) {
    page.drawText(line, { x: 50, y, size: 10, font });
    y -= 14;
  }
  y -= 20;

  // Invoice details
  page.drawText(`Date: ${options.date}`, { x: 50, y, size: 10, font });
  page.drawText(`Due Date: ${options.dueDate}`, { x: 200, y, size: 10, font });
  y -= 15;
  page.drawText(`Matter Ref: ${options.matterRef}`, { x: 50, y, size: 10, font });
  y -= 15;
  page.drawText(`Re: ${options.matterDescription}`, { x: 50, y, size: 10, font });
  y -= 30;

  // Table header
  const colX = { desc: 50, hours: 320, rate: 380, amount: 460 };
  page.drawRectangle({ x: 45, y: y - 5, width: 505, height: 20, color: rgb(0.9, 0.9, 0.9) });
  page.drawText("Description", { x: colX.desc, y, size: 10, font: boldFont });
  page.drawText("Hours", { x: colX.hours, y, size: 10, font: boldFont });
  page.drawText("Rate", { x: colX.rate, y, size: 10, font: boldFont });
  page.drawText("Amount", { x: colX.amount, y, size: 10, font: boldFont });
  y -= 25;

  // Line items
  let subtotal = 0;
  for (const item of options.lineItems) {
    page.drawText(item.description.substring(0, 40), { x: colX.desc, y, size: 9, font });
    page.drawText(item.hours.toFixed(1), { x: colX.hours, y, size: 9, font });
    page.drawText(`£${item.rate.toFixed(2)}`, { x: colX.rate, y, size: 9, font });
    page.drawText(`£${item.amount.toFixed(2)}`, { x: colX.amount, y, size: 9, font });
    subtotal += item.amount;
    y -= 18;
  }

  // Totals
  y -= 10;
  page.drawLine({
    start: { x: 380, y: y + 5 },
    end: { x: 550, y: y + 5 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  page.drawText("Subtotal:", { x: 380, y, size: 10, font });
  page.drawText(`£${subtotal.toFixed(2)}`, { x: 480, y, size: 10, font });
  y -= 18;

  const vat = subtotal * (options.vatRate / 100);
  page.drawText(`VAT @ ${options.vatRate}%:`, { x: 380, y, size: 10, font });
  page.drawText(`£${vat.toFixed(2)}`, { x: 480, y, size: 10, font });
  y -= 18;

  const total = subtotal + vat;
  page.drawRectangle({ x: 375, y: y - 5, width: 175, height: 20, color: rgb(0.9, 0.9, 0.9) });
  page.drawText("TOTAL DUE:", { x: 380, y, size: 11, font: boldFont });
  page.drawText(`£${total.toFixed(2)}`, { x: 480, y, size: 11, font: boldFont });

  // Payment details
  y -= 60;
  page.drawText("Payment Details:", { x: 50, y, size: 10, font: boldFont });
  y -= 15;
  page.drawText("Bank: National Westminster Bank plc", { x: 50, y, size: 9, font });
  y -= 12;
  page.drawText("Account Name: Harrison & Clarke Solicitors Client Account", {
    x: 50,
    y,
    size: 9,
    font,
  });
  y -= 12;
  page.drawText("Sort Code: 60-00-01  |  Account Number: 12345678", { x: 50, y, size: 9, font });
  y -= 12;
  page.drawText(`Reference: ${options.invoiceNumber}`, { x: 50, y, size: 9, font });

  addFooter(page, font, 1, 1);

  return doc.save();
}

/**
 * Generate Will document
 */
export async function generateWill(options: {
  testatorName: string;
  testatorAddress: string;
  executors: { name: string; address: string }[];
  beneficiaries: { name: string; relationship: string; bequest: string }[];
  residuaryBeneficiary: string;
  date: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await doc.embedFont(StandardFonts.TimesRomanBold);

  const page = doc.addPage([595, 842]);
  let y = 760;

  // Title
  page.drawText("LAST WILL AND TESTAMENT", { x: 170, y, size: 18, font: boldFont });
  y -= 20;
  page.drawText("OF", { x: 285, y, size: 12, font });
  y -= 20;
  page.drawText(options.testatorName.toUpperCase(), { x: 200, y, size: 14, font: boldFont });
  y -= 50;

  // Revocation
  page.drawText("1.", { x: 50, y, size: 11, font: boldFont });
  y = addWrappedText(
    page,
    `I, ${options.testatorName}, of ${options.testatorAddress}, hereby revoke all former wills and testamentary dispositions made by me and declare this to be my last will.`,
    70,
    y,
    475,
    font,
    11,
    16
  );
  y -= 25;

  // Executors
  page.drawText("2.", { x: 50, y, size: 11, font: boldFont });
  page.drawText("EXECUTORS", { x: 70, y, size: 11, font: boldFont });
  y -= 20;
  y = addWrappedText(
    page,
    "I appoint as the Executors and Trustees of this my will:",
    70,
    y,
    475,
    font,
    11,
    16
  );
  y -= 10;

  for (const exec of options.executors) {
    y = addWrappedText(page, `• ${exec.name} of ${exec.address}`, 90, y, 455, font, 11, 16);
  }
  y -= 25;

  // Specific gifts
  page.drawText("3.", { x: 50, y, size: 11, font: boldFont });
  page.drawText("SPECIFIC GIFTS", { x: 70, y, size: 11, font: boldFont });
  y -= 20;
  page.drawText("I give the following specific gifts:", { x: 70, y, size: 11, font });
  y -= 20;

  for (const ben of options.beneficiaries) {
    y = addWrappedText(
      page,
      `• To ${ben.name} (my ${ben.relationship}): ${ben.bequest}`,
      90,
      y,
      455,
      font,
      11,
      16
    );
    y -= 5;
  }
  y -= 25;

  // Residuary estate
  page.drawText("4.", { x: 50, y, size: 11, font: boldFont });
  page.drawText("RESIDUARY ESTATE", { x: 70, y, size: 11, font: boldFont });
  y -= 20;
  y = addWrappedText(
    page,
    `I give all the rest of my estate (after payment of my debts, funeral expenses and any legacies) to ${options.residuaryBeneficiary} absolutely.`,
    70,
    y,
    475,
    font,
    11,
    16
  );
  y -= 40;

  // Execution
  page.drawText("IN WITNESS WHEREOF", { x: 70, y, size: 11, font: boldFont });
  y -= 20;
  y = addWrappedText(
    page,
    `I have set my hand to this my will this ${options.date}.`,
    70,
    y,
    475,
    font,
    11,
    16
  );
  y -= 40;

  page.drawText("SIGNED by the above-named Testator", { x: 70, y, size: 10, font });
  y -= 30;
  page.drawLine({ start: { x: 70, y }, end: { x: 270, y }, thickness: 1, color: rgb(0, 0, 0) });
  y -= 15;
  page.drawText(options.testatorName, { x: 70, y, size: 10, font });

  // Witnesses
  y -= 40;
  page.drawText("in our presence and then by us in the presence of the Testator:", {
    x: 70,
    y,
    size: 10,
    font,
  });
  y -= 30;

  page.drawText("Witness 1:", { x: 70, y, size: 10, font: boldFont });
  page.drawText("Witness 2:", { x: 320, y, size: 10, font: boldFont });
  y -= 30;
  page.drawLine({ start: { x: 70, y }, end: { x: 220, y }, thickness: 1, color: rgb(0, 0, 0) });
  page.drawLine({ start: { x: 320, y }, end: { x: 470, y }, thickness: 1, color: rgb(0, 0, 0) });
  y -= 15;
  page.drawText("Signature", { x: 70, y, size: 8, font });
  page.drawText("Signature", { x: 320, y, size: 8, font });

  addFooter(page, font, 1, 1);

  return doc.save();
}
