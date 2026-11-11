# SmartLogix AI — Supabase Backup and Rollback Plan (REVIEW ONLY)

**Status:** Planning document only. **No SQL executed, no migrations applied, no backup or rollback rehearsal completed.**  
**Scope:** Pre-migration backup, Supabase backup/PITR considerations, rollback strategy, and post-migration verification for SmartLogix Stage 2 migrations.

> **Important:** Backup/restore capabilities depend on your Supabase project’s **current plan, region, and dashboard features**. Verify details in the Supabase Dashboard and official Supabase documentation for the specific project before applying migrations.

## 1. Supabase backup and PITR considerations (current Free plan)

### Features to verify for the current Supabase Free plan
Supabase plan features can change; confirm the following in **Project Settings / Database / Backups** and Supabase pricing/docs for the project:

| Capability | Typical expectation on Free plan (verify) | Notes |
|---|---|---|
| **Point-in-Time Recovery (PITR)** | **Not available** on Free plan in general; typically a paid/Pro feature (verify) | If unavailable, you cannot restore to an arbitrary timestamp; recovery options are limited to available backups/snapshots/exports. |
| **Automated scheduled backups / snapshots** | **Limited or not equivalent to Pro managed backups** (verify availability and retention in dashboard) | Do not assume daily automated backups with long retention exist on Free. Check what, if any, backups are listed in the dashboard. |
| **Manual database export (pg_dump / SQL)** | **Available via tooling/connection string or dashboard export options** (verify) | Practical baseline for Free projects: take a manual schema/data export before migration using approved tools. |
| **Restore from dashboard backup** | **Depends on whether backups are available for the project** (verify) | If no backups are listed, dashboard restore may not be possible. |
| **Downloadable backup artifacts** | **Project-dependent** (verify) | Confirm you can obtain and securely store a restorable export before changes. |

**Do not claim PITR or automated backups are available unless confirmed in the project dashboard/docs.**

## 2. Pre-migration backup checklist (must complete before apply, when approved)

- [ ] **Confirm target project and environment:** dedicated SmartLogix Supabase project/ref, correct branch/environment.
- [ ] **Verify current plan and backup features in dashboard:** check Database/Backups for PITR availability, automated backups, retention, and restore options; record findings/screenshots in change log.
- [ ] **Identify restore point capability:** if PITR unavailable (expected on Free, verify), document the best available recovery point (manual export timestamp, any listed backup).
- [ ] **Create manual pre-migration export (required baseline):** export schema and data using approved method (e.g. `pg_dump` with direct DB connection if available, or Supabase-supported export). Store securely with timestamp, project ref, migration target version, and checksum.
- [ ] **Export critical metadata:** record current migration history/state (if any), auth configuration notes, extensions, and relevant project settings (no secrets in logs).
- [ ] **Validate export artifact:** confirm file integrity/readability and that it contains expected schema/data scope for rollback planning.
- [ ] **Restrict access to backups:** backups may contain PII/operational data; encrypt/store in approved secure location with least-privilege access.
- [ ] **Establish change window and approval:** record approver, UTC timestamp, operator, and rollback owner.
- [ ] **Confirm no rehearsal completed:** unless explicitly performed and documented, state “backup/rollback rehearsal not completed”.

## 3. Migration rollback strategy

### General principles
- **Preferred recovery on Free/no-PITR:** restore from verified manual pre-migration export/backup to a known-good state (or provision clean restore target and replay safe data as appropriate). Point-in-time rollback is **not assumed**.
- **Do not edit applied migrations in place.** Rollback/repair should use a forward-fix migration or controlled restore procedure.
- **Data-loss risk:** any rollback after new writes can lose post-migration data; freeze/limit writes during migration window where possible.

### Rollback options (choose based on verified capabilities)

| Scenario | Strategy | Preconditions | Risks/limitations |
|---|---|---|---|
| **Before apply** | No rollback needed; defer changes | N/A | None |
| **Apply fails mid-migration** | Transactions in migration files reduce partial state, but review actual DB state; restore from pre-migration export if inconsistent | Verified manual export; ability to restore | Manual restore may be time-consuming; requires DB access/tooling |
| **Apply succeeds but verification fails (no critical writes)** | Restore pre-migration export/backup to return to baseline | Verified export/backup and restore path | Downtime; loss of any test writes |
| **Apply succeeds and production writes occurred** | **Forward-fix** with new versioned migration; restore only as last resort | Change analysis, tested fix, backups | Restore loses new data; forward-fix preferred but requires careful design |
| **PITR available and approved (if verified, typically not Free)** | Restore to pre-change timestamp per Supabase procedure | Confirmed PITR, selected timestamp, restore permissions | Project-specific; may affect entire database/branch |

### Forward-fix requirements
- Create new sequential migration file(s) (e.g. `20261111XXXXXX_smartlogix_stage2_fix_*.sql`).
- Include impact analysis, data migration safety, idempotency where possible, and verification steps.
- Preserve audit history and avoid destructive data loss unless explicitly approved with backup.

## 4. Post-migration verification steps

- [ ] Confirm migrations applied in order: 1) `20261110235025_smartlogix_stage2.sql`, 2) `20261111000500_smartlogix_stage2_auth_profile_lifecycle.sql`, 3) `20261111000600_smartlogix_stage2_shipment_location_retention.sql`, 4) `20261111000700_smartlogix_stage2_fk_integrity_archival.sql`.
- [ ] Verify schema objects exist: enums, tables (incl. `data_retention_policies`), constraints/FKs, indexes, functions, triggers, views, RLS policies.
- [ ] Run verification checklist in `MIGRATION_APPLICATION_AND_VERIFICATION_CHECKLIST.md` (isolation, auth/membership, shipment retention, inventory transactions, webhook idempotency, RBAC/approvals).
- [ ] Validate FK integrity and archival behavior: notifications/audit concrete FKs, no orphaned polymorphic refs for validated types, soft-delete/append-only protections effective.
- [ ] Smoke-test SmartLogix app auth/connectivity and basic authorized reads (no unintended data exposure).
- [ ] Record outcome: success/failure, evidence, timestamps, and any follow-up forward-fix migrations required.

## 5. Rehearsal and limitations statement
- **Backup/rollback rehearsal completed:** **No (not completed).** No claim of successful rehearsal is made.
- **PITR:** assumed **unavailable on Free plan unless verified otherwise** in the project dashboard.
- **Restore confidence:** depends on validated manual export and tested restore procedure in a safe environment (not performed).