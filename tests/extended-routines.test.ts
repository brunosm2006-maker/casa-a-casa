import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays } from '../src/calendar';
import { effectiveHome, effectiveNextChange, setExceptionRange, validateRoutine, type Routine } from '../src/routine';
import { blockTemplate, makeCycle, makeMonths, makePrimary, detectPattern } from '../src/patternTemplates';
import { previewCycles } from '../src/routinePreview';
import { decodeState, initialState, loadState, saveState } from '../src/persistence';

test('plantillas reales 2–2–3, 2–2–5–5 y 3–4–4–3, con inversión y repetición', () => {
  const expected = {
    '223': 'MMPPMMMPPMMPPP',
    '2255': 'MMPPMMMMMPPPPP',
    '3443': 'MMMPPPPMMMMPPP',
  };
  for (const name of ['223', '2255', '3443'] as const) {
    const rule = makeCycle('2026-10-26', blockTemplate(name, 'madre'), name);
    let actual = '';
    for (let i = 0; i < 28; i++) actual += effectiveHome({}, rule, addDays(rule.start, i)) === 'madre' ? 'M' : 'P';
    assert.equal(actual, expected[name].repeat(2));
    const inverted = makeCycle(rule.start, blockTemplate(name, 'padre'), name);
    for (let i = 0; i < 14; i++) assert.notEqual(effectiveHome({}, rule, addDays(rule.start, i)), effectiveHome({}, inverted, addDays(rule.start, i)));
  }
});

test('2–2–5–5 coincide con días fijos y fin de semana alterno A al empezar un lunes', () => {
  const weekly: Routine = { start: '2026-10-26', days: ['madre','madre','padre','padre','alterno','alterno','alterno'], referenceFriday: '2026-10-30', referenceHome: 'madre', otherWeekendHome: 'padre' };
  const cycle = makeCycle(weekly.start, blockTemplate('2255', 'madre'), '2255');
  for (let i = 0; i < 84; i++) {
    const day = addDays(weekly.start, i);
    assert.equal(effectiveHome({}, cycle, day), effectiveHome({}, weekly, day), day);
  }
});

test('semanas y bloques de 14/15 días empiezan cualquier día y cruzan años sin reinicio', () => {
  for (const length of [7, 14, 15]) {
    const rule = makeCycle('2026-12-23', [{ days: length, home: 'padre' }, { days: length, home: 'madre' }], length === 7 ? 'weeks' : 'long');
    assert.equal(effectiveHome({}, rule, '2026-12-22'), null);
    assert.equal(effectiveHome({}, rule, addDays(rule.start, length - 1)), 'padre');
    assert.equal(effectiveHome({}, rule, addDays(rule.start, length)), 'madre');
    assert.equal(effectiveHome({}, rule, addDays(rule.start, 2 * length)), 'padre');
  }
});

test('meses naturales: febrero bisiesto y meses de 31 días; exige inicio en día 1', () => {
  const rule = makeMonths('2028-01-01', 'madre');
  assert.equal(effectiveHome({}, rule, '2028-01-31'), 'madre');
  assert.equal(effectiveHome({}, rule, '2028-02-01'), 'padre');
  assert.equal(effectiveHome({}, rule, '2028-02-29'), 'padre');
  assert.equal(effectiveHome({}, rule, '2028-03-01'), 'madre');
  assert.equal(effectiveHome({}, rule, '2029-01-01'), 'madre');
  assert.throws(() => makeMonths('2028-01-15', 'madre'), /primer día/);
  const preview = previewCycles(rule, {});
  assert.equal(preview[0]?.start, '2028-01-01');
  assert.equal(preview[0]?.end, '2028-02-29');
  assert.equal(preview[1]?.start, '2028-03-01');
  assert.equal(preview[1]?.end, '2028-04-30');
});

test('ciclo personalizado 9/5 y cambios de hora conservan los días', () => {
  const rule = makeCycle('2027-03-20', [{ days: 9, home: 'madre' }, { days: 5, home: 'padre' }], 'custom');
  assert.equal(effectiveHome({}, rule, '2027-03-28'), 'madre');
  assert.equal(effectiveHome({}, rule, '2027-03-29'), 'padre');
  assert.equal(effectiveHome({}, rule, '2027-04-03'), 'madre');
  const preview = previewCycles(rule, {});
  assert.equal(preview[0]?.end, '2027-04-02');
  assert.equal(preview[1]?.end, '2027-04-16');
});

test('próximos cambios después de 14 días y retorno tras excepción larga', () => {
  const custom = makeCycle('2026-10-01', [{ days: 40, home: 'madre' }, { days: 9, home: 'padre' }], 'custom');
  assert.deepEqual(effectiveNextChange({}, custom, '2026-10-02'), { date: '2026-11-10', home: 'padre' });
  const months = makeMonths('2028-01-01', 'madre');
  assert.deepEqual(effectiveNextChange({}, months, '2028-01-02'), { date: '2028-02-01', home: 'padre' });
  const exceptions = setExceptionRange({}, '2028-01-31', '2028-03-05', 'madre');
  assert.deepEqual(effectiveNextChange(exceptions, months, '2028-01-02'), { date: '2028-04-01', home: 'padre' });
  const unknown = setExceptionRange({}, '2028-02-01', '2028-02-01', null);
  assert.deepEqual(effectiveNextChange(unknown, months, '2028-01-02'), { date: '2028-03-01', home: 'madre' });
});

