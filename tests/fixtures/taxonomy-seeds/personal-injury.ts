/**
 * Personal Injury Taxonomy Pack Seed
 *
 * 5 categories, ~39 fields, 20+ document types, action triggers,
 * reconciliation rules, and prompt templates for PI cases.
 */

import type {
  NewTaxonomyPack,
  NewTaxonomyCategory,
  NewTaxonomyField,
  NewTaxonomyDocumentType,
  NewTaxonomyActionTrigger,
  NewTaxonomyReconciliationRule,
  NewTaxonomyPromptTemplate,
} from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// IDs
// ---------------------------------------------------------------------------

const PACK_ID = "de000000-0000-4000-b200-000000000001";

const CAT_IDS = {
  plaintiff: "de000000-0000-4000-b201-000000000001",
  incident: "de000000-0000-4000-b201-000000000002",
  defendant: "de000000-0000-4000-b201-000000000003",
  medical: "de000000-0000-4000-b201-000000000004",
  damages: "de000000-0000-4000-b201-000000000005",
};

// ---------------------------------------------------------------------------
// Pack
// ---------------------------------------------------------------------------

export const personalInjuryPack: NewTaxonomyPack & { id: string } = {
  id: PACK_ID,
  firmId: null,
  key: "personal-injury",
  version: "1.0.0",
  name: "Personal Injury",
  description:
    "Extraction pack for personal injury claims — plaintiff details, incident facts, defendant info, medical treatment, and damages calculations.",
  practiceArea: "personal_injury",
  isSystem: true,
  isActive: true,
  parentPackId: null,
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const personalInjuryCategories: (NewTaxonomyCategory & { id: string })[] = [
  {
    id: CAT_IDS.plaintiff,
    packId: PACK_ID,
    key: "plaintiff_info",
    label: "Plaintiff Information",
    description: "Personal details and contact information for the injured party",
    icon: "user",
    color: "#3b82f6",
    sortOrder: 0,
  },
  {
    id: CAT_IDS.incident,
    packId: PACK_ID,
    key: "incident_details",
    label: "Incident Details",
    description: "Facts about the accident or incident that caused injury",
    icon: "alert-triangle",
    color: "#ef4444",
    sortOrder: 1,
  },
  {
    id: CAT_IDS.defendant,
    packId: PACK_ID,
    key: "defendant_info",
    label: "Defendant Information",
    description: "Defendant details, insurance, and liability information",
    icon: "building",
    color: "#8b5cf6",
    sortOrder: 2,
  },
  {
    id: CAT_IDS.medical,
    packId: PACK_ID,
    key: "medical_treatment",
    label: "Medical Treatment",
    description: "Medical providers, diagnoses, treatment, and prognosis",
    icon: "heart-pulse",
    color: "#10b981",
    sortOrder: 3,
  },
  {
    id: CAT_IDS.damages,
    packId: PACK_ID,
    key: "damages_calculation",
    label: "Damages & Compensation",
    description: "Economic and non-economic damages, lost wages, and settlement",
    icon: "dollar-sign",
    color: "#f59e0b",
    sortOrder: 4,
  },
];

// ---------------------------------------------------------------------------
// Fields (~39 total)
// ---------------------------------------------------------------------------

let fieldOrder = 0;

function makeFieldId(catPrefix: string, seq: number): string {
  return `de000000-0000-4000-b202-${catPrefix}${String(seq).padStart(4, "0")}`;
}

export const personalInjuryFields: NewTaxonomyField[] = [
  // --- Plaintiff Info (8 fields) ---
  {
    id: makeFieldId("01", 1),
    categoryId: CAT_IDS.plaintiff,
    key: "plaintiff_name",
    label: "Plaintiff Full Name",
    dataType: "text",
    examples: ["Maria Garcia", "James Williams"],
    confidenceThreshold: "0.800",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("01", 2),
    categoryId: CAT_IDS.plaintiff,
    key: "date_of_birth",
    label: "Date of Birth",
    dataType: "date",
    examples: ["1990-05-22"],
    confidenceThreshold: "0.850",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("01", 3),
    categoryId: CAT_IDS.plaintiff,
    key: "address",
    label: "Mailing Address",
    dataType: "text",
    examples: ["456 Oak Ave, Chicago, IL 60601"],
    confidenceThreshold: "0.800",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("01", 4),
    categoryId: CAT_IDS.plaintiff,
    key: "phone",
    label: "Phone Number",
    dataType: "text",
    examples: ["(312) 555-0199"],
    confidenceThreshold: "0.800",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("01", 5),
    categoryId: CAT_IDS.plaintiff,
    key: "email",
    label: "Email Address",
    dataType: "text",
    examples: ["maria.garcia@email.com"],
    confidenceThreshold: "0.850",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("01", 6),
    categoryId: CAT_IDS.plaintiff,
    key: "occupation",
    label: "Occupation",
    dataType: "text",
    examples: ["Registered Nurse", "Software Engineer"],
    confidenceThreshold: "0.800",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("01", 7),
    categoryId: CAT_IDS.plaintiff,
    key: "employer_name",
    label: "Employer",
    dataType: "text",
    examples: ["Northwestern Memorial Hospital"],
    confidenceThreshold: "0.800",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("01", 8),
    categoryId: CAT_IDS.plaintiff,
    key: "annual_income",
    label: "Annual Income",
    dataType: "currency",
    examples: ["$85,000.00"],
    confidenceThreshold: "0.850",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },

  // --- Incident Details (9 fields) ---
  {
    id: makeFieldId("02", 1),
    categoryId: CAT_IDS.incident,
    key: "incident_date",
    label: "Date of Incident",
    dataType: "date",
    examples: ["2025-03-10"],
    confidenceThreshold: "0.900",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("02", 2),
    categoryId: CAT_IDS.incident,
    key: "incident_time",
    label: "Time of Incident",
    dataType: "text",
    examples: ["3:15 PM"],
    confidenceThreshold: "0.750",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("02", 3),
    categoryId: CAT_IDS.incident,
    key: "incident_location",
    label: "Location",
    dataType: "text",
    examples: ["Intersection of Main St and 5th Ave, Chicago, IL"],
    confidenceThreshold: "0.800",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("02", 4),
    categoryId: CAT_IDS.incident,
    key: "incident_type",
    label: "Type of Incident",
    dataType: "text",
    examples: ["Motor vehicle accident", "Slip and fall", "Medical malpractice"],
    confidenceThreshold: "0.800",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("02", 5),
    categoryId: CAT_IDS.incident,
    key: "incident_description",
    label: "Description of Incident",
    dataType: "text",
    examples: ["Rear-ended at red light by defendant traveling at approximately 35 mph"],
    confidenceThreshold: "0.750",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("02", 6),
    categoryId: CAT_IDS.incident,
    key: "police_report_number",
    label: "Police Report Number",
    dataType: "text",
    examples: ["CPD-2025-0310-4567"],
    confidenceThreshold: "0.900",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("02", 7),
    categoryId: CAT_IDS.incident,
    key: "witnesses",
    label: "Witnesses",
    dataType: "text",
    examples: ["Tom Johnson, (312) 555-0145"],
    confidenceThreshold: "0.700",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("02", 8),
    categoryId: CAT_IDS.incident,
    key: "statute_of_limitation_date",
    label: "Statute of Limitations Date",
    dataType: "date",
    examples: ["2027-03-10"],
    confidenceThreshold: "0.900",
    requiresHumanReview: true,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("02", 9),
    categoryId: CAT_IDS.incident,
    key: "cause_of_action",
    label: "Cause of Action",
    dataType: "text",
    examples: ["Negligence", "Strict liability", "Premises liability"],
    confidenceThreshold: "0.800",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },

  // --- Defendant Info (7 fields) ---
  {
    id: makeFieldId("03", 1),
    categoryId: CAT_IDS.defendant,
    key: "defendant_name",
    label: "Defendant Name",
    dataType: "text",
    examples: ["Robert Johnson", "ABC Trucking Inc."],
    confidenceThreshold: "0.850",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("03", 2),
    categoryId: CAT_IDS.defendant,
    key: "defendant_address",
    label: "Defendant Address",
    dataType: "text",
    examples: ["789 Commerce Dr, Naperville, IL 60540"],
    confidenceThreshold: "0.800",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("03", 3),
    categoryId: CAT_IDS.defendant,
    key: "defendant_insurance_carrier",
    label: "Insurance Carrier",
    dataType: "text",
    examples: ["State Farm", "Allstate"],
    confidenceThreshold: "0.850",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("03", 4),
    categoryId: CAT_IDS.defendant,
    key: "defendant_policy_number",
    label: "Policy Number",
    dataType: "text",
    examples: ["SF-2025-456789"],
    confidenceThreshold: "0.900",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("03", 5),
    categoryId: CAT_IDS.defendant,
    key: "defendant_policy_limits",
    label: "Policy Limits",
    dataType: "currency",
    examples: ["$100,000/$300,000"],
    confidenceThreshold: "0.850",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("03", 6),
    categoryId: CAT_IDS.defendant,
    key: "defendant_claim_number",
    label: "Claim Number",
    dataType: "text",
    examples: ["CLM-2025-PI-34567"],
    confidenceThreshold: "0.900",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("03", 7),
    categoryId: CAT_IDS.defendant,
    key: "liability_assessment",
    label: "Liability Assessment",
    dataType: "text",
    examples: ["100% defendant at fault", "Comparative fault 70/30"],
    confidenceThreshold: "0.750",
    requiresHumanReview: true,
    sortOrder: fieldOrder++,
  },

  // --- Medical Treatment (8 fields) ---
  {
    id: makeFieldId("04", 1),
    categoryId: CAT_IDS.medical,
    key: "treating_physician",
    label: "Treating Physician",
    dataType: "text",
    examples: ["Dr. Sarah Park, MD"],
    confidenceThreshold: "0.800",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("04", 2),
    categoryId: CAT_IDS.medical,
    key: "diagnosis",
    label: "Primary Diagnosis",
    dataType: "text",
    examples: ["Cervical herniated disc C5-C6", "Traumatic brain injury"],
    confidenceThreshold: "0.850",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("04", 3),
    categoryId: CAT_IDS.medical,
    key: "secondary_diagnoses",
    label: "Secondary Diagnoses",
    dataType: "text",
    examples: ["PTSD, cervical radiculopathy"],
    confidenceThreshold: "0.750",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("04", 4),
    categoryId: CAT_IDS.medical,
    key: "treatment_summary",
    label: "Treatment Summary",
    dataType: "text",
    examples: ["Epidural injections, physical therapy 2x/week"],
    confidenceThreshold: "0.750",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("04", 5),
    categoryId: CAT_IDS.medical,
    key: "surgery_performed",
    label: "Surgery Performed",
    dataType: "text",
    examples: ["Anterior cervical discectomy and fusion C5-C6"],
    confidenceThreshold: "0.850",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("04", 6),
    categoryId: CAT_IDS.medical,
    key: "prognosis",
    label: "Prognosis",
    dataType: "text",
    examples: ["Permanent restrictions, ongoing pain management"],
    confidenceThreshold: "0.800",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("04", 7),
    categoryId: CAT_IDS.medical,
    key: "disability_rating",
    label: "Disability Rating",
    dataType: "percentage",
    examples: ["15%", "25%"],
    confidenceThreshold: "0.900",
    requiresHumanReview: true,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("04", 8),
    categoryId: CAT_IDS.medical,
    key: "future_treatment_needed",
    label: "Future Treatment Needed",
    dataType: "text",
    examples: ["Possible revision surgery, lifetime pain management"],
    confidenceThreshold: "0.750",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },

  // --- Damages (7 fields) ---
  {
    id: makeFieldId("05", 1),
    categoryId: CAT_IDS.damages,
    key: "medical_expenses_to_date",
    label: "Medical Expenses to Date",
    dataType: "currency",
    examples: ["$78,500.00"],
    confidenceThreshold: "0.850",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("05", 2),
    categoryId: CAT_IDS.damages,
    key: "future_medical_expenses",
    label: "Future Medical Expenses",
    dataType: "currency",
    examples: ["$125,000.00"],
    confidenceThreshold: "0.800",
    requiresHumanReview: true,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("05", 3),
    categoryId: CAT_IDS.damages,
    key: "lost_wages_to_date",
    label: "Lost Wages to Date",
    dataType: "currency",
    examples: ["$42,500.00"],
    confidenceThreshold: "0.850",
    requiresHumanReview: false,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("05", 4),
    categoryId: CAT_IDS.damages,
    key: "future_lost_earnings",
    label: "Future Lost Earnings",
    dataType: "currency",
    examples: ["$350,000.00"],
    confidenceThreshold: "0.800",
    requiresHumanReview: true,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("05", 5),
    categoryId: CAT_IDS.damages,
    key: "pain_and_suffering",
    label: "Pain and Suffering",
    dataType: "currency",
    examples: ["$250,000.00"],
    confidenceThreshold: "0.750",
    requiresHumanReview: true,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("05", 6),
    categoryId: CAT_IDS.damages,
    key: "total_damages_demanded",
    label: "Total Damages Demanded",
    dataType: "currency",
    examples: ["$846,000.00"],
    confidenceThreshold: "0.900",
    requiresHumanReview: true,
    sortOrder: fieldOrder++,
  },
  {
    id: makeFieldId("05", 7),
    categoryId: CAT_IDS.damages,
    key: "settlement_amount",
    label: "Settlement Amount",
    dataType: "currency",
    examples: ["$475,000.00"],
    confidenceThreshold: "0.950",
    requiresHumanReview: true,
    sortOrder: fieldOrder++,
  },
];

// ---------------------------------------------------------------------------
// Document Types (20+)
// ---------------------------------------------------------------------------

let dtOrder = 0;

function makeDtId(seq: number): string {
  return `de000000-0000-4000-b203-${String(seq).padStart(12, "0")}`;
}

export const personalInjuryDocTypes: NewTaxonomyDocumentType[] = [
  {
    id: makeDtId(1),
    packId: PACK_ID,
    key: "complaint",
    label: "Complaint / Petition",
    activatedCategories: [
      "plaintiff_info",
      "incident_details",
      "defendant_info",
      "damages_calculation",
    ],
    classificationHints: "Legal complaint, civil petition, initial filing",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(2),
    packId: PACK_ID,
    key: "answer",
    label: "Answer / Response",
    activatedCategories: ["defendant_info", "incident_details"],
    classificationHints: "Defendant's answer, response to complaint",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(3),
    packId: PACK_ID,
    key: "police_report",
    label: "Police Report",
    activatedCategories: ["plaintiff_info", "incident_details", "defendant_info"],
    classificationHints: "Police accident report, incident report, crash report",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(4),
    packId: PACK_ID,
    key: "medical_report",
    label: "Medical Report",
    activatedCategories: ["plaintiff_info", "medical_treatment"],
    classificationHints: "Doctor's report, medical evaluation, clinical findings",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(5),
    packId: PACK_ID,
    key: "medical_records",
    label: "Medical Records",
    activatedCategories: ["medical_treatment"],
    classificationHints: "Hospital records, chart notes, treatment history",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(6),
    packId: PACK_ID,
    key: "medical_bills",
    label: "Medical Bills",
    activatedCategories: ["medical_treatment", "damages_calculation"],
    classificationHints: "Hospital bills, medical invoices, treatment costs",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(7),
    packId: PACK_ID,
    key: "demand_letter",
    label: "Demand Letter",
    activatedCategories: ["plaintiff_info", "defendant_info", "damages_calculation"],
    classificationHints: "Settlement demand, demand package, attorney demand",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(8),
    packId: PACK_ID,
    key: "insurance_correspondence",
    label: "Insurance Correspondence",
    activatedCategories: ["defendant_info", "damages_calculation"],
    classificationHints: "Insurance letter, claim correspondence, adjuster letter",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(9),
    packId: PACK_ID,
    key: "deposition_transcript",
    label: "Deposition Transcript",
    activatedCategories: ["plaintiff_info", "incident_details", "defendant_info"],
    classificationHints: "Deposition, sworn testimony, examination transcript",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(10),
    packId: PACK_ID,
    key: "expert_report",
    label: "Expert Report",
    activatedCategories: ["incident_details", "medical_treatment", "damages_calculation"],
    classificationHints: "Expert witness report, accident reconstruction, economic report",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(11),
    packId: PACK_ID,
    key: "operative_report",
    label: "Operative Report",
    activatedCategories: ["medical_treatment"],
    classificationHints: "Surgery report, operative findings, surgical procedure",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(12),
    packId: PACK_ID,
    key: "imaging_report",
    label: "Imaging / Radiology Report",
    activatedCategories: ["medical_treatment"],
    classificationHints: "MRI report, X-ray report, CT scan results",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(13),
    packId: PACK_ID,
    key: "wage_verification",
    label: "Wage Verification",
    activatedCategories: ["plaintiff_info", "damages_calculation"],
    classificationHints: "Pay stubs, W-2, employer wage verification, earnings history",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(14),
    packId: PACK_ID,
    key: "tax_returns",
    label: "Tax Returns",
    activatedCategories: ["plaintiff_info", "damages_calculation"],
    classificationHints: "Income tax return, 1040, earnings documentation",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(15),
    packId: PACK_ID,
    key: "settlement_agreement",
    label: "Settlement Agreement",
    activatedCategories: ["plaintiff_info", "defendant_info", "damages_calculation"],
    classificationHints: "Settlement, release, compromise agreement",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(16),
    packId: PACK_ID,
    key: "photographs",
    label: "Photographs / Evidence",
    activatedCategories: ["incident_details"],
    classificationHints: "Accident photos, injury photos, scene documentation",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(17),
    packId: PACK_ID,
    key: "property_damage_estimate",
    label: "Property Damage Estimate",
    activatedCategories: ["incident_details", "damages_calculation"],
    classificationHints: "Vehicle repair estimate, property damage appraisal",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(18),
    packId: PACK_ID,
    key: "life_care_plan",
    label: "Life Care Plan",
    activatedCategories: ["medical_treatment", "damages_calculation"],
    classificationHints: "Future care plan, lifetime medical needs assessment",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(19),
    packId: PACK_ID,
    key: "discovery_responses",
    label: "Discovery Responses",
    activatedCategories: ["plaintiff_info", "incident_details", "defendant_info"],
    classificationHints: "Interrogatory answers, request for production responses",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(20),
    packId: PACK_ID,
    key: "motion",
    label: "Motion / Brief",
    activatedCategories: ["incident_details", "damages_calculation"],
    classificationHints: "Summary judgment motion, motion to dismiss, legal brief",
    sortOrder: dtOrder++,
  },
  {
    id: makeDtId(21),
    packId: PACK_ID,
    key: "mediation_brief",
    label: "Mediation Brief",
    activatedCategories: ["plaintiff_info", "incident_details", "damages_calculation"],
    classificationHints: "Mediation statement, settlement conference brief",
    sortOrder: dtOrder++,
  },
];

// ---------------------------------------------------------------------------
// Action Triggers
// ---------------------------------------------------------------------------

function makeTriggerId(seq: number): string {
  return `de000000-0000-4000-b204-${String(seq).padStart(12, "0")}`;
}

export const personalInjuryTriggers: (NewTaxonomyActionTrigger & { id: string })[] = [
  {
    id: makeTriggerId(1),
    packId: PACK_ID,
    triggerType: "deadline",
    name: "Statute of Limitations Alert",
    description: "Creates deadline when statute date is extracted",
    triggerCondition: {
      fieldKey: "statute_of_limitation_date",
      categoryKey: "incident_details",
      operator: "exists",
    },
    actionTemplate: {
      actionType: "create_deadline",
      title: "Statute of Limitations Deadline",
      description: "Filing deadline — verify jurisdiction-specific statute",
      priority: 0,
    },
    jurisdictionSpecific: true,
    jurisdictionRules: {
      IL: { years: 2, note: "2 years per 735 ILCS 5/13-202" },
      CA: { years: 2, note: "2 years per CCP §335.1" },
      NY: { years: 3, note: "3 years per CPLR §214" },
    },
    isDeterministic: true,
  },
  {
    id: makeTriggerId(2),
    packId: PACK_ID,
    triggerType: "alert",
    name: "High-Value Demand",
    description: "Flags cases with total damages > $500K for partner review",
    triggerCondition: {
      fieldKey: "total_damages_demanded",
      categoryKey: "damages_calculation",
      operator: "gt",
      value: 500000,
    },
    actionTemplate: {
      actionType: "request_review",
      title: "High-Value Case — Partner Review Required",
      description: "Total damages demanded exceed $500,000",
      priority: 0,
    },
    jurisdictionSpecific: false,
    isDeterministic: true,
  },
  {
    id: makeTriggerId(3),
    packId: PACK_ID,
    triggerType: "recommendation",
    name: "Surgery Detected",
    description: "Creates task to review surgical outcomes when surgery is found",
    triggerCondition: {
      fieldKey: "surgery_performed",
      categoryKey: "medical_treatment",
      operator: "exists",
    },
    actionTemplate: {
      actionType: "create_task",
      title: "Review Surgical Outcomes — Update Case Valuation",
      description: "Surgery identified. Obtain operative report and update damages calculation.",
      priority: 1,
    },
    jurisdictionSpecific: false,
    isDeterministic: true,
  },
  {
    id: makeTriggerId(4),
    packId: PACK_ID,
    triggerType: "recommendation",
    name: "Disability Rating Found",
    description: "Creates review task for disability rating verification",
    triggerCondition: {
      fieldKey: "disability_rating",
      categoryKey: "medical_treatment",
      operator: "exists",
    },
    actionTemplate: {
      actionType: "create_task",
      title: "Verify Disability Rating — Consider IME",
      description:
        "Disability rating extracted. Verify methodology and consider independent evaluation.",
      priority: 1,
    },
    jurisdictionSpecific: false,
    isDeterministic: true,
  },
  {
    id: makeTriggerId(5),
    packId: PACK_ID,
    triggerType: "alert",
    name: "Comparative Fault Detected",
    description: "Flags case when comparative fault is mentioned",
    triggerCondition: {
      fieldKey: "liability_assessment",
      categoryKey: "defendant_info",
      operator: "contains",
      value: "comparative",
    },
    actionTemplate: {
      actionType: "flag_risk",
      title: "Comparative Fault — Recovery May Be Reduced",
      description:
        "Comparative fault detected. Evaluate impact on recovery and assess jury appeal.",
      priority: 1,
    },
    jurisdictionSpecific: false,
    isDeterministic: true,
  },
];

// ---------------------------------------------------------------------------
// Reconciliation Rules
// ---------------------------------------------------------------------------

function makeRuleId(seq: number): string {
  return `de000000-0000-4000-b205-${String(seq).padStart(12, "0")}`;
}

export const personalInjuryReconciliationRules: (NewTaxonomyReconciliationRule & { id: string })[] =
  [
    {
      id: makeRuleId(1),
      packId: PACK_ID,
      fieldKey: "plaintiff_name",
      caseFieldMapping: "client.name",
      conflictDetectionMode: "fuzzy_text",
      autoApplyThreshold: "0.900",
      requiresHumanReview: false,
    },
    {
      id: makeRuleId(2),
      packId: PACK_ID,
      fieldKey: "date_of_birth",
      caseFieldMapping: "client.dateOfBirth",
      conflictDetectionMode: "date_range",
      autoApplyThreshold: "0.900",
      requiresHumanReview: false,
    },
    {
      id: makeRuleId(3),
      packId: PACK_ID,
      fieldKey: "incident_date",
      caseFieldMapping: "matter.incidentDate",
      conflictDetectionMode: "date_range",
      autoApplyThreshold: "0.950",
      requiresHumanReview: false,
    },
    {
      id: makeRuleId(4),
      packId: PACK_ID,
      fieldKey: "defendant_name",
      caseFieldMapping: "matter.defendantName",
      conflictDetectionMode: "fuzzy_text",
      autoApplyThreshold: "0.850",
      requiresHumanReview: false,
    },
    {
      id: makeRuleId(5),
      packId: PACK_ID,
      fieldKey: "defendant_claim_number",
      caseFieldMapping: "matter.claimNumber",
      conflictDetectionMode: "exact",
      autoApplyThreshold: "0.950",
      requiresHumanReview: false,
    },
    {
      id: makeRuleId(6),
      packId: PACK_ID,
      fieldKey: "diagnosis",
      caseFieldMapping: "matter.diagnosis",
      conflictDetectionMode: "fuzzy_text",
      autoApplyThreshold: "0.800",
      requiresHumanReview: true,
    },
    {
      id: makeRuleId(7),
      packId: PACK_ID,
      fieldKey: "settlement_amount",
      caseFieldMapping: "matter.settlementAmount",
      conflictDetectionMode: "exact",
      autoApplyThreshold: "0.990",
      requiresHumanReview: true,
    },
    {
      id: makeRuleId(8),
      packId: PACK_ID,
      fieldKey: "medical_expenses_to_date",
      caseFieldMapping: "matter.medicalExpenses",
      conflictDetectionMode: "fuzzy_number",
      autoApplyThreshold: "0.900",
      requiresHumanReview: false,
    },
  ];

// ---------------------------------------------------------------------------
// Prompt Templates
// ---------------------------------------------------------------------------

export const personalInjuryPromptTemplates: NewTaxonomyPromptTemplate[] = [
  {
    id: "de000000-0000-4000-b206-000000000001",
    packId: PACK_ID,
    templateType: "classification",
    systemPrompt:
      "You are a legal document classifier specializing in personal injury cases. Classify the document into one of the provided types based on its content.",
    userPromptTemplate:
      'Available document types:\n{{document_types}}\n\nClassify this text excerpt. Return JSON with "documentType" (key) and "confidence" (0-1).\n\nText:\n{{text_sample}}',
    modelPreference: "google/gemini-2.0-flash-001",
    temperature: "0.100",
    maxTokens: 256,
  },
  {
    id: "de000000-0000-4000-b206-000000000002",
    packId: PACK_ID,
    templateType: "extraction",
    systemPrompt:
      "You are a legal document extraction specialist for personal injury cases. Extract structured data precisely. Be conservative with confidence scores.",
    userPromptTemplate:
      'Extract the following fields from this personal injury document.\n\nFields:\n{{field_descriptions}}\n\nDocument type: {{document_type}}\n{{chunk_text}}\n\nReturn JSON array of findings: [{"categoryKey": string, "fieldKey": string, "value": string, "sourceQuote": string, "confidence": number}].',
    modelPreference: "google/gemini-2.0-flash-001",
    temperature: "0.100",
    maxTokens: 2048,
  },
];

// ---------------------------------------------------------------------------
// Aggregate export
// ---------------------------------------------------------------------------

export const personalInjurySeed = {
  pack: personalInjuryPack,
  categories: personalInjuryCategories,
  fields: personalInjuryFields,
  documentTypes: personalInjuryDocTypes,
  triggers: personalInjuryTriggers,
  reconciliationRules: personalInjuryReconciliationRules,
  promptTemplates: personalInjuryPromptTemplates,
};
