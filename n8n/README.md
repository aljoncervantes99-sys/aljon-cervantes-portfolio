# SmartLogix AI n8n Workflow Architecture (Prepared, Not Connected)

**Status:** Architecture prepared for review only. No n8n instance, paid service, or external integration is connected.

## Security and control rules
- All third-party secrets stay in n8n credentials or secure server environment variables (never frontend).
- Webhook ingestion uses signature/HMAC verification and idempotency keys to prevent duplicate processing.
- Inventory-affecting operations must use database transactions/RPCs.
- Purchase order creation/sending and consequential supplier communications require human approval records before execution.
- Every workflow writes execution start/end/error logs to SmartLogix (`workflow_runs`, `workflow_run_logs`, alerts).
- Unconfigured integrations must remain disabled and reported as `not_configured`.

## Prepared workflows
- `workflows/order-automation.json` — Shopify order webhook intake, validation, availability check, Supabase persistence, fulfillment update, notifications.
- `workflows/inventory-automation.json` — Stock monitoring, availability/reorder calculation, low-stock alerts, PO draft generation (approval required).
- `workflows/supplier-automation.json` — PO/supplier date tracking, overdue detection, supplier follow-up drafts (approval required before sending).
- `workflows/shipment-automation.json` — Tracking references, carrier updates when configured, status updates, delay/exception notifications.
- `workflows/ai-automation.json` — PO extraction, operational summaries, replenishment recommendations, follow-up drafts, daily reports (server-side AI provider only).

## Callback/logging contract (planned)
n8n nodes should POST signed execution events to `/api/smartlogix/n8n/callback` with:
`workflow_key`, `run_id`, `status`, `started_at`, `finished_at`, `entity_refs`, `message`, `error` (sanitized), and HMAC signature using `SMARTLOGIX_N8N_CALLBACK_SECRET`.

Stage 1 provides endpoint scaffolding only; processing is implemented in later stages.