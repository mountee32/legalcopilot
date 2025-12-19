Could we support the following examples

1. Regulatory framework you must design for

Your SaaS must support compliance with:

Primary regulators

SRA (Solicitors Regulation Authority)

SRA Standards and Regulations

Code of Conduct (solicitors & firms)

Law Society Conveyancing Protocol (not law, but industry standard)

UK Finance Mortgage Lenders’ Handbook (mandatory when acting for lenders)

Money Laundering Regulations 2017 (as amended)

Proceeds of Crime Act 2002

Land Registration Act 2002 & Land Registry Rules

Data Protection Act 2018 / UK GDPR

2. Conveyancing phases (typical workflow backbone)

Client onboarding & instruction

AML / compliance checks

Pre-contract (investigation of title)

Exchange of contracts

Pre-completion

Completion

Post-completion

Your system should enforce phase-gated tasks.

3. Mandatory steps / tasks (regulatory or legally required)

These are non-negotiable in a compliant system.

A. Client onboarding & instruction (MANDATORY)

Required by SRA + contract law

☐ Client instruction recorded

☐ Client care letter issued

☐ Terms of business provided

☐ Costs information provided (fees + disbursements)

☐ Scope of retainer clearly defined

☐ Conflicts of interest check completed

☐ File opened with matter reference

💡 SaaS requirement:

Evidence storage (PDF, timestamps)

Conflict check log (with override justification)

B. AML / CDD (MANDATORY)

Required by Money Laundering Regulations

☐ Client identity verification (individual or entity)

☐ Address verification

☐ Beneficial owner identification (if applicable)

☐ Source of funds check

☐ Source of wealth check (where required)

☐ Risk assessment recorded

☐ Ongoing monitoring flag

Failure here is criminal liability, not just regulatory.

💡 SaaS requirement:

Risk scoring

Audit trail (who approved, when)

Document expiry tracking

Ability to pause matter progression

C. Property & title investigation (MANDATORY)

Required by professional duty & negligence law

For purchases:

☐ Official copy of register obtained

☐ Title plan reviewed

☐ Title defects identified & addressed

☐ Rights, restrictions, covenants reviewed

☐ Search results reviewed (see below)

☐ Enquiries raised and answered

For sales:

☐ Title information verified

☐ Authority to sell confirmed

💡 SaaS:

Structured title issue logging

Enquiry lifecycle tracking

D. Searches (MANDATORY in most cases)

Legally required? Sometimes indirectly — professionally mandatory.

Common required searches:

☐ Local authority search

☐ Drainage & water search

☐ Environmental search

☐ Chancel repair liability (risk assessed)

Lender-driven (mandatory if mortgage involved):

☐ Any additional lender-specific searches

💡 SaaS:

Search ordering

Result parsing

Risk flagging

E. Mortgage / lender compliance (MANDATORY if mortgage)

UK Finance Lenders’ Handbook compliance is mandatory

☐ Mortgage offer checked

☐ Special conditions satisfied

☐ Report to lender completed (if required)

☐ Certificate of title prepared

☐ Authority to exchange confirmed

💡 SaaS:

Lender-specific task generation

Conditional logic per lender

F. Exchange of contracts (MANDATORY step if transaction proceeds)

☐ Contract approved by client

☐ Deposit arrangements confirmed

☐ Authority to exchange recorded

☐ Contracts exchanged

☐ Exchange date/time recorded

💡 SaaS:

Exchange lock (no edits post-exchange)

Evidence of client authority

G. Pre-completion (MANDATORY)

☐ Completion statement issued

☐ Funds requested (mortgage & client)

☐ Final searches (OS1 / OS2, bankruptcy)

☐ Transfer deed approved & executed

☐ Completion date confirmed

H. Completion (MANDATORY)

☐ Purchase monies sent

☐ Receipt confirmed

☐ Keys released (recorded)

☐ Completion time logged

I. Post-completion (MANDATORY)

Land Registry & tax compliance

☐ SDLT return submitted

☐ SDLT paid

☐ AP1 application lodged

☐ Registration completed

☐ Title updated & checked

☐ Lender charge registered

☐ Client notified of registration

💡 SaaS:

Deadline tracking (SDLT = 14 days)

Land Registry status monitoring

J. File closure & retention (MANDATORY)

☐ Matter closed

☐ Accounting reconciled

☐ File retention period applied

☐ GDPR compliance (data minimisation)

4. Optional / best-practice steps (expected in modern firms)

Not strictly “mandatory”, but expected by insurers, auditors, and lenders.

Risk & quality control

☐ Supervisor review checkpoints

☐ Complex title escalation

☐ File audit trail

☐ Negligence risk flags

Client communication

☐ Automated progress updates

☐ Plain-English reports

☐ Client portal access

Enhanced due diligence

☐ PEP / sanctions screening

☐ High-risk jurisdiction checks

☐ Gifted deposit declarations

Transaction enhancements

☐ Indemnity insurance management

☐ Leasehold management packs

☐ New-build specific workflows

☐ Shared ownership logic

Operational efficiency

☐ SLA timers

☐ Bottleneck reporting

☐ Fee earner workload tracking

5. SaaS design implications (critical for market adoption)

To sell to UK conveyancing firms, your system must support:

1. Evidence-based compliance

Every task must store:

Who did it

When

What evidence exists

2. Conditional workflows

Tasks differ based on:

Sale vs purchase

Freehold vs leasehold

Mortgage vs cash

Lender type

Client risk level

3. Regulatory audit readiness

Firms expect:

One-click audit packs

AML reports

Lender compliance logs

4. Human override with justification

Regulators allow discretion — but only if recorded.
