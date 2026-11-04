import assert from 'node:assert/strict';
import test from 'node:test';
import { type PackingList } from '../src/backpacks';
import { dateKey, type Schedule } from '../src/calendar';
import { defaultReminders, loadReminders, planReminders, reconcileReminders, saveReminders } from '../src/reminders';

const settings = {
  change: { enabled: true, daysBefore: 1, time: '18:00' },
  bag: { enabled: true, daysBefore: 0, time: '08:30' },
};
const now = new Date(2026, 9, 24, 12);
const schedule: Schedule = { '2026-10-25': 'madre', '2026-10-26': 'padre', '2026-10-27': null, '2026-10-28': 'madre' };
const bag: PackingList = { id: 'lista', date: '2026-10-26', destination: 'padre', items: [{ id: 'libro', text: 'Libro', prepared: false }] };

test('avisa a la hora local de cada tipo aunque cambie la hora de verano y no infiere cambios a través de huecos', () => {
  const planned = planReminders(now, settings, schedule, null, [bag]);
  assert.deepEqual(planned.map(({ kind, at }) => [kind, at]), [
    ['change', new Date(2026, 9, 25, 18).getTime()],
    ['bag', new Date(2026, 9, 26, 8, 30).getTime()],
  ]);
  assert.equal(planReminders(new Date(2026, 9, 25, 18), settings, schedule, null, [bag]).length, 1);
  assert.deepEqual(planReminders(now, defaultReminders, schedule, null, [bag]), []);
});

test('solo avisa de mochilas coincidentes sin completar y usa excepciones sobre la rutina', () => {
  const routine = { kind: 'cycle' as const, template: 'custom' as const, start: '2026-10-25', blocks: [{ days: 1, home: 'madre' as const }, { days: 1, home: 'padre' as const }] };
  const bagOnly = { ...settings, change: defaultReminders.change };
  assert.equal(planReminders(now, bagOnly, {}, routine, [bag]).length, 1);
  assert.deepEqual(planReminders(now, bagOnly, { '2026-10-26': 'madre' }, routine, [bag]), []);
  assert.deepEqual(planReminders(now, bagOnly, {}, routine, [{ ...bag, destination: 'madre' }]), []);
  assert.deepEqual(planReminders(now, bagOnly, {}, routine, [{ ...bag, items: [{ ...bag.items[0]!, prepared: true }] }]), []);
  assert.deepEqual(planReminders(now, bagOnly, {}, routine, []), []);
});

test('el límite de la ventana excluye cambios a 30 días y respeta el último día admitido', () => {
  const alternating = { kind: 'cycle' as const, template: 'custom' as const, start: '2026-10-23', blocks: [{ days: 1, home: 'madre' as const }, { days: 1, home: 'padre' as const }] };
  const sameDay = { ...defaultReminders, change: { ...settings.change, daysBefore: 0 } };
  const plans = planReminders(now, sameDay, {}, alternating, []);
  assert.equal(plans.length, 30);
  assert.equal(dateKey(new Date(plans.at(-1)!.at)), '2026-11-22');
  assert.equal(planReminders(new Date(2100, 11, 31, 12), sameDay, {}, alternating, []).length, 1);
});

test('reconciliar evita duplicados, cancela obsoletos, conserva avisos ajenos y reintenta una escritura fallida', async () => {
  const future = new Date(2099, 9, 24, 12);
  const shifted: Schedule = { '2099-10-25': 'madre', '2099-10-26': 'padre' };
  const old = planReminders(future, settings, shifted, null, []);
  const revised = planReminders(future, { ...settings, change: { ...settings.change, time: '21:00' } }, shifted, null, []);
  const pending = new Set(['ajeno', old[0]!.id]);
  const canceled: string[] = [];
  let attempts = 0;
  const api = {
    pending: async () => [...pending],
    cancel: async (id: string) => { canceled.push(id); pending.delete(id); },
    schedule: async ({ id }: { id: string }) => { if (++attempts === 1) throw new Error('sistema'); pending.add(id); },
  };
  await assert.rejects(reconcileReminders(revised, api), /sistema/);
  assert.deepEqual([...pending], ['ajeno']);
  await reconcileReminders(revised, api);
  await reconcileReminders(revised, api);
  assert.equal(attempts, 2);
  assert.deepEqual(canceled, [old[0]!.id]);
  await reconcileReminders([], api, () => false);
  assert.equal(pending.size, 2);
  await reconcileReminders([], api);
  assert.deepEqual([...pending], ['ajeno']);
});

test('las preferencias se guardan por separado y un ajuste inválido no modifica datos anteriores', async () => {
  const disk = new Map([['custodia.calendario.v2', 'calendario'], ['custodia.mochilas.v1', 'mochilas']]);
  const storage = { getItem: async (key: string) => disk.get(key) ?? null, setItem: async (key: string, value: string) => { disk.set(key, value); } };
  assert.deepEqual(await loadReminders(storage), defaultReminders);
  await saveReminders(storage, settings);
  await assert.rejects(saveReminders(storage, { ...settings, bag: { ...settings.bag, time: '24:00' } }), /HH:MM/);
  assert.deepEqual(await loadReminders(storage), settings);
  assert.equal(disk.get('custodia.calendario.v2'), 'calendario');
  assert.equal(disk.get('custodia.mochilas.v1'), 'mochilas');
  disk.set('custodia.recordatorios.v1', '{"version":9}');
  await assert.rejects(loadReminders(storage), /ajustes/);
});
