import { test, expect, type Page } from '@playwright/test';

async function stay(page: Page, start: string, end: string, home: 'madre' | 'padre' | null) {
  await page.getByRole('button', { name: 'Añadir estancia', exact: true }).click();
  await page.getByRole('textbox', { name: 'Fecha inicial' }).fill(start);
  await page.getByRole('textbox', { name: 'Fecha final' }).fill(end);
  await page.getByRole('radio', { name: home ? `Con ${home}` : 'Quitar asignación' }).click();
  await page.getByRole('button', { name: 'Guardar estancia', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Organiza una estancia' })).toHaveCount(0);
}

test('calendario vacío, rango entre años, edición, borrado, perfiles y persistencia', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-29T12:00:00+01:00') });
  await page.goto('/');
  await page.getByRole('radio', { name: 'Hijo o hija' }).press('Enter');
  await expect(page.getByText('Tu calendario empieza aquí', { exact: true })).toBeVisible();
  await expect(page.getByText('Hoy todavía no tiene una casa asignada.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await page.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'diciembre', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Añadir estancia', exact: true }).click();
  await page.getByRole('textbox', { name: 'Fecha inicial' }).fill('31/02/2026');
  await page.getByRole('button', { name: 'Guardar estancia', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('La fecha no existe');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await stay(page, '31/12/2026', '02/01/2027', 'madre');
  await expect(page.getByRole('button', { name: '31 de diciembre de 2026, con madre', exact: true })).toBeVisible();
  await stay(page, '03/01/2027', '04/01/2027', 'padre');
  await expect(page.getByRole('heading', { name: '3 de enero de 2027 · con padre', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await page.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await page.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await expect(page.getByRole('button', { name: '1 de enero de 2027, con madre', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '1 de enero de 2027, con madre', exact: true }).click();
  await page.getByRole('radio', { name: 'Con padre' }).click();
  await page.getByRole('button', { name: 'Guardar estancia', exact: true }).click();
  await expect(page.getByRole('heading', { name: '1 de enero de 2027 · con padre', exact: true })).toBeVisible();
  await stay(page, '01/01/2027', '02/01/2027', null);
  await expect(page.getByRole('button', { name: '1 de enero de 2027, sin asignar', exact: true })).toBeVisible();
  await expect(page.getByText('Sin cambios definidos', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Perfil', exact: true }).click();
  await page.getByRole('radio', { name: 'Padre', exact: false }).click();
  await expect(page.getByText('2 días contigo este mes.', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Padre', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Ir a hoy', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'octubre', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('fallo de almacenamiento no confirma un perfil guardado', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Sin espacio'); }; });
  await page.goto('/');
  await page.getByRole('radio', { name: 'Hijo o hija' }).click();
  await expect(page.getByRole('alert')).toContainText('No se han podido guardar');
  await expect(page.getByRole('heading', { name: '¿Cómo usarás el calendario?' })).toBeVisible();
});

test('datos locales dañados se muestran como error de lectura', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('custodia.calendario.v1', '{'); });
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('No se han podido leer');
  await expect(page.getByRole('button', { name: 'Volver a intentar' })).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(0);
});

test('interfaz sin desbordamiento a 320, 768 y 1440 píxeles', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'Hijo o hija' }).click();
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('heading', { name: 'El tiempo en cada casa' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/calendario-movil.png', fullPage: true });
});
