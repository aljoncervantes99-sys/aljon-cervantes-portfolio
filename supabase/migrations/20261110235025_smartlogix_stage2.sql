-- SmartLogix AI Stage 2 - Proposed schema migration (REVIEW ONLY)
-- Status: generated for review; DO NOT EXECUTE/APPLY without explicit approval.
-- Target: Supabase PostgreSQL (Auth: auth.users). Uses pgcrypto for gen_random_uuid().
-- Decisions applied: creator becomes org owner; service-role server-side only;
-- dedicated webhook_events with idempotency; restricted profile/customer visibility;
-- minimized shipment location/retention; inventory over-receipt flagged for review;
-- soft delete/archive for important records; PII minimization/redaction for AI;
-- human approval required for POs and consequential external notifications.

begin;

-- Extensions
create extension if not exists pgcrypto;

-- =========================
-- Enums
-- =========================
do $$ begin
  create type public.member_role as enum ('owner','admin','operator','viewer','automation_service');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.member_status as enum ('invited','active','suspended','removed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.org_status as enum ('active','suspended','archived');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.order_status as enum ('draft','received','validated','awaiting_stock','allocated','processing','fulfilled','cancelled','exception');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.payment_status as enum ('pending','authorized','paid','partially_paid','refunded','failed','voided','not_applicable');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.fulfillment_status as enum ('unfulfilled','partially_fulfilled','fulfilled','on_hold','cancelled','exception');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.inventory_movement_type as enum ('receipt','reservation','reservation_release','allocation','shipment','adjustment_increase','adjustment_decrease','return','transfer_in','transfer_out','damage','cycle_count');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.inventory_reference_type as enum ('order','order_item','shipment','purchase_order','purchase_order_item','manual','webhook','automation','reconciliation');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.purchase_order_status as enum ('draft','pending_approval','approved','rejected','sent','acknowledged','partially_received','received','overdue','cancelled','closed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.receiving_discrepancy_status as enum ('none','flagged','under_review','resolved','accepted');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.shipment_status as enum ('pending','label_created','picked_up','in_transit','out_for_delivery','delivered','delayed','exception','returned','cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.webhook_processing_status as enum ('received','verified','queued','processing','processed','duplicate','ignored','failed','dead_letter');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.workflow_trigger_type as enum ('manual','schedule','webhook','event','ai');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.execution_status as enum ('queued','running','succeeded','failed','cancelled','awaiting_approval','approved','rejected','skipped_duplicate');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.notification_type as enum ('order','inventory','shipment','supplier','purchase_order','automation','ai','approval','system','security');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.notification_channel as enum ('in_app','email_draft','email','webhook');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.notification_status as enum ('pending','pending_approval','approved','sent','failed','read','dismissed','cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.audit_action as enum ('create','update','delete','soft_delete','restore','archive','status_change','approve','reject','execute','send','login','webhook_received','webhook_duplicate','inventory_move','ai_generate');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.actor_type as enum ('user','system','automation','ai','integration','service');
exception when duplicate_object then null; end $$;

-- =========================
-- Utility / auth helper functions
-- =========================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.deleted_at is null
  );
$$;

create or replace function public.has_org_role(p_org_id uuid, p_roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.deleted_at is null
      and m.role = any(p_roles)
  );
$$;

create or replace function public.can_approve(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_org_role(p_org_id, array['owner','admin']::public.member_role[]);
$$;

create or replace function public.prevent_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_logs are immutable';
end;
$$;

create or replace function public.enforce_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception '% is append-only', tg_table_name;
end;
$$;

-- =========================
-- Tables
-- =========================

-- 1. profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  display_name text,
  avatar_url text,
  phone text,
  is_active boolean not null default true,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 2. organizations
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status public.org_status not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  archived_at timestamptz
);

-- 3. organization_members
create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'viewer',
  status public.member_status not null default 'active',
  is_default boolean not null default false,
  invited_by uuid references public.profiles(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint organization_members_org_user_unique unique (organization_id, user_id)
);

-- 4. webhook_events (dedicated idempotency)
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  provider text not null,
  event_type text not null,
  external_event_id text,
  idempotency_key text,
  signature_verified boolean not null default false,
  signature_valid boolean,
  verification_method text,
  request_id text,
  payload_hash text,
  headers_minimized jsonb not null default '{}'::jsonb,
  payload_minimized jsonb not null default '{}'::jsonb,
  processing_status public.webhook_processing_status not null default 'received',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  related_entity_type text,
  related_entity_id uuid,
  error_code text,
  error_message text,
  received_at timestamptz not null default now(),
  verified_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. customers
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  external_source text,
  external_customer_id text,
  email text,
  phone text,
  first_name text,
  last_name text,
  company_name text,
  shipping_address jsonb not null default '{}'::jsonb,
  billing_address jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  archived_at timestamptz
);

