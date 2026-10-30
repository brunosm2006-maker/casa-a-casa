import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyOverview, millisecondsToMidnight } from '../src/dailyOverview';
import { type Routine } from '../src/routine';
process.env.TZ = 'Europe/Madrid';

test('hoy y mañana cruzan fin de año y usan las estancias efectivas', () => {
  const routine: Routine = { kind: 'cycle', start: '2026-12-25', blocks: [{ days: 7, home: 'madre' }, { days: 7, home: 'padre' }], template: 'weeks' };
  const view = dailyOverview('2026-12-31', {}, routine);
  assert.deepEqual(view.today, { date: '2026-12-31', home: 'madre', exception: false });
  assert.deepEqual(view.tomorrow, { date: '2027-01-01', home: 'padre', exception: false });
  assert.deepEqual(view.change, { date: '2027-01-01', home: 'padre' });
});
test('mes bisiesto y excepción vacía no asignan por defecto el otro progenitor', () => {
  const routine: Routine = { kind: 'months', start: '2028-01-01', firstHome: 'madre' };
  const view = dailyOverview('2028-02-29', { '2028-03-01': null }, routine);
  assert.equal(view.today.home, 'padre');
  assert.deepEqual(view.tomorrow, { date: '2028-03-01', home: null, exception: true });
  assert.equal(view.change?.date, '2028-04-01');
});
test('se conserva el cambio previsto para hoy y se encuentran cambios lejanos', () => {
  const routine: Routine = { kind: 'cycle', start: '2026-10-01', blocks: [{ days: 40, home: 'madre' }, { days: 9, home: 'padre' }], template: 'custom' };
  assert.equal(dailyOverview('2026-10-02', {}, routine).change?.date, '2026-11-10');
  assert.deepEqual(dailyOverview('2026-11-10', {}, routine).change, { date: '2026-11-10', home: 'padre' });
});
test('sin rutina conserva días manuales y evita inventar cambios a través de huecos', () => {
  const view = dailyOverview('2026-10-30', { '2026-10-31': 'padre' }, null);
  assert.equal(view.today.home, null);
  assert.equal(view.tomorrow?.home, 'padre');
  assert.equal(view.change, null);
  assert.equal(dailyOverview('2100-12-31', {}, null).tomorrow, null);
});
test('refresco a medianoche usa la siguiente fecha local, incluidos días de cambio de hora', () => {
  assert.equal(millisecondsToMidnight(new Date(2026, 11, 31, 23, 59, 59)), 1050);
  assert.equal(millisecondsToMidnight(new Date(2027, 2, 28, 0, 0, 0)), 23 * 60 * 60 * 1000 + 50);
});
