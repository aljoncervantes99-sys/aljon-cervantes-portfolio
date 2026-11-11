# SmartLogix AI — Supabase Migration Application & Verification Checklist (REVIEW ONLY)

**Status:** Proposed for review. **Do not execute SQL or apply migrations without final explicit approval.**  
**Scope:** Stage 2 schema and hardening for organization isolation, webhook idempotency, inventory integrity, auth/profile lifecycle, shipment location retention, FK integrity/archival safety, and backup/rollback planning.

## 1. Migration traceability and file order (sequential, versioned)

| Order | File | Purpose | Dependencies |
|---:|---|---|---|
| 1 | `supabase/migrations/20261110235025_smartlogix_stage2.sql` | Base Stage 2 schema: extensions, enums, 19 tables, indexes/idempotency constraints, RLS helpers, RLS enablement/policies, core triggers, core RPC scaffolds (`create_organization_with_owner`, `record_webhook_event`, `apply_inventory_movement`) | `auth.users` (Supabase Auth) |
| 2 | `supabase/migrations/20261111000500_smartlogix_stage2_auth_profile_lifecycle.sql` | Auth/profile sync functions & proposed `auth.users` triggers, profile lifecycle fields, account-status-aware RLS helpers, tightened co-member profile visibility, `organization_member_directory` view, last-owner protection | Migration 1 |
| 3 | `supabase/migrations/20261111000600_smartlogix_stage2_shipment_location_retention.sql` | Shipment location minimization constraints, `data_retention_policies`, redaction/retention functions, sanitized shipment events view, tightened shipment event RLS, scheduling note | Migrations 1–2 |
| 4 | `supabase/migrations/20261111000700_smartlogix_stage2_fk_integrity_archival.sql` | Concrete FK hardening for `notifications`/`audit_logs`, safe archival/deletion behavior, polymorphic reference guards, orphan prevention, audit-history preservation | Migrations 1–3 |

**Traceability rules**
- Every database change must be committed as a new timestamped migration file in `supabase/migrations/` (never edit applied migrations in place).
- Use UTC timestamps in filenames (`YYYYMMDDHHMMSS_description.sql`) to preserve order.
- Each migration should be idempotent where practical (`if not exists`, guarded `do $$` blocks, `create or replace`) and include a header with status, dependencies, and purpose.
- Review SQL diff before apply; record approver, apply time, target project/environment, and result in release notes/change log.
- Keep rollback/compensation plan documented per migration (restore from verified backup/export or forward-fix migration) — no destructive rollback SQL included.

## 2. Backup and rollback (pre-migration)

**Reference:** `supabase/BACKUP_AND_ROLLBACK_PLAN.md` (complete). **Backup/rollback rehearsal completed: No (not completed).**

### Pre-apply backup checklist
- [ ] Verify Supabase project/ref, environment, and current plan features in dashboard (Database/Backups): confirm PITR availability, automated backups, retention, and restore options; record findings.
- [ ] **Supabase Free plan (verify in dashboard/docs):** PITR is generally **not available** on Free; automated managed backups/retention may be limited or unavailable. Do not assume PITR or daily automated backups exist.
- [ ] Create and securely store a verified manual pre-migration export (schema + data baseline) with timestamp, checksum, and access controls (backups may contain PII).
- [ ] Record migration history/state and relevant non-secret settings; define rollback owner and change window.
- [ ] Confirm restore path is understood for verified capabilities; explicitly note no rehearsal completed.

### Rollback strategy
- [ ] **Preferred (Free/no-PITR, verify):** restore from verified manual pre-migration export/backup if migration fails verification before critical writes.
- [ ] **If writes occurred after apply:** prefer forward-fix with a new sequential migration; restore is last resort due to data-loss risk.
- [ ] **If PITR is verified available (not assumed on Free):** follow Supabase PITR restore procedure for approved timestamp.
- [ ] Never edit applied migrations in place.

## 3. Application checklist (when explicitly approved)

### Pre-apply
- [ ] Final approval received for migrations 1–4, revised schema/RLS, and backup/rollback plan.
- [ ] Target is the dedicated SmartLogix Supabase project confirmed.
- [ ] Pre-migration backup checklist completed and evidence recorded.
- [ ] Server-side secrets remain server-only; no secrets added to frontend/env exposed to client.
- [ ] Supabase CLI or SQL editor access confirmed (CLI not currently installed locally).

### Apply (in order)
- [ ] Apply `20261110235025_smartlogix_stage2.sql`.
- [ ] Apply `20261111000500_smartlogix_stage2_auth_profile_lifecycle.sql`.
- [ ] Apply `20261111000600_smartlogix_stage2_shipment_location_retention.sql`.
- [ ] Apply `20261111000700_smartlogix_stage2_fk_integrity_archival.sql`.
- [ ] Review/apply `auth.users` triggers noted in migration 2 only with appropriate privileges and after verification.
- [ ] Seed/configure default retention policies per org if required (e.g. `shipment_location` = 30 days) via approved admin/RPC path.
- [ ] Configure trusted scheduler for `apply_shipment_location_retention()` (pg_cron or server job with service role) if approved.
- [ ] Regenerate DB types/client bindings if used by application (future step).

### Post-apply
- [ ] Run verification checklist below and record evidence.
- [ ] Confirm no unintended grants; explicitly grant/revoke as required for `authenticated`, `anon`, `service_role`, and function execute privileges.
- [ ] Smoke-test SmartLogix app auth/connectivity (no tables populated beyond controlled test data).
- [ ] Document applied versions, timestamps, approver, backup reference, and verification outcome.

## 3. Verification checklist

