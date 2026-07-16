# LOCUS US Discovery Corpus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Register LOCUS-v1 as an optional U.S. local AI-law discovery corpus without importing it into the verified legal database or treating it as authority.

**Architecture:** Add a focused LOCUS policy/helper module under the U.S. AI-regulation agent code. It maps a LOCUS row into a private `DiscoveryLeadInput` only when AI/local-law terms are detected, preserving official-source gates and public-display bans.

**Tech Stack:** TypeScript, existing `DiscoveryLeadInput`, Vitest, existing Supabase-backed discovery lead architecture.

## Global Constraints

- Do not import the full LOCUS-v1 dataset into the main legal database.
- Do not treat LOCUS as official legal authority.
- Do not display LOCUS-derived items publicly as verified law.
- Do not create final legal database items from LOCUS alone.
- LOCUS belongs in the U.S. local-law discovery layer only.
- LOCUS-derived leads must default to `requires_official_source=true` and `public_display_allowed=false`.

---

### Task 1: LOCUS Discovery Policy and Lead Builder

**Files:**
- Create: `src/agents/ai-regulation/usLocusDiscovery.ts`
- Test: `src/agents/ai-regulation/usLocusDiscovery.test.ts`

**Interfaces:**
- Produces: `buildLocusDiscoveryLead(row, options): DiscoveryLeadInput | null`
- Produces: `parseLocusReviewerNotes(notes): LocusDiscoveryMetadata | null`
- Consumes: `DiscoveryLeadInput` from `src/agents/ai-regulation/governance.ts`

- [ ] Write tests proving AI terms create private discovery leads.
- [ ] Write tests proving non-AI LOCUS rows return `null`.
- [ ] Write tests proving LOCUS leads cannot be public and require official source verification.
- [ ] Implement the policy and builder with topic detection, confidence scoring, city/county/state metadata, excerpt creation, and JSON reviewer notes.
- [ ] Run `npm test -- src/agents/ai-regulation/usLocusDiscovery.test.ts`.

### Task 2: Documentation

**Files:**
- Modify: `README.md`
- Modify: `PROJECT_LOGBOOK.md`
- Modify: `AI_AGENT_MASTER_CONTEXT.md`

**Interfaces:**
- Documents LOCUS as a U.S. discovery corpus only.
- Documents conversion rules: official municipal/county source, accessible URL, verified text, jurisdiction/date/pinpoint, AI relevance, admin review.

- [ ] Add a README section under U.S. local-law/discovery policy.
- [ ] Add a project logbook entry.
- [ ] Add master agent context instructions.
- [ ] Run `rg "LOCUS|locus" README.md PROJECT_LOGBOOK.md AI_AGENT_MASTER_CONTEXT.md src/agents/ai-regulation/usLocusDiscovery.ts`.

### Task 3: Verification and Handoff

**Files:**
- Modify: `AI_TASKS.md`

**Interfaces:**
- Handoff references `buildLocusDiscoveryLead()`, `DiscoveryLead`, community "Scan Pipeline", community "DB Repository Layer".

- [ ] Run targeted tests.
- [ ] Run full `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
- [ ] Update the Codex row and current-status handoff.
- [ ] Commit, push, and verify external checks.
