-- SmartLogix AI Stage 2.3 - FK integrity, archival/deletion safety, orphan prevention (REVIEW ONLY)
-- Status: generated for review; DO NOT EXECUTE/APPLY without explicit approval.
-- Depends on: 20261110235025_smartlogix_stage2.sql
--             20261111000500_smartlogix_stage2_auth_profile_lifecycle.sql
--             20261111000600_smartlogix_stage2_shipment_location_retention.sql
-- Addresses: concrete FK integrity for notifications/audit_logs, safe archival/deletion behavior,
-- orphan prevention for polymorphic references, and preservation of audit history.

begin;

-- =========================
-- 1) notifications: strengthen concrete FKs and integrity
-- =========================
-- Existing concrete FKs: organization_id -> organizations, recipient_user_id -> profiles,
-- approved_by -> profiles. Polymorphic entity_type/entity_id cannot have a single SQL FK.
-- Ensure organization linkage is not nullable and prevent hard-delete cascades that would lose records.
alter table public.notifications
  alter column organization_id set not null;

alter table public.notifications
  drop constraint if exists notifications_organization_id_fkey;
alter table public.notifications
  add constraint notifications_organization_id_fkey
  foreign key (organization_id) references public.organizations(id) on delete restrict;

-- Recipient/approver are profile references; SET NULL preserves notification history if a profile is removed.
alter table public.notifications
  drop constraint if exists notifications_recipient_user_id_fkey;
alter table public.notifications
  add constraint notifications_recipient_user_id_fkey
  foreign key (recipient_user_id) references public.profiles(id) on delete set null;

alter table public.notifications
  drop constraint if exists notifications_approved_by_fkey;
alter table public.notifications
  add constraint notifications_approved_by_fkey
  foreign key (approved_by) references public.profiles(id) on delete set null;

-- Basic polymorphic integrity guard (best-effort, application must also validate)
alter table public.notifications
  drop constraint if exists notifications_entity_ref_check;
alter table public.notifications
  add constraint notifications_entity_ref_check
  check (
    (entity_type is null and entity_id is null)
    or (entity_type is not null and entity_id is not null)
  );

-- Known entity types (extend in future versioned migrations as entities/actions evolve)
alter table public.notifications
  drop constraint if exists notifications_entity_type_check;
alter table public.notifications
  add constraint notifications_entity_type_check
  check (
    entity_type is null or entity_type in (
      'order','order_item','customer','product','inventory','inventory_movement',
      'supplier','purchase_order','purchase_order_item','shipment','shipment_event',
      'automation_workflow','automation_execution','webhook_event','organization','profile','system'
    )
  );

-- Prevent hard deletes of notifications except controlled service/admin maintenance paths;
-- prefer soft delete (deleted_at). RLS has no delete policy; add defensive trigger.
create or replace function public.prevent_notification_hard_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'notifications_hard_delete_disabled_use_soft_delete';
end;
$$;
drop trigger if exists notifications_prevent_hard_delete on public.notifications;
create trigger notifications_prevent_hard_delete
before delete on public.notifications
for each row execute function public.prevent_notification_hard_delete();

-- =========================
-- 2) audit_logs: preserve history and strengthen concrete integrity
-- =========================
-- audit_logs must be append-only and preserved. organization_id/actor_user_id are concrete FKs:
-- keep actor nullable with SET NULL to retain log if profile removed; keep org nullable for
-- system/pre-org events but prevent org hard-delete from cascading loss of audit history.
alter table public.audit_logs
  drop constraint if exists audit_logs_actor_user_id_fkey;
alter table public.audit_logs
  add constraint audit_logs_actor_user_id_fkey
  foreign key (actor_user_id) references public.profiles(id) on delete set null;

alter table public.audit_logs
  drop constraint if exists audit_logs_organization_id_fkey;
alter table public.audit_logs
  add constraint audit_logs_organization_id_fkey
  foreign key (organization_id) references public.organizations(id) on delete restrict;

-- Polymorphic entity reference guard (best-effort)
alter table public.audit_logs
  drop constraint if exists audit_logs_entity_ref_check;
alter table public.audit_logs
  add constraint audit_logs_entity_ref_check
  check (entity_type is not null);

-- Entity type vocabulary guard (extend via future migrations)
alter table public.audit_logs
  drop constraint if exists audit_logs_entity_type_check;