-- 6. products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sku text not null,
  name text not null,
  description text,
  external_source text,
  external_product_id text,
  external_variant_id text,
  unit_cost numeric(12,2) check (unit_cost is null or unit_cost >= 0),
  unit_price numeric(12,2) check (unit_price is null or unit_price >= 0),
  reorder_point integer not null default 0 check (reorder_point >= 0),
  reorder_quantity integer not null default 0 check (reorder_quantity >= 0),
  lead_time_days integer check (lead_time_days is null or lead_time_days >= 0),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  archived_at timestamptz,
  constraint products_org_sku_unique unique (organization_id, sku)
);

-- 7. orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  external_source text,
  external_order_id text,
  external_order_number text,
  webhook_event_id uuid references public.webhook_events(id) on delete set null,
  idempotency_key text,
  order_status public.order_status not null default 'received',
  payment_status public.payment_status not null default 'pending',
  fulfillment_status public.fulfillment_status not null default 'unfulfilled',
  currency char(3) not null default 'USD',
  subtotal_amount numeric(12,2) not null default 0 check (subtotal_amount >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  shipping_amount numeric(12,2) not null default 0 check (shipping_amount >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  placed_at timestamptz,
  validated_at timestamptz,
  cancelled_at timestamptz,
  customer_snapshot jsonb not null default '{}'::jsonb,
  raw_payload_ref text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  archived_at timestamptz
);

-- 8. order_items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  sku text,
  title text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  line_total numeric(12,2) not null default 0 check (line_total >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. inventory
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  location_code text not null default 'default',
  on_hand integer not null default 0 check (on_hand >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  damaged integer not null default 0 check (damaged >= 0),
  available integer generated always as (on_hand - reserved - damaged) stored,
  reorder_in_progress boolean not null default false,
  last_movement_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint inventory_org_product_location_unique unique (organization_id, product_id, location_code),
  constraint inventory_reserved_damaged_within_on_hand check (reserved + damaged <= on_hand),
  constraint inventory_available_nonnegative check (available >= 0)
);

-- 10. inventory_movements (append-only ledger)
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  inventory_id uuid not null references public.inventory(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  movement_type public.inventory_movement_type not null,
  quantity_delta integer not null check (quantity_delta <> 0),
  reserved_delta integer not null default 0,
  damaged_delta integer not null default 0,
  on_hand_before integer not null,
  on_hand_after integer not null,
  reserved_before integer not null,
  reserved_after integer not null,
  damaged_before integer not null default 0,
  damaged_after integer not null default 0,
  reference_type public.inventory_reference_type,
  reference_id uuid,
  webhook_event_id uuid references public.webhook_events(id) on delete set null,
  external_source text,
  external_event_id text,
  idempotency_key text,
  reason text,
  actor_type public.actor_type not null default 'system',
  actor_user_id uuid references public.profiles(id) on delete set null,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 11. suppliers
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_name text,
  email text,
  phone text,
  address jsonb not null default '{}'::jsonb,
  lead_time_days integer check (lead_time_days is null or lead_time_days >= 0),
  payment_terms text,
  is_active boolean not null default true,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  archived_at timestamptz
);

-- 12. purchase_orders
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  po_number text not null,
  status public.purchase_order_status not null default 'draft',
  currency char(3) not null default 'USD',
  subtotal_amount numeric(12,2) not null default 0 check (subtotal_amount >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  shipping_amount numeric(12,2) not null default 0 check (shipping_amount >= 0),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  expected_at timestamptz,
  ordered_at timestamptz,
  received_at timestamptz,
  cancelled_at timestamptz,
  requires_approval boolean not null default true,
  approval_requested_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  rejected_by uuid references public.profiles(id) on delete set null,
  rejected_at timestamptz,
  rejection_reason text,
  sent_by uuid references public.profiles(id) on delete set null,
  sent_at timestamptz,
  receiving_discrepancy_status public.receiving_discrepancy_status not null default 'none',
  receiving_discrepancy_note text,
  created_by uuid references public.profiles(id) on delete set null,
  source text not null default 'manual',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  archived_at timestamptz,
  constraint purchase_orders_org_number_unique unique (organization_id, po_number)
);

-- 13. purchase_order_items
create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  sku text,
  description text,
  quantity_ordered integer not null check (quantity_ordered > 0),
  quantity_received integer not null default 0 check (quantity_received >= 0),
  quantity_damaged integer not null default 0 check (quantity_damaged >= 0),
  unit_cost numeric(12,2) not null default 0 check (unit_cost >= 0),
  line_total numeric(12,2) not null default 0 check (line_total >= 0),
  receiving_discrepancy boolean not null default false,
  discrepancy_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 14. shipments
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete restrict,
  carrier text,
  service_level text,
  tracking_number text,
  tracking_url text,
  external_shipment_id text,
  status public.shipment_status not null default 'pending',
  shipped_at timestamptz,
  estimated_delivery_at timestamptz,
  delivered_at timestamptz,
  last_event_at timestamptz,
  exception_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  archived_at timestamptz
);

-- 15. shipment_events (append-only timeline, minimized location/payload)
create table if not exists public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  webhook_event_id uuid references public.webhook_events(id) on delete set null,
  provider text,
  provider_event_id text,
  idempotency_key text,
  event_status public.shipment_status,
  event_code text,
  message text,
  location_text text, -- coarse/minimized only
  occurred_at timestamptz not null,
  raw_payload jsonb not null default '{}'::jsonb, -- minimized/redacted
  retention_until timestamptz,
  created_at timestamptz not null default now()
);

