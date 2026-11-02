import { test, expect, type Page } from '@playwright/test';
const routine = { kind: 'cycle', start: '2026-11-01', blocks: [{ days: 14, home: 'madre' }, { days: 15, home: 'padre' }], template: 'custom' };
const savedBag = { id: 'bag-1', date: '2026-11-15', destination: 'padre', items: [{ id: 'item-1', text: 'Libro', prepared: false }] };
async function setup(page: Page, options: { bags?: unknown[]; noRoutine?: boolean; fail?: boolean; corrupt?: boolean } = {}) {
  await page.clock.install({ time: new Date('2026-11-14T12:00:00+01:00') });
  await page.addInitScript(({ routine, options }) => {
    localStorage.setItem('custodia.calendario.v2', JSON.stringify({ version: 2, profile: 'hija', setupComplete: true,
      schedule: options.noRoutine ? { '2026-11-15': 'padre' } : {}, routine: options.noRoutine ? null : routine }));
    if (localStorage.getItem('custodia.mochilas.v1') === null) localStorage.setItem('custodia.mochilas.v1',
      options.corrupt ? '{"version":999}' : JSON.stringify({ version: 1, lists: options.bags ?? [] }));
    if (options.fail) {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (key === 'custodia.mochilas.v1') throw new Error('Sin espacio');
        return original.call(this, key, value);
      };
    }
  }, { routine, options });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hoy y mañana', exact: true })).toBeVisible();
}
async function add(page: Page, text: string) {
  await page.getByRole('textbox', { name: 'Nombre del objeto', exact: true }).fill(text);
  await page.getByRole('button', { name: 'Añadir objeto', exact: true }).click();
}
test('lista para estancia de quince días, edición, marcas, copia independiente y eliminación confirmada', async ({ page }) => {
  await setup(page);
  await page.getByRole('button', { name: 'Preparar mochila', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Fecha de la mochila' })).toHaveValue('15/11/2026');
  await page.getByRole('button', { name: 'Crear lista', exact: true }).click();
  await page.getByRole('button', { name: 'Añadir objeto', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('nombre');
  await add(page, 'Libro');
  await add(page, 'Cargador');
  await page.getByRole('checkbox', { name: 'Libro', exact: true }).click();
  await page.getByRole('button', { name: 'Editar Cargador', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nuevo texto de Cargador', exact: true }).fill('Cargador del móvil');
  await page.getByRole('button', { name: 'Guardar texto', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Cargador del móvil', exact: true }).click();
  await expect(page.getByText('2 de 2 preparados · Lista completada', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Libro', exact: true }).click();
  await page.reload();
  await expect(page.getByTestId('today-backpack')).toContainText('1 de 2 preparados');
  await page.getByRole('button', { name: 'Ver mochila', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Cargador del móvil', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Libro', exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: 'Copiar esta lista', exact: true }).click();
  await page.getByRole('textbox', { name: 'Fecha de la mochila' }).fill('14122026');
  await page.getByRole('button', { name: 'Crear lista', exact: true }).click();
  await expect(page.getByText('0 de 2 preparados · 2 pendientes', { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Libro', exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: 'Todas las listas', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir mochila del 15 de noviembre de 2026 con padre', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Cargador del móvil', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Quitar Cargador del móvil', exact: true }).click();
  await page.getByRole('button', { name: 'Conservar objeto', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Cargador del móvil', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Quitar Cargador del móvil', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar objeto', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Cargador del móvil', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Eliminar lista', exact: true }).click();
  await page.getByRole('button', { name: 'Conservar lista', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Libro', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar lista', exact: true }).click();
  await page.getByRole('button', { name: 'Sí, eliminar esta lista', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Abrir mochila del 15 de noviembre de 2026 con padre', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Abrir mochila del 14 de diciembre de 2026 con padre', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Cargador del móvil', exact: true })).not.toBeChecked();
});
test('fecha futura sin destino no crea lista; fecha asignada y pantallas estrechas', async ({ page }) => {
  await setup(page, { noRoutine: true });
  await page.getByRole('tab', { name: 'Mochila', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva lista', exact: true }).click();
  await page.getByRole('textbox', { name: 'Fecha de la mochila' }).fill('16112026');
  await page.getByRole('button', { name: 'Crear lista', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('calendario');
  await expect(page.getByRole('button', { name: 'Completar esta fecha en el calendario', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Fecha de la mochila' }).fill('15112026');
  await page.getByRole('button', { name: 'Crear lista', exact: true }).click();
  await expect(page.getByText('Lista vacía · Añade objetos para empezar.', { exact: true })).toBeVisible();
  await add(page, 'Una prenda con un nombre largo que quiero recordar para esta estancia');
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/mochila-' + width + '.png' });
  }
});
test('cambio de destino conserva la lista original y no la muestra para otro cambio', async ({ page }) => {
  await setup(page, { bags: [savedBag] });
  await page.getByRole('button', { name: 'Ver calendario', exact: true }).click();
  await page.getByRole('button', { name: '15 de noviembre de 2026, con padre', exact: true }).click();
  await page.getByRole('radio', { name: 'Con madre' }).click();
  await page.getByRole('button', { name: 'Guardar cambio puntual', exact: true }).click();
  await page.getByRole('tab', { name: 'Mochila', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir mochila del 15 de noviembre de 2026 con padre', exact: true }).click();
  await expect(page.getByTestId('bag-calendar-warning')).toContainText('una estancia con madre');
  await expect(page.getByRole('checkbox', { name: 'Libro', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Hoy y mañana', exact: true }).click();
  await expect(page.getByTestId('next-change-card')).toContainText('16 de noviembre de 2026');
  await expect(page.getByTestId('today-backpack')).toHaveCount(0);
  await page.clock.setSystemTime(new Date('2026-11-15T12:00:00+01:00'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByTestId('today-backpack')).toContainText('16 de noviembre de 2026');
  await expect(page.getByRole('button', { name: 'Ver mochila', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Preparar mochila', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Fecha de la mochila' })).toHaveValue('16/11/2026');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('tab', { name: 'Mochila', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir mochila del 15 de noviembre de 2026 con padre', exact: true }).click();
  await page.getByRole('button', { name: 'Copiar esta lista', exact: true }).click();
  await page.getByRole('textbox', { name: 'Fecha de la mochila' }).fill('15112026');
  await page.getByRole('button', { name: 'Crear lista', exact: true }).click();
  await expect(page.getByText('15 de noviembre de 2026 · con madre', { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Libro', exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: 'Todas las listas', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Abrir mochila del 15 de noviembre de 2026 con padre', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir mochila del 15 de noviembre de 2026 con madre', exact: true })).toBeVisible();
});
test('fallo de guardado conserva textos de edición, marcas y listas previas', async ({ page }) => {
  await setup(page, { bags: [savedBag], fail: true });
  await page.getByRole('button', { name: 'Ver mochila', exact: true }).click();
  await add(page, 'Gorra');
  await expect(page.getByRole('alert')).toContainText('No se han podido guardar');
  await expect(page.getByRole('textbox', { name: 'Nombre del objeto', exact: true })).toHaveValue('Gorra');
  await expect(page.getByRole('checkbox', { name: 'Gorra', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Editar Libro', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nuevo texto de Libro', exact: true }).fill('Libro de verano');
  await page.getByRole('button', { name: 'Guardar texto', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Nuevo texto de Libro', exact: true })).toHaveValue('Libro de verano');
  await page.getByRole('button', { name: 'Cancelar edición', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Libro', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Libro', exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: 'Eliminar lista', exact: true }).click();
  await page.getByRole('button', { name: 'Sí, eliminar esta lista', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Libro', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Conservar lista', exact: true })).toBeVisible();
});
test('mochilas dañadas no bloquean el calendario ni se sustituyen por listas nuevas', async ({ page }) => {
  await setup(page, { corrupt: true });
  await page.getByRole('tab', { name: 'Mochila', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('No se han podido abrir');
  await expect(page.getByRole('button', { name: 'Nueva lista', exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Calendario', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'El tiempo en cada casa' })).toBeVisible();
});