alter table public.audit_logs
  add constraint audit_logs_entity_type_check
  check (
    entity_type in (
      'auth_user','profile','organization','organization_member','webhook_event',
      'customer','product','order','order_item','inventory','inventory_movement',
      'supplier','purchase_order','purchase_order_item','shipment','shipment_event',
      'automation_workflow','automation_execution','notification','audit_log',
      'data_retention_policy','integration','ai_artifact','system'
    )
  );

-- audit_logs already has immutability trigger in base migration; keep append-only/no delete.

-- =========================
-- 3) Optional best-effort orphan guard for polymorphic refs (known entity tables)
-- =========================
-- Validates existence for selected entity types within same organization when provided.
-- Does NOT replace application/service validation; intentionally limited to core tables.
create or replace function public.validate_polymorphic_entity_ref()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_type text;
  v_id uuid;
  v_exists boolean := true;
begin
  v_type := new.entity_type;
  v_id := new.entity_id;
  if tg_table_name = 'notifications' then
    v_org := new.organization_id;
  elsif tg_table_name = 'audit_logs' then
    v_org := new.organization_id;
  else
    return new;
  end if;

  if v_type is null or v_id is null then
    return new;
  end if;

  -- Only validate when org context is known
  if v_org is null then
    return new;
  end if;

  case v_type
    when 'order' then select exists(select 1 from public.orders where id = v_id and organization_id = v_org) into v_exists;
    when 'order_item' then select exists(select 1 from public.order_items where id = v_id and organization_id = v_org) into v_exists;
    when 'customer' then select exists(select 1 from public.customers where id = v_id and organization_id = v_org) into v_exists;
    when 'product' then select exists(select 1 from public.products where id = v_id and organization_id = v_org) into v_exists;
    when 'inventory' then select exists(select 1 from public.inventory where id = v_id and organization_id = v_org) into v_exists;
    when 'inventory_movement' then select exists(select 1 from public.inventory_movements where id = v_id and organization_id = v_org) into v_exists;
    when 'supplier' then select exists(select 1 from public.suppliers where id = v_id and organization_id = v_org) into v_exists;
    when 'purchase_order' then select exists(select 1 from public.purchase_orders where id = v_id and organization_id = v_org) into v_exists;
    when 'purchase_order_item' then select exists(select 1 from public.purchase_order_items where id = v_id and organization_id = v_org) into v_exists;
    when 'shipment' then select exists(select 1 from public.shipments where id = v_id and organization_id = v_org) into v_exists;
    when 'shipment_event' then select exists(select 1 from public.shipment_events where id = v_id and organization_id = v_org) into v_exists;
    when 'automation_workflow' then select exists(select 1 from public.automation_workflows where id = v_id and organization_id = v_org) into v_exists;
    when 'automation_execution' then select exists(select 1 from public.automation_executions where id = v_id and organization_id = v_org) into v_exists;
    when 'webhook_event' then select exists(select 1 from public.webhook_events where id = v_id and organization_id = v_org) into v_exists;
    when 'organization' then select exists(select 1 from public.organizations where id = v_id) into v_exists;
    when 'organization_member' then select exists(select 1 from public.organization_members where id = v_id and organization_id = v_org) into v_exists;
    when 'notification' then select exists(select 1 from public.notifications where id = v_id and organization_id = v_org) into v_exists;
    when 'profile' then select exists(select 1 from public.profiles where id = v_id) into v_exists;
    when 'data_retention_policy' then select exists(select 1 from public.data_retention_policies where id = v_id and organization_id = v_org) into v_exists;
    else
      v_exists := true; -- unknown/future types validated at application layer
  end case;

  if not v_exists then
    raise exception 'polymorphic_entity_reference_not_found: % %', v_type, v_id;
  end if;

  return new;
end;
$$;

drop trigger if exists notifications_validate_entity_ref on public.notifications;
create trigger notifications_validate_entity_ref
before insert or update of entity_type, entity_id, organization_id on public.notifications
for each row execute function public.validate_polymorphic_entity_ref();

drop trigger if exists audit_logs_validate_entity_ref on public.audit_logs;
create trigger audit_logs_validate_entity_ref
before insert on public.audit_logs
for each row execute function public.validate_polymorphic_entity_ref();

-- =========================
-- 4) Archival/deletion behavior guidance (enforced patterns)
-- =========================
-- Important operational records use soft delete/archive fields and RLS filters.
-- Hard deletes are restricted (no client delete policies; RESTRICT FKs protect history).
-- audit_logs and ledgers/events remain append-only/immutable.
-- Organizations: prefer archived/deleted_at status transitions; RESTRICT FKs from audit_logs/notifications
-- prevent destructive hard delete while history exists.

commit;