-- 16. automation_workflows
create table if not exists public.automation_workflows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  trigger_type public.workflow_trigger_type not null,
  integration_key text,
  is_enabled boolean not null default false,
  requires_approval boolean not null default true,
  allowed_roles public.member_role[] not null default array['owner','admin']::public.member_role[],
  n8n_workflow_id text,
  config jsonb not null default '{}'::jsonb,
  last_run_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  archived_at timestamptz,
  constraint automation_workflows_org_key_unique unique (organization_id, key)
);

-- 17. automation_executions
create table if not exists public.automation_executions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow_id uuid references public.automation_workflows(id) on delete set null,
  webhook_event_id uuid references public.webhook_events(id) on delete set null,
  workflow_key text not null,
  trigger_type public.workflow_trigger_type not null,
  trigger_source text,
  trigger_event_id text,
  idempotency_key text,
  status public.execution_status not null default 'queued',
  actor_type public.actor_type not null default 'system',
  actor_user_id uuid references public.profiles(id) on delete set null,
  requires_approval boolean not null default false,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  rejected_by uuid references public.profiles(id) on delete set null,
  rejected_at timestamptz,
  approval_note text,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  attempt integer not null default 1 check (attempt >= 1),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 18. notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recipient_user_id uuid references public.profiles(id) on delete set null,
  type public.notification_type not null,
  channel public.notification_channel not null default 'in_app',
  status public.notification_status not null default 'pending',
  severity text not null default 'info',
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  dedupe_key text,
  requires_approval boolean not null default false,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  dismissed_at timestamptz,
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 19. audit_logs (append-only)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  actor_type public.actor_type not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_label text,
  action public.audit_action not null,
  entity_type text not null,
  entity_id uuid,
  request_id text,
  idempotency_key text,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- =========================
-- Indexes & idempotency constraints
-- =========================
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_org_members_user on public.organization_members(user_id, status);
create index if not exists idx_org_members_org_role on public.organization_members(organization_id, role, status);

