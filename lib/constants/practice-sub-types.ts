/**
 * Practice Area Sub-Types
 *
 * Fixed enum of sub-types for each practice area.
 * Used for task templates and matter classification.
 */

export const practiceAreaSubTypes = {
  conveyancing: [
    "freehold_purchase",
    "freehold_sale",
    "leasehold_purchase",
    "leasehold_sale",
    "remortgage",
    "transfer_of_equity",
    "new_build",
    "auction_purchase",
    "commercial_purchase",
    "commercial_sale",
    "commercial_lease",
  ],

  litigation: [
    "contract_dispute",
    "debt_recovery",
    "professional_negligence",
    "property_dispute",
    "inheritance_dispute",
    "judicial_review",
    "defamation",
    "injunction",
  ],

  family: [
    "divorce_petition",
    "financial_settlement",
    "child_arrangements",
    "domestic_abuse",
    "prenuptial_agreement",
    "cohabitation_dispute",
    "adoption",
    "child_abduction",
  ],

  probate: [
    "grant_of_probate",
    "letters_of_administration",
    "estate_administration",
    "will_drafting",
    "intestacy",
    "trust_administration",
    "estate_dispute",
  ],

  employment: [
    "unfair_dismissal",
    "discrimination",
    "redundancy",
    "settlement_agreement",
    "tribunal_claim",
    "contract_dispute",
    "whistleblowing",
  ],

  immigration: [
    "skilled_worker_visa",
    "family_visa",
    "student_visa",
    "indefinite_leave",
    "naturalisation",
    "asylum",
    "deportation_appeal",
    "sponsor_licence",
  ],

  personal_injury: [
    "road_traffic_accident",
    "employer_liability",
    "public_liability",
    "clinical_negligence",
    "industrial_disease",
    "occupiers_liability",
  ],

  commercial: [
    "company_formation",
    "shareholder_agreement",
    "asset_purchase",
    "share_purchase",
    "joint_venture",
    "commercial_contract",
    "terms_and_conditions",
    "gdpr_compliance",
  ],

  criminal: [
    "magistrates_court",
    "crown_court",
    "motoring_offence",
    "fraud",
    "regulatory_prosecution",
    "appeal",
  ],

  ip: [
    "trademark_registration",
    "trademark_dispute",
    "patent_application",
    "copyright_infringement",
    "licensing_agreement",
  ],

  insolvency: [
    "creditor_voluntary_liquidation",
    "compulsory_liquidation",
    "administration",
    "individual_voluntary_arrangement",
    "bankruptcy",
    "debt_restructuring",
  ],

  other: ["general"],
} as const;

export type PracticeArea = keyof typeof practiceAreaSubTypes;
export type SubType<T extends PracticeArea> = (typeof practiceAreaSubTypes)[T][number];
export type AnySubType = SubType<PracticeArea>;

/** All valid sub-types across all practice areas */
export const allSubTypes = Object.values(practiceAreaSubTypes).flat();

/** Task template categories */
export const taskTemplateCategories = [
  "regulatory",
  "legal",
  "firm_policy",
  "best_practice",
] as const;

export type TaskTemplateCategory = (typeof taskTemplateCategories)[number];

/** Assignee roles for template tasks */
export const assigneeRoles = ["fee_earner", "supervisor", "paralegal", "secretary"] as const;

export type AssigneeRole = (typeof assigneeRoles)[number];

/** Due date anchors for relative due dates */
export const dueDateAnchors = ["matter_opened", "key_deadline", "completion"] as const;

export type DueDateAnchor = (typeof dueDateAnchors)[number];

/**
 * Check if a sub-type is valid for a practice area
 */
export function isValidSubType(practiceArea: string, subType: string): boolean {
  const subTypes = practiceAreaSubTypes[practiceArea as PracticeArea];
  if (!subTypes) return false;
  return (subTypes as readonly string[]).includes(subType);
}

/**
 * Get sub-types for a practice area
 */
export function getSubTypesForPracticeArea(practiceArea: string): readonly string[] {
  return practiceAreaSubTypes[practiceArea as PracticeArea] ?? [];
}

/**
 * Format sub-type for display (e.g., "freehold_purchase" -> "Freehold Purchase")
 */
export function formatSubType(subType: string): string {
  return subType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
