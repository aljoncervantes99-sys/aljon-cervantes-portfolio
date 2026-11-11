-- SmartLogix AI Stage 2.2 - Shipment location minimization, access, retention, and redaction (REVIEW ONLY)
-- Status: generated for review; DO NOT EXECUTE/APPLY without explicit approval.
-- Depends on: 20261110235025_smartlogix_stage2.sql, 20261111000500_smartlogix_stage2_auth_profile_lifecycle.sql
-- Addresses: minimized collection of shipment location data, org-based RLS access,
-- configurable retention/deletion (redaction) policies, and preservation of audit history.

begin;

-- 1) Minimize collection and storage
-- location_text must remain coarse (city/region/facility/country-level as provided by carrier), never precise coordinates.
-- Enforce coarse-only storage defensively (reject obvious lat/long patterns).
alter table public.shipment_events
  drop constraint if exists shipment_events_location_coarse_check;
alter table public.shipment_events
  add constraint shipment_events_location_coarse_check
  check (
    location_text is null
    or length(location_text) <= 120
    and location_text !~ '(-?\d{1,2}\.\d+\s*,\s*-?\d{1,3}\.\d+)'
    and location_text !~* '\b(lat|latitude|lng|lon|longitude|gps|coordinates?)\b'
  );

alter table public.shipment_events
  add column if not exists location_redacted_at timestamptz,
  add column if not exists payload_redacted_at timestamptz;

comment on column public.shipment_events.location_text is 'Coarse/minimized location only (e.g. city/region/hub). No precise coordinates. Subject to retention redaction.';
comment on column public.shipment_events.raw_payload is 'Minimized/redacted carrier payload. Sensitive location/PII keys must be removed before insert and on retention purge.';

-- 2) Configurable retention policy (per organization)
create table if not exists public.data_retention_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  policy_key text not null,
  retention_days integer not null check (retention_days >= 0),
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint data_retention_policies_org_key_unique unique (organization_id, policy_key)
);

drop trigger if exists set_data_retention_policies_updated_at on public.data_retention_policies;
create trigger set_data_retention_policies_updated_at before update on public.data_retention_policies
for each row execute function public.set_updated_at();

alter table public.data_retention_policies enable row level security;

drop policy if exists data_retention_policies_select on public.data_retention_policies;
create policy data_retention_policies_select on public.data_retention_policies
for select using (public.is_org_member(organization_id));
drop policy if exists data_retention_policies_manage on public.data_retention_policies;
create policy data_retention_policies_manage on public.data_retention_policies
for all using (public.has_org_role(organization_id, array['owner','admin']::public.member_role[]))
with check (public.has_org_role(organization_id, array['owner','admin']::public.member_role[]));

-- Default policy helper (no insert side effects here; application/RPC may seed defaults)
-- Suggested default: shipment_location retention 30 days, shipment_payload_sensitive retention 30 days.

-- 3) Redaction (retention "deletion") that preserves necessary audit history
-- Preserves: event id, org/shipment refs, provider ids, status/code, occurred_at/created_at, sanitized message, correlation.
-- Removes/redacts: location_text and sensitive payload fragments after retention window.
create or replace function public.redact_shipment_event_sensitive_data(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.shipment_events e
  set location_text = null,
      location_redacted_at = coalesce(e.location_redacted_at, now()),
      raw_payload = jsonb_build_object(
        'redacted', true,
        'redacted_at', now(),
        'reason', 'retention_policy',
        'preserved', jsonb_build_object(
          'event_status', e.event_status,
          'event_code', e.event_code,
          'provider', e.provider,
          'provider_event_id_present', (e.provider_event_id is not null)
        )
      ),
      payload_redacted_at = coalesce(e.payload_redacted_at, now())
  where e.id = p_event_id
    and (e.location_text is not null or e.location_redacted_at is null or e.payload_redacted_at is null);
end;
$$;

create or replace function public.apply_shipment_location_retention(p_organization_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  r record;
begin
  for r in
    select e.id
    from public.shipment_events e
    join public.organizations o on o.id = e.organization_id
    left join public.data_retention_policies p
      on p.organization_id = e.organization_id
     and p.policy_key = 'shipment_location'
     and p.enabled = true
    where (p_organization_id is null or e.organization_id = p_organization_id)
      and e.occurred_at < now() - make_interval(days => coalesce(p.retention_days, 30))
      and (e.location_text is not null or e.location_redacted_at is null or e.payload_redacted_at is null)
  loop
    perform public.redact_shipment_event_sensitive_data(r.id);
    v_count := v_count + 1;
  end loop;

  -- Audit summary (sanitized) - insert only where org context known; service execution expected.
  if v_count > 0 and p_organization_id is not null then
    insert into public.audit_logs (organization_id, actor_type, actor_label, action, entity_type, entity_id, metadata)
    values (p_organization_id, 'system', 'retention_job', 'update', 'shipment_events', null,
      jsonb_build_object('retention_policy', 'shipment_location', 'redacted_count', v_count));
  end if;

  return v_count;
end;
$$;

-- 4) Tighten shipment event access (org-based RLS) and encourage minimized reads
drop policy if exists shipment_events_select on public.shipment_events;
create policy shipment_events_select on public.shipment_events
for select using (
  public.is_org_member(organization_id)
  and exists (
    select 1 from public.shipments s
    where s.id = shipment_events.shipment_id
      and s.organization_id = shipment_events.organization_id
  )
);

-- Inserts/updates remain service/RPC only (no client policies) and table is append-only by trigger.
-- Operational consumers should prefer a sanitized view excluding/redacting location when not needed.
create or replace view public.shipment_events_sanitized as
select
  id,
  organization_id,
  shipment_id,
  webhook_event_id,
  provider,
  provider_event_id,
  event_status,
  event_code,
  message,
  case
    when retention_until is not null and retention_until < now() then null
    when location_redacted_at is not null then null
    else location_text
  end as location_text,
  occurred_at,
  created_at
from public.shipment_events;

alter view public.shipment_events_sanitized set (security_invoker = true);
revoke all on public.shipment_events_sanitized from anon;
grant select on public.shipment_events_sanitized to authenticated;

-- 5) Scheduling note (apply-time operational step, not executed now)
-- Configure a trusted scheduled job (Supabase pg_cron or external server cron using service role)
-- to run: select public.apply_shipment_location_retention(); at a regular interval.
-- Example (if pg_cron available and approved): SELECT cron.schedule('smartlogix-shipment-location-retention', '0 3 * * *', $$select public.apply_shipment_location_retention();$$);

commit;