create index if not exists idx_webhook_events_org_received on public.webhook_events(organization_id, received_at desc);
create index if not exists idx_webhook_events_status on public.webhook_events(processing_status);
create unique index if not exists uq_webhook_events_org_provider_event
  on public.webhook_events(organization_id, provider, external_event_id)
  where external_event_id is not null;
create unique index if not exists uq_webhook_events_org_provider_idempotency
  on public.webhook_events(organization_id, provider, idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_customers_org_email on public.customers(organization_id, email);
create unique index if not exists uq_customers_org_external
  on public.customers(organization_id, external_source, external_customer_id)
  where external_source is not null and external_customer_id is not null;

create index if not exists idx_products_org_active on public.products(organization_id, is_active) where deleted_at is null;
create unique index if not exists uq_products_org_variant
  on public.products(organization_id, external_source, external_variant_id)
  where external_source is not null and external_variant_id is not null;

create index if not exists idx_orders_org_created on public.orders(organization_id, created_at desc);
create index if not exists idx_orders_org_status on public.orders(organization_id, order_status, fulfillment_status);
create index if not exists idx_orders_customer on public.orders(customer_id);
create unique index if not exists uq_orders_org_external
  on public.orders(organization_id, external_source, external_order_id)
  where external_source is not null and external_order_id is not null;
create unique index if not exists uq_orders_org_idempotency
  on public.orders(organization_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_items_org_product on public.order_items(organization_id, product_id);

create index if not exists idx_inventory_org_available on public.inventory(organization_id, available);

create index if not exists idx_inventory_movements_inventory_time on public.inventory_movements(inventory_id, occurred_at desc);
create index if not exists idx_inventory_movements_org_time on public.inventory_movements(organization_id, occurred_at desc);
create index if not exists idx_inventory_movements_ref on public.inventory_movements(reference_type, reference_id);
create unique index if not exists uq_inventory_movements_org_source_event
  on public.inventory_movements(organization_id, external_source, external_event_id)
  where external_source is not null and external_event_id is not null;
create unique index if not exists uq_inventory_movements_org_idempotency
  on public.inventory_movements(organization_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_suppliers_org_name on public.suppliers(organization_id, name);
create index if not exists idx_purchase_orders_org_status on public.purchase_orders(organization_id, status);
create index if not exists idx_purchase_orders_org_expected on public.purchase_orders(organization_id, expected_at);
create index if not exists idx_purchase_order_items_po on public.purchase_order_items(purchase_order_id);

create index if not exists idx_shipments_org_status on public.shipments(organization_id, status);
create index if not exists idx_shipments_order on public.shipments(order_id);
create index if not exists idx_shipments_eta on public.shipments(organization_id, estimated_delivery_at);
create unique index if not exists uq_shipments_org_carrier_tracking
  on public.shipments(organization_id, carrier, tracking_number)
  where carrier is not null and tracking_number is not null;

create index if not exists idx_shipment_events_shipment_time on public.shipment_events(shipment_id, occurred_at desc);
create index if not exists idx_shipment_events_org_time on public.shipment_events(organization_id, occurred_at desc);
create unique index if not exists uq_shipment_events_org_provider_event
  on public.shipment_events(organization_id, provider, provider_event_id)
  where provider is not null and provider_event_id is not null;
create unique index if not exists uq_shipment_events_org_idempotency
  on public.shipment_events(organization_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_automation_workflows_org_enabled on public.automation_workflows(organization_id, is_enabled);
create index if not exists idx_automation_executions_org_workflow_time on public.automation_executions(organization_id, workflow_key, created_at desc);
create index if not exists idx_automation_executions_org_status on public.automation_executions(organization_id, status);
create unique index if not exists uq_automation_executions_org_source_event
  on public.automation_executions(organization_id, trigger_source, trigger_event_id)
  where trigger_source is not null and trigger_event_id is not null;
create unique index if not exists uq_automation_executions_org_idempotency
  on public.automation_executions(organization_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_notifications_org_recipient_time on public.notifications(organization_id, recipient_user_id, created_at desc);
create index if not exists idx_notifications_org_status on public.notifications(organization_id, status);
create unique index if not exists uq_notifications_org_dedupe
  on public.notifications(organization_id, dedupe_key)
  where dedupe_key is not null;

create index if not exists idx_audit_logs_org_time on public.audit_logs(organization_id, occurred_at desc);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_user_id, occurred_at desc);
create index if not exists idx_audit_logs_request on public.audit_logs(request_id);

-- =========================
-- Triggers
-- =========================
-- updated_at
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();
drop trigger if exists set_organization_members_updated_at on public.organization_members;
create trigger set_organization_members_updated_at before update on public.organization_members for each row execute function public.set_updated_at();
drop trigger if exists set_webhook_events_updated_at on public.webhook_events;
create trigger set_webhook_events_updated_at before update on public.webhook_events for each row execute function public.set_updated_at();
drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
drop trigger if exists set_order_items_updated_at on public.order_items;
create trigger set_order_items_updated_at before update on public.order_items for each row execute function public.set_updated_at();
drop trigger if exists set_inventory_updated_at on public.inventory;
create trigger set_inventory_updated_at before update on public.inventory for each row execute function public.set_updated_at();
drop trigger if exists set_suppliers_updated_at on public.suppliers;
create trigger set_suppliers_updated_at before update on public.suppliers for each row execute function public.set_updated_at();
drop trigger if exists set_purchase_orders_updated_at on public.purchase_orders;
create trigger set_purchase_orders_updated_at before update on public.purchase_orders for each row execute function public.set_updated_at();
drop trigger if exists set_purchase_order_items_updated_at on public.purchase_order_items;
create trigger set_purchase_order_items_updated_at before update on public.purchase_order_items for each row execute function public.set_updated_at();
drop trigger if exists set_shipments_updated_at on public.shipments;
create trigger set_shipments_updated_at before update on public.shipments for each row execute function public.set_updated_at();
drop trigger if exists set_automation_workflows_updated_at on public.automation_workflows;
create trigger set_automation_workflows_updated_at before update on public.automation_workflows for each row execute function public.set_updated_at();
drop trigger if exists set_automation_executions_updated_at on public.automation_executions;
create trigger set_automation_executions_updated_at before update on public.automation_executions for each row execute function public.set_updated_at();
drop trigger if exists set_notifications_updated_at on public.notifications;
create trigger set_notifications_updated_at before update on public.notifications for each row execute function public.set_updated_at();

-- immutability / append-only
drop trigger if exists audit_logs_immutable on public.audit_logs;
create trigger audit_logs_immutable before update or delete on public.audit_logs
for each row execute function public.prevent_audit_mutation();

drop trigger if exists inventory_movements_append_only on public.inventory_movements;
create trigger inventory_movements_append_only before update or delete on public.inventory_movements
for each row execute function public.enforce_append_only();

drop trigger if exists shipment_events_append_only on public.shipment_events;
create trigger shipment_events_append_only before update or delete on public.shipment_events
for each row execute function public.enforce_append_only();

-- =========================
-- RLS
-- =========================
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.webhook_events enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_events enable row level security;
alter table public.automation_workflows enable row level security;
alter table public.automation_executions enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- profiles: self, and co-members in shared active orgs (restricted visibility)
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select using (
  id = auth.uid()
  or exists (
    select 1
    from public.organization_members m_self
    join public.organization_members m_other
      on m_other.organization_id = m_self.organization_id
    where m_self.user_id = auth.uid()
      and m_self.status = 'active' and m_self.deleted_at is null
      and m_other.user_id = profiles.id
      and m_other.status = 'active' and m_other.deleted_at is null
  )
);
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
for insert with check (id = auth.uid());

-- organizations: members can read; creation via RPC preferred (service/definer)
drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
for select using (public.is_org_member(id) and deleted_at is null);
drop policy if exists organizations_update_admin on public.organizations;
create policy organizations_update_admin on public.organizations
for update using (public.has_org_role(id, array['owner','admin']::public.member_role[]))
with check (public.has_org_role(id, array['owner','admin']::public.member_role[]));

-- organization_members
drop policy if exists organization_members_select on public.organization_members;
create policy organization_members_select on public.organization_members
for select using (public.is_org_member(organization_id) and deleted_at is null);
drop policy if exists organization_members_insert_admin on public.organization_members;
create policy organization_members_insert_admin on public.organization_members
for insert with check (public.has_org_role(organization_id, array['owner','admin']::public.member_role[]));
drop policy if exists organization_members_update_admin on public.organization_members;
create policy organization_members_update_admin on public.organization_members
for update using (public.has_org_role(organization_id, array['owner','admin']::public.member_role[]))
with check (public.has_org_role(organization_id, array['owner','admin']::public.member_role[]));

-- Generic org-member read/write helpers for tenant tables
-- webhook_events: read by ops/admin; writes via service/RPC (no client insert/update policies)
drop policy if exists webhook_events_select on public.webhook_events;
create policy webhook_events_select on public.webhook_events
for select using (
  organization_id is not null
  and public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[])
);

-- customers, products, suppliers, orders, order_items, shipments, automation_workflows
drop policy if exists customers_select on public.customers;
create policy customers_select on public.customers for select using (public.is_org_member(organization_id) and deleted_at is null);
drop policy if exists customers_insert on public.customers;
create policy customers_insert on public.customers for insert with check (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]));
drop policy if exists customers_update on public.customers;
create policy customers_update on public.customers for update
  using (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]));

