import { expect, test } from '@playwright/test';

test('Cuenta y familia explica la conexión pendiente y conserva el modo individual', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('custodia.calendario.v2', JSON.stringify({
    version: 2, profile: 'hija', schedule: { '2026-11-10': 'madre' }, routine: null, setupComplete: true,
  })));
  await page.goto('/');
  await page.getByRole('button', { name: 'Cuenta y familia', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Conexión familiar pendiente' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Crear cuenta', exact: true })).toBeDisabled();
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/familia-pendiente-' + width + '.png' });
  }
  await page.getByRole('button', { name: 'Volver al modo individual', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hoy y mañana', exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('custodia.calendario.v2')!).schedule)).toEqual({ '2026-11-10': 'madre' });
});
