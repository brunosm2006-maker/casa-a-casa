import test from 'node:test';
import assert from 'node:assert/strict';
import { editDate } from '../src/dateEditing';
import { fromInput } from '../src/calendar';

test('escritura secuencial: ocho dígitos generan DD/MM/AAAA', () => {
  let value = '';
  for (const char of '30102026') {
    value = editDate(value, value + char, { start: value.length, end: value.length }).value;
  }
  assert.equal(value, '30/10/2026');
});
test('pegar con barras, guiones, puntos o sin separadores conserva ocho dígitos', () => {
  for (const text of ['30102026', '30/10/2026', '30-10-2026', '30.10.2026', '30 / 10 / 2026']) {
    assert.equal(editDate('', text, { start: 0, end: 0 }).value, '30/10/2026');
  }
  assert.equal(editDate('', '301020261234', { start: 0, end: 0 }).value, '30/10/2026');
});
test('retroceso sobre la barra elimina el dígito anterior y no atrapa el cursor', () => {
  const result = editDate('30/10/2026', '3010/2026', { start: 3, end: 3 }, 2, 'Backspace');
  assert.equal(result.value, '31/02/026');
  assert.deepEqual(result.selection, { start: 1, end: 1 });
  assert.equal(editDate('30/10/2026', '3010/2026', { start: 2, end: 2 }, 2, 'Delete').value, '30/02/026');
});
test('sustituir el mes mantiene el cursor tras el mes, sin saltar al final', () => {
  const result = editDate('30/10/2026', '30/11/2026', { start: 3, end: 5 }, 5);
  assert.equal(result.value, '30/11/2026');
  assert.deepEqual(result.selection, { start: 5, end: 5 });
});
test('borrar el contenido y formatear no da validez a una fecha inexistente', () => {
  assert.equal(editDate('30/10/2026', '', { start: 0, end: 10 }).value, '');
  const formatted = editDate('', '31022026', { start: 0, end: 0 }).value;
  assert.equal(formatted, '31/02/2026');
  assert.throws(() => fromInput(formatted));
});
