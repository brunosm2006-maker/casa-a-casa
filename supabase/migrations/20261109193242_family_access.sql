
-- Family writes are restricted to authenticated RPCs. Private functions are not Data API endpoints.
create schema if not exists casa_private;
revoke all on schema casa_private from public;
grant usage on schema casa_private to authenticated;

create table public.casa_families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 80),
  created_by uuid not null references auth.users(id)
);
create table public.casa_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.casa_families(id),
  user_id uuid references auth.users(id),
  name text not null check (length(btrim(name)) between 1 and 80),
  role text not null check (role in ('parent','child')),
  profile text not null check (profile in ('madre','padre','hijo','hija')),
  unique (family_id, user_id),
  unique (id, family_id),
  check ((role = 'parent' and profile in ('madre','padre')) or (role = 'child' and profile in ('hijo','hija')))
);
create table public.casa_calendars (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.casa_families(id),
  child_id uuid not null unique,
  payload jsonb not null default '{"schedule":{},"routine":null}',
  revision integer not null default 0 check (revision >= 0),
  foreign key (child_id, family_id) references public.casa_members(id, family_id)
);
create table public.casa_proposals (
  id uuid primary key,
  calendar_id uuid not null references public.casa_calendars(id),
  author_id uuid not null references public.casa_members(id),
  first_day date not null check (first_day >= '1900-01-01' and first_day <= '2100-12-31'),
  last_day date not null check (last_day >= first_day and last_day <= first_day + 365 and last_day <= '2100-12-31'),
  destination text check (destination in ('madre','padre','rutina')),
  explanation text not null default '' check (length(explanation) <= 1000),
  base_revision integer not null,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  resolved_by uuid references public.casa_members(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status='pending' and resolved_by is null and resolved_at is null) or
    (status<>'pending' and resolved_by is not null and resolved_at is not null))
);
create table casa_private.invitations (
  token_hash text primary key,
  member_id uuid not null references public.casa_members(id),
  created_by uuid not null references auth.users(id),
  expires_at timestamptz not null default now() + interval '48 hours',
  used_by uuid references auth.users(id),
  revoked boolean not null default false
);
create index casa_members_user on public.casa_members(user_id);
create index casa_calendars_family on public.casa_calendars(family_id);
create index casa_proposals_calendar on public.casa_proposals(calendar_id);
create index casa_proposals_author on public.casa_proposals(author_id);
create index casa_proposals_resolver on public.casa_proposals(resolved_by);
create index casa_invitation_member on casa_private.invitations(member_id);

create function casa_private.family_role(family uuid) returns text
language sql stable security definer set search_path = '' as $$
  select role from public.casa_members where family_id=family and user_id=auth.uid()
$$;
create function casa_private.can_read_calendar(calendar uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.casa_calendars c join public.casa_members m on m.family_id=c.family_id
    where c.id=calendar and m.user_id=auth.uid() and (m.role='parent' or m.id=c.child_id)
  )
$$;

alter table public.casa_families enable row level security;
alter table public.casa_members enable row level security;
alter table public.casa_calendars enable row level security;
alter table public.casa_proposals enable row level security;
alter table casa_private.invitations enable row level security;
create policy family_read on public.casa_families for select to authenticated
  using (casa_private.family_role(id) is not null);
create policy member_read on public.casa_members for select to authenticated
  using (user_id=auth.uid() or casa_private.family_role(family_id)='parent' or
    (role='parent' and casa_private.family_role(family_id)='child'));
create policy calendar_read on public.casa_calendars for select to authenticated
  using (casa_private.can_read_calendar(id));
create policy proposal_read on public.casa_proposals for select to authenticated
  using (casa_private.can_read_calendar(calendar_id));

create function casa_private.valid_date(value text) returns date language plpgsql immutable
set search_path = '' as $$
declare result date;
begin
  if value is null or value !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Fecha inválida'; end if;
  result := value::date;
  if result < date '1900-01-01' or result > date '2100-12-31' then raise exception 'Fecha fuera de rango'; end if;
  return result;
end $$;