drop policy if exists products_select on public.products;
create policy products_select on public.products for select using (public.is_org_member(organization_id) and deleted_at is null);
drop policy if exists products_insert on public.products;
create policy products_insert on public.products for insert with check (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]));
drop policy if exists products_update on public.products;
create policy products_update on public.products for update
  using (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]));

drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select using (public.is_org_member(organization_id) and deleted_at is null);
drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders for insert with check (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]));
drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update
  using (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]));

drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items for select using (public.is_org_member(organization_id));
drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert on public.order_items for insert with check (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]));
drop policy if exists order_items_update on public.order_items;
create policy order_items_update on public.order_items for update
  using (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]));

drop policy if exists suppliers_select on public.suppliers;
create policy suppliers_select on public.suppliers for select using (public.is_org_member(organization_id) and deleted_at is null);
drop policy if exists suppliers_insert on public.suppliers;
create policy suppliers_insert on public.suppliers for insert with check (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]));
drop policy if exists suppliers_update on public.suppliers;
create policy suppliers_update on public.suppliers for update
  using (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]));

drop policy if exists shipments_select on public.shipments;
create policy shipments_select on public.shipments for select using (public.is_org_member(organization_id) and deleted_at is null);
drop policy if exists shipments_insert on public.shipments;
create policy shipments_insert on public.shipments for insert with check (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]));
drop policy if exists shipments_update on public.shipments;
create policy shipments_update on public.shipments for update
  using (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]));

