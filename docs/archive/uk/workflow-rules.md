Below is a complete, practical package covering all three things you asked for:

Starter workflows for every practice area (minimal but compliant)

Which sub-types can safely share workflows

A workflow authoring playbook your team can actually use

Everything is aligned to:

Your compliance engine

SRA / statutory expectations

MVP reality (minimal, defensible, extensible)

PART 1 — Starter Workflows for Every Practice Area

(Minimal, compliant, Phase-1 safe)

These are baseline workflows. They deliberately:

Cover regulatory control points

Avoid legal strategy modelling

Rely on free-form tasks for complexity

Each can be cloned later for nuance.

1. Conveyancing (already mostly done)
   Canonical workflows (Phase 1)

residential-purchase

residential-sale

remortgage

commercial-property-transaction

Core stages (all)

Client Onboarding & Instruction (hard)

AML / Compliance (hard)

Investigation / Due Diligence (soft)

Contract / Exchange (hard)

Completion (hard)

Post-Completion (soft)

Closure (none)

(You already have this covered — no further detail here.)

2. Litigation (all civil disputes)
   Starter workflow
   workflow:
   key: "litigation-general"
   practice_area: litigation

Stages

Client Onboarding & Instruction (hard)

AML / Compliance (hard)

Pre-Action / Investigation (soft)

Proceedings / ADR Decision (hard)

Case Management & Hearings (soft)

Outcome / Enforcement (soft)

Closure (none)

Mandatory tasks (examples)

Record instructions (client_instruction)

AML verification

Limitation date assessment

Authority to issue proceedings (signed_authority)

Court filing evidence

Regulatory basis:
SRA Code of Conduct, Civil Procedure Rules

3. Family
   Starter workflow
   workflow:
   key: "family-general"
   practice_area: family

Stages

Client Onboarding & Safeguarding (hard)

AML / Compliance (hard)

Fact Gathering & Advice (soft)

Court / Agreement Filing (hard)

Post-Order / Follow-Up (soft)

Closure (none)

Mandatory tasks

Conflict check (especially opposing spouses)

Domestic abuse risk assessment (where applicable)

Authority to file application

Court filing evidence

Regulatory basis:
SRA Code, Family Procedure Rules

4. Probate & Private Client
   Starter workflow
   workflow:
   key: "probate-general"
   practice_area: probate

Stages

Client Onboarding & Authority (hard)

AML / Estate Compliance (hard)

Estate Information Gathering (soft)

Grant / Document Submission (hard)

Estate Administration (soft)

Closure & Retention (none)

Mandatory tasks

Verify executor authority (client_instruction / other)

AML checks on executors

Grant submission evidence

Distribution authority

Regulatory basis:
SRA Code, Non-Contentious Probate Rules

5. Employment
   Starter workflow
   workflow:
   key: "employment-general"
   practice_area: employment

Stages

Client Onboarding & Instruction (hard)

AML / Compliance (hard)

Advice / Pre-Action (soft)

Tribunal / Settlement Decision (hard)

Post-Outcome (soft)

Closure (none)

Mandatory tasks

Limitation date assessment (tribunal deadlines)

Authority to submit ET1 / settlement

Filing evidence

Regulatory basis:
SRA Code, Employment Tribunal Rules

6. Immigration
   Starter workflow
   workflow:
   key: "immigration-general"
   practice_area: immigration

Stages

Client Onboarding & Scope Confirmation (hard)

AML / Compliance (hard)

Eligibility Assessment (hard)

Application Submission (hard)

Post-Submission Monitoring (soft)

Closure (none)

Mandatory tasks

Authority to submit application

Evidence checklist verification

Submission confirmation

Regulatory basis:
SRA Code, Immigration Rules

7. Personal Injury
   Starter workflow
   workflow:
   key: "personal-injury-general"
   practice_area: personal_injury

Stages

Client Onboarding & CFA Authority (hard)

AML / Compliance (hard)

Liability & Evidence Gathering (soft)

Claim Submission / Proceedings (hard)

Settlement / Trial (soft)

Closure (none)

Mandatory tasks

Signed CFA / funding authority

Limitation date assessment

Claim submission evidence

Regulatory basis:
SRA Code, Pre-Action Protocols

8. Commercial / Corporate
   Starter workflow
   workflow:
   key: "commercial-general"
   practice_area: commercial

