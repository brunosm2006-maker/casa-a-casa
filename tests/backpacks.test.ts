import test from 'node:test';
import assert from 'node:assert/strict';
import { createBag, addBagItem, editBagItem, toggleBagItem, removeBagItem, removeBag, bagProgress, bagDestinationStatus, nearbyBagChange } from '../src/backpacks';
import { loadBackpacks, saveBackpacks } from '../src/backpackStorage';
import { type Routine } from '../src/routine';

const routine: Routine = { kind: 'cycle', start: '2026-11-01', blocks: [{ days: 14, home: 'madre' }, { days: 15, home: 'padre' }], template: 'custom' };
test('crear para una estancia larga usa el destino efectivo sin inventar duración', () => {
  const bags = createBag([], '2026-11-15', {}, routine);
  assert.equal(bags[0]?.date, '2026-11-15');
  assert.equal(bags[0]?.destination, 'padre');
  assert.equal(bags[0]?.items.length, 0);
  assert.equal('end' in bags[0]!, false);
  assert.throws(() => createBag([], '2026-11-15', {}, null), /calendario/);
  assert.throws(() => createBag(bags, '2026-11-15', {}, routine), /Ya hay/);
});
test('añadir, editar, marcar y borrar no mutan la lista original ni otras estancias', () => {
  let bags = createBag([], '2026-11-15', {}, routine);
  const id = bags[0]!.id;
  const original = bags;
  bags = addBagItem(bags, id, '  Cargador  ');
  const item = bags[0]!.items[0]!;
  assert.equal(item.text, 'Cargador');
  assert.equal(original[0]?.items.length, 0);
  bags = editBagItem(bags, id, item.id, 'Cargador del móvil');
  bags = toggleBagItem(bags, id, item.id);
  assert.deepEqual(bagProgress(bags[0]!), { total: 1, ready: 1, pending: 0, complete: true });
  bags = createBag(bags, '2026-12-14', {}, routine);
  assert.equal(bags[1]?.items.length, 0);
  assert.equal(bags[0]?.items[0]?.prepared, true);
  bags = toggleBagItem(bags, id, item.id);
  assert.equal(bagProgress(bags[0]!).pending, 1);
  assert.throws(() => editBagItem(bags, id, item.id, '   '), /nombre/);
  bags = removeBagItem(bags, id, item.id);
  assert.equal(bagProgress(bags[0]!).complete, false);
  assert.equal(removeBag(bags, id).length, 1);
  assert.throws(() => addBagItem(bags, id, '  '), /nombre/);
  assert.throws(() => editBagItem(bags, id, 'no-existe', 'Objeto'), /objeto/);
});
test('copiar una lista reinicia marcas y crea objetos independientes', () => {
  let bags = createBag([], '2026-11-15', {}, routine);
  const id = bags[0]!.id;
  bags = addBagItem(bags, id, 'Libro');
  bags = toggleBagItem(bags, id, bags[0]!.items[0]!.id);
  bags = createBag(bags, '2026-12-14', {}, routine, id);
  assert.equal(bags[1]?.items[0]?.text, 'Libro');
  assert.equal(bags[1]?.items[0]?.prepared, false);
  assert.notEqual(bags[1]?.items[0]?.id, bags[0]?.items[0]?.id);
  assert.equal(bags[0]?.items[0]?.prepared, true);
  assert.throws(() => createBag([], '2026-11-15', {}, routine, 'no-existe'), /lista/);
});
test('un cambio de destino no reasigna ni borra listas y permite conservar ambas', () => {
  let bags = createBag([], '2026-11-15', {}, routine);
  const saved = bags[0]!;
  assert.deepEqual(bagDestinationStatus(saved, { '2026-11-15': 'madre' }, routine), { changed: true, current: 'madre' });
  assert.equal(bagDestinationStatus(saved, { '2026-11-15': null }, routine).changed, true);
  assert.equal(saved.destination, 'padre');
  bags = createBag(bags, '2026-11-15', { '2026-11-15': 'madre' }, routine);
  assert.equal(bags.length, 2);
  assert.equal(bags[0]?.destination, 'padre');
});
test('cercanía es día anterior o mismo día, incluido fin de año, nunca cambia la fecha', () => {
  const change = { date: '2027-01-01', home: 'padre' as const };
  assert.equal(nearbyBagChange('2026-12-31', change), true);
  assert.equal(nearbyBagChange('2027-01-01', change), true);
  assert.equal(nearbyBagChange('2026-12-30', change), false);
  assert.equal(nearbyBagChange('2027-01-02', change), false);
  assert.equal(nearbyBagChange('2026-12-31', null), false);
});
test('primer uso migra a mochilas vacías sin tocar v1 ni v2; guarda y recupera objetos', async () => {
  const previous = '{"version":2,"profile":"hija","schedule":{},"routine":null,"setupComplete":true}';
  const disk = new Map<string,string>([['custodia.calendario.v2', previous], ['custodia.calendario.v1', 'original']]);
  const store = { getItem: async (key: string) => disk.get(key) ?? null, setItem: async (key: string, value: string) => { disk.set(key, value); } };
  assert.deepEqual(await loadBackpacks(store), []);
  let bags = createBag([], '2026-11-15', {}, routine);
  bags = addBagItem(bags, bags[0]!.id, 'Zapatillas');
  await saveBackpacks(store, bags);
  assert.deepEqual(await loadBackpacks(store), bags);
  assert.equal(disk.get('custodia.calendario.v2'), previous);
  assert.equal(disk.get('custodia.calendario.v1'), 'original');
});
test('lectura dañada y escritura fallida no se presentan como listas guardadas', async () => {
  await assert.rejects(loadBackpacks({ getItem: async () => '{"version":999}' }));
  await assert.rejects(loadBackpacks({ getItem: async () => '{"version":1,"lists":[{"id":"x","date":"2026-02-30","destination":"padre","items":[]}]}' }));
  await assert.rejects(saveBackpacks({ setItem: async () => { throw new Error('Sin espacio'); } }, []), /Sin espacio/);
});