drop policy if exists automation_workflows_select on public.automation_workflows;
create policy automation_workflows_select on public.automation_workflows for select using (public.is_org_member(organization_id) and deleted_at is null);
drop policy if exists automation_workflows_manage on public.automation_workflows;
create policy automation_workflows_manage on public.automation_workflows for all
  using (public.has_org_role(organization_id, array['owner','admin']::public.member_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin']::public.member_role[]));

-- inventory: read members; quantity changes via RPC/service (no direct client update policy on quantities)
drop policy if exists inventory_select on public.inventory;
create policy inventory_select on public.inventory for select using (public.is_org_member(organization_id) and deleted_at is null);
drop policy if exists inventory_insert_admin on public.inventory;
create policy inventory_insert_admin on public.inventory for insert with check (public.has_org_role(organization_id, array['owner','admin']::public.member_role[]));
-- inventory_movements/shipment_events: read by members; inserts/updates by service/RPC only
drop policy if exists inventory_movements_select on public.inventory_movements;
create policy inventory_movements_select on public.inventory_movements for select using (public.is_org_member(organization_id));
drop policy if exists shipment_events_select on public.shipment_events;
create policy shipment_events_select on public.shipment_events for select using (public.is_org_member(organization_id));

-- purchase orders/items: members operate; approvals restricted in RPCs (and can be tightened further)
drop policy if exists purchase_orders_select on public.purchase_orders;
create policy purchase_orders_select on public.purchase_orders for select using (public.is_org_member(organization_id) and deleted_at is null);
drop policy if exists purchase_orders_insert on public.purchase_orders;
create policy purchase_orders_insert on public.purchase_orders for insert with check (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]));
drop policy if exists purchase_orders_update on public.purchase_orders;
create policy purchase_orders_update on public.purchase_orders for update
  using (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]));
