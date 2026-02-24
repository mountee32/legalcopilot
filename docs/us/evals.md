# AI Evaluation Plan

## Purpose

Define objective gates for shipping AI extraction, reconciliation, and action generation.

## Evaluation Datasets

- Gold set by practice area (Workers' Comp, Personal Injury)
- Document type coverage set (medical reports, correspondence, forms, filings)
- Conflict set with known contradictions
- Low-quality OCR set for robustness

## Core Metrics

- Classification accuracy
- Extraction precision/recall (field-level)
- Conflict detection precision/recall
- Action recommendation acceptance rate
- Hallucination rate (unsupported claims)
- Citation coverage rate

## Launch Thresholds

- Classification >= 90%
- Critical-field precision >= 92%
- Conflict precision >= 90%
- Citation coverage >= 98%
- Unsupported claim rate <= 1%

## Run Cadence

- Required before each sprint demo for AI-touching changes
- Required before promotion to pilot and production cohorts

## Failure Policy

- If thresholds fail, release is blocked for affected feature flags
- Fixes must include targeted regression cases added to gold set