create function casa_private.validate_payload(value jsonb) returns void language plpgsql
set search_path = '' as $$
declare rule jsonb; entry record; block jsonb; item jsonb; position integer:=0; total integer:=0; hint jsonb; visit jsonb; houses text[]:='{}'; start_day date;
begin
  if jsonb_typeof(value) is distinct from 'object' or
    jsonb_typeof(value->'schedule') is distinct from 'object' or not(value ? 'routine') or
    octet_length(value::text) > 1000000 then raise exception 'Calendario inválido'; end if;
  for entry in select * from jsonb_each(value->'schedule') loop
    perform casa_private.valid_date(entry.key);
    if entry.value not in ('"madre"','"padre"','null') then raise exception 'Destino inválido'; end if;
  end loop;
  rule:=value->'routine';
  if rule='null'::jsonb then return; end if;
  if jsonb_typeof(rule) is distinct from 'object' then raise exception 'Rutina inválida'; end if;
  start_day:=casa_private.valid_date(rule->>'start');
  if rule->>'kind'='months' then
    if extract(day from start_day)<>1 or coalesce(rule->>'firstHome','') not in ('madre','padre') then raise exception 'Mes inválido'; end if;
  elsif rule->>'kind'='cycle' then
    if coalesce(rule->>'template','') not in ('weeks','long','223','2255','3443','custom') or
      jsonb_typeof(rule->'blocks') is distinct from 'array' then raise exception 'Ciclo inválido'; end if;
    if jsonb_array_length(rule->'blocks') not between 2 and 12 then raise exception 'Ciclo inválido'; end if;
    for block in select * from jsonb_array_elements(rule->'blocks') loop
      if coalesce(block->>'home','') not in ('madre','padre') or coalesce(block->>'days','') !~ '^\d+$' then raise exception 'Bloque inválido'; end if;
      if (block->>'days')::integer not between 1 and 60 then raise exception 'Bloque inválido'; end if;
      total:=total+(block->>'days')::integer; houses:=array_append(houses,block->>'home');
    end loop;
    if total>90 or not('madre'=any(houses) and 'padre'=any(houses)) then raise exception 'Ciclo inválido'; end if;
  else
    if coalesce(rule->>'kind','weekly')<>'weekly' or jsonb_typeof(rule->'days') is distinct from 'array' then raise exception 'Semana inválida'; end if;
    if jsonb_array_length(rule->'days')<>7 then raise exception 'Semana inválida'; end if;
    for item in select * from jsonb_array_elements(rule->'days') loop
      if item not in ('"madre"','"padre"','null') and not(item='"alterno"' and position>=4) then raise exception 'Día inválido'; end if;
      position:=position+1;
    end loop;
    if not(rule ?& array['referenceFriday','referenceHome','otherWeekendHome']) then raise exception 'Referencia inválida'; end if;
    if rule->'referenceFriday'<>'null' then
      if extract(isodow from casa_private.valid_date(rule->>'referenceFriday'))<>5 then raise exception 'Viernes inválido'; end if;
    end if;
    if rule->'referenceHome' not in ('"madre"','"padre"','null') or
       rule->'otherWeekendHome' not in ('"madre"','"padre"','null') then raise exception 'Referencia inválida'; end if;
    if rule->'days' @> '["alterno"]' and (rule->'referenceFriday'='null' or rule->'referenceHome'='null') then raise exception 'Falta referencia'; end if;
    if rule ? 'primary' then
      hint:=rule->'primary';
      if jsonb_typeof(hint) is distinct from 'object' or
        not(hint ?& array['home','guest','visitDays','alternate']) or
        hint->'home' not in ('"madre"','"padre"','null') or
        coalesce(hint->>'guest','') not in ('madre','padre') or hint->>'home'=hint->>'guest' or
        jsonb_typeof(hint->'alternate') is distinct from 'boolean' or
        jsonb_typeof(hint->'visitDays') is distinct from 'array' then raise exception 'Hogar habitual inválido'; end if;
      if jsonb_array_length(hint->'visitDays')=0 then raise exception 'Faltan días de visita'; end if;
      for visit in select * from jsonb_array_elements(hint->'visitDays') loop
        if visit::text !~ '^[0-6]$' then raise exception 'Día de visita inválido'; end if;
      end loop;
    end if;
  end if;
end $$;

create function casa_private.create_family(args jsonb) returns jsonb language plpgsql
security definer set search_path = '' as $$
declare family uuid;
begin
  if auth.uid() is null then raise exception 'Inicia sesión'; end if;
  if coalesce(args->>'profile','') not in ('madre','padre') then raise exception 'Elige un perfil parental'; end if;
  insert into public.casa_families(name,created_by) values(btrim(args->>'name'),auth.uid()) returning id into family;
  insert into public.casa_members(family_id,user_id,name,role,profile)
    values(family,auth.uid(),btrim(args->>'member_name'),'parent',args->>'profile');
  return jsonb_build_object('id',family);