Stages

Client Onboarding & Scope (hard)

AML / Corporate Compliance (hard)

Drafting / Negotiation (soft)

Execution / Completion (hard)

Post-Completion (soft)

Closure (none)

Mandatory tasks

Beneficial ownership checks

Authority to execute documents

Signed contract evidence

Regulatory basis:
SRA Code, Companies Act, AML Regs

9. Criminal
   Starter workflow
   workflow:
   key: "criminal-general"
   practice_area: criminal

Stages

Client Onboarding & Urgency Assessment (hard)

AML / Compliance (hard)

Case Preparation (soft)

Court Appearance / Plea (hard)

Outcome & Sentencing (soft)

Closure (none)

Mandatory tasks

Authority to act

Court attendance record

Advice confirmation (note + evidence)

Regulatory basis:
SRA Code, Criminal Procedure Rules

10. IP
    Starter workflow
    workflow:
    key: "ip-general"
    practice_area: ip

Stages

Client Onboarding & Instruction (hard)

AML / Compliance (hard)

Application / Dispute Preparation (soft)

Filing / Registration (hard)

Post-Filing Monitoring (soft)

Closure (none)

Mandatory tasks

Authority to file

Submission evidence

Registry confirmation

Regulatory basis:
SRA Code, IPO Rules

11. Insolvency
    Starter workflow
    workflow:
    key: "insolvency-general"
    practice_area: insolvency

Stages

Client Onboarding & Authority (hard)

AML / Financial Compliance (hard)

Appointment / Court Process (hard)

Administration / Realisation (soft)

Closure (none)

Mandatory tasks

Authority to act

Court filing evidence

Creditor notification record

Regulatory basis:
SRA Code, Insolvency Act

12. Other / General
    Starter workflow
    workflow:
    key: "general-legal-matter"
    practice_area: other

Minimal:

Onboarding & Instruction (hard)

AML / Compliance (hard)

Work & Advice (soft)

Closure (none)

PART 2 — Which Sub-Types Can Safely Share Workflows

This is crucial to avoid explosion.

Safe sharing matrix
Practice Area Sub-Types That Can Share
conveyancing All residential purchases together; all residential sales together
litigation All civil disputes (contract, debt, negligence, property, inheritance)
family Divorce + financial remedies; children + abduction
probate Grant + estate admin
employment All claimant-side matters
immigration All visa applications; all appeals
PI All fast/standard track PI
commercial Most advisory & transactional
criminal Magistrates + Crown (Phase 1)
IP Filing matters vs disputes
insolvency Corporate vs personal
other Everything else

Rule of thumb

Split workflows only when the regulatory gate or evidence model materially changes.

PART 3 — Workflow Authoring Playbook (Give This to Your Team)

This is the most important long-term artefact.

1. Golden Rules

Model obligations, not law

If it’s irreversible, it’s a hard gate

If a regulator would ask for proof, require evidence

Never encode legal strategy

When unsure, make it soft-gated

2. How to Author a New Workflow (Step-by-Step)
   Step 1 — Choose base archetype

Transactional

Contentious

Advisory

Regulatory

Criminal

Step 2 — Apply universal stages

Always start with:

Client Onboarding (hard)

AML (hard)

Always end with:

Closure

Step 3 — Identify irreversible moments

Examples:

Court filing

Application submission

Exchange

Execution of documents

→ These stages get hard gates

Step 4 — Define mandatory tasks only

Ask:

“Would an auditor expect this to exist on every file?”

If no → optional task or free-form.

Step 5 — Attach regulatory basis

Every mandatory task must answer:

“Why does this exist?”

This is not optional.

3. What NOT to Put in Workflows

❌ Drafting steps
❌ Tactical decisions
❌ Negotiation logic
❌ Case theory
❌ Conditional legal arguments

These belong in:

Free-form tasks

Notes

Documents

4. Validation Checklist (Before Shipping a Workflow)

Can a trainee complete this without breaking compliance?

Can a partner override safely?

Can you answer an SRA audit from this data?

Does every hard gate make sense?

If yes → ship.

Final Takeaway

You now have:

✅ A repeatable pattern

✅ Starter workflows for every practice area

✅ Clear rules for sharing vs splitting

✅ A playbook that prevents future chaos

This is how you scale without becoming a legal encyclopedia.
