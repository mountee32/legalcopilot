/**
 * Practice Area Sub-Types
 *
 * Fixed enum of sub-types for each practice area.
 * Used for task templates and matter classification.
 */

export const practiceAreaSubTypes = {
  workers_compensation: [
    "workplace_injury",
    "occupational_disease",
    "temporary_disability",
    "permanent_disability",
    "death_benefits",
    "claim_denial_appeal",
  ],

  insurance_defense: [
    "auto_liability_defense",
    "premises_liability_defense",
    "professional_liability_defense",
    "coverage_dispute",
    "bad_faith_defense",
    "subrogation_recovery",
  ],

  personal_injury: [
    "motor_vehicle_collision",
    "slip_and_fall",
    "medical_malpractice",
    "product_liability",
    "wrongful_death",
    "premises_liability",
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

  employment: [
    "unlawful_termination",
    "workplace_discrimination",
    "wage_and_hour",
    "retaliation",
    "severance_agreement",
    "employment_contract_dispute",
    "whistleblower_claim",
  ],

  immigration: [
    "employment_based_visa",
    "family_based_visa",
    "student_visa",
    "adjustment_of_status",
    "naturalization",
    "asylum",
    "removal_defense",
    "business_immigration_compliance",
  ],

  family: [
    "divorce_petition",
    "property_division",
    "child_custody",
    "domestic_violence_protection",
    "prenuptial_agreement",
    "cohabitation_dispute",
    "adoption",
    "child_support_modification",
  ],

  commercial: [
    "entity_formation",
    "shareholder_agreement",
    "asset_purchase",
    "share_purchase",
    "joint_venture",
    "commercial_contract",
    "terms_and_conditions",
    "privacy_compliance",
  ],

  criminal: [
    "misdemeanor_defense",
    "felony_defense",
    "dui_defense",
    "fraud_defense",
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
    "chapter_7",
    "chapter_11",
    "chapter_13",
    "receivership",
    "debt_restructuring",
    "creditor_rights",
  ],

  // Legacy UK-oriented values retained for compatibility:
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

  probate: [
    "grant_of_probate",
    "letters_of_administration",
    "estate_administration",
    "will_drafting",
    "intestacy",
    "trust_administration",
    "estate_dispute",
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
