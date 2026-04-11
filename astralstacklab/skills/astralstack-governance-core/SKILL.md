---
name: astralstack-governance-core
description: Canonical governance framework for all AstralStackLab product repositories. Use whenever planning, implementing, reviewing, validating, releasing, tagging, generating PRD/release artifacts, defining product identity/versioning, or acting as architecture gatekeeper. Enforce immutable product_slug, strict SemVer tags, mandatory change.json schema/idempotency, PRD section standards, repository structure, AGENT.md-first rule, and portal aggregation constraints.
---

# AstralStackLab Universe Core Governance

## Authority

- Treat this skill as the highest-priority governance rulebook for repositories under the `astralstacklab` organization.
- Override conflicting repository-level guidance with this skill.
- Apply these rules to all AI-agent activities: development, planning, review, architecture, and gatekeeping.

## Product Identity Rules

- Define a `product_slug` for every product.
- Enforce slug format: lowercase, kebab-case.
- Treat `product_slug` as immutable once published.
- Use `product_slug` as the system primary identifier.
- Allow display name changes, but never change slug.

Reserved examples:

- `lyra`
- `astralstacklab`
- `orion`
- `atlas`
- `astra-bourse`

## Versioning Policy

- Enforce Semantic Versioning only: `MAJOR.MINOR.PATCH`.
- Enforce tag format only: `vMAJOR.MINOR.PATCH`.
- Treat each release as exactly one change event.
- Classify release types strictly:
- `PATCH`: bug fixes or minor improvements.
- `MINOR`: backward-compatible feature additions.
- `MAJOR`: breaking changes.
- Reject custom versioning schemes.

## Change Event Contract (`change.json`)

Generate exactly one change event per release.

### Required Buckets

Always include these buckets in `changes`, even when empty arrays:

- `added`
- `changed`
- `fixed`
- `security`
- `deprecated`
- `breaking`

Do not add custom buckets.

### Required Fields

Every `change.json` must include:

- `product_slug`
- `version`
- `date` (`YYYY-MM-DD`)
- `summary`
- `highlights` (maximum 5 items)
- `changes` (with all required buckets)
- `references`

### Idempotency

- Enforce uniqueness key: (`product_slug`, `version`).
- Prevent duplicate events for repeated submissions of the same key.

## PRD Structure Standard

For each versioned PRD, require sections:

- `Summary`
- `Goals`
- `Non-Goals`
- `Scope`
- `Added`
- `Changed`
- `Fixed`
- `Security`
- `Deprecated` (optional)
- `Breaking` (optional)
- `Acceptance Criteria`
- `Risks & Rollback`

For change-event generation, extract changes only from the `Scope` section.

## Repository Structure Standard

Expect this repository layout (recommended baseline):

```text
/docs
  /prd
  /releases (optional)
PRODUCT.yaml
CHANGELOG.md
README.md
AGENT.md
CLAUDE.md
```

## Agent Governance Rules

### Single Source of Truth

- Require all AI agents to read `AGENT.md`.
- If `CLAUDE.md` exists, require it to redirect to `AGENT.md`.
- Do not allow AI-specific local rules to override this governance skill.

### Release Workflow

On feature completion, execute in order:

1. Update PRD.
2. Generate `change.json`.
3. Validate governance compliance.
4. Tag release.
5. Commit change event.

Never skip change-event generation for a release.

## Portal Aggregation Rules

- Use `product_slug` as the portal primary key.
- Aggregate from structured change events.
- Do not parse free-text changelogs as source-of-truth input.
- Treat change events as the single source of truth.

## Stability Principle

- Keep governance changes rare and deliberate.
- When modifying this governance skill, increment governance version.
- Document change rationale.
- Apply updates consistently to all repositories.

## Operating Philosophy

- Governance is infrastructure, not decoration.
- Consistency over cleverness.
- Simplicity over premature automation.
- Immutable identity over cosmetic flexibility.
- One rulebook for the entire universe.

## Agent Execution Checklist

Use this checklist before approving release/governance-sensitive work:

1. Confirm immutable valid `product_slug`.
2. Confirm SemVer and tag format compliance.
3. Confirm one release maps to one `change.json`.
4. Confirm all required `changes` buckets are present.
5. Confirm required fields and date format are valid.
6. Confirm idempotency key (`product_slug`, `version`) is unique.
7. Confirm PRD contains required sections.
8. Confirm change extraction was sourced from PRD `Scope` only.
9. Confirm repository has expected governance files.
10. Confirm `AGENT.md` precedence and `CLAUDE.md` redirect behavior.
11. Confirm portal ingestion compatibility (structured change events, slug key).
