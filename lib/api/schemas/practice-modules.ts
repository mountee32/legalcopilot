/**
 * Practice Module API Schemas
 *
 * Zod schemas for practice-specific endpoints (conveyancing, litigation, probate).
 * These modules extend the base Matter entity with specialized functionality.
 *
 * @see lib/db/schema/matters.ts for practiceData JSONB column
 * @see docs/backend-design.md for ConveyancingData, LitigationData, ProbateData types
 */

import { z, UuidSchema, DateTimeSchema, DateSchema, MoneySchema } from "./common";

// ============================================================================
// CONVEYANCING SCHEMAS
// ============================================================================

export const ConveyancingTransactionTypeSchema = z
  .enum(["sale", "purchase", "remortgage", "transfer"])
  .openapi({
    example: "purchase",
    description: "Type of conveyancing transaction",
  });

export const PropertyTypeSchema = z.enum(["freehold", "leasehold", "commonhold"]).openapi({
  example: "freehold",
  description: "Property tenure type",
});

export const AddressSchema = z.object({
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  county: z.string().optional(),
  postcode: z.string(),
  country: z.string().default("GB"),
});

export const ConveyancingSearchSchema = z.object({
  id: UuidSchema.optional(),
  type: z.string().openapi({
    example: "local",
    description: "Search type (e.g., local, drainage, environmental)",
  }),
  provider: z.string(),
  status: z.enum(["ordered", "received", "reviewed"]),
  orderedAt: DateTimeSchema,
  receivedAt: DateTimeSchema.optional(),
  documentId: UuidSchema.optional(),
  aiSummary: z.string().optional(),
  aiConcerns: z.array(z.string()).optional(),
});

export const ConveyancingDataSchema = z.object({
  transactionType: ConveyancingTransactionTypeSchema,
  propertyAddress: AddressSchema,
  propertyType: PropertyTypeSchema,
  titleNumber: z.string().optional(),
  purchasePrice: MoneySchema.optional(),
  salePrice: MoneySchema.optional(),
  mortgageAmount: MoneySchema.optional(),
  lenderId: UuidSchema.optional(),
  lenderReference: z.string().optional(),
  chainPosition: z.number().int().optional(),
  linkedCaseIds: z.array(UuidSchema).optional(),
  exchangeDate: DateSchema.optional(),
  completionDate: DateSchema.optional(),
  searches: z.array(ConveyancingSearchSchema).optional().default([]),
  sdltAmount: MoneySchema.optional(),
  sdltSubmittedAt: DateTimeSchema.optional(),
  sdltReference: z.string().optional(),
  landRegistrySubmittedAt: DateTimeSchema.optional(),
  landRegistryReference: z.string().optional(),
});

export const CalculateSDLTRequestSchema = z
  .object({
    purchasePrice: MoneySchema,
    propertyType: PropertyTypeSchema,
    isFirstTimeBuyer: z.boolean().default(false),
    isAdditionalProperty: z.boolean().default(false),
  })
  .openapi("CalculateSDLTRequest");

export const CalculateSDLTResponseSchema = z
  .object({
    sdltAmount: MoneySchema,
    breakdown: z.array(
      z.object({
        band: z.string(),
        rate: z.string(),
        taxableAmount: MoneySchema,
        sdlt: MoneySchema,
      })
    ),
    notes: z.string().optional(),
  })
  .openapi("CalculateSDLTResponse");

export const UpdateConveyancingDataSchema = ConveyancingDataSchema.partial().openapi(
  "UpdateConveyancingDataRequest"
);

export const OrderSearchRequestSchema = z
  .object({
    matterId: UuidSchema,
    searchType: z.string().openapi({
      example: "local",
      description: "Type of search to order (e.g., local, drainage, environmental)",
    }),
    provider: z.string().openapi({
      example: "TM Group",
      description: "Search provider name",
    }),
  })
  .openapi("OrderSearchRequest");

export const OrderSearchResponseSchema = z
  .object({
    success: z.literal(true),
    searchId: UuidSchema,
    message: z.string().optional(),
  })
  .openapi("OrderSearchResponse");

// ============================================================================
// LITIGATION SCHEMAS
// ============================================================================

export const LitigationCaseTypeSchema = z
  .enum(["civil", "employment", "family", "immigration", "criminal"])
  .openapi({
    example: "civil",
    description: "Type of litigation case",
  });

export const HearingDateSchema = z.object({
  id: UuidSchema.optional(),
  type: z.string().openapi({ example: "preliminary", description: "Hearing type" }),
  date: DateSchema,
  time: z.string().optional().openapi({ example: "10:30" }),
  location: z.string().optional(),
  judge: z.string().optional(),
  outcome: z.string().optional(),
});

export const DeadlineSchema = z.object({
  id: UuidSchema.optional(),
  description: z.string(),
  dueDate: DateSchema,
  filedAt: DateTimeSchema.optional(),
  documentId: UuidSchema.optional(),
});

