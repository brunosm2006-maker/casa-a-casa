import assert from 'node:assert/strict';
import test from 'node:test';
import { loadBackpacks, saveBackpacks } from '../src/backpackStorage';
import { defaultReminders, loadReminders, saveReminders } from '../src/reminders';

test('mochilas y avisos familiares se separan por cuenta y calendario del modo individual', async () => {
  const disk = new Map<string, string>();
  const storage = { getItem: async (key: string) => disk.get(key) ?? null, setItem: async (key: string, value: string) => { disk.set(key, value); } };
  const bag = { id: 'lista', date: '2026-11-10', destination: 'padre' as const, items: [{ id: 'libro', text: 'Libro', prepared: true }] };
  await saveBackpacks(storage, [bag]);
  await saveBackpacks(storage, [{ ...bag, id: 'privada-familiar' }], 'custodia.mochilas.familia.v1:cuentaA:calendarioA');
  assert.equal((await loadBackpacks(storage))[0]!.id, 'lista');
  assert.deepEqual(await loadBackpacks(storage, 'custodia.mochilas.familia.v1:cuentaB:calendarioA'), []);
  assert.deepEqual(await loadBackpacks(storage, 'custodia.mochilas.familia.v1:cuentaA:calendarioB'), []);
  const settings = { ...defaultReminders, change: { ...defaultReminders.change, enabled: true } };
  await saveReminders(storage, settings, 'cuentaA:calendarioA');
  assert.deepEqual(await loadReminders(storage), defaultReminders);
  assert.deepEqual(await loadReminders(storage, 'cuentaB:calendarioA'), defaultReminders);
  assert.deepEqual(await loadReminders(storage, 'cuentaA:calendarioB'), defaultReminders);
  assert.deepEqual(await loadReminders(storage, 'cuentaA:calendarioA'), settings);
});