### 3.1 Migration traceability & integrity
- [ ] All three migration files present in order and checksums/content reviewed.
- [ ] Objects created successfully: enums, 19 base tables + `data_retention_policies`, indexes/unique constraints, functions, triggers, views, RLS policies.
- [ ] No SQL executed outside versioned migrations except explicitly approved operational steps (e.g. scheduler setup), and those steps documented.

### 3.2 Organization isolation
- [ ] RLS enabled on all tenant tables including `data_retention_policies`.
- [ ] User in Org A cannot select/insert/update/delete Org B data across all org-scoped tables and views.
- [ ] `organization_id` scoping enforced in policies, helper functions, and any service/RPC paths.
- [ ] Soft-deleted/archived records excluded from normal member access where specified.

### 3.3 Auth/profile lifecycle and membership
- [ ] New `auth.users` create/sync corresponding `profiles` rows (via trigger or approved provisioning flow).
- [ ] Profile updates (email, confirmation/sign-in metadata as applicable) synchronize safely without leaking secrets.
- [ ] Suspended, deactivated, deleted, or inactive profiles cannot access organization data (`is_profile_active`/`is_org_member`/`has_org_role`).
- [ ] Removed or inactive organization members cannot access org data; last-owner removal is prevented.
- [ ] Co-member direct `profiles` access restricted (self; owner/admin where intended). Non-admin members see only necessary business info via `organization_member_directory`.
- [ ] Directory view returns no email, phone, preferences, suspension reasons, or other unnecessary PII.

### 3.4 Shipment location minimization & retention
- [ ] `shipment_events.location_text` rejects obvious precise coordinate/lat-lng patterns and enforces coarse/minimized length.
- [ ] `shipment_events` payloads stored minimized/redacted; no unnecessary precise location or PII retained.
- [ ] `shipment_events` accessible only to authorized members of the same organization (and linked shipment/org checks where applied).
- [ ] `data_retention_policies` configurable per org and manageable by owner/admin only.
- [ ] `apply_shipment_location_retention()` redacts `location_text` and sensitive payload while preserving necessary audit history (event identity, shipment/org refs, provider ids, status/code, timestamps, sanitized message/correlation).
- [ ] Retention job runs on trusted schedule with service privileges and produces sanitized audit summary where applicable.

### 3.5 Inventory transactions
- [ ] `inventory` invariants enforced: non-negative quantities, `reserved + damaged <= on_hand`, generated `available`, unique `(organization_id, product_id, location_code)`.
- [ ] `apply_inventory_movement` is transactional, row-locking, idempotent, and writes ledger + state consistently; invariant violations raise and roll back.
- [ ] `inventory_movements` append-only; direct client quantity mutation prevented by RLS.
- [ ] Concurrent movement tests produce correct final state with no double-apply.

### 3.6 Webhook idempotency and verification
- [ ] `record_webhook_event` enforces dedupe on provider/external event id and idempotency key.
- [ ] Duplicate webhook deliveries do not create duplicate side effects (orders, movements, shipment events, executions).
- [ ] Server-side signature/HMAC verification required before trusted processing; failures/duplicates recorded with sanitized data only.
- [ ] `webhook_events`, `inventory_movements`, `shipment_events`, `automation_executions` dedupe constraints/indexes validated.

### 3.7 Role-based permissions and approvals
- [ ] `owner/admin/operator/viewer/automation_service` permissions match intended matrix; negative tests pass.
- [ ] PO approval and consequential external notifications/sends require authorized human approval (server-side enforcement via RPC/state machine in follow-up implementation).
- [ ] `audit_logs` immutable and readable only by authorized roles; inserts restricted to service/triggers.
- [ ] Explicit grants reviewed: `anon` minimal, `authenticated` least privilege, function execute permissions scoped.

### 3.8 FK integrity, archival, and orphan prevention
- [ ] `notifications.organization_id` is NOT NULL with FK to `organizations(id) ON DELETE RESTRICT`; recipient/approver profile FKs use `ON DELETE SET NULL`; hard delete prevented (soft delete only).
- [ ] `audit_logs.organization_id` FK uses `ON DELETE RESTRICT` and `actor_user_id` uses `ON DELETE SET NULL`; `audit_logs` remains append-only/immutable.
- [ ] Polymorphic reference guards enforced: entity type/id pairing checks, known entity-type constraints, and best-effort existence validation trigger for supported types/org contexts.
- [ ] Attempt to create orphaned notification/audit references for known types fails; unknown/future types documented as application-validated.
- [ ] Organizations/important records cannot be hard-deleted in ways that destroy required history; soft-delete/archive behavior preserved.

### 3.9 Backup and rollback readiness
- [ ] Pre-migration backup/export verified and stored securely; dashboard backup/PITR capabilities recorded for current plan.
- [ ] Rollback path selected based on verified capabilities; no PITR assumed on Free unless confirmed.
- [ ] **No backup or rollback rehearsal completed** unless separately executed and evidenced.

## 4. Operational notes
- `auth.users` triggers and `pg_cron` scheduling are environment-dependent and must be reviewed for Supabase permissions before apply.
- Additional follow-up migrations/RPCs still required for full production flows (audit writer triggers per table, PO/notification approval-dispatch RPCs, Shopify ingestion/receiving workflows, over-receipt resolution, explicit GRANT hardening, full audit coverage).
- All changes must remain server-side for privileged operations; no credentials or service-role keys in frontend.
- Backup/restore capabilities are plan-dependent; verify current Supabase Free plan features in project dashboard/docs before apply. Do not claim PITR or rehearsals unless verified/completed.