test('vista previa muestra dos ciclos íntegros e identifica excepciones sin perder la rutina', () => {
  const rule = makeCycle('2026-10-01', [{ days: 7, home: 'madre' }, { days: 7, home: 'padre' }], 'weeks');
  const preview = previewCycles(rule, { '2026-10-02': 'padre', '2026-10-03': null });
  assert.equal(preview.length, 2);
  assert.equal(preview[1]?.end, '2026-10-28');
  const day = preview[0]?.segments.find(segment => segment.start === '2026-10-02');
  assert.equal(day?.home, 'padre');
  assert.equal(day?.usualHome, 'madre');
  assert.equal(day?.exception, true);
  assert.equal(preview[0]?.segments.find(segment => segment.start === '2026-10-03')?.home, null);
});

test('límites útiles y validación de ciclos, sin aceptar valores vacíos o fraccionarios', () => {
  for (const blocks of [
    [{ days: 1, home: 'madre' }],
    [{ days: 1.5, home: 'madre' }, { days: 3, home: 'padre' }],
    [{ days: 0, home: 'madre' }, { days: 3, home: 'padre' }],
    [{ days: 61, home: 'madre' }, { days: 3, home: 'padre' }],
    [{ days: 60, home: 'madre' }, { days: 31, home: 'padre' }],
    Array.from({ length: 13 }, (_, i) => ({ days: 1, home: i % 2 ? 'madre' : 'padre' })),
  ]) assert.throws(() => validateRoutine({ kind: 'cycle', start: '2026-10-01', blocks, template: 'custom' }));
});

test('lectura de v2 semanal y guardado de nuevas rutinas sin cambiar claves o excepciones', async () => {
  const previous = { version: 2, profile: 'hija', setupComplete: true, schedule: { '2026-10-31': null }, routine: { start: '2026-10-26', days: [null,null,null,null,'alterno','alterno','alterno'], referenceFriday: '2026-10-30', referenceHome: 'padre', otherWeekendHome: null } };
  const decoded = decodeState(JSON.stringify(previous));
  assert.deepEqual(decoded, previous);
  const disk = new Map<string,string>();
  const store = { getItem: async (key: string) => disk.get(key) ?? null, setItem: async (key: string, value: string) => { disk.set(key, value); } };
  const next = { ...initialState(), profile: 'hija' as const, setupComplete: true, schedule: decoded.schedule, routine: makeMonths('2027-01-01', 'padre') };
  await saveState(store, next);
  assert.ok(disk.has('custodia.calendario.v2'));
  assert.deepEqual(await loadState(store), next);
  assert.equal(effectiveHome(next.schedule, next.routine, '2026-10-31'), null);
});

test('primer patrón ampliado conserva una copia v2 anterior y los siguientes no la sobrescriben', async () => {
  const previous = JSON.stringify({ ...initialState(), profile: 'padre', setupComplete: true, schedule: { '2026-10-31': 'madre' } });
  const disk = new Map<string,string>([['custodia.calendario.v2', previous]]);
  const store = { getItem: async (key: string) => disk.get(key) ?? null, setItem: async (key: string, value: string) => { disk.set(key, value); } };
  const state = { ...decodeState(previous), routine: makeMonths('2027-01-01', 'padre') };
  await saveState(store, state);
  assert.equal(disk.get('custodia.calendario.v2.pre-plantillas'), previous);
  await saveState(store, { ...state, routine: makeMonths('2027-02-01', 'madre') });
  assert.equal(disk.get('custodia.calendario.v2.pre-plantillas'), previous);
  assert.equal((await loadState(store)).schedule['2026-10-31'], 'madre');
});

test('si no puede conservar la copia anterior, no sobrescribe el calendario guardado', async () => {
  const previous = JSON.stringify(initialState());
  const disk = new Map<string,string>([['custodia.calendario.v2', previous]]);
  const store = { getItem: async (key: string) => disk.get(key) ?? null, setItem: async (key: string, value: string) => {
    if (key.endsWith('pre-plantillas')) throw new Error('Sin espacio');
    disk.set(key, value);
  } };
  await assert.rejects(saveState(store, { ...initialState(), routine: makeMonths('2027-01-01', 'padre') }), /Sin espacio/);
  assert.equal(disk.get('custodia.calendario.v2'), previous);
});

test('la edición de una rutina antigua con días fijos y otro turno desconocido conserva el editor semanal', () => {
  const rule: Routine = { start: '2026-10-26', days: ['madre','madre','madre','madre','alterno','alterno','alterno'], referenceFriday: '2026-10-30', referenceHome: 'padre', otherWeekendHome: null };
  assert.equal(detectPattern(rule), 'weekly');
  assert.equal(effectiveHome({}, rule, '2026-11-02'), 'madre');
  assert.equal(effectiveHome({}, rule, '2026-11-06'), null);
});

test('principalmente con uno conserva sus días y las opciones para editar tras recargar', () => {
  const rule = makePrimary('2026-10-26', { home: 'madre', guest: 'padre', visitDays: [2,4,5,6], alternate: true }, '2026-10-30');
  const saved = decodeState(JSON.stringify({ ...initialState(), profile: 'hija', setupComplete: true, routine: rule }));
  assert.equal(detectPattern(saved.routine), 'primary');
  assert.deepEqual(saved.routine, rule);
  assert.equal(effectiveHome({}, saved.routine, '2026-10-28'), 'padre');
  assert.equal(effectiveHome({}, saved.routine, '2026-11-06'), 'madre');
});