export const LitigationDataSchema = z.object({
  caseType: LitigationCaseTypeSchema,
  court: z.string().optional(),
  courtReference: z.string().optional(),
  limitationDate: DateSchema.optional(),
  limitationCalculation: z.string().optional(),
  claimValue: MoneySchema.optional(),
  hearingDates: z.array(HearingDateSchema).optional().default([]),
  filingDeadlines: z.array(DeadlineSchema).optional().default([]),
  bundleDocumentIds: z.array(UuidSchema).optional().default([]),
});

export const CreateBundleRequestSchema = z
  .object({
    matterId: UuidSchema,
    documentIds: z.array(UuidSchema).min(1),
    title: z.string().optional(),
  })
  .openapi("CreateBundleRequest");

export const CreateBundleResponseSchema = z
  .object({
    success: z.literal(true),
    bundleDocumentIds: z.array(UuidSchema),
    message: z.string().optional(),
  })
  .openapi("CreateBundleResponse");

export const CalculateLimitationRequestSchema = z
  .object({
    caseType: LitigationCaseTypeSchema,
    incidentDate: DateSchema,
    knowledgeDate: DateSchema.optional(),
  })
  .openapi("CalculateLimitationRequest");

export const CalculateLimitationResponseSchema = z
  .object({
    limitationDate: DateSchema,
    calculation: z.string(),
    periodYears: z.number().int(),
    notes: z.string().optional(),
  })
  .openapi("CalculateLimitationResponse");

export const UpdateLitigationDataSchema = LitigationDataSchema.partial().openapi(
  "UpdateLitigationDataRequest"
);

// ============================================================================
// PROBATE SCHEMAS
// ============================================================================

export const GrantTypeSchema = z.enum(["probate", "letters_of_administration"]).openapi({
  example: "probate",
  description: "Type of grant of representation",
});

export const BeneficiarySchema = z.object({
  id: UuidSchema.optional(),
  name: z.string(),
  relationship: z.string().openapi({ example: "spouse" }),
  share: z.number().min(0).max(100).openapi({
    description: "Percentage share of estate",
    example: 50,
  }),
  contactId: UuidSchema.optional(),
});

export const EstateAssetSchema = z.object({
  id: UuidSchema.optional(),
  type: z.string().openapi({ example: "property" }),
  description: z.string(),
  value: MoneySchema,
  collectedAt: DateTimeSchema.optional(),
});

export const EstateLiabilitySchema = z.object({
  id: UuidSchema.optional(),
  type: z.string().openapi({ example: "mortgage" }),
  description: z.string(),
  amount: MoneySchema,
  paidAt: DateTimeSchema.optional(),
});

export const DistributionSchema = z.object({
  id: UuidSchema.optional(),
  beneficiaryId: UuidSchema,
  amount: MoneySchema,
  distributedAt: DateTimeSchema.optional(),
});

export const ProbateDataSchema = z.object({
  deceasedName: z.string(),
  dateOfDeath: DateSchema,
  grantType: GrantTypeSchema,
  grantIssuedAt: DateTimeSchema.optional(),
  grantReference: z.string().optional(),
  estateGrossValue: MoneySchema.optional(),
  estateNetValue: MoneySchema.optional(),
  ihtPayable: MoneySchema.optional(),
  beneficiaries: z.array(BeneficiarySchema).optional().default([]),
  assets: z.array(EstateAssetSchema).optional().default([]),
  liabilities: z.array(EstateLiabilitySchema).optional().default([]),
  distributions: z.array(DistributionSchema).optional().default([]),
});

export const CalculateIHTRequestSchema = z
  .object({
    estateGrossValue: MoneySchema,
    liabilities: MoneySchema,
    exemptions: MoneySchema.optional().default("0.00"),
    reliefs: MoneySchema.optional().default("0.00"),
  })
  .openapi("CalculateIHTRequest");

export const CalculateIHTResponseSchema = z
  .object({
    estateNetValue: MoneySchema,
    nilRateBand: MoneySchema,
    taxableAmount: MoneySchema,
    ihtPayable: MoneySchema,
    effectiveRate: z.string().openapi({
      description: "Effective tax rate as percentage",
      example: "40.0",
    }),
    notes: z.string().optional(),
  })
  .openapi("CalculateIHTResponse");

export const UpdateProbateDataSchema = ProbateDataSchema.partial().openapi(
  "UpdateProbateDataRequest"
);

export const GenerateEstateAccountRequestSchema = z
  .object({
    matterId: UuidSchema,
    includeAssets: z.boolean().default(true),
    includeLiabilities: z.boolean().default(true),
    includeDistributions: z.boolean().default(true),
  })
  .openapi("GenerateEstateAccountRequest");

export const GenerateEstateAccountResponseSchema = z
  .object({
    success: z.literal(true),
    estateGrossValue: MoneySchema,
    estateNetValue: MoneySchema,
    totalDistributions: MoneySchema,
    remainingBalance: MoneySchema,
    summary: z.string(),
  })
  .openapi("GenerateEstateAccountResponse");

// Type exports
export type ConveyancingData = z.infer<typeof ConveyancingDataSchema>;
export type LitigationData = z.infer<typeof LitigationDataSchema>;
export type ProbateData = z.infer<typeof ProbateDataSchema>;