drop policy if exists purchase_order_items_select on public.purchase_order_items;
create policy purchase_order_items_select on public.purchase_order_items for select using (public.is_org_member(organization_id));
drop policy if exists purchase_order_items_write on public.purchase_order_items;
create policy purchase_order_items_write on public.purchase_order_items for all
  using (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]));

-- automation_executions
drop policy if exists automation_executions_select on public.automation_executions;
create policy automation_executions_select on public.automation_executions for select using (public.is_org_member(organization_id));
drop policy if exists automation_executions_insert on public.automation_executions;
create policy automation_executions_insert on public.automation_executions for insert
  with check (public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]));

-- notifications: org members read own/org-relevant (simplified); updates limited
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select using (
  public.is_org_member(organization_id) and deleted_at is null
  and (recipient_user_id is null or recipient_user_id = auth.uid() or public.has_org_role(organization_id, array['owner','admin','operator']::public.member_role[]))
);
drop policy if exists notifications_update_recipient on public.notifications;
create policy notifications_update_recipient on public.notifications for update
  using (recipient_user_id = auth.uid() or public.can_approve(organization_id))
  with check (recipient_user_id = auth.uid() or public.can_approve(organization_id));

-- audit_logs: owner/admin read; inserts via service/triggers only
drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin on public.audit_logs for select
  using (organization_id is not null and public.has_org_role(organization_id, array['owner','admin']::public.member_role[]));

-- =========================
-- Core RPCs (proposed scaffolds)
-- =========================

