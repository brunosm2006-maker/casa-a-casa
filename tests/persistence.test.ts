import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeState, initialState, loadState, saveState } from '../src/persistence';

test('primer inicio vacío, sin perfil ni fechas de demostración', async () => {
  assert.deepEqual(await loadState({ getItem: async () => null }), initialState());
});

test('guarda y recupera perfil y estancias al reabrir', async () => {
  let disk = '';
  const store = { getItem: async () => disk, setItem: async (_key: string, value: string) => { disk = value; } };
  const state = { ...initialState(), profile: 'madre' as const, schedule: { '2026-12-31': 'padre' as const } };
  await saveState(store, state);
  assert.deepEqual(await loadState(store), state);
});

test('datos dañados no se sustituyen silenciosamente por un calendario vacío', () => {
  for (const value of ['{', 'null', '{"version":9}', '{"version":1,"profile":"madre","schedule":{"2026-02-30":"padre"}}', '{"version":1,"profile":"otro","schedule":{}}']) {
    assert.throws(() => decodeState(value));
  }
});

test('fallo de escritura se propaga para evitar mostrar un guardado falso', async () => {
  await assert.rejects(saveState({ setItem: async () => { throw new Error('Sin espacio'); } }, initialState()), /Sin espacio/);
});
