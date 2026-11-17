-- Migrate the source of truth while keeping the current app API.
lock table public.casa_calendars in access exclusive mode;
alter table public.casa_calendars rename to casa_calendar_headers;

create table public.casa_calendar_routines (
  calendar_id uuid primary key references public.casa_calendar_headers(id) on delete cascade,
  rule jsonb not null check (jsonb_typeof(rule) = 'object')
);
create table public.casa_calendar_exceptions (
  calendar_id uuid not null references public.casa_calendar_headers(id) on delete cascade,
  day date not null check (day between date '1900-01-01' and date '2100-12-31'),
  destination text check (destination in ('madre','padre')),
  primary key (calendar_id, day)
);

insert into public.casa_calendar_routines (calendar_id, rule)
select id, payload->'routine' from public.casa_calendar_headers where payload->'routine' <> 'null'::jsonb;
insert into public.casa_calendar_exceptions (calendar_id, day, destination)
select c.id, e.key::date, e.value from public.casa_calendar_headers c
cross join lateral jsonb_each_text(c.payload->'schedule') e;

create or replace function casa_private.can_read_calendar(calendar uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.casa_calendar_headers c join public.casa_members m on m.family_id=c.family_id
    where c.id=calendar and m.user_id=auth.uid() and (m.role='parent' or m.id=c.child_id)
  )
$$;

alter table public.casa_calendar_routines enable row level security;
alter table public.casa_calendar_exceptions enable row level security;
create policy routine_read on public.casa_calendar_routines for select to authenticated
  using (casa_private.can_read_calendar(calendar_id));
create policy exception_read on public.casa_calendar_exceptions for select to authenticated
  using (casa_private.can_read_calendar(calendar_id));

create view public.casa_calendars with (security_invoker = true) as
select c.id, c.family_id, c.child_id,
  jsonb_build_object(
    'schedule', coalesce((
      select jsonb_object_agg(to_char(e.day, 'YYYY-MM-DD'), e.destination)
      from public.casa_calendar_exceptions e where e.calendar_id = c.id
    ), '{}'::jsonb),
    'routine', r.rule
  ) as payload,
  c.revision
from public.casa_calendar_headers c
left join public.casa_calendar_routines r on r.calendar_id = c.id;

do $$
begin
  if exists (
    select 1 from public.casa_calendar_headers h
    join public.casa_calendars c on c.id=h.id
    where c.payload is distinct from h.payload
  ) then raise exception 'No coincide el calendario reconstruido'; end if;
end $$;

alter table public.casa_calendar_headers drop column payload;
revoke all on public.casa_calendars, public.casa_calendar_headers,
  public.casa_calendar_routines, public.casa_calendar_exceptions from public, anon, authenticated;
grant select on public.casa_calendars, public.casa_calendar_headers,
  public.casa_calendar_routines, public.casa_calendar_exceptions to authenticated;

comment on table public.casa_calendar_headers is 'Identidad, familia, hijo y revisión confirmada del calendario.';
comment on table public.casa_calendar_routines is 'Regla habitual, una por calendario. El formato depende del patrón.';
comment on table public.casa_calendar_exceptions is 'Excepción por fecha. Un destino NULL deja ese día explícitamente sin asignar.';
comment on view public.casa_calendars is 'Vista que reúne rutina y excepciones para la aplicación.';

create or replace function casa_private.add_member(args jsonb) returns jsonb language plpgsql
security definer set search_path = '' as $$
declare member public.casa_members; family uuid:=(args->>'family_id')::uuid; profile text:=args->>'profile';
begin
  if auth.uid() is null or casa_private.family_role(family) is distinct from 'parent' then raise exception 'Solo progenitores'; end if;
  insert into public.casa_members(family_id,name,role,profile) values(
    family,btrim(args->>'name'),case when profile in ('madre','padre') then 'parent' else 'child' end,profile
  ) returning * into member;
  if member.role='child' then insert into public.casa_calendar_headers(family_id,child_id) values(family,member.id); end if;
  return to_jsonb(member);
end $$;

