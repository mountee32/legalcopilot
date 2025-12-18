/**
 * Demo Document Generation
 *
 * Generates actual PDF content for demo documents and uploads to MinIO.
 */

import {
  generateClientLetter,
  generatePropertyContract,
  generateParticularsOfClaim,
  generateWitnessStatement,
  generateFormE,
  generateET1Form,
  generateInvoice,
  generateWill,
} from "./pdf-generator";
import { DEMO_IDS } from "./index";

// Document definitions with their generated content
export interface GeneratedDocument {
  id: string;
  filename: string;
  content: Uint8Array;
}

/**
 * Generate all demo PDF documents
 */
export async function generateAllDemoDocuments(): Promise<GeneratedDocument[]> {
  const documents: GeneratedDocument[] = [];

  // ============================================================================
  // CONVEYANCING DOCUMENTS - MAT-DEMO-001 (15 Willow Lane, Richmond)
  // Client: Mrs Margaret Thompson | Purchase Price: £850,000
  // ============================================================================

  // Contract for Sale - 15 Willow Lane
  documents.push({
    id: DEMO_IDS.documents.doc1,
    filename: "contract-15-willow-lane.pdf",
    content: await generatePropertyContract({
      propertyAddress: "15 Willow Lane, Richmond, Surrey, TW9 1AA",
      sellerName: "David & Sarah Davidson",
      buyerName: "Margaret Elizabeth Thompson",
      purchasePrice: "£850,000",
      completionDate: "20th December 2024",
      contractDate: "15th November 2024",
    }),
  });

  // Letter to Seller's Solicitor - Initial Enquiries
  documents.push({
    id: DEMO_IDS.documents.doc3,
    filename: "letter-seller-solicitor-enquiries.pdf",
    content: await generateClientLetter({
      recipientName: "Ms Helen Browne",
      recipientAddress: [
        "Browne & Partners Solicitors",
        "Richmond House",
        "12 Hill Street",
        "Richmond",
        "TW9 1TW",
      ],
      subject: "Purchase of 15 Willow Lane, Richmond TW9 1AA - Our Client: Mrs M Thompson",
      body: [
        "We write further to the above matter and confirm that we act on behalf of Mrs Margaret Thompson in connection with her proposed purchase of the above property for £850,000.",
        "We have now received the contract pack and have reviewed the documentation. We should be grateful if you would address the following preliminary enquiries at your earliest convenience:",
        "1. Boundaries: Please confirm who owns and maintains the fence between the property and No. 13. The title plan is unclear on this point.",
        "2. Alterations: We note from the Property Information Form that the loft was converted in 2018. Please provide copies of the Building Regulations completion certificate and any FENSA certificates for replacement windows.",
        "3. Japanese Knotweed: Please confirm whether the property or any neighbouring properties have ever been affected by Japanese Knotweed or other invasive species.",
        "4. Disputes: Please confirm whether there have been any disputes with neighbours regarding boundaries, rights of way, or noise.",
        "5. Flooding: Please confirm whether the property has ever been affected by flooding or subsidence, and whether any insurance claims have been made.",
        "We look forward to hearing from you within 14 days. Our client is keen to proceed to exchange before Christmas.",
      ],
      senderName: "James Clarke",
      senderTitle: "Associate Solicitor",
      date: "25th October 2024",
      ourRef: "JC/MT/CONV/2024/001",
    }),
  });

  // Report on Title - Client advice letter
  documents.push({
    id: DEMO_IDS.documents.doc2, // Repurpose doc2 for this
    filename: "report-on-title-15-willow-lane.pdf",
    content: await generateClientLetter({
      recipientName: "Mrs Margaret Thompson",
      recipientAddress: ["42 Oak Road", "Didsbury", "Manchester", "M20 6RT"],
      subject: "Report on Title - 15 Willow Lane, Richmond TW9 1AA",
      body: [
        "CONFIDENTIAL - LEGALLY PRIVILEGED",
        "",
        "We have now completed our investigation of the title to 15 Willow Lane, Richmond and write to report our findings and advise you on the key matters arising.",
        "",
        "THE PROPERTY",
        "The property comprises a detached Victorian house with four bedrooms, two reception rooms, kitchen, and garden. It is registered at HM Land Registry under Title Number SY123456.",
        "",
        "TITLE",
        "The property is held freehold with absolute title. The sellers, Mr David and Mrs Sarah Davidson, have been the registered owners since 2010. There are no restrictions on title that would prevent the sale.",
        "",
        "RESTRICTIVE COVENANTS",
        "The property is subject to a covenant dated 1925 prohibiting the use of the property for any trade or business. This will not affect normal residential occupation.",
        "",
        "SEARCHES",
        "All searches have been received and are satisfactory. The local authority search confirms no adverse planning matters. The drainage search confirms connection to mains drainage. The environmental search shows no contaminated land issues.",
        "",
        "MORTGAGE",
        "We have received your mortgage offer from Nationwide Building Society for £680,000. The offer is valid until 15th January 2025. Please ensure buildings insurance is in place from exchange.",
        "",
        "COMPLETION",
        "Subject to satisfactory replies to our final enquiries, we recommend proceeding to exchange with a target completion date of 20th December 2024.",
        "",
        "Please sign and return the enclosed contract and transfer deed at your earliest convenience.",
      ],
      senderName: "James Clarke",
      senderTitle: "Associate Solicitor",
      date: "20th November 2024",
      ourRef: "JC/MT/CONV/2024/001",
    }),
  });

  // ============================================================================
  // LITIGATION DOCUMENTS
  // ============================================================================

  // Particulars of Claim
  documents.push({
    id: DEMO_IDS.documents.doc4,
    filename: "particulars-of-claim.pdf",
    content: await generateParticularsOfClaim({
      caseNumber: "M24C12345",
      claimant: "Apex Developments Limited",
      defendant: "BuildRight Construction Limited",
      claimValue: "£245,000",
      particulars: [
        "The Claimant is a property development company incorporated under the laws of England and Wales. The Defendant is a construction company similarly incorporated.",
        "By a written contract dated 15th March 2023 ('the Contract'), the Defendant agreed to construct a residential development comprising 12 apartments at Riverside Court, Salford, for the Claimant.",
        "The Contract provided for completion of the works by 1st December 2023 for the sum of £1,850,000.",
        "It was an express term of the Contract that all works would be carried out in a good and workmanlike manner and in accordance with the approved plans and specifications.",
        "In breach of the Contract, the Defendant failed to complete the works by the agreed completion date. The works were eventually completed on 15th March 2024, some 3.5 months late.",
        "Further, the Defendant carried out the works defectively. Particulars of defects include: (a) inadequate foundations to Block B causing subsidence; (b) defective waterproofing to the basement car park; (c) non-compliant fire doors throughout.",
        "As a result of the Defendant's breaches, the Claimant has suffered loss and damage, including the cost of remedial works (£180,000), loss of rental income during the period of delay (£45,000), and professional fees (£20,000).",
      ],
      reliefSought: [
        "Damages in the sum of £245,000 or such other sum as the Court thinks fit",
        "Interest pursuant to section 35A of the Senior Courts Act 1981",
        "Costs",
      ],
      statementOfTruth: {
        name: "Sarah Harrison, Partner, Harrison & Clarke Solicitors",
        date: "15th August 2024",
      },
    }),
  });

  // Witness Statement
  documents.push({
    id: DEMO_IDS.documents.doc5,
    filename: "witness-statement-j-smith.pdf",
    content: await generateWitnessStatement({
      caseNumber: "M24C12345",
      claimant: "Apex Developments Limited",
      defendant: "BuildRight Construction Limited",
      witnessName: "Jonathan Smith",
      witnessAddress: "14 Victoria Road, Sale, M33 2AB",
      witnessOccupation: "Chartered Surveyor",
      statementNumber: 1,
      paragraphs: [
        "I am a Chartered Surveyor and have been instructed by the Claimant's solicitors to provide expert evidence in relation to the construction defects at Riverside Court, Salford.",
        "I have over 25 years' experience in the construction industry and have prepared numerous expert reports for litigation purposes. I am a Fellow of the Royal Institution of Chartered Surveyors.",
        "I inspected the property on 20th April 2024 and again on 15th May 2024. During my inspections, I identified significant defects in the construction works.",
        "The foundations to Block B are inadequate for the ground conditions. I observed cracking to the external walls consistent with differential settlement. In my opinion, underpinning will be required at an estimated cost of £85,000.",
        "The basement car park waterproofing system has failed. There is evidence of water ingress through the walls and floor slab. A tanking system will need to be installed at an estimated cost of £45,000.",
        "The fire doors throughout the development do not meet the required fire rating. All doors will need to be replaced at an estimated cost of £50,000.",
        "In my professional opinion, the total cost of remedial works is £180,000 plus VAT.",
      ],
      date: "1st June 2024",
    }),
  });

  // Letter to Opposing Counsel
  documents.push({
    id: DEMO_IDS.documents.doc6,
    filename: "letter-opposing-counsel.pdf",
    content: await generateClientLetter({
      recipientName: "Ms Rachel Green",
      recipientAddress: ["Greenwood & Partners", "100 Deansgate", "Manchester", "M3 2GQ"],
      subject: "Apex Developments Ltd v BuildRight Construction Ltd - Claim No. M24C12345",
      body: [
        "We refer to the above matter and your client's Defence served on 30th September 2024.",
        "We note that your client denies liability for the defects identified in the Particulars of Claim. However, we have now obtained a detailed expert report from Mr Jonathan Smith FRICS which confirms the existence and extent of the defects.",
        "A copy of Mr Smith's report is enclosed for your consideration. You will note that Mr Smith concludes that the defects are the direct result of poor workmanship and failure to comply with the approved specifications.",
        "In light of this evidence, we invite your client to reconsider their position. Our client remains willing to engage in without prejudice discussions with a view to resolving this matter.",
        "We propose a meeting between the parties and their respective experts to discuss the scope of remedial works. Please confirm whether your client would be willing to participate in such a meeting.",
        "We look forward to hearing from you within 14 days, failing which our client will proceed to apply for directions.",
      ],
      senderName: "Sarah Harrison",
      senderTitle: "Partner",
      date: "15th October 2024",
      ourRef: "SH/AD/LIT/2024/042",
    }),
  });

  // ============================================================================
  // FAMILY LAW DOCUMENTS
  // ============================================================================

  // Form E Financial Statement
  documents.push({
    id: DEMO_IDS.documents.doc7,
    filename: "form-e-financial-statement.pdf",
    content: await generateFormE({
      caseNumber: "MA24D00456",
      applicantName: "Margaret Thompson",
      respondentName: "Peter Thompson",
      assets: [
        { description: "Matrimonial home - 42 Oak Road, Didsbury", value: "£425,000" },
        { description: "Bank accounts (joint)", value: "£15,420" },
        { description: "ISA investments", value: "£32,000" },
        { description: "Premium Bonds", value: "£5,000" },
        { description: "Pension (CETV)", value: "£145,000" },
        { description: "Car - 2021 Audi A4", value: "£22,000" },
        { description: "Jewellery and personal effects", value: "£8,000" },
      ],
      liabilities: [
        { description: "Mortgage on matrimonial home", value: "£180,000" },
        { description: "Credit card debt", value: "£3,500" },
        { description: "Personal loan", value: "£8,000" },
      ],
      income: [
        { source: "Employment - Teacher at St Mary's School", annual: "£42,000" },
        { source: "Child benefit", annual: "£1,885" },
      ],
      date: "20th October 2024",
    }),
  });

  // ============================================================================
  // EMPLOYMENT DOCUMENTS
  // ============================================================================

  // ET1 Employment Tribunal Form
  documents.push({
    id: DEMO_IDS.documents.doc10,
    filename: "et1-employment-tribunal.pdf",
    content: await generateET1Form({
      claimantName: "Michael James O'Brien",
      claimantAddress: ["28 Wilmslow Road", "Fallowfield", "Manchester", "M14 6AB"],
      respondentName: "Northern Manufacturing PLC",
      respondentAddress: ["Industrial Estate", "Trafford Park", "Manchester", "M17 1HH"],
      employmentDates: { start: "15th March 2019", end: "30th June 2024" },
      jobTitle: "Production Manager",
      salary: "£55,000 per annum",
      claimType: "Unfair Dismissal (Ordinary)",
      claimDetails:
        "I was employed as Production Manager for over 5 years with an excellent performance record. On 15th May 2024, I raised concerns about health and safety practices in the factory, specifically regarding inadequate machine guarding and lack of proper PPE. Two weeks later, on 1st June 2024, I was called to a meeting and told that my position was being made redundant due to restructuring. However, I believe this was not a genuine redundancy as: (1) no consultation took place; (2) my role still exists but has been given a different title; (3) a new employee was hired shortly after my dismissal. I believe I was dismissed because I raised health and safety concerns, which amounts to automatic unfair dismissal under s.100 ERA 1996.",
      remedySought:
        "I seek compensation for unfair dismissal including: (1) Basic award; (2) Compensatory award to reflect my loss of earnings and benefits; (3) An uplift for failure to follow the ACAS Code of Practice on Disciplinary and Grievance Procedures. I estimate my total loss at approximately £85,000.",
      date: "28th July 2024",
    }),
  });

  // Employment Contract
  documents.push({
    id: DEMO_IDS.documents.doc11,
    filename: "employment-contract.pdf",
    content: await generateClientLetter({
      recipientName: "Michael O'Brien",
      recipientAddress: ["28 Wilmslow Road", "Fallowfield", "Manchester", "M14 6AB"],
      subject: "Contract of Employment - Production Manager",
      body: [
        "This letter confirms your employment with Northern Manufacturing PLC on the following terms:",
        "Position: Production Manager reporting to the Operations Director. Start Date: 15th March 2019. Salary: £55,000 per annum paid monthly in arrears.",
        "Hours: 40 hours per week, Monday to Friday 8:00am to 5:00pm with one hour for lunch. You may be required to work additional hours as necessary to fulfil your duties.",
        "Holiday: 25 days per annum plus bank holidays. The holiday year runs from 1st January to 31st December. Holiday entitlement is accrued pro rata.",
        "Notice: After completion of your probationary period, you are entitled to receive and required to give 3 months' notice of termination of employment.",
        "This contract is governed by English law and subject to the exclusive jurisdiction of the English courts.",
      ],
      senderName: "HR Department",
      senderTitle: "Northern Manufacturing PLC",
      date: "1st March 2019",
      ourRef: "NM/HR/MOB/2019",
    }),
  });

  // ============================================================================
  // PROBATE DOCUMENTS
  // ============================================================================

  // Will
  documents.push({
    id: DEMO_IDS.documents.doc16,
    filename: "last-will-testament.pdf",
    content: await generateWill({
      testatorName: "John Edward Roberts",
      testatorAddress: "15 Chestnut Avenue, Bramhall, Stockport, SK7 1AB",
      executors: [
        {
          name: "Elizabeth Anne Roberts",
          address: "15 Chestnut Avenue, Bramhall, Stockport, SK7 1AB",
        },
        { name: "George William Henderson", address: "42 Park Lane, Wilmslow, SK9 2PQ" },
      ],
      beneficiaries: [
        {
          name: "Elizabeth Anne Roberts",
          relationship: "wife",
          bequest: "the matrimonial home and all contents",
        },
        { name: "Thomas John Roberts", relationship: "son", bequest: "the sum of £50,000" },
        { name: "Catherine Mary Roberts", relationship: "daughter", bequest: "the sum of £50,000" },
        { name: "Cancer Research UK", relationship: "charity", bequest: "the sum of £10,000" },
      ],
      residuaryBeneficiary:
        "my wife Elizabeth Anne Roberts, or if she predeceases me, to my children in equal shares",
      date: "15th day of March 2020",
    }),
  });

  // ============================================================================
  // INVOICE
  // ============================================================================

  documents.push({
    id: DEMO_IDS.documents.doc19,
    filename: "invoice-apex-developments.pdf",
    content: await generateInvoice({
      invoiceNumber: "INV-2024-001",
      clientName: "Apex Developments Limited",
      clientAddress: ["Riverside House", "100 Quay Street", "Manchester", "M3 3HN"],
      matterRef: "SH/AD/LIT/2024/042",
      matterDescription: "Construction defects claim against BuildRight Construction Ltd",
      lineItems: [
        {
          description: "Partner - reviewing documentation and advising",
          hours: 8.5,
          rate: 350,
          amount: 2975,
        },
        {
          description: "Associate - drafting Particulars of Claim",
          hours: 12.0,
          rate: 200,
          amount: 2400,
        },
        {
          description: "Associate - correspondence with experts",
          hours: 4.5,
          rate: 200,
          amount: 900,
        },
        {
          description: "Paralegal - document review and bundling",
          hours: 15.0,
          rate: 100,
          amount: 1500,
        },
        { description: "Court fee for issuing claim", hours: 0, rate: 0, amount: 455 },
        { description: "Expert's fees (Jonathan Smith FRICS)", hours: 0, rate: 0, amount: 3500 },
      ],
      vatRate: 20,
      date: "31st October 2024",
      dueDate: "30th November 2024",
    }),
  });

  // ============================================================================
  // MORE CLIENT LETTERS
  // ============================================================================

  // Personal Injury - Letter Before Action
  documents.push({
    id: DEMO_IDS.documents.doc15,
    filename: "letter-before-action-pi.pdf",
    content: await generateClientLetter({
      recipientName: "Claims Department",
      recipientAddress: [
        "Tesco Stores Limited",
        "Tesco House",
        "Shire Park",
        "Welwyn Garden City",
        "AL7 1GA",
      ],
      subject:
        "Letter of Claim - Mrs Fatima Hassan - Accident at Tesco Extra, Stretford on 15th June 2024",
      body: [
        "We are instructed by Mrs Fatima Hassan of 45 Moss Lane, Stretford, M32 9PL in connection with an accident which occurred at your Tesco Extra store on Chester Road, Stretford on 15th June 2024.",
        "At approximately 2:30pm, our client was shopping in the store when she slipped on a spillage of cooking oil in aisle 7. She fell heavily onto the floor, sustaining injuries to her lower back, right hip and right wrist.",
        "We allege that this accident was caused by your negligence and/or breach of statutory duty, in that you failed to maintain a safe system for the detection and removal of spillages, failed to adequately train your staff, and failed to provide adequate warning of the hazard.",
        "Our client has suffered significant injury as a result of this accident. She was taken to Manchester Royal Infirmary by ambulance where X-rays confirmed a fractured wrist. She continues to suffer from chronic lower back pain and is currently unable to work.",
        "We enclose a copy of the medical report from Mr James Wilson, Consultant Orthopaedic Surgeon, which sets out the nature and extent of our client's injuries.",
        "In accordance with the Pre-Action Protocol for Personal Injury Claims, please acknowledge this letter within 21 days and provide a full response within 3 months. If liability is denied, please set out your reasons in full.",
      ],
      senderName: "David Chen",
      senderTitle: "Associate Solicitor",
      date: "15th September 2024",
      ourRef: "DC/FH/PI/2024/089",
    }),
  });

  // Immigration - Client update letter
  documents.push({
    id: DEMO_IDS.documents.doc27,
    filename: "visa-application-letter.pdf",
    content: await generateClientLetter({
      recipientName: "Dr Priya Sharma",
      recipientAddress: ["45 Victoria Park", "Rusholme", "Manchester", "M14 5RX"],
      subject: "Skilled Worker Visa Application - Update",
      body: [
        "We write to update you on the progress of your Skilled Worker visa application submitted to UK Visas and Immigration on 1st November 2024.",
        "We are pleased to confirm that your Certificate of Sponsorship has been successfully assigned by your employer, TechStart Solutions Ltd. The COS reference number is ABC123456789.",
        "We have now completed the online application form and submitted all supporting documents, including your passport, proof of English language proficiency, and evidence of maintenance funds.",
        "The current processing time for Skilled Worker visa applications is approximately 3 weeks. We will notify you as soon as we receive a decision.",
        "In the meantime, please ensure that you do not travel outside the UK until your new visa has been granted, as your current visa will expire on 15th December 2024.",
        "If you have any questions or require any further assistance, please do not hesitate to contact us.",
      ],
      senderName: "Emma Williams",
      senderTitle: "Senior Associate",
      date: "5th November 2024",
      ourRef: "EW/PS/IMM/2024/156",
    }),
  });

  return documents;
}
