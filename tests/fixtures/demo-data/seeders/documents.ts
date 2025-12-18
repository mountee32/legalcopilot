/**
 * Documents Seeder
 *
 * Seeds 30 demo documents across multiple matters with PDF generation and MinIO upload.
 */

import { db } from "@/lib/db";
import { documents, uploads } from "@/lib/db/schema";
import { DEMO_IDS } from "../ids";
import type { SeederContext } from "../types";
import { generateAllDemoDocuments } from "../demo-documents";
import { uploadFile, initializeBucket } from "@/lib/storage/minio";

export async function seedDocuments(ctx: SeederContext) {
  console.log("\nSeeding documents...");

  const documentsData = [
    // Conveyancing documents (MAT-DEMO-001 - 15 Willow Lane, Richmond)
    {
      id: DEMO_IDS.documents.doc1,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Contract for Sale - 15 Willow Lane",
      type: "contract" as const,
      status: "approved" as const,
      filename: "contract-15-willow-lane.pdf",
      mimeType: "application/pdf",
      fileSize: 245000,
      createdBy: DEMO_IDS.users.associate,
      documentDate: new Date("2024-09-15"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc2,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Report on Title - 15 Willow Lane",
      type: "letter_out" as const,
      status: "sent" as const,
      filename: "report-on-title-15-willow-lane.pdf",
      mimeType: "application/pdf",
      fileSize: 185000,
      createdBy: DEMO_IDS.users.associate,
      documentDate: new Date("2024-09-20"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc3,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Letter to Seller's Solicitor - Enquiries",
      type: "letter_out" as const,
      status: "sent" as const,
      filename: "letter-seller-solicitor-enquiries.pdf",
      mimeType: "application/pdf",
      fileSize: 45000,
      createdBy: DEMO_IDS.users.associate,
      documentDate: new Date("2024-10-01"),
      createdAt: ctx.now,
    },
    // Litigation documents (matter 2)
    {
      id: DEMO_IDS.documents.doc4,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      title: "Particulars of Claim",
      type: "court_form" as const,
      status: "approved" as const,
      filename: "particulars-of-claim.pdf",
      mimeType: "application/pdf",
      fileSize: 180000,
      createdBy: DEMO_IDS.users.partner,
      documentDate: new Date("2024-08-15"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc5,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      title: "Witness Statement - J Smith",
      type: "evidence" as const,
      status: "approved" as const,
      filename: "witness-statement-j-smith.pdf",
      mimeType: "application/pdf",
      fileSize: 92000,
      createdBy: DEMO_IDS.users.partner,
      documentDate: new Date("2024-08-20"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc6,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      title: "Letter to Opposing Counsel",
      type: "letter_out" as const,
      status: "sent" as const,
      filename: "letter-opposing-counsel.pdf",
      mimeType: "application/pdf",
      fileSize: 38000,
      createdBy: DEMO_IDS.users.partner,
      documentDate: new Date("2024-09-05"),
      createdAt: ctx.now,
    },
    // Family Divorce documents
    {
      id: DEMO_IDS.documents.doc7,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.familyDivorce,
      title: "Form E Financial Statement",
      type: "court_form" as const,
      status: "draft" as const,
      filename: "form-e-financial.pdf",
      mimeType: "application/pdf",
      fileSize: 156000,
      createdBy: DEMO_IDS.users.associate2,
      documentDate: new Date("2024-10-10"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc8,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.familyDivorce,
      title: "Consent Order Draft",
      type: "court_form" as const,
      status: "pending_review" as const,
      filename: "consent-order-draft.pdf",
      mimeType: "application/pdf",
      fileSize: 72000,
      createdBy: DEMO_IDS.users.associate2,
      documentDate: new Date("2024-10-12"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc9,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.familyDivorce,
      title: "Bank Statements (Evidence)",
      type: "financial" as const,
      status: "approved" as const,
      filename: "bank-statements.pdf",
      mimeType: "application/pdf",
      fileSize: 210000,
      createdBy: DEMO_IDS.users.paralegal2,
      documentDate: new Date("2024-10-08"),
      createdAt: ctx.now,
    },
    // Employment Dismissal documents
    {
      id: DEMO_IDS.documents.doc10,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.employmentDismissal,
      title: "ET1 Employment Tribunal Form",
      type: "court_form" as const,
      status: "approved" as const,
      filename: "et1-form.pdf",
      mimeType: "application/pdf",
      fileSize: 145000,
      createdBy: DEMO_IDS.users.associate3,
      documentDate: new Date("2024-09-25"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc11,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.employmentDismissal,
      title: "Employment Contract",
      type: "contract" as const,
      status: "approved" as const,
      filename: "employment-contract.pdf",
      mimeType: "application/pdf",
      fileSize: 98000,
      createdBy: DEMO_IDS.users.associate3,
      documentDate: new Date("2024-09-20"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc12,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.employmentDismissal,
      title: "Dismissal Letter",
      type: "letter_in" as const,
      status: "approved" as const,
      filename: "dismissal-letter.pdf",
      mimeType: "application/pdf",
      fileSize: 52000,
      createdBy: DEMO_IDS.users.paralegal1,
      documentDate: new Date("2024-09-18"),
      createdAt: ctx.now,
    },
    // Personal Injury RTA documents
    {
      id: DEMO_IDS.documents.doc13,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      title: "Medical Report - Dr. Williams",
      type: "evidence" as const,
      status: "approved" as const,
      filename: "medical-report.pdf",
      mimeType: "application/pdf",
      fileSize: 185000,
      createdBy: DEMO_IDS.users.associate,
      documentDate: new Date("2024-10-05"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc14,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      title: "Police Accident Report",
      type: "evidence" as const,
      status: "approved" as const,
      filename: "police-report.pdf",
      mimeType: "application/pdf",
      fileSize: 142000,
      createdBy: DEMO_IDS.users.paralegal1,
      documentDate: new Date("2024-09-28"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc15,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      title: "Letter Before Action",
      type: "letter_out" as const,
      status: "sent" as const,
      filename: "letter-before-action.pdf",
      mimeType: "application/pdf",
      fileSize: 68000,
      createdBy: DEMO_IDS.users.associate,
      documentDate: new Date("2024-10-10"),
      createdAt: ctx.now,
    },
    // Probate Estate documents
    {
      id: DEMO_IDS.documents.doc16,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.probateEstate,
      title: "Last Will and Testament",
      type: "other" as const,
      status: "approved" as const,
      filename: "will.pdf",
      mimeType: "application/pdf",
      fileSize: 118000,
      createdBy: DEMO_IDS.users.seniorPartner,
      documentDate: new Date("2024-09-15"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc17,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.probateEstate,
      title: "Grant of Probate Application",
      type: "court_form" as const,
      status: "pending_review" as const,
      filename: "grant-probate-app.pdf",
      mimeType: "application/pdf",
      fileSize: 95000,
      createdBy: DEMO_IDS.users.associate2,
      documentDate: new Date("2024-10-12"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc18,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.probateEstate,
      title: "Estate Valuation Report",
      type: "financial" as const,
      status: "approved" as const,
      filename: "estate-valuation.pdf",
      mimeType: "application/pdf",
      fileSize: 168000,
      createdBy: DEMO_IDS.users.paralegal2,
      documentDate: new Date("2024-10-08"),
      createdAt: ctx.now,
    },
    // Commercial Shareholder documents
    {
      id: DEMO_IDS.documents.doc19,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.commercialShareholder,
      title: "Shareholder Agreement",
      type: "contract" as const,
      status: "approved" as const,
      filename: "shareholder-agreement.pdf",
      mimeType: "application/pdf",
      fileSize: 225000,
      createdBy: DEMO_IDS.users.seniorPartner,
      documentDate: new Date("2024-09-22"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc20,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.commercialShareholder,
      title: "Company Constitution",
      type: "other" as const,
      status: "approved" as const,
      filename: "company-constitution.pdf",
      mimeType: "application/pdf",
      fileSize: 138000,
      createdBy: DEMO_IDS.users.seniorPartner,
      documentDate: new Date("2024-09-20"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc21,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.commercialShareholder,
      title: "Letter to Companies House",
      type: "letter_out" as const,
      status: "sent" as const,
      filename: "letter-companies-house.pdf",
      mimeType: "application/pdf",
      fileSize: 42000,
      createdBy: DEMO_IDS.users.paralegal1,
      documentDate: new Date("2024-09-28"),
      createdAt: ctx.now,
    },
    // Conveyancing Sale documents
    {
      id: DEMO_IDS.documents.doc22,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancingSale,
      title: "Title Deeds",
      type: "other" as const,
      status: "approved" as const,
      filename: "title-deeds.pdf",
      mimeType: "application/pdf",
      fileSize: 198000,
      createdBy: DEMO_IDS.users.associate,
      documentDate: new Date("2024-10-01"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc23,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancingSale,
      title: "Property Information Form",
      type: "other" as const,
      status: "approved" as const,
      filename: "property-info-form.pdf",
      mimeType: "application/pdf",
      fileSize: 85000,
      createdBy: DEMO_IDS.users.paralegal1,
      documentDate: new Date("2024-10-03"),
      createdAt: ctx.now,
    },
    // Litigation Contract documents
    {
      id: DEMO_IDS.documents.doc24,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigationContract,
      title: "Defence and Counterclaim",
      type: "court_form" as const,
      status: "approved" as const,
      filename: "defence-counterclaim.pdf",
      mimeType: "application/pdf",
      fileSize: 165000,
      createdBy: DEMO_IDS.users.partner,
      documentDate: new Date("2024-09-30"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc25,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigationContract,
      title: "Contract in Dispute",
      type: "contract" as const,
      status: "approved" as const,
      filename: "contract-dispute.pdf",
      mimeType: "application/pdf",
      fileSize: 215000,
      createdBy: DEMO_IDS.users.partner,
      documentDate: new Date("2024-09-15"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc26,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigationContract,
      title: "Email Correspondence (Evidence)",
      type: "email_in" as const,
      status: "approved" as const,
      filename: "email-evidence.pdf",
      mimeType: "application/pdf",
      fileSize: 58000,
      createdBy: DEMO_IDS.users.paralegal2,
      documentDate: new Date("2024-09-25"),
      createdAt: ctx.now,
    },
    // Immigration Tier 2 documents
    {
      id: DEMO_IDS.documents.doc27,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.immigrationTier2,
      title: "Visa Application Form",
      type: "court_form" as const,
      status: "pending_review" as const,
      filename: "visa-application.pdf",
      mimeType: "application/pdf",
      fileSize: 125000,
      createdBy: DEMO_IDS.users.associate3,
      documentDate: new Date("2024-10-11"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc28,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.immigrationTier2,
      title: "Passport Copy",
      type: "id_document" as const,
      status: "approved" as const,
      filename: "passport-copy.pdf",
      mimeType: "application/pdf",
      fileSize: 48000,
      createdBy: DEMO_IDS.users.paralegal1,
      documentDate: new Date("2024-10-08"),
      createdAt: ctx.now,
    },
    {
      id: DEMO_IDS.documents.doc29,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.immigrationTier2,
      title: "Certificate of Sponsorship",
      type: "other" as const,
      status: "approved" as const,
      filename: "certificate-sponsorship.pdf",
      mimeType: "application/pdf",
      fileSize: 62000,
      createdBy: DEMO_IDS.users.associate3,
      documentDate: new Date("2024-10-09"),
      createdAt: ctx.now,
    },
    // Criminal Driving documents
    {
      id: DEMO_IDS.documents.doc30,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.criminalDriving,
      title: "Basis of Plea",
      type: "court_form" as const,
      status: "approved" as const,
      filename: "basis-of-plea.pdf",
      mimeType: "application/pdf",
      fileSize: 75000,
      createdBy: DEMO_IDS.users.associate2,
      documentDate: new Date("2024-10-07"),
      createdAt: ctx.now,
    },
  ];

  // Generate and upload actual PDF documents
  let generatedPdfs: Map<string, { content: Uint8Array; filename: string }> = new Map();

  try {
    console.log("  Generating PDF documents...");
    const pdfDocuments = await generateAllDemoDocuments();
    for (const pdf of pdfDocuments) {
      generatedPdfs.set(pdf.id, { content: pdf.content, filename: pdf.filename });
    }
    console.log(`    Generated ${pdfDocuments.length} PDF documents`);

    // Initialize MinIO bucket
    await initializeBucket("uploads");
    console.log("  Uploading documents to MinIO...");
  } catch (error) {
    console.log("  Note: PDF generation skipped (MinIO may not be available)");
  }

  const createdDocuments = [];

  for (const documentData of documentsData) {
    let uploadId: string | undefined;

    // Check if we have a generated PDF for this document
    const pdfData = generatedPdfs.get(documentData.id);
    if (pdfData) {
      try {
        // Create a unique storage filename
        const storagePath = `demo/${documentData.firmId}/${documentData.id}/${pdfData.filename}`;

        // Upload to MinIO
        await uploadFile("uploads", storagePath, Buffer.from(pdfData.content), "application/pdf");

        // Create upload record
        const [upload] = await db
          .insert(uploads)
          .values({
            id: `de000000-0000-4000-b000-${documentData.id.slice(-12)}`, // Deterministic upload ID
            userId: documentData.createdBy,
            filename: storagePath,
            originalName: pdfData.filename,
            mimeType: "application/pdf",
            size: String(pdfData.content.length),
            bucket: "uploads",
            path: storagePath,
            url: `http://${process.env.MINIO_ENDPOINT || "localhost"}:${process.env.MINIO_PORT || "9000"}/uploads/${storagePath}`,
          })
          .onConflictDoUpdate({
            target: uploads.id,
            set: {
              filename: storagePath,
              path: storagePath,
              originalName: pdfData.filename,
              size: String(pdfData.content.length),
              url: `http://${process.env.MINIO_ENDPOINT || "localhost"}:${process.env.MINIO_PORT || "9000"}/uploads/${storagePath}`,
            },
          })
          .returning();

        uploadId = upload.id;
      } catch {
        // MinIO upload failed, continue without file
      }
    }

    const [document] = await db
      .insert(documents)
      .values({
        ...documentData,
        uploadId,
        fileSize: pdfData ? pdfData.content.length : documentData.fileSize,
      })
      .onConflictDoUpdate({
        target: documents.id,
        set: {
          uploadId,
          fileSize: pdfData ? pdfData.content.length : documentData.fileSize,
          createdAt: ctx.now,
        },
      })
      .returning();

    createdDocuments.push(document);

    const hasFile = uploadId ? " [PDF uploaded]" : "";
    console.log(`    Created document: ${document.title}${hasFile}`);
  }

  return createdDocuments;
}
