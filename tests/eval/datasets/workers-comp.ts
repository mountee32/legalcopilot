/**
 * Workers' Compensation — Gold Evaluation Dataset
 *
 * Synthetic documents with known ground-truth values for measuring
 * classification accuracy and extraction precision/recall.
 */

import type { GoldDataset } from "../types";

export const dataset: GoldDataset = {
  name: "Workers' Compensation Gold Dataset v1",
  packKey: "workers-comp",
  documents: [
    {
      id: "wc-gold-001",
      expectedDocType: "first_report_of_injury",
      text: `EMPLOYER'S FIRST REPORT OF INJURY OR ILLNESS

State File No: WC-2025-IL-00456
Date of Report: January 20, 2025

EMPLOYEE INFORMATION
Name: Michael Anthony Rodriguez
Date of Birth: March 15, 1982
Social Security No: XXX-XX-4589
Address: 2847 Elm Street, Springfield, IL 62704
Phone: (217) 555-0198
Email: m.rodriguez@email.com
Occupation: Warehouse Foreman
Date of Hire: June 1, 2018
Marital Status: Married
Number of Dependents: 3

EMPLOYER INFORMATION
Employer Name: Midwest Distribution Centers LLC
Address: 1200 Industrial Parkway, Springfield, IL 62704
FEIN: 37-4521890
Insurance Carrier: Hartford Fire Insurance Company
Policy Number: WC-HFI-2025-78432
Claims Adjuster: Patricia Ann Williams

INJURY INFORMATION
Date of Injury: January 15, 2025
Time of Injury: 2:45 PM
Location: Loading Dock B, Building 3, 1200 Industrial Parkway
Description: Employee was operating a forklift to move pallets of automotive parts
(approximately 1,800 lbs each) when the forklift struck an uneven seam in the concrete
floor. The sudden jolt caused the employee to be thrown forward against the steering
column, striking his lower back and right shoulder against the seat restraint. Employee
reported immediate sharp pain in the lumbar region and right shoulder area.
Body Parts Affected: Lower back (lumbar spine), right shoulder
Type of Injury: Strain/Sprain, Contusion
Cause: Forklift accident - struck against object
Witnesses: David Chen (shift supervisor), Badge #1847; Maria Santos (co-worker)

Employer contests claim: No

Signature: James Henderson, HR Director
Date: January 20, 2025`,
      expectedFindings: [
        {
          categoryKey: "claimant_info",
          fieldKey: "claimant_name",
          value: "Michael Anthony Rodriguez",
          required: true,
        },
        {
          categoryKey: "claimant_info",
          fieldKey: "date_of_birth",
          value: "1982-03-15",
          required: true,
        },
        { categoryKey: "claimant_info", fieldKey: "ssn_last4", value: "4589" },
        {
          categoryKey: "claimant_info",
          fieldKey: "address",
          value: "2847 Elm Street, Springfield, IL 62704",
        },
        { categoryKey: "claimant_info", fieldKey: "phone", value: "(217) 555-0198" },
        { categoryKey: "claimant_info", fieldKey: "occupation", value: "Warehouse Foreman" },
        { categoryKey: "claimant_info", fieldKey: "hire_date", value: "2018-06-01" },
        { categoryKey: "claimant_info", fieldKey: "marital_status", value: "Married" },
        { categoryKey: "claimant_info", fieldKey: "dependents_count", value: "3" },
        {
          categoryKey: "injury_details",
          fieldKey: "injury_date",
          value: "2025-01-15",
          required: true,
        },
        { categoryKey: "injury_details", fieldKey: "injury_time", value: "2:45 PM" },
        {
          categoryKey: "injury_details",
          fieldKey: "body_parts_affected",
          value: "Lower back (lumbar spine), right shoulder",
        },
        {
          categoryKey: "injury_details",
          fieldKey: "injury_type",
          value: "Strain/Sprain, Contusion",
        },
        {
          categoryKey: "employer_info",
          fieldKey: "employer_name",
          value: "Midwest Distribution Centers LLC",
          required: true,
        },
        { categoryKey: "employer_info", fieldKey: "employer_fein", value: "37-4521890" },
        {
          categoryKey: "employer_info",
          fieldKey: "insurance_carrier",
          value: "Hartford Fire Insurance Company",
        },
        { categoryKey: "employer_info", fieldKey: "policy_number", value: "WC-HFI-2025-78432" },
        { categoryKey: "employer_info", fieldKey: "adjuster_name", value: "Patricia Ann Williams" },
        { categoryKey: "employer_info", fieldKey: "employer_contested", value: "false" },
      ],
      packKey: "workers-comp",
    },
    {
      id: "wc-gold-002",
      expectedDocType: "medical_report",
      text: `MEDICAL REPORT — WORKERS' COMPENSATION

Patient: Michael A. Rodriguez    DOB: 03/15/1982
Claim #: CLM-2025-WC-78432     Date of Injury: 01/15/2025
Date of Examination: February 3, 2025

TREATING PHYSICIAN: Dr. Robert K. Chen, MD
Board Certified — Orthopedic Surgery
Springfield Orthopedic Associates
456 Medical Center Drive, Springfield, IL 62702

HISTORY OF PRESENT ILLNESS:
Mr. Rodriguez presents for follow-up evaluation 19 days post-workplace injury.
Patient reports persistent lower back pain radiating to the right leg (L4-L5
distribution) and right shoulder pain with limited range of motion. Pain rated
7/10 at rest, 9/10 with movement.

PHYSICAL EXAMINATION:
- Lumbar spine: Tenderness to palpation L4-L5, positive straight leg raise on
  right at 35 degrees, reduced lumbar flexion
- Right shoulder: Positive Neer's test, positive Hawkins test, limited abduction
  to 90 degrees (normal 180), pain with overhead reaching

IMAGING:
MRI Lumbar Spine (01/25/2025): L4-L5 disc herniation with moderate foraminal
stenosis on the right. No cord compression.
MRI Right Shoulder (01/25/2025): Partial thickness rotator cuff tear
(supraspinatus), moderate subacromial bursitis.

DIAGNOSIS:
1. Lumbar disc herniation L4-L5 with right-sided radiculopathy (M51.16)
2. Partial rotator cuff tear, right shoulder (M75.11)
3. Subacromial bursitis, right shoulder (M75.51)

TREATMENT PLAN:
1. Physical therapy 3x/week for 8 weeks (lumbar stabilization + shoulder rehab)
2. Gabapentin 300mg TID for radicular pain
3. Corticosteroid injection right shoulder — scheduled 02/10/2025
4. Follow-up in 6 weeks
5. Work restrictions: No lifting over 10 lbs, no overhead reaching, no prolonged
   sitting >30 minutes, no operating heavy equipment

WORK STATUS: Temporary Total Disability effective 01/16/2025

Robert K. Chen, MD
Orthopedic Surgery`,
      expectedFindings: [
        {
          categoryKey: "claimant_info",
          fieldKey: "claimant_name",
          value: "Michael A. Rodriguez",
          required: true,
        },
        { categoryKey: "claimant_info", fieldKey: "date_of_birth", value: "1982-03-15" },
        {
          categoryKey: "injury_details",
          fieldKey: "injury_date",
          value: "2025-01-15",
          required: true,
        },
        {
          categoryKey: "injury_details",
          fieldKey: "body_parts_affected",
          value: "Lower back (lumbar spine), right shoulder",
        },
        {
          categoryKey: "medical_treatment",
          fieldKey: "treating_physician",
          value: "Dr. Robert K. Chen, MD",
          required: true,
        },
        {
          categoryKey: "medical_treatment",
          fieldKey: "diagnosis",
          value: "Lumbar disc herniation L4-L5 with right-sided radiculopathy (M51.16)",
          required: true,
        },
        {
          categoryKey: "medical_treatment",
          fieldKey: "treatment_summary",
          value:
            "Physical therapy 3x/week for 8 weeks, Gabapentin 300mg TID, corticosteroid injection",
        },
        {
          categoryKey: "medical_treatment",
          fieldKey: "work_restrictions",
          value: "No lifting over 10 lbs, no overhead reaching, no prolonged sitting >30 minutes",
        },
        { categoryKey: "employer_info", fieldKey: "claim_number", value: "CLM-2025-WC-78432" },
        { categoryKey: "benefits_compensation", fieldKey: "ttd_start_date", value: "2025-01-16" },
      ],
      packKey: "workers-comp",
    },
    {
      id: "wc-gold-003",
      expectedDocType: "wage_statement",
      text: `WAGE VERIFICATION STATEMENT
Workers' Compensation Claim

Employer: Midwest Distribution Centers LLC
Employee: Michael A. Rodriguez
Employee ID: EMP-4521
Date of Injury: 01/15/2025

EARNINGS HISTORY (52-week period prior to injury):
Period: January 14, 2024 — January 13, 2025

Regular Wages:
  Bi-weekly gross: $2,307.69
  Annual salary: $60,000.00

Overtime (last 52 weeks):
  Total overtime hours: 312
  Total overtime pay: $13,500.00

Total earnings (52 weeks): $73,500.00

AVERAGE WEEKLY WAGE CALCULATION:
Total earnings / 52 weeks = $1,413.46

Computed TTD Rate (2/3 of AWW): $942.31
Maximum TTD Rate (IL 2025): $1,956.44
Applicable TTD Rate: $942.31

Benefits effective date: January 16, 2025

Prepared by: Jennifer Walsh, Payroll Manager
Date: January 22, 2025`,
      expectedFindings: [
        {
          categoryKey: "claimant_info",
          fieldKey: "claimant_name",
          value: "Michael A. Rodriguez",
          required: true,
        },
        {
          categoryKey: "employer_info",
          fieldKey: "employer_name",
          value: "Midwest Distribution Centers LLC",
          required: true,
        },
        { categoryKey: "injury_details", fieldKey: "injury_date", value: "2025-01-15" },
        {
          categoryKey: "benefits_compensation",
          fieldKey: "average_weekly_wage",
          value: "$1,413.46",
          required: true,
        },
        {
          categoryKey: "benefits_compensation",
          fieldKey: "compensation_rate",
          value: "$942.31",
          required: true,
        },
        { categoryKey: "benefits_compensation", fieldKey: "ttd_start_date", value: "2025-01-16" },
      ],
      packKey: "workers-comp",
    },
    {
      id: "wc-gold-004",
      expectedDocType: "mmi_report",
      text: `MAXIMUM MEDICAL IMPROVEMENT REPORT

Patient: Michael A. Rodriguez    DOB: 03/15/1982
Claim Number: CLM-2025-WC-78432
Date of Injury: 01/15/2025
Date of MMI Evaluation: September 15, 2025

TREATING PHYSICIAN: Dr. Robert K. Chen, MD

CLINICAL SUMMARY:
Mr. Rodriguez has been under my care since January 2025 following his workplace
forklift injury. After 8 months of treatment including physical therapy,
medication management, and a right shoulder corticosteroid injection, I determine
that the patient has reached Maximum Medical Improvement as of September 15, 2025.

Lumbar spine surgery (L4-L5 microdiscectomy) was performed on March 20, 2025
at Springfield Memorial Hospital by Dr. Susan Park, Neurosurgery.

CURRENT STATUS:
- Low back: Improved but residual pain, limited flexion
- Right shoulder: Improved range of motion, mild residual weakness

IMPAIRMENT RATING (AMA Guides, 6th Edition):
- Lumbar spine: 8% whole person
- Right shoulder: 5% whole person
- Combined: 12% whole person impairment

PERMANENT WORK RESTRICTIONS:
- No lifting over 25 lbs
- No repetitive overhead work
- Ability to alternate sitting/standing every 45 minutes
- No operation of heavy industrial equipment

TOTAL MEDICAL EXPENSES TO DATE: $47,832.00

Robert K. Chen, MD`,
      expectedFindings: [
        {
          categoryKey: "claimant_info",
          fieldKey: "claimant_name",
          value: "Michael A. Rodriguez",
          required: true,
        },
        { categoryKey: "injury_details", fieldKey: "injury_date", value: "2025-01-15" },
        {
          categoryKey: "medical_treatment",
          fieldKey: "treating_physician",
          value: "Dr. Robert K. Chen, MD",
        },
        {
          categoryKey: "medical_treatment",
          fieldKey: "mmi_date",
          value: "2025-09-15",
          required: true,
        },
        {
          categoryKey: "medical_treatment",
          fieldKey: "impairment_rating",
          value: "12%",
          required: true,
        },
        { categoryKey: "medical_treatment", fieldKey: "surgery_date", value: "2025-03-20" },
        {
          categoryKey: "medical_treatment",
          fieldKey: "work_restrictions",
          value: "No lifting over 25 lbs, no repetitive overhead work",
        },
        {
          categoryKey: "benefits_compensation",
          fieldKey: "total_medical_expenses",
          value: "$47,832.00",
          required: true,
        },
        { categoryKey: "employer_info", fieldKey: "claim_number", value: "CLM-2025-WC-78432" },
      ],
      packKey: "workers-comp",
    },
    {
      id: "wc-gold-005",
      expectedDocType: "settlement_agreement",
      text: `WORKERS' COMPENSATION SETTLEMENT AGREEMENT
Compromise and Release

State of Illinois
Workers' Compensation Commission
Case No: 25-WC-012345

PARTIES:
Petitioner: Michael Anthony Rodriguez
Respondent: Midwest Distribution Centers LLC
Insurance Carrier: Hartford Fire Insurance Company
Policy Number: WC-HFI-2025-78432

DATE OF INJURY: January 15, 2025
CLAIM NUMBER: CLM-2025-WC-78432

SETTLEMENT TERMS:
The parties agree to settle all claims arising from the above-referenced
workplace injury on the following terms:

1. Lump-sum settlement amount: $137,500.00
2. Attorney fees (20%): $27,500.00
3. Net to Petitioner: $110,000.00
4. Medical expenses paid to date: $47,832.00
5. TTD benefits paid to date: $33,923.16 (36 weeks at $942.31/week)

Average Weekly Wage: $1,413.46
Permanent Partial Disability: 12% whole person

This settlement is full and final. Petitioner waives all future claims
related to the January 15, 2025 injury.

Signed this 15th day of November, 2025.

______________________________
Michael A. Rodriguez, Petitioner

______________________________
James Henderson, HR Director
Midwest Distribution Centers LLC`,
      expectedFindings: [
        {
          categoryKey: "claimant_info",
          fieldKey: "claimant_name",
          value: "Michael Anthony Rodriguez",
          required: true,
        },
        {
          categoryKey: "employer_info",
          fieldKey: "employer_name",
          value: "Midwest Distribution Centers LLC",
          required: true,
        },
        {
          categoryKey: "employer_info",
          fieldKey: "insurance_carrier",
          value: "Hartford Fire Insurance Company",
        },
        { categoryKey: "employer_info", fieldKey: "policy_number", value: "WC-HFI-2025-78432" },
        { categoryKey: "employer_info", fieldKey: "claim_number", value: "CLM-2025-WC-78432" },
        {
          categoryKey: "injury_details",
          fieldKey: "injury_date",
          value: "2025-01-15",
          required: true,
        },
        {
          categoryKey: "benefits_compensation",
          fieldKey: "settlement_amount",
          value: "$137,500.00",
          required: true,
        },
        {
          categoryKey: "benefits_compensation",
          fieldKey: "attorney_fees",
          value: "$27,500.00",
          required: true,
        },
        {
          categoryKey: "benefits_compensation",
          fieldKey: "average_weekly_wage",
          value: "$1,413.46",
        },
        {
          categoryKey: "benefits_compensation",
          fieldKey: "total_medical_expenses",
          value: "$47,832.00",
        },
        { categoryKey: "medical_treatment", fieldKey: "impairment_rating", value: "12%" },
      ],
      packKey: "workers-comp",
    },
  ],
};

export default dataset;
