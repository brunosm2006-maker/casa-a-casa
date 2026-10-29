import test from 'node:test';
import assert from 'node:assert/strict';
import { effectiveHome, effectiveNextChange, setExceptionRange, validateRoutine, type Routine } from '../src/routine';
import { decodeState, initialState, loadState, saveState } from '../src/persistence';

const routine: Routine = { start: '2026-10-26', days: ['madre', 'madre', 'padre', 'padre', 'alterno', 'alterno', 'alterno'], referenceFriday: '2026-10-30', referenceHome: 'madre', otherWeekendHome: 'padre' };

test('plantilla semanal, inicio y fines de semana de viernes a domingo alternos', () => {
  assert.equal(effectiveHome({}, routine, '2026-10-25'), null);
  const expected = ['madre', 'madre', 'padre', 'padre', 'madre', 'madre', 'madre', 'madre', 'madre', 'padre', 'padre', 'padre', 'padre', 'padre'];
  for (let i = 0; i < 14; i++) {
    const day = new Date(2026, 9, 26 + i, 12);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    assert.equal(effectiveHome({}, routine, key), expected[i], key);
  }
});

test('solo un fin de semana cada dos semanas sin inventar el resto del horario', () => {
  const weekends: Routine = { ...routine, days: [null, null, null, null, 'alterno', 'alterno', 'alterno'], referenceHome: 'padre', otherWeekendHome: null };
  assert.equal(effectiveHome({}, weekends, '2026-10-26'), null);
  assert.equal(effectiveHome({}, weekends, '2026-10-30'), 'padre');
  assert.equal(effectiveHome({}, weekends, '2026-11-01'), 'padre');
  assert.equal(effectiveHome({}, weekends, '2026-11-06'), null);
  assert.equal(effectiveHome({}, weekends, '2026-11-13'), 'padre');
  assert.equal(effectiveNextChange({}, weekends, '2026-10-26'), null);
});

test('alternancia continúa al cruzar año y cambio de hora, también antes del viernes de referencia', () => {
  const rule = { ...routine, referenceFriday: '2027-01-01', referenceHome: 'padre' as const, otherWeekendHome: 'madre' as const };
  assert.equal(effectiveHome({}, rule, '2026-12-25'), 'madre');
  assert.equal(effectiveHome({}, rule, '2027-01-01'), 'padre');
  assert.equal(effectiveHome({}, rule, '2027-01-03'), 'padre');
  assert.equal(effectiveHome({}, rule, '2027-01-08'), 'madre');
  assert.equal(effectiveHome({}, routine, '2027-03-26'), 'padre');
  assert.equal(effectiveHome({}, routine, '2027-03-28'), 'padre');
  assert.equal(effectiveHome({}, routine, '2027-04-02'), 'madre');
  assert.equal(effectiveHome({}, routine, '2030-01-04'), 'madre');
});

test('excepciones prevalecen al cambiar regla; sin asignar y recuperar rutina son acciones distintas', () => {
  const assigned = setExceptionRange({}, '2026-10-26', '2026-10-27', 'padre');
  assert.equal(effectiveHome(assigned, routine, '2026-10-26'), 'padre');
  assert.equal(effectiveHome(assigned, { ...routine, days: Array(7).fill('madre') }, '2026-10-26'), 'padre');
  const unknown = setExceptionRange(assigned, '2026-10-26', '2026-10-26', null);
  assert.equal(effectiveHome(unknown, routine, '2026-10-26'), null);
  const restored = setExceptionRange(unknown, '2026-10-26', '2026-10-26', 'rutina');
  assert.equal(effectiveHome(restored, routine, '2026-10-26'), 'madre');
  assert.equal(restored['2026-10-27'], 'padre');
  assert.equal(effectiveHome(restored, null, '2026-10-27'), 'padre');
  assert.equal(effectiveHome(restored, null, '2026-10-26'), null);
});

test('próximo cambio efectivo, huecos, rutina futura y retorno tras una excepción larga', () => {
  assert.deepEqual(effectiveNextChange({}, routine, '2026-10-26'), { date: '2026-10-28', home: 'padre' });
  assert.deepEqual(effectiveNextChange({ '2026-10-28': null }, routine, '2026-10-28'), { date: '2026-10-30', home: 'madre' });
  const long = setExceptionRange({}, '2026-10-26', '2026-12-31', 'madre');
  assert.deepEqual(effectiveNextChange(long, routine, '2026-10-27'), { date: '2027-01-01', home: 'padre' });
  assert.equal(effectiveNextChange({ '2026-10-26': 'madre', '2026-10-29': 'padre' }, null, '2026-10-26'), null);
  assert.deepEqual(effectiveNextChange({}, { ...routine, start: '2030-01-01' }, '2026-10-26'), { date: '2030-01-02', home: 'padre' });
  assert.equal(effectiveNextChange({}, { ...routine, days: Array(7).fill('madre') }, '2026-10-26'), null);
});

test('valida anclaje explícito en viernes y siete días; no acepta rutina incompleta', () => {
  for (const invalid of [{ ...routine, referenceFriday: null }, { ...routine, referenceHome: null }, { ...routine, referenceFriday: '2026-10-29' }, { ...routine, days: ['madre'] }, { ...routine, days: Array(7).fill('alterno') }]) {
    assert.throws(() => validateRoutine(invalid));
  }
  assert.doesNotThrow(() => validateRoutine({ ...routine, days: Array(7).fill('padre'), referenceFriday: null, referenceHome: null }));
});

test('migra versión anterior sin perder fechas y guarda regla y excepciones sin sobrescribir el original', async () => {
  const legacy = JSON.stringify({ version: 1, profile: 'hijo', schedule: { '2026-10-26': 'padre' } });
  const disk = new Map<string, string>([['custodia.calendario.v1', legacy]]);
  const store = { getItem: async (key: string) => disk.get(key) ?? null, setItem: async (key: string, value: string) => { disk.set(key, value); } };
  const migrated = await loadState(store);
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.schedule, { '2026-10-26': 'padre' });
  assert.equal(migrated.routine, null);
  const updated = { ...migrated, routine, schedule: { ...migrated.schedule, '2026-10-26': 'padre' as const, '2026-10-28': null } };
  await saveState(store, updated);
  assert.deepEqual(await loadState(store), updated);
  assert.equal(disk.get('custodia.calendario.v1'), legacy);
  assert.equal(effectiveHome((await loadState(store)).schedule, routine, '2026-10-26'), 'padre');
  assert.deepEqual(decodeState(legacy), migrated);
  assert.equal(initialState().routine, null);
});