end $$;

create function casa_private.add_member(args jsonb) returns jsonb language plpgsql
security definer set search_path = '' as $$
declare member public.casa_members; family uuid:=(args->>'family_id')::uuid; profile text:=args->>'profile';
begin
  if auth.uid() is null or casa_private.family_role(family) is distinct from 'parent' then raise exception 'Solo progenitores'; end if;
  insert into public.casa_members(family_id,name,role,profile) values(
    family,btrim(args->>'name'),case when profile in ('madre','padre') then 'parent' else 'child' end,profile
  ) returning * into member;
  if member.role='child' then insert into public.casa_calendars(family_id,child_id) values(family,member.id); end if;
  return to_jsonb(member);
end $$;

create function casa_private.create_invitation(args jsonb) returns jsonb language plpgsql
security definer set search_path = '' as $$
declare member public.casa_members; token text;
begin
  select * into member from public.casa_members where id=(args->>'member_id')::uuid for update;
  if auth.uid() is null or casa_private.family_role(member.family_id) is distinct from 'parent' then raise exception 'Solo progenitores'; end if;
  if member.user_id is not null then raise exception 'Este miembro ya tiene cuenta'; end if;
  update casa_private.invitations set revoked=true where member_id=member.id and used_by is null;
  token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  insert into casa_private.invitations(token_hash,member_id,created_by)
    values(encode(sha256(convert_to(token,'UTF8')),'hex'),member.id,auth.uid());
  return jsonb_build_object('token',token,'expires_at',now()+interval '48 hours','role',member.role);
end $$;

create function casa_private.redeem_invitation(args jsonb) returns jsonb language plpgsql
security definer set search_path = '' as $$
declare invitation casa_private.invitations; member public.casa_members; target uuid;
begin
  if auth.uid() is null then raise exception 'Inicia sesión'; end if;
  if coalesce(args->>'token','') !~ '^[a-f0-9]{64}$' then raise exception 'Invitación inválida o caducada'; end if;
  -- Lock the member first, matching creation lock order.
  select member_id into target from casa_private.invitations
    where token_hash=encode(sha256(convert_to(args->>'token','UTF8')),'hex');
  select * into member from public.casa_members where id=target for update;
  select * into invitation from casa_private.invitations
    where token_hash=encode(sha256(convert_to(args->>'token','UTF8')),'hex') for update;
  if invitation.member_id is null or invitation.revoked or invitation.expires_at<=now() then raise exception 'Invitación inválida o caducada'; end if;
  if invitation.used_by=auth.uid() and member.user_id=auth.uid() then return jsonb_build_object('family_id',member.family_id); end if;
  if invitation.used_by is not null or member.user_id is not null then raise exception 'Invitación ya utilizada'; end if;
  update public.casa_members set user_id=auth.uid() where id=member.id;
  update casa_private.invitations set used_by=auth.uid() where token_hash=invitation.token_hash;
  return jsonb_build_object('family_id',member.family_id);
end $$;

create function casa_private.save_calendar(args jsonb) returns jsonb language plpgsql
security definer set search_path = '' as $$
declare calendar public.casa_calendars;
begin
  select * into calendar from public.casa_calendars where id=(args->>'calendar_id')::uuid for update;
  if auth.uid() is null or casa_private.family_role(calendar.family_id) is distinct from 'parent' then raise exception 'Solo progenitores'; end if;
  if calendar.revision is distinct from (args->>'revision')::integer then raise exception 'El calendario cambió. Actualiza antes de guardar'; end if;
  perform casa_private.validate_payload(args->'payload');
  update public.casa_calendars set payload=args->'payload',revision=revision+1 where id=calendar.id returning * into calendar;
  return to_jsonb(calendar);
end $$;

create function casa_private.propose(args jsonb) returns jsonb language plpgsql
security definer set search_path = '' as $$
declare calendar public.casa_calendars; member public.casa_members; existing public.casa_proposals; proposal public.casa_proposals;
begin
  select * into calendar from public.casa_calendars where id=(args->>'calendar_id')::uuid for update;
  select * into member from public.casa_members where family_id=calendar.family_id and user_id=auth.uid();
  if auth.uid() is null or member.role is distinct from 'child' or member.id is distinct from calendar.child_id then raise exception 'Solo el hijo de este calendario puede proponer'; end if;
  select * into existing from public.casa_proposals where id=(args->>'id')::uuid;
  if existing.id is not null then
    if existing.author_id=member.id and existing.calendar_id=calendar.id and
      existing.first_day=casa_private.valid_date(args->>'first_day') and existing.last_day=casa_private.valid_date(args->>'last_day') and
      existing.destination is not distinct from args->>'destination' and existing.explanation=coalesce(args->>'explanation','') then return to_jsonb(existing); end if;
    raise exception 'Identificador de propuesta ya usado';
  end if;
  if calendar.revision is distinct from (args->>'revision')::integer then raise exception 'El calendario cambió. Actualiza antes de proponer'; end if;
  insert into public.casa_proposals(id,calendar_id,author_id,first_day,last_day,destination,explanation,base_revision)
    values((args->>'id')::uuid,calendar.id,member.id,casa_private.valid_date(args->>'first_day'),casa_private.valid_date(args->>'last_day'),args->>'destination',coalesce(args->>'explanation',''),calendar.revision)
    returning * into proposal;
  return to_jsonb(proposal);
end $$;

create function casa_private.resolve(args jsonb) returns jsonb language plpgsql
security definer set search_path = '' as $$
declare proposal public.casa_proposals; calendar public.casa_calendars; member uuid; change_day date; changes jsonb; decision text:=args->>'decision';
begin
  if decision is null or decision not in ('accepted','rejected') then raise exception 'Resolución inválida'; end if;
  select * into proposal from public.casa_proposals where id=(args->>'proposal_id')::uuid;
  select * into calendar from public.casa_calendars where id=proposal.calendar_id for update;
  select * into proposal from public.casa_proposals where id=(args->>'proposal_id')::uuid for update;
  if auth.uid() is null or casa_private.family_role(calendar.family_id) is distinct from 'parent' then raise exception 'Solo progenitores'; end if;
  select id into member from public.casa_members where family_id=calendar.family_id and user_id=auth.uid();
  if proposal.status<>'pending' then
    if proposal.status=decision then return to_jsonb(proposal); end if;
    raise exception 'La propuesta ya está resuelta';
  end if;
  if decision='accepted' then
    if proposal.base_revision<>calendar.revision then raise exception 'El calendario cambió. Rechaza esta propuesta y pide una nueva'; end if;
    changes:=calendar.payload->'schedule';
    for change_day in select generate_series(proposal.first_day,proposal.last_day,interval '1 day')::date loop
      if proposal.destination='rutina' then changes:=changes-to_char(change_day,'YYYY-MM-DD');
      else changes:=jsonb_set(changes,array[to_char(change_day,'YYYY-MM-DD')],coalesce(to_jsonb(proposal.destination),'null'::jsonb)); end if;
    end loop;
    update public.casa_calendars set payload=jsonb_set(payload,'{schedule}',changes),revision=revision+1 where id=calendar.id;
  end if;
  update public.casa_proposals set status=decision,resolved_by=member,resolved_at=now() where id=proposal.id returning * into proposal;
  return to_jsonb(proposal);
end $$;

-- The exposed entry point is an invoker with a fixed dispatch list.
create function public.casa_command(action text,args jsonb) returns jsonb language plpgsql
security invoker set search_path = '' as $$
begin
  case action
    when 'create_family' then return casa_private.create_family(args);
    when 'add_member' then return casa_private.add_member(args);
    when 'create_invitation' then return casa_private.create_invitation(args);
    when 'redeem_invitation' then return casa_private.redeem_invitation(args);
    when 'save_calendar' then return casa_private.save_calendar(args);
    when 'propose' then return casa_private.propose(args);
    when 'resolve' then return casa_private.resolve(args);
    else raise exception 'Acción inválida';
  end case;
end $$;

revoke all on all tables in schema casa_private from public,anon,authenticated;
revoke all on public.casa_families,public.casa_members,public.casa_calendars,public.casa_proposals from public,anon,authenticated;
grant select on public.casa_families,public.casa_members,public.casa_calendars,public.casa_proposals to authenticated;
revoke all on all functions in schema casa_private from public,anon,authenticated;
grant execute on function casa_private.family_role(uuid), casa_private.can_read_calendar(uuid),
  casa_private.create_family(jsonb),casa_private.add_member(jsonb),casa_private.create_invitation(jsonb),
  casa_private.redeem_invitation(jsonb),casa_private.save_calendar(jsonb),casa_private.propose(jsonb),casa_private.resolve(jsonb)
  to authenticated;
revoke all on function public.casa_command(text,jsonb) from public,anon;
grant execute on function public.casa_command(text,jsonb) to authenticated;
