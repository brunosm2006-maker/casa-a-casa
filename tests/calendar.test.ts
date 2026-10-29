import test from 'node:test';
import assert from 'node:assert/strict';
import { assignRange, dateKey, monthCells, moveMonth, nextChange, parseDate } from '../src/calendar';

test('febrero bisiesto y calendario con lunes como primer día', () => {
  const cells = monthCells(2024, 1);
  assert.equal(cells.filter(Boolean).length, 29);
  assert.deepEqual(cells.slice(0, 4), [null, null, null, '2024-02-01']);
  assert.equal(monthCells(2025, 1).filter(Boolean).length, 28);
});

test('cambiar de mes desde el día 31 no salta febrero; cruza de año', () => {
  assert.deepEqual(moveMonth(2026, 0, 1), { year: 2026, month: 1 });
  assert.deepEqual(moveMonth(2026, 11, 1), { year: 2027, month: 0 });
  assert.deepEqual(moveMonth(2026, 0, -1), { year: 2025, month: 11 });
});

test('estancias inclusivas cruzan mes, año y cambio de hora sin desplazar días', () => {
  const schedule = assignRange({}, '2026-10-24', '2026-11-02', 'madre');
  assert.equal(Object.keys(schedule).length, 10);
  assert.equal(schedule['2026-10-25'], 'madre');
  assert.equal(schedule['2026-11-02'], 'madre');
  assert.equal(Object.keys(assignRange({}, '2026-12-31', '2027-01-02', 'padre')).length, 3);
});

test('editar y borrar un tramo respeta las fechas ajenas y la entrada original', () => {
  const original = assignRange({}, '2026-10-01', '2026-10-05', 'madre');
  const edited = assignRange(original, '2026-10-02', '2026-10-03', 'padre');
  const erased = assignRange(edited, '2026-10-03', '2026-10-03', null);
  assert.equal(original['2026-10-02'], 'madre');
  assert.equal(edited['2026-10-02'], 'padre');
  assert.equal(erased['2026-10-03'], undefined);
  assert.equal(erased['2026-10-04'], 'madre');
});

test('rechaza fechas inexistentes, formato incorrecto, rango invertido y excesivo', () => {
  for (const value of ['2026-02-29', '2026-13-01', '26-01-01', '2026-01-32']) {
    assert.throws(() => parseDate(value));
  }
  assert.throws(() => assignRange({}, '2026-05-03', '2026-05-01', 'padre'));
  assert.throws(() => assignRange({}, '2026-01-01', '2028-01-01', 'padre'));
  assert.equal(dateKey(parseDate('2024-02-29')), '2024-02-29');
});

test('próximo cambio incluye hoy si ayer se estaba con el otro progenitor', () => {
  const schedule = { '2026-10-28': 'madre', '2026-10-29': 'padre', '2026-10-30': 'padre' } as const;
  assert.deepEqual(nextChange(schedule, '2026-10-29'), { date: '2026-10-29', home: 'padre' });
});

test('no deduce cambios a través de huecos ni desde un calendario sin configurar', () => {
  assert.equal(nextChange({}, '2026-10-29'), null);
  assert.equal(nextChange({ '2026-10-29': 'madre', '2026-11-01': 'padre' }, '2026-10-29'), null);
  assert.deepEqual(nextChange({ '2026-10-29': 'madre', '2026-10-30': 'madre', '2026-10-31': 'padre' }, '2026-10-29'), { date: '2026-10-31', home: 'padre' });
});
