import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('PostgreSQL local: aislamiento familiar, invitaciones y resolución atómica de propuestas', async t => {
  const db = new PGlite();
  const parent = '00000000-0000-4000-8000-000000000001';
  const child = '00000000-0000-4000-8000-000000000002';
  const outsider = '00000000-0000-4000-8000-000000000003';
  const sibling = '00000000-0000-4000-8000-000000000004';
  const otherParent = '00000000-0000-4000-8000-000000000005';
  try {
    await db.exec(`
      create role authenticated;
      create role anon;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,anon;
      insert into auth.users(id) values ('${parent}'),('${child}'),('${outsider}'),('${sibling}'),('${otherParent}');
    `);
    await db.exec(readFileSync(new URL('../supabase/migrations/20261109193242_family_access.sql', import.meta.url), 'utf8'));
    async function as(user: string, role = 'authenticated') {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
      await db.exec('set role ' + role);
    }
    async function command(action: string, args: Record<string, unknown>) {
      const result = await db.query<{ value: any }>('select public.casa_command($1,$2::jsonb) as value', [action, JSON.stringify(args)]);
      return result.rows[0]!.value;
    }
    await as(parent);
    const family = await command('create_family', { name: 'Familia de prueba', member_name: 'Progenitor', profile: 'madre' });
    const represented = await command('add_member', { family_id: family.id, name: 'Hijo de prueba', profile: 'hijo' });
    const anotherChild = await command('add_member', { family_id: family.id, name: 'Hermana de prueba', profile: 'hija' });
    const parentMember = await command('add_member', { family_id: family.id, name: 'Otro progenitor', profile: 'padre' });
    let calendar = (await db.query<any>('select * from public.casa_calendars where child_id=$1', [represented.id])).rows[0]!;
    let invitation = await command('create_invitation', { member_id: represented.id });
    const expired = invitation.token;
    invitation = await command('create_invitation', { member_id: represented.id });

    await t.test('solo progenitores invitan, el código renovado se invalida y el hijo no elige rol', async () => {
      await as(child);
      await assert.rejects(command('redeem_invitation', { token: expired }), /inválida/);
      await command('redeem_invitation', { token: invitation.token, role: 'parent', profile: 'madre' });
      await command('redeem_invitation', { token: invitation.token });
      const own = (await db.query<any>('select * from public.casa_members where user_id=$1', [child])).rows[0]!;
      assert.equal(own.role, 'child');
      await assert.rejects(command('create_invitation', { member_id: anotherChild.id }), /Solo progenitores/);
      await assert.rejects(command('add_member', { family_id: family.id, name: 'Escalada', profile: 'padre' }), /Solo progenitores/);
      await as(outsider);
      await assert.rejects(command('redeem_invitation', { token: invitation.token }), /utilizada/);
    });

    await t.test('aislamiento entre familias, entre hermanos y respecto a visitantes sin sesión', async () => {
      await as(outsider);
      const other = await command('create_family', { name: 'Otra familia', member_name: 'Otra persona', profile: 'padre' });
      assert.equal((await db.query<any>('select * from public.casa_families')).rows.length, 1);
      assert.equal((await db.query<any>('select * from public.casa_calendars')).rows.length, 0);
      await assert.rejects(command('save_calendar', { calendar_id: calendar.id, revision: 0, payload: { routine: null, schedule: {} } }), /Solo progenitores/);
      await as(child);
      const calendars = (await db.query<any>('select * from public.casa_calendars')).rows;
      assert.equal(calendars.length, 1);
      assert.equal(calendars[0]!.child_id, represented.id);
      assert.equal((await db.query('select * from public.casa_families where id=$1', [other.id])).rows.length, 0);
      await as('', 'anon');
      await assert.rejects(db.query('select * from public.casa_calendars'), /permission denied/);
      await assert.rejects(command('create_family', { name: 'Sin sesión' }), /permission denied/);
    });

    await t.test('el hijo no puede guardar, modificar filas, resolver ni ver tokens de invitación', async () => {
      await as(child);
      await assert.rejects(command('save_calendar', { calendar_id: calendar.id, revision: 0, payload: { routine: null, schedule: {} } }), /Solo progenitores/);
      await assert.rejects(db.query('update public.casa_calendars set revision=1 where id=$1', [calendar.id]), /permission denied/);
      await assert.rejects(db.query('update public.casa_members set role=\'parent\' where id=$1', [represented.id]), /permission denied/);
      await assert.rejects(db.query('select * from casa_private.invitations'), /permission denied/);
    });

    const firstId = '00000000-0000-4000-8000-000000000011';
    const args = { id: firstId, calendar_id: calendar.id, revision: 0, first_day: '2026-12-14', last_day: '2026-12-15', destination: 'padre', explanation: 'Para probar' };
    await t.test('proponer no modifica el confirmado y repetir la misma petición no la duplica', async () => {
      await as(child);
      await command('propose', args);
      await command('propose', args);
      assert.equal((await db.query('select * from public.casa_proposals')).rows.length, 1);
      assert.deepEqual((await db.query<any>('select payload from public.casa_calendars')).rows[0]!.payload.schedule, {});
      await assert.rejects(command('resolve', { proposal_id: firstId, decision: 'accepted' }), /Solo progenitores/);
      await assert.rejects(command('resolve', { proposal_id: firstId, decision: 'rejected' }), /Solo progenitores/);
      await as(outsider);
      await assert.rejects(command('resolve', { proposal_id: firstId, decision: 'accepted' }), /Solo progenitores/);
    });

    await t.test('aceptar aplica las fechas una vez y registra quién resolvió', async () => {
      await as(parent);
      const accepted = await command('resolve', { proposal_id: firstId, decision: 'accepted' });
      assert.equal(accepted.status, 'accepted');
      assert.ok(accepted.resolved_by);
      await command('resolve', { proposal_id: firstId, decision: 'accepted' });
      calendar = (await db.query<any>('select * from public.casa_calendars where id=$1', [calendar.id])).rows[0]!;
      assert.equal(calendar.revision, 1);
      assert.deepEqual(calendar.payload.schedule, { '2026-12-14': 'padre', '2026-12-15': 'padre' });
      await assert.rejects(command('resolve', { proposal_id: firstId, decision: 'rejected' }), /ya está resuelta/);
    });

    await t.test('calendario modificado bloquea la aceptación y rechazar conserva todas las fechas', async () => {
      await as(child);
      const next = { ...args, id: '00000000-0000-4000-8000-000000000012', revision: 1, destination: null };
      await command('propose', next);
      await as(parent);
      const payload = { ...calendar.payload, schedule: { ...calendar.payload.schedule, '2026-12-16': 'madre' } };
      await command('save_calendar', { calendar_id: calendar.id, revision: 1, payload });
      await assert.rejects(command('resolve', { proposal_id: next.id, decision: 'accepted' }), /calendario cambió/);
      assert.equal((await db.query<any>('select status from public.casa_proposals where id=$1', [next.id])).rows[0]!.status, 'pending');
      await command('resolve', { proposal_id: next.id, decision: 'rejected' });
      await command('resolve', { proposal_id: next.id, decision: 'rejected' });
      assert.deepEqual((await db.query<any>('select payload from public.casa_calendars where id=$1', [calendar.id])).rows[0]!.payload, payload);
      await assert.rejects(command('save_calendar', { calendar_id: calendar.id, revision: 1, payload }), /calendario cambió/);
    });

    await t.test('importar rutina anterior conserva sus datos y aceptar sin asignar o recuperar rutina es reversible', async () => {
      await as(parent);
      const current = (await db.query<any>('select * from public.casa_calendars where id=$1', [calendar.id])).rows[0]!;
      const routine = {
        start: '2026-12-01', days: ['madre', 'madre', null, null, 'alterno', 'alterno', 'alterno'],
        referenceFriday: '2026-12-04', referenceHome: 'padre', otherWeekendHome: 'madre',
        primary: { home: 'madre', guest: 'padre', alternate: true, visitDays: [4, 5, 6] },
      };
      await command('save_calendar', { calendar_id: calendar.id, revision: current.revision, payload: { schedule: current.payload.schedule, routine } });
      const id = '00000000-0000-4000-8000-000000000013';
      await as(child);
      await command('propose', { ...args, id, revision: current.revision + 1, destination: null });
      await as(parent);
      await command('resolve', { proposal_id: id, decision: 'accepted' });
      const vacant = (await db.query<any>('select * from public.casa_calendars where id=$1', [calendar.id])).rows[0]!;
      assert.equal(vacant.payload.schedule['2026-12-14'], null);
      assert.deepEqual(vacant.payload.routine, routine);
      await as(child);
      const restore = '00000000-0000-4000-8000-000000000014';
      await command('propose', { ...args, id: restore, revision: vacant.revision, destination: 'rutina' });
      await as(parent);
      await command('resolve', { proposal_id: restore, decision: 'accepted' });
      const restored = (await db.query<any>('select * from public.casa_calendars where id=$1', [calendar.id])).rows[0]!;
      assert.equal(Object.hasOwn(restored.payload.schedule, '2026-12-14'), false);
      assert.equal(restored.payload.schedule['2026-12-16'], 'madre');
      await assert.rejects(command('save_calendar', { calendar_id: calendar.id, revision: restored.revision, payload: { schedule: { '2026-02-30': 'madre' }, routine: null } }));
      assert.equal((await db.query<any>('select revision from public.casa_calendars where id=$1', [calendar.id])).rows[0]!.revision, restored.revision);
    });

    await t.test('invitar a otro progenitor no cambia los permisos del hijo y caducan los códigos', async () => {
      await as(parent);
      const parentInvite = await command('create_invitation', { member_id: parentMember.id });
      const siblingInvite = await command('create_invitation', { member_id: anotherChild.id });
      await db.exec('reset role');
      await db.query('update casa_private.invitations set expires_at=now()-interval \'1 second\' where member_id=$1', [anotherChild.id]);
      await as(sibling);
      await assert.rejects(command('redeem_invitation', { token: siblingInvite.token }), /caducada/);
      await as(otherParent);
      await command('redeem_invitation', { token: parentInvite.token, role: 'child' });
      assert.equal((await db.query<any>('select * from public.casa_members where user_id=$1', [otherParent])).rows[0]!.role, 'parent');
      assert.equal((await db.query('select * from public.casa_calendars')).rows.length, 2);
    });
  } finally { await db.close(); }
});
