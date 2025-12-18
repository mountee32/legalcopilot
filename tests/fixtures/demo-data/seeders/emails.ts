import { db } from "@/lib/db";
import { emails } from "@/lib/db/schema";
import { DEMO_IDS } from "../ids";
import type { SeederContext } from "../types";

export async function seedEmails(ctx: SeederContext) {
  console.log("  Creating AI inbox emails...");

  const now = ctx.now;
  const oneHourAgo = new Date(now.getTime() - 60 * 60000);
  const twoHoursAgo = new Date(now.getTime() - 120 * 60000);
  const fourHoursAgo = new Date(now.getTime() - 240 * 60000);
  const oneDayAgoEmail = new Date(now.getTime() - 24 * 60 * 60000);
  const twoDaysAgoEmail = new Date(now.getTime() - 48 * 60 * 60000);

  const emailsData = [
    // Urgent - frustrated client about delays
    {
      id: DEMO_IDS.emails.email1,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      direction: "inbound" as const,
      fromAddress: { email: "margaret.thompson@email.com", name: "Margaret Thompson" },
      toAddresses: [{ email: "james.clarke@harrisonclark.demo", name: "James Clarke" }],
      subject: "URGENT: Exchange deadline approaching - need update NOW",
      bodyText: `Dear Mr Clarke,

I am extremely frustrated with the lack of communication regarding my property purchase at 15 Willow Lane. The exchange deadline is next Friday and I still haven't received the final contract!

I've called the office three times this week and left messages, but nobody has called me back. This is completely unacceptable service.

I need to know TODAY:
1. When will I receive the final contract?
2. Are there any outstanding issues with the title?
3. Will we make the exchange deadline?

If I don't hear back from you by 5pm today, I will be making a formal complaint to your senior partner.

Margaret Thompson`,
      bodyHtml: null,
      status: "received" as const,
      aiProcessed: true,
      aiProcessedAt: oneHourAgo,
      aiIntent: "complaint" as const,
      aiSentiment: "frustrated" as const,
      aiUrgency: 95,
      aiSummary:
        "Client is frustrated about lack of communication and approaching exchange deadline. Demands immediate response regarding contract status, title issues, and deadline confirmation. Threatens formal complaint if no response by 5pm.",
      aiSuggestedResponse: `Dear Mrs Thompson,

Thank you for your email and I sincerely apologise for the delay in responding to your calls. This is not the level of service we strive to provide.

I can confirm:
1. The final contract is ready and will be emailed to you within the hour
2. There are no outstanding title issues - everything has been resolved
3. We are on track for exchange by Friday

I will personally ensure this matter receives priority attention. Please expect my call this afternoon to discuss any remaining concerns.

Kind regards,
James Clarke`,
      aiMatchedMatterId: DEMO_IDS.matters.conveyancing,
      aiMatchConfidence: 98,
      receivedAt: oneHourAgo,
      createdAt: oneHourAgo,
      updatedAt: oneHourAgo,
    },
    // High priority - opposing counsel deadline
    {
      id: DEMO_IDS.emails.email2,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      direction: "inbound" as const,
      fromAddress: { email: "r.green@greenwoodpartners.co.uk", name: "Rachel Green" },
      toAddresses: [{ email: "sarah.harrison@harrisonclark.demo", name: "Sarah Harrison" }],
      subject: "Re: Apex v BuildRight - Defence deadline extension request",
      bodyText: `Dear Ms Harrison,

I write in response to your request for a 14-day extension to file the Defence in the above matter.

My client is not minded to agree to any extension. The claim was served over two months ago and your client has had ample time to prepare their Defence.

If no Defence is filed by 4pm on Friday, we will apply for judgment in default.

Regards,
Rachel Green
Partner, Greenwood & Partners`,
      bodyHtml: null,
      status: "received" as const,
      aiProcessed: true,
      aiProcessedAt: twoHoursAgo,
      aiIntent: "deadline" as const,
      aiSentiment: "neutral" as const,
      aiUrgency: 85,
      aiSummary:
        "Opposing counsel refusing extension request for Defence filing. Warns of default judgment application if Defence not filed by Friday 4pm. Requires immediate attention and client communication.",
      aiSuggestedResponse: `Dear Ms Green,

Thank you for your response. While we are disappointed by your client's position, we understand their commercial concerns.

Please be assured that our Defence will be filed in time. We anticipate serving it by Wednesday to allow adequate time before the deadline.

We would welcome the opportunity to discuss settlement before incurring further costs. Would your client be open to a without prejudice meeting next week?

Kind regards,
Sarah Harrison`,
      aiMatchedMatterId: DEMO_IDS.matters.litigation,
      aiMatchConfidence: 96,
      receivedAt: twoHoursAgo,
      createdAt: twoHoursAgo,
      updatedAt: twoHoursAgo,
    },
    // Medium priority - client providing information
    {
      id: DEMO_IDS.emails.email3,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.familyDivorce,
      direction: "inbound" as const,
      fromAddress: { email: "margaret.t@personalmail.com", name: "Margaret Thompson" },
      toAddresses: [{ email: "emma.williams@harrisonclark.demo", name: "Emma Williams" }],
      subject: "Form E documents - bank statements attached",
      bodyText: `Hi Emma,

As discussed, please find attached my bank statements for the last 12 months. I've also included the pension valuation letter that arrived yesterday.

Let me know if you need anything else for the Form E.

Thanks,
Margaret`,
      bodyHtml: null,
      hasAttachments: true,
      attachmentCount: 3,
      status: "received" as const,
      aiProcessed: true,
      aiProcessedAt: fourHoursAgo,
      aiIntent: "provide_information" as const,
      aiSentiment: "positive" as const,
      aiUrgency: 45,
      aiSummary:
        "Client providing requested financial documents for Form E disclosure - bank statements and pension valuation. Attachments need to be saved to matter and reviewed before completing Form E.",
      aiSuggestedResponse: `Dear Margaret,

Thank you for sending through the bank statements and pension valuation - I've saved these to your file.

I'll review everything this week and start preparing your Form E. If I have any questions or need additional documents, I'll be in touch.

Best wishes,
Emma Williams`,
      aiMatchedMatterId: DEMO_IDS.matters.familyDivorce,
      aiMatchConfidence: 92,
      receivedAt: fourHoursAgo,
      createdAt: fourHoursAgo,
      updatedAt: fourHoursAgo,
    },
    // Low priority - status update request
    {
      id: DEMO_IDS.emails.email4,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.employmentDismissal,
      direction: "inbound" as const,
      fromAddress: { email: "michael.obrien@gmail.com", name: "Michael O'Brien" },
      toAddresses: [{ email: "david.chen@harrisonclark.demo", name: "David Chen" }],
      subject: "Tribunal claim - any updates?",
      bodyText: `Hi David,

Just checking in to see if there's been any progress on my unfair dismissal claim. I know you mentioned the other side had until the end of the month to respond.

Have you heard anything from ACAS yet?

Thanks,
Michael`,
      bodyHtml: null,
      status: "received" as const,
      aiProcessed: true,
      aiProcessedAt: oneDayAgoEmail,
      aiIntent: "status_update" as const,
      aiSentiment: "neutral" as const,
      aiUrgency: 30,
      aiSummary:
        "Client requesting status update on employment tribunal claim. Asking about opponent's response and ACAS progress. Routine follow-up, no urgent action required.",
      aiSuggestedResponse: `Dear Michael,

Thank you for checking in. The response deadline is indeed the end of this month, so we're still within the normal timeframe.

I spoke with ACAS yesterday - they've been in touch with Northern Manufacturing's solicitors and early conciliation is ongoing. I'll update you as soon as there's any development.

In the meantime, please let me know if you have any questions.

Kind regards,
David Chen`,
      aiMatchedMatterId: DEMO_IDS.matters.employmentDismissal,
      aiMatchConfidence: 94,
      receivedAt: oneDayAgoEmail,
      createdAt: oneDayAgoEmail,
      updatedAt: oneDayAgoEmail,
    },
    // New enquiry - not linked to matter yet
    {
      id: DEMO_IDS.emails.email5,
      firmId: DEMO_IDS.firm,
      matterId: null,
      direction: "inbound" as const,
      fromAddress: { email: "j.wilson@techstartup.io", name: "James Wilson" },
      toAddresses: [{ email: "info@harrisonclark.demo", name: "Harrison & Clarke" }],
      subject: "Commercial property lease advice needed",
      bodyText: `Dear Sir/Madam,

I'm the CEO of a tech startup and we're looking to lease new office space in Manchester city centre. We've found premises we like but the landlord's solicitor has sent over a draft lease that I don't understand.

Could you advise on commercial property matters? We'd need someone to review the lease and negotiate on our behalf.

Our budget is around £5,000-7,000 for legal fees. The landlord wants to complete within 6 weeks.

Please let me know if you can help and your availability for an initial call.

Kind regards,
James Wilson
CEO, TechStartup Ltd`,
      bodyHtml: null,
      status: "received" as const,
      aiProcessed: true,
      aiProcessedAt: twoDaysAgoEmail,
      aiIntent: "request_action" as const,
      aiSentiment: "positive" as const,
      aiUrgency: 55,
      aiSummary:
        "New business enquiry - CEO seeking commercial lease advice for office space. Budget £5-7k, 6-week timeline. Potential new client and matter. Requires initial consultation to scope work.",
      aiSuggestedResponse: `Dear Mr Wilson,

Thank you for your enquiry regarding commercial property lease advice. Harrison & Clarke would be delighted to assist with your new office lease.

We have extensive experience advising businesses on commercial property matters and can certainly work within your budget and timeline.

I'd suggest an initial call to discuss your requirements. Would Thursday at 2pm or Friday at 10am work for you? The call will last around 30 minutes and there's no charge for the initial consultation.

Please let me know which time suits and I'll send a calendar invitation.

Kind regards,
Victoria Clarke
Senior Partner`,
      aiMatchedMatterId: null,
      aiMatchConfidence: null,
      receivedAt: twoDaysAgoEmail,
      createdAt: twoDaysAgoEmail,
      updatedAt: twoDaysAgoEmail,
    },
    // High urgency - court date confirmation
    {
      id: DEMO_IDS.emails.email6,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.criminalDriving,
      direction: "inbound" as const,
      fromAddress: { email: "listings@manchestermc.gov.uk", name: "Manchester Magistrates Court" },
      toAddresses: [{ email: "sarah.harrison@harrisonclark.demo", name: "Sarah Harrison" }],
      subject: "Listing notification - R v Henderson - 15 December 2024",
      bodyText: `Case Reference: MC-2024-08934
Defendant: George Henderson

This is to confirm the hearing in the above matter is listed for:

Date: 15 December 2024
Time: 10:00am
Court: Manchester Magistrates Court, Court Room 2
Type: Plea Hearing

Please confirm attendance within 7 days.

Court Listings Office
Manchester Magistrates Court`,
      bodyHtml: null,
      status: "received" as const,
      aiProcessed: true,
      aiProcessedAt: oneHourAgo,
      aiIntent: "confirmation" as const,
      aiSentiment: "neutral" as const,
      aiUrgency: 75,
      aiSummary:
        "Court listing notification for criminal matter - plea hearing on 15 December at Manchester Magistrates Court. Requires attendance confirmation within 7 days and client notification.",
      aiSuggestedResponse: null,
      aiSuggestedTasks: [
        { title: "Confirm attendance with court", dueInDays: 5 },
        { title: "Notify client of hearing date", dueInDays: 1 },
        { title: "Prepare plea hearing bundle", dueInDays: 12 },
      ],
      aiMatchedMatterId: DEMO_IDS.matters.criminalDriving,
      aiMatchConfidence: 99,
      receivedAt: oneHourAgo,
      createdAt: oneHourAgo,
      updatedAt: oneHourAgo,
    },
    // Medical expert report received
    {
      id: DEMO_IDS.emails.email7,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      direction: "inbound" as const,
      fromAddress: { email: "admin@drwilliamsclinic.co.uk", name: "Dr Williams Clinic" },
      toAddresses: [{ email: "tom.richards@harrisonclark.demo", name: "Tom Richards" }],
      subject: "Medical report - Robert Williams - RTA injuries",
      bodyText: `Dear Sirs,

Please find attached the medical report for Mr Robert Williams following my examination on 10 December 2024.

Summary of findings:
- Whiplash injury Grade II with ongoing symptoms
- Prognosis: Full recovery expected within 12-18 months
- Current disability: Moderate impact on daily activities
- Treatment recommended: Physiotherapy (12 sessions)

Please contact the clinic if you require any clarification.

Dr James Williams FRCS
Consultant Orthopaedic Surgeon`,
      bodyHtml: null,
      hasAttachments: true,
      attachmentCount: 1,
      status: "received" as const,
      aiProcessed: true,
      aiProcessedAt: fourHoursAgo,
      aiIntent: "provide_information" as const,
      aiSentiment: "neutral" as const,
      aiUrgency: 50,
      aiSummary:
        "Medical expert report received for personal injury claim. Grade II whiplash, 12-18 month prognosis. Report needs review and incorporation into quantum assessment. Client to be advised of findings.",
      aiSuggestedResponse: `Dear Dr Williams,

Thank you for providing your medical report on Mr Williams. We have received the report and attachment.

We will review the findings and may be in touch if we require any clarification.

Kind regards,
Tom Richards
Paralegal`,
      aiMatchedMatterId: DEMO_IDS.matters.personalInjuryRTA,
      aiMatchConfidence: 97,
      receivedAt: fourHoursAgo,
      createdAt: fourHoursAgo,
      updatedAt: fourHoursAgo,
    },
    // Estate administration - beneficiary query
    {
      id: DEMO_IDS.emails.email8,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.probateEstate,
      direction: "inbound" as const,
      fromAddress: { email: "thomas.roberts@email.co.uk", name: "Thomas Roberts" },
      toAddresses: [{ email: "sophie.brown@harrisonclark.demo", name: "Sophie Brown" }],
      subject: "Father's estate - when will distribution happen?",
      bodyText: `Dear Sophie,

I hope you're well. I'm just wondering when we might expect distribution of my father's estate?

It's been 6 months since the grant of probate was issued and I know you mentioned there were some assets to sell. Has the house sale completed yet?

I don't want to be difficult but I'm getting some pressure from my sister about timescales.

Thanks for all your help with this.

Tom Roberts`,
      bodyHtml: null,
      status: "received" as const,
      aiProcessed: true,
      aiProcessedAt: oneDayAgoEmail,
      aiIntent: "request_information" as const,
      aiSentiment: "neutral" as const,
      aiUrgency: 40,
      aiSummary:
        "Estate beneficiary enquiring about distribution timeline. Grant issued 6 months ago, awaiting property sale completion. Beneficiary under family pressure for updates. Requires status update and realistic timeline.",
      aiSuggestedResponse: `Dear Tom,

Thank you for your email. I completely understand you'd like clarity on timescales.

The house sale completed last week and funds have now been received. I'm in the process of preparing the estate accounts, which should be ready within the next two weeks.

Once the accounts are approved, I anticipate we can make the interim distribution within 21 days. I'll send you a detailed breakdown shortly.

Please share this update with your sister, and don't hesitate to call if you have questions.

Kind regards,
Sophie Brown`,
      aiMatchedMatterId: DEMO_IDS.matters.probateEstate,
      aiMatchConfidence: 91,
      receivedAt: oneDayAgoEmail,
      createdAt: oneDayAgoEmail,
      updatedAt: oneDayAgoEmail,
    },
    // Immigration - visa decision
    {
      id: DEMO_IDS.emails.email9,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.immigrationTier2,
      direction: "inbound" as const,
      fromAddress: { email: "noreply@homeoffice.gov.uk", name: "UK Visas and Immigration" },
      toAddresses: [{ email: "emma.williams@harrisonclark.demo", name: "Emma Williams" }],
      subject: "Decision on your application - GWF123456789",
      bodyText: `Application Reference: GWF123456789
Applicant: Dr Priya Sharma

Dear Applicant,

A decision has been made on your application for leave to remain in the United Kingdom as a Skilled Worker.

Your application has been GRANTED.

Your new permission to stay is valid from 18 December 2024 to 18 December 2027.

Your Biometric Residence Permit will be delivered to the address provided within 10 working days.

UK Visas and Immigration`,
      bodyHtml: null,
      status: "received" as const,
      aiProcessed: true,
      aiProcessedAt: twoHoursAgo,
      aiIntent: "confirmation" as const,
      aiSentiment: "positive" as const,
      aiUrgency: 65,
      aiSummary:
        "Visa application GRANTED for client. Skilled Worker visa valid until December 2027. BRP to be delivered within 10 days. Client needs immediate notification of positive outcome.",
      aiSuggestedResponse: `Dear Dr Sharma,

I am delighted to inform you that your Skilled Worker visa application has been GRANTED!

Your new visa is valid from 18 December 2024 to 18 December 2027. Your Biometric Residence Permit (BRP) will be delivered to your address within the next 10 working days.

Please let me know when you receive your BRP, and we can then close your file.

Congratulations on this positive outcome!

Kind regards,
Emma Williams`,
      aiMatchedMatterId: DEMO_IDS.matters.immigrationTier2,
      aiMatchConfidence: 99,
      receivedAt: twoHoursAgo,
      createdAt: twoHoursAgo,
      updatedAt: twoHoursAgo,
    },
    // Commercial - shareholder agreement feedback
    {
      id: DEMO_IDS.emails.email10,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.commercialShareholder,
      direction: "inbound" as const,
      fromAddress: { email: "alex.wong@techstartsolutions.com", name: "Alex Wong" },
      toAddresses: [{ email: "victoria.clarke@harrisonclark.demo", name: "Victoria Clarke" }],
      subject: "Shareholder agreement - investor comments",
      bodyText: `Victoria,

Thanks for sending over the draft shareholder agreement. Our lead investor has reviewed it and has the following comments:

1. Clause 8.3 (drag-along) - they want the threshold reduced from 75% to 66.67%
2. Clause 12.1 (pre-emption) - they want founders excluded from pre-emption rights for the first 3 years
3. Clause 15 (reserved matters) - they want to add "any single expenditure over £50k" to the list

Can we discuss these tomorrow? The investor is pushing to sign before Christmas.

Thanks,
Alex`,
      bodyHtml: null,
      status: "received" as const,
      aiProcessed: true,
      aiProcessedAt: fourHoursAgo,
      aiIntent: "request_action" as const,
      aiSentiment: "neutral" as const,
      aiUrgency: 70,
      aiSummary:
        "Investor feedback on shareholder agreement draft. Three specific clause amendments requested (drag-along threshold, pre-emption exclusion, reserved matters). Client wants to sign before Christmas - time-sensitive negotiation required.",
      aiSuggestedResponse: `Dear Alex,

Thank you for the investor's feedback on the shareholder agreement. I've noted their three proposed amendments.

I have some initial thoughts:
1. Drag-along at 66.67% is common and shouldn't be problematic
2. Pre-emption exclusion for founders needs careful consideration
3. The £50k threshold may need adjustment based on your operational needs

I'm available tomorrow at 11am or 3pm to discuss. Shall I call you?

Kind regards,
Victoria Clarke`,
      aiMatchedMatterId: DEMO_IDS.matters.commercialShareholder,
      aiMatchConfidence: 95,
      receivedAt: fourHoursAgo,
      createdAt: fourHoursAgo,
      updatedAt: fourHoursAgo,
    },
    // ==========================================================
    // MAT-DEMO-001 Showcase Emails - Property Purchase Correspondence
    // Purchase of 15 Willow Lane, Richmond for Margaret Thompson
    // ==========================================================
    // Seller's solicitor - replies to enquiries
    {
      id: DEMO_IDS.emails.email11,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      direction: "inbound" as const,
      fromAddress: { email: "j.smith@smithandpatel.co.uk", name: "Jennifer Smith" },
      toAddresses: [{ email: "james.clarke@harrisonclark.demo", name: "James Clarke" }],
      subject: "Re: 15 Willow Lane - Replies to Additional Enquiries",
      bodyText: `Dear James,

Please find attached our client's replies to your additional enquiries of last week.

In summary:
1. Japanese knotweed - our client confirms the PCA treatment certificate is enclosed. The 10-year insurance-backed guarantee transfers to your client on completion.
2. Boundary dispute - the matter was resolved in 2019 by mutual agreement with the neighbour. Copy of the boundary agreement is enclosed.
3. Planning permission for rear extension - all building regulations sign-off documentation enclosed.

Please let me know if you have any further queries. My client is keen to exchange by Friday if possible.

Regards,
Jennifer Smith
Smith & Patel Solicitors`,
      bodyHtml: null,
      status: "received" as const,
      aiProcessed: true,
      aiProcessedAt: twoHoursAgo,
      aiIntent: "provide_information" as const,
      aiSentiment: "neutral" as const,
      aiUrgency: 65,
      aiSummary:
        "Seller's solicitor providing replies to additional enquiries. Key documents enclosed: Japanese knotweed treatment certificate with 10-year guarantee, boundary agreement from 2019, and building regulations sign-off. Seller wants exchange by Friday.",
      aiSuggestedResponse: `Dear Jennifer,

Thank you for the replies to our additional enquiries.

I've reviewed the documentation and am satisfied with:
- The Japanese knotweed treatment certificate and transferable guarantee
- The 2019 boundary agreement
- The building regulations completion certificate

Subject to satisfactory search results and mortgage funds, we should be in a position to exchange on Friday as requested. I'll confirm with my client and revert.

Kind regards,
James Clarke`,
      aiMatchedMatterId: DEMO_IDS.matters.conveyancing,
      aiMatchConfidence: 99,
      receivedAt: twoHoursAgo,
      createdAt: twoHoursAgo,
      updatedAt: twoHoursAgo,
    },
    // Mortgage lender notification
    {
      id: DEMO_IDS.emails.email12,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      direction: "inbound" as const,
      fromAddress: { email: "conveyancing@nationwide.co.uk", name: "Nationwide Conveyancing" },
      toAddresses: [{ email: "james.clarke@harrisonclark.demo", name: "James Clarke" }],
      subject: "Mortgage Funds Release - Thompson/15 Willow Lane - CONFIRMED",
      bodyText: `Our Ref: NBS-2024-MT-789456
Your Ref: HC/MT/2024/001

Dear Sir/Madam,

We confirm that mortgage funds in the sum of £562,500.00 will be released to you by CHAPS transfer on the day of completion, subject to your satisfactory Certificate of Title.

Please ensure:
1. Certificate of Title submitted via portal before 2pm on day of completion
2. All special conditions in the mortgage offer are satisfied
3. Buildings insurance is in place from completion

Standard Nationwide undertakings apply.

Yours faithfully,
Nationwide Building Society
Conveyancing Services`,
      bodyHtml: null,
      status: "received" as const,
      aiProcessed: true,
      aiProcessedAt: oneDayAgoEmail,
      aiIntent: "confirmation" as const,
      aiSentiment: "positive" as const,
      aiUrgency: 55,
      aiSummary:
        "Nationwide Building Society confirming mortgage funds of £562,500 will be released on completion day via CHAPS. Conditions: Certificate of Title via portal before 2pm, special conditions satisfied, buildings insurance in place.",
      aiSuggestedResponse: null,
      aiMatchedMatterId: DEMO_IDS.matters.conveyancing,
      aiMatchConfidence: 98,
      receivedAt: oneDayAgoEmail,
      createdAt: oneDayAgoEmail,
      updatedAt: oneDayAgoEmail,
    },
    // Client follow-up after complaint email
    {
      id: DEMO_IDS.emails.email13,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      direction: "inbound" as const,
      fromAddress: { email: "margaret.thompson@email.com", name: "Margaret Thompson" },
      toAddresses: [{ email: "james.clarke@harrisonclark.demo", name: "James Clarke" }],
      subject: "RE: URGENT: Exchange deadline approaching - need update NOW",
      bodyText: `Dear Mr Clarke,

Thank you for calling me back this afternoon. I appreciate you taking the time to explain everything.

I understand now that:
1. You were waiting for replies to additional enquiries about the Japanese knotweed
2. The searches have all come back clear
3. We are on track for exchange on Friday

I apologise for my earlier email - I was just so stressed about potentially losing this house. My mother is currently in hospital and I've been trying to sort everything out while visiting her.

Please can you confirm once you've received my deposit transfer? I sent it an hour ago.

Many thanks,
Margaret`,
      bodyHtml: null,
      status: "received" as const,
      aiProcessed: true,
      aiProcessedAt: oneHourAgo,
      aiIntent: "general" as const,
      aiSentiment: "positive" as const,
      aiUrgency: 45,
      aiSummary:
        "Client responding positively after solicitor's call. Apologises for earlier complaint - stressed due to mother in hospital. Confirms understanding of timeline. Deposit transfer sent - requests confirmation of receipt.",
      aiSuggestedResponse: `Dear Mrs Thompson,

Thank you for your kind email and for understanding. I completely appreciate how stressful this process can be, particularly with everything else you have going on. Please don't apologise.

I can confirm we have received your deposit of £75,000 into our client account - thank you.

I hope your mother is recovering well. If there's anything we can do to make the process easier for you during this difficult time, please let me know.

I'll be in touch on Friday to confirm exchange.

Kind regards,
James Clarke`,
      aiMatchedMatterId: DEMO_IDS.matters.conveyancing,
      aiMatchConfidence: 99,
      receivedAt: oneHourAgo,
      createdAt: oneHourAgo,
      updatedAt: oneHourAgo,
    },
    // Estate agent chasing
    {
      id: DEMO_IDS.emails.email14,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      direction: "inbound" as const,
      fromAddress: { email: "sarah.jones@foxtons.co.uk", name: "Sarah Jones" },
      toAddresses: [{ email: "james.clarke@harrisonclark.demo", name: "James Clarke" }],
      subject: "15 Willow Lane - Status Update Request",
      bodyText: `Hi James,

Just following up on the Thompson purchase. We've had the sellers on the phone asking when exchange is likely.

They're getting nervous as they've found a property they want to buy and don't want to lose it.

Can you give me a quick update on where things are? Are we still on track for exchange this week?

Thanks,
Sarah Jones
Senior Sales Negotiator
Foxtons Richmond`,
      bodyHtml: null,
      status: "received" as const,
      aiProcessed: true,
      aiProcessedAt: fourHoursAgo,
      aiIntent: "request_information" as const,
      aiSentiment: "neutral" as const,
      aiUrgency: 60,
      aiSummary:
        "Estate agent requesting status update. Sellers anxious about timing as they've found onward purchase. Asking if exchange on track for this week.",
      aiSuggestedResponse: `Hi Sarah,

Thanks for chasing. Yes, we're on track for exchange on Friday.

Just received satisfactory replies to our additional enquiries today and the deposit has been received. Priority search to be ordered tomorrow.

I'll keep you posted on progress.

Best,
James`,
      aiMatchedMatterId: DEMO_IDS.matters.conveyancing,
      aiMatchConfidence: 97,
      receivedAt: fourHoursAgo,
      createdAt: fourHoursAgo,
      updatedAt: fourHoursAgo,
    },
    // Local authority search results
    {
      id: DEMO_IDS.emails.email15,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      direction: "inbound" as const,
      fromAddress: { email: "searches@richmond.gov.uk", name: "Richmond Council Searches" },
      toAddresses: [{ email: "searches@harrisonclark.demo", name: "Harrison & Clarke Searches" }],
      subject: "Local Search Results - 15 Willow Lane, Richmond TW10 6AB",
      bodyText: `Your Ref: HC/MT/2024/001

Dear Sirs,

Please find attached the official search results for 15 Willow Lane, Richmond TW10 6AB.

Key findings:
- No planning applications affecting the property
- No building control matters outstanding
- No road schemes affecting the property
- No tree preservation orders
- No conservation area restrictions
- Property is not in a smoke control area

Financial search: No outstanding charges registered.

Search date: ${new Date().toLocaleDateString("en-GB")}
Valid for: 3 months

Richmond Upon Thames Council
Land Charges Department`,
      bodyHtml: null,
      status: "received" as const,
      aiProcessed: true,
      aiProcessedAt: twoDaysAgoEmail,
      aiIntent: "provide_information" as const,
      aiSentiment: "neutral" as const,
      aiUrgency: 50,
      aiSummary:
        "Local authority search results received - all clear. No planning issues, no outstanding building control matters, no road schemes, no TPOs. No financial charges. Valid for 3 months.",
      aiSuggestedResponse: null,
      aiMatchedMatterId: DEMO_IDS.matters.conveyancing,
      aiMatchConfidence: 96,
      receivedAt: twoDaysAgoEmail,
      createdAt: twoDaysAgoEmail,
      updatedAt: twoDaysAgoEmail,
    },
    // Building survey company
    {
      id: DEMO_IDS.emails.email16,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      direction: "inbound" as const,
      fromAddress: { email: "reports@homesurveyexperts.co.uk", name: "Home Survey Experts" },
      toAddresses: [
        { email: "margaret.thompson@email.com", name: "Margaret Thompson" },
        { email: "james.clarke@harrisonclark.demo", name: "James Clarke" },
      ],
      subject: "HomeBuyers Report - 15 Willow Lane, Richmond - COMPLETED",
      bodyText: `Dear Mrs Thompson,

Please find attached your HomeBuyers Report for 15 Willow Lane, Richmond TW10 6AB.

Overall Assessment: AMBER (3)

Key findings requiring attention:
1. AMBER - Roof tiles: Some slipped tiles on rear elevation requiring attention within 12 months. Estimated cost: £800-1,200
2. AMBER - Damp: Minor rising damp in cellar (common in Victorian properties). Recommend specialist survey. Estimated cost: £2,000-4,000 for treatment
3. GREEN - Structure: Property structurally sound
4. GREEN - Electrics: Consumer unit and wiring appear modern and compliant

Valuation: £750,000 (consistent with asking price)

We recommend you discuss these findings with your solicitor.

Regards,
Home Survey Experts Ltd`,
      bodyHtml: null,
      status: "received" as const,
      aiProcessed: true,
      aiProcessedAt: new Date(now.getTime() - 5 * 24 * 60 * 60000),
      aiIntent: "provide_information" as const,
      aiSentiment: "neutral" as const,
      aiUrgency: 55,
      aiSummary:
        "HomeBuyers Report completed with AMBER rating. Two issues flagged: slipped roof tiles (£800-1,200) and minor rising damp in cellar (£2,000-4,000). Structure and electrics are fine. Valuation confirms asking price of £750,000.",
      aiSuggestedResponse: null,
      aiMatchedMatterId: DEMO_IDS.matters.conveyancing,
      aiMatchConfidence: 94,
      receivedAt: new Date(now.getTime() - 5 * 24 * 60 * 60000),
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60000),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60000),
    },
    // Client query about costs
    {
      id: DEMO_IDS.emails.email17,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      direction: "inbound" as const,
      fromAddress: { email: "margaret.thompson@email.com", name: "Margaret Thompson" },
      toAddresses: [{ email: "james.clarke@harrisonclark.demo", name: "James Clarke" }],
      subject: "Question about Stamp Duty",
      bodyText: `Dear Mr Clarke,

I've been trying to work out my completion costs and I'm a bit confused about Stamp Duty.

The property is £750,000 and this will be my only home (I'm selling my flat). I thought the rate was 5% above £250,000 but my friend says there are different rates for different bands?

Also, do I pay it to you or directly to HMRC?

Thanks for clarifying.

Margaret Thompson`,
      bodyHtml: null,
      status: "received" as const,
      aiProcessed: true,
      aiProcessedAt: new Date(now.getTime() - 3 * 24 * 60 * 60000),
      aiIntent: "request_information" as const,
      aiSentiment: "neutral" as const,
      aiUrgency: 40,
      aiSummary:
        "Client asking for clarification on Stamp Duty Land Tax calculation and payment process. Not an additional property purchase. Unclear about banded rates.",
      aiSuggestedResponse: `Dear Mrs Thompson,

Good question - Stamp Duty can be confusing!

For a £750,000 property that will be your only/main residence, the SDLT calculation is:

- £0 - £250,000: 0% = £0
- £250,001 - £750,000: 5% = £25,000

Total SDLT: £25,000

We handle the SDLT return and payment on your behalf. The tax is paid from your completion funds, so you don't need to make a separate payment to HMRC. You'll see this as a line item on your completion statement.

I'll send you the full completion statement once we have the exchange date confirmed.

Kind regards,
James Clarke`,
      aiMatchedMatterId: DEMO_IDS.matters.conveyancing,
      aiMatchConfidence: 99,
      receivedAt: new Date(now.getTime() - 3 * 24 * 60 * 60000),
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60000),
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60000),
    },
    // Management company (leasehold query - for context/variety)
    {
      id: DEMO_IDS.emails.email18,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      direction: "inbound" as const,
      fromAddress: {
        email: "enquiries@willowlanemanagement.co.uk",
        name: "Willow Lane Management Co",
      },
      toAddresses: [{ email: "james.clarke@harrisonclark.demo", name: "James Clarke" }],
      subject: "LPE1 Response - 15 Willow Lane",
      bodyText: `Our Ref: WLM/15WL/2024

Dear Sir/Madam,

Further to your enquiries, please find enclosed:

1. LPE1 (Leasehold Property Enquiries) - completed
2. Management pack including:
   - Current service charge budget
   - Last 3 years' accounts
   - Insurance certificate
   - Memorandum and Articles

Key points:
- Ground rent: £350 per annum (next review 2028)
- Service charge: £1,800 per annum
- Reserve fund balance: £45,000
- No planned major works
- No outstanding service charge arrears on this property

Fee for this pack: £350 + VAT = £420 (invoice attached)

Willow Lane Management Company Limited`,
      bodyHtml: null,
      status: "received" as const,
      aiProcessed: true,
      aiProcessedAt: new Date(now.getTime() - 7 * 24 * 60 * 60000),
      aiIntent: "provide_information" as const,
      aiSentiment: "neutral" as const,
      aiUrgency: 45,
      aiSummary:
        "Management company LPE1 response. Ground rent £350/year (review 2028), service charge £1,800/year. Healthy reserve fund of £45,000. No major works planned, no arrears. Pack fee £420 inc VAT.",
      aiSuggestedResponse: null,
      aiMatchedMatterId: DEMO_IDS.matters.conveyancing,
      aiMatchConfidence: 95,
      receivedAt: new Date(now.getTime() - 7 * 24 * 60 * 60000),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60000),
      updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60000),
    },
  ];

  const createdEmails = [];

  for (const emailData of emailsData) {
    const [email] = await db
      .insert(emails)
      .values(emailData)
      .onConflictDoUpdate({
        target: emails.id,
        set: { updatedAt: now },
      })
      .returning();

    createdEmails.push(email);

    const urgencyLabel =
      email.aiUrgency && email.aiUrgency >= 75
        ? "[URGENT]"
        : email.aiUrgency && email.aiUrgency >= 50
          ? "[HIGH]"
          : "";
    console.log(`    Created email: ${urgencyLabel} ${email.subject?.substring(0, 45)}...`);
  }

  return createdEmails;
}