-- Create org and assign creator as owner (Decision 1)
create or replace function public.create_organization_with_owner(p_name text, p_slug text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.organizations;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  insert into public.organizations (name, slug, status, created_by)
  values (p_name, p_slug, 'active', auth.uid())
  returning * into v_org;

  insert into public.organization_members (organization_id, user_id, role, status, joined_at)
  values (v_org.id, auth.uid(), 'owner', 'active', now())
  on conflict (organization_id, user_id) do nothing;

  return v_org;
end;
$$;

-- Record webhook event with idempotency (Decision 3)
create or replace function public.record_webhook_event(
  p_organization_id uuid,
  p_provider text,
  p_event_type text,
  p_external_event_id text,
  p_idempotency_key text,
  p_signature_verified boolean,
  p_signature_valid boolean,
  p_verification_method text,
  p_request_id text,
  p_payload_hash text,
  p_headers_minimized jsonb default '{}'::jsonb,
  p_payload_minimized jsonb default '{}'::jsonb
)
returns table(event_id uuid, duplicate boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.webhook_events (
    organization_id, provider, event_type, external_event_id, idempotency_key,
    signature_verified, signature_valid, verification_method, request_id, payload_hash,
    headers_minimized, payload_minimized, processing_status, verified_at
  ) values (
    p_organization_id, p_provider, p_event_type, p_external_event_id, p_idempotency_key,
    coalesce(p_signature_verified,false), p_signature_valid, p_verification_method, p_request_id, p_payload_hash,
    coalesce(p_headers_minimized,'{}'::jsonb), coalesce(p_payload_minimized,'{}'::jsonb),
    case when coalesce(p_signature_verified,false) then 'verified'::public.webhook_processing_status else 'received'::public.webhook_processing_status end,
    case when coalesce(p_signature_verified,false) then now() else null end
  )
  on conflict do nothing
  returning id into v_id;

  if v_id is not null then
    return query select v_id, false;
  else
    return query
      select w.id, true
      from public.webhook_events w
      where (p_external_event_id is not null and w.organization_id = p_organization_id and w.provider = p_provider and w.external_event_id = p_external_event_id)
         or (p_idempotency_key is not null and w.organization_id = p_organization_id and w.provider = p_provider and w.idempotency_key = p_idempotency_key)
      order by w.created_at desc
      limit 1;
  end if;
end;
$$;

-- Transactional inventory movement with idempotency (core invariant enforcement)
create or replace function public.apply_inventory_movement(
  p_organization_id uuid,
  p_product_id uuid,
  p_location_code text,
  p_movement_type public.inventory_movement_type,
  p_quantity_delta integer,
  p_reserved_delta integer default 0,
  p_damaged_delta integer default 0,
  p_reference_type public.inventory_reference_type default null,
  p_reference_id uuid default null,
  p_idempotency_key text default null,
  p_external_source text default null,
  p_external_event_id text default null,
  p_reason text default null,
  p_actor_type public.actor_type default 'system',
  p_actor_user_id uuid default null,
  p_webhook_event_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.inventory_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.inventory;
  v_existing public.inventory_movements;
  v_new_on_hand integer;
  v_new_reserved integer;
  v_new_damaged integer;
  v_mov public.inventory_movements;
begin
  if p_idempotency_key is not null then
    select * into v_existing
    from public.inventory_movements m
    where m.organization_id = p_organization_id and m.idempotency_key = p_idempotency_key
    limit 1;
    if found then
      return v_existing;
    end if;
  end if;
  if p_external_source is not null and p_external_event_id is not null then
    select * into v_existing
    from public.inventory_movements m
    where m.organization_id = p_organization_id and m.external_source = p_external_source and m.external_event_id = p_external_event_id
    limit 1;
    if found then
      return v_existing;
    end if;
  end if;

  select * into v_inv
  from public.inventory
  where organization_id = p_organization_id
    and product_id = p_product_id
    and location_code = coalesce(p_location_code, 'default')
  for update;

  if not found then
    insert into public.inventory (organization_id, product_id, location_code)
    values (p_organization_id, p_product_id, coalesce(p_location_code, 'default'))
    returning * into v_inv;
  end if;

  v_new_on_hand := v_inv.on_hand + coalesce(p_quantity_delta,0);
  v_new_reserved := v_inv.reserved + coalesce(p_reserved_delta,0);
  v_new_damaged := v_inv.damaged + coalesce(p_damaged_delta,0);

  if v_new_on_hand < 0 or v_new_reserved < 0 or v_new_damaged < 0 or (v_new_reserved + v_new_damaged) > v_new_on_hand then
    raise exception 'inventory_invariant_violation';
  end if;

  insert into public.inventory_movements (
    organization_id, inventory_id, product_id, movement_type,
    quantity_delta, reserved_delta, damaged_delta,
    on_hand_before, on_hand_after, reserved_before, reserved_after, damaged_before, damaged_after,
    reference_type, reference_id, webhook_event_id, external_source, external_event_id, idempotency_key,
    reason, actor_type, actor_user_id, metadata
  ) values (
    p_organization_id, v_inv.id, p_product_id, p_movement_type,
    coalesce(p_quantity_delta,0), coalesce(p_reserved_delta,0), coalesce(p_damaged_delta,0),
    v_inv.on_hand, v_new_on_hand, v_inv.reserved, v_new_reserved, v_inv.damaged, v_new_damaged,
    p_reference_type, p_reference_id, p_webhook_event_id, p_external_source, p_external_event_id, p_idempotency_key,
    p_reason, coalesce(p_actor_type,'system'), p_actor_user_id, coalesce(p_metadata,'{}'::jsonb)
  ) returning * into v_mov;

  update public.inventory
  set on_hand = v_new_on_hand,
      reserved = v_new_reserved,
      damaged = v_new_damaged,
      last_movement_at = now()
  where id = v_inv.id;

  return v_mov;
end;
$$;

-- NOTE: additional RPCs to implement in follow-up migration/review as needed:
-- approve_purchase_order, reject_purchase_order, request_purchase_order_approval,
-- queue_supplier_notification_draft, approve_and_dispatch_notification,
-- approve_automation_execution, ingest_shopify_order, receive_purchase_order (with discrepancy flagging),
-- mark_webhook_processing, write_audit_log helper and audit triggers per table.
-- All consequential/external actions must enforce human approval and run server-side.

commit;