create function casa_private.write_calendar_schedule(calendar uuid, schedule jsonb) returns void
language plpgsql set search_path = '' as $$
begin
  delete from public.casa_calendar_exceptions e where e.calendar_id=calendar
    and not (schedule ? to_char(e.day, 'YYYY-MM-DD'));
  insert into public.casa_calendar_exceptions (calendar_id, day, destination)
  select calendar, e.key::date, e.value from jsonb_each_text(schedule) e
  on conflict (calendar_id, day) do update set destination=excluded.destination
    where casa_calendar_exceptions.destination is distinct from excluded.destination;
end $$;
revoke all on function casa_private.write_calendar_schedule(uuid,jsonb) from public, anon, authenticated;

create or replace function casa_private.save_calendar(args jsonb) returns jsonb language plpgsql
security definer set search_path = '' as $$
declare calendar public.casa_calendar_headers;
begin
  select * into calendar from public.casa_calendar_headers where id=(args->>'calendar_id')::uuid for update;
  if auth.uid() is null or casa_private.family_role(calendar.family_id) is distinct from 'parent' then raise exception 'Solo progenitores'; end if;
  if calendar.revision is distinct from (args->>'revision')::integer then raise exception 'El calendario cambió. Actualiza antes de guardar'; end if;
  perform casa_private.validate_payload(args->'payload');
  if args->'payload'->'routine' = 'null'::jsonb then
    delete from public.casa_calendar_routines where calendar_id=calendar.id;
  else
    insert into public.casa_calendar_routines (calendar_id, rule) values (calendar.id, args->'payload'->'routine')
      on conflict (calendar_id) do update set rule=excluded.rule
      where casa_calendar_routines.rule is distinct from excluded.rule;
  end if;
  perform casa_private.write_calendar_schedule(calendar.id, args->'payload'->'schedule');
  update public.casa_calendar_headers set revision=revision+1 where id=calendar.id;
  return (select to_jsonb(item) from public.casa_calendars item where item.id=calendar.id);
end $$;

create or replace function casa_private.propose(args jsonb) returns jsonb language plpgsql
security definer set search_path = '' as $$
declare calendar public.casa_calendar_headers; member public.casa_members; existing public.casa_proposals; proposal public.casa_proposals;
begin
  select * into calendar from public.casa_calendar_headers where id=(args->>'calendar_id')::uuid for update;
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

create or replace function casa_private.resolve(args jsonb) returns jsonb language plpgsql
security definer set search_path = '' as $$
declare proposal public.casa_proposals; calendar public.casa_calendar_headers; member uuid; change_day date; changes jsonb; decision text:=args->>'decision';
begin
  if decision is null or decision not in ('accepted','rejected') then raise exception 'Resolución inválida'; end if;
  select * into proposal from public.casa_proposals where id=(args->>'proposal_id')::uuid;
  select * into calendar from public.casa_calendar_headers where id=proposal.calendar_id for update;
  select * into proposal from public.casa_proposals where id=(args->>'proposal_id')::uuid for update;
  if auth.uid() is null or casa_private.family_role(calendar.family_id) is distinct from 'parent' then raise exception 'Solo progenitores'; end if;
  select id into member from public.casa_members where family_id=calendar.family_id and user_id=auth.uid();
  if proposal.status<>'pending' then
    if proposal.status=decision then return to_jsonb(proposal); end if;
    raise exception 'La propuesta ya está resuelta';
  end if;
  if decision='accepted' then
    if proposal.base_revision<>calendar.revision then raise exception 'El calendario cambió. Rechaza esta propuesta y pide una nueva'; end if;
    select payload->'schedule' into changes from public.casa_calendars where id=calendar.id;
    for change_day in select generate_series(proposal.first_day,proposal.last_day,interval '1 day')::date loop
      if proposal.destination='rutina' then changes:=changes-to_char(change_day,'YYYY-MM-DD');
      else changes:=jsonb_set(changes,array[to_char(change_day,'YYYY-MM-DD')],coalesce(to_jsonb(proposal.destination),'null'::jsonb)); end if;
    end loop;
    perform casa_private.validate_payload(
      (select jsonb_set(payload,'{schedule}',changes) from public.casa_calendars where id=calendar.id)
    );
    perform casa_private.write_calendar_schedule(calendar.id, changes);
    update public.casa_calendar_headers set revision=revision+1 where id=calendar.id;
  end if;
  update public.casa_proposals set status=decision,resolved_by=member,resolved_at=now() where id=proposal.id returning * into proposal;
  return to_jsonb(proposal);
end $$;

notify pgrst, 'reload schema';
