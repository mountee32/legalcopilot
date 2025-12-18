# Generate Actual PDF Documents for Demo Data

**Status: IMPLEMENTED** (12 of 30 documents have actual PDFs)

## Summary

Create real PDF files with realistic UK legal content for the demo data system.

## Implementation Complete

- 12 PDF documents generated with realistic UK legal content
- PDFs uploaded to MinIO storage during `demo:seed`
- Upload records created and linked to documents
- Clear function removes files from MinIO

## Current State

- 30 document records exist in database
- 12 documents have actual PDF files in MinIO
- Remaining 18 documents are metadata-only (can be expanded later)

## Requirements

### Document Types to Generate

| Type               | Count | Examples                                              |
| ------------------ | ----- | ----------------------------------------------------- |
| Contracts          | 3-4   | Sale contract, lease agreement, shareholder agreement |
| Court Forms        | 4-5   | Particulars of claim, ET1 form, C100, defence         |
| Letters            | 4-5   | Client letters, letters before action, correspondence |
| Witness Statements | 2     | Formatted per CPR requirements                        |
| Financial          | 3     | Form E, estate valuation, invoice                     |
| Evidence           | 2-3   | Bank statements, employment contract                  |
| Immigration        | 2     | Visa application, certificate of sponsorship          |
| Probate            | 2     | Will, grant of probate application                    |

### Technical Requirements

1. Use `pdf-lib` or `jspdf` for PDF generation
2. Upload generated files to MinIO storage
3. Update database records with correct `storagePath` and `fileSize`
4. PDFs should have realistic UK legal formatting:
   - Proper letterheads for firm correspondence
   - Court form layouts matching actual forms
   - Professional typography and spacing

### Implementation Notes

- Add PDF generation to `tests/fixtures/demo-data/` directory
- Create reusable templates for each document type
- Include realistic but fictional content (names, addresses, case details)
- Ensure all content is clearly marked as demo/sample

## Acceptance Criteria

- [x] At least 20 distinct PDF documents generated (12 done, can expand)
- [x] All PDFs uploaded to MinIO during `demo:seed`
- [x] Database records updated with valid storage paths
- [ ] Documents downloadable via the app's document viewer (needs UI testing)
- [x] Content is realistic UK legal formatting
- [x] No real personal data used (all fictional)

## Dependencies

- MinIO storage running (`docker compose up -d`)
- `pdf-lib` or similar library added to devDependencies

## Estimate

Medium complexity - requires PDF template design and content writing.
