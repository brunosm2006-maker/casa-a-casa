import { test, expect, type Page } from '@playwright/test';
async function stored(page: Page, profile: string, schedule: Record<string, string | null>, routine: unknown) {
  await page.addInitScript(state => localStorage.setItem('custodia.calendario.v2', JSON.stringify(state)),
    { version: 2, profile, schedule, routine, setupComplete: true });
}
test('hija: fin de año, medianoche y refresco al volver a la aplicación', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-12-31T23:59:59+01:00') });
  await stored(page, 'hija', {}, { kind: 'cycle', start: '2026-12-25', blocks: [{ days: 7, home: 'madre' }, { days: 7, home: 'padre' }], template: 'weeks' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hoy y mañana', exact: true })).toBeVisible();
  await expect(page.getByTestId('today-card')).toContainText('31 de diciembre de 2026');
  await expect(page.getByTestId('today-card')).toContainText('Con madre');
  await expect(page.getByTestId('tomorrow-card')).toContainText('1 de enero de 2027');
  await expect(page.getByTestId('tomorrow-card')).toContainText('Con padre');
  await page.clock.runFor(1500);
  await expect(page.getByTestId('today-card')).toContainText('1 de enero de 2027');
  await expect(page.getByTestId('next-change-card')).toContainText('El cambio está previsto para hoy');
  await expect(page.getByTestId('next-change-card')).toContainText('No hay una hora');
  await page.clock.setSystemTime(new Date('2027-01-08T12:00:00+01:00'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByTestId('today-card')).toContainText('8 de enero de 2027');
  await expect(page.getByTestId('today-card')).toContainText('Con madre');
  await page.clock.setSystemTime(new Date('2027-01-09T12:00:00+01:00'));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.getByTestId('today-card')).toContainText('9 de enero de 2027');
});
test('perfiles madre, padre e hijo y excepción guardada se reflejan inmediatamente', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-30T12:00:00+01:00') });
  await stored(page, 'madre', { '2026-10-31': 'padre' }, { kind: 'cycle', start: '2026-10-30', blocks: [{ days: 7, home: 'madre' }, { days: 7, home: 'padre' }], template: 'weeks' });
  await page.goto('/');
  await expect(page.getByTestId('today-card')).toContainText('Estancia contigo');
  await expect(page.getByTestId('tomorrow-card')).toContainText('Con su padre');
  await page.getByRole('tab', { name: 'Perfil', exact: true }).click();
  await page.getByRole('radio', { name: 'Padre', exact: true }).click();
  await expect(page.getByTestId('today-card')).toContainText('Con su madre');
  await expect(page.getByTestId('tomorrow-card')).toContainText('Estancia contigo');
  await page.getByRole('tab', { name: 'Perfil', exact: true }).click();
  await page.getByRole('radio', { name: 'Hijo', exact: true }).click();
  await expect(page.getByTestId('today-card')).toContainText('Con madre');
  await page.getByRole('button', { name: 'Ver calendario', exact: true }).click();
  await page.getByRole('button', { name: '30 de octubre de 2026, con madre, hoy', exact: true }).click();
  await page.getByRole('radio', { name: 'Con padre' }).click();
  await page.getByRole('button', { name: 'Guardar cambio puntual', exact: true }).click();
  await page.getByRole('tab', { name: 'Hoy y mañana', exact: true }).click();
  await expect(page.getByTestId('today-card')).toContainText('Con padre');
  await expect(page.getByTestId('today-card')).toContainText('Cambio puntual');
});
test('día desconocido y ausencia de rutina sin inventar otro hogar', async ({ page }) => {
  await page.clock.install({ time: new Date('2028-02-29T12:00:00+01:00') });
  await stored(page, 'hijo', { '2028-03-01': 'padre' }, null);
  await page.goto('/');
  await expect(page.getByTestId('today-card')).toContainText('Sin asignar');
  await expect(page.getByTestId('tomorrow-card')).toContainText('1 de marzo de 2028');
  await expect(page.getByTestId('tomorrow-card')).toContainText('Con padre');
  await expect(page.getByTestId('next-change-card')).toContainText('Aún no se puede determinar');
  await expect(page.getByRole('heading', { name: 'Sin rutina configurada', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Configurar rutina', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¿Cómo os organizáis habitualmente?', exact: true })).toBeVisible();
});
test('cambio lejano, nueva rutina, navegación y vista móvil/escritorio', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-02T12:00:00+02:00') });
  await stored(page, 'hija', {}, { kind: 'cycle', start: '2026-10-01', blocks: [{ days: 40, home: 'madre' }, { days: 9, home: 'padre' }], template: 'custom' });
  await page.goto('/');
  await expect(page.getByTestId('next-change-card')).toContainText('10 de noviembre de 2026');
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/hoy-manana-' + width + '.png' });
  }
  await page.getByRole('button', { name: 'Cambiar rutina', exact: true }).click();
  await page.getByRole('radio', { name: 'Semanas alternas', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('textbox', { name: 'Inicio de la rutina' }).fill('02102026');
  await page.getByRole('radio', { name: 'Primer progenitor: Padre', exact: true }).click();
  await page.getByRole('button', { name: 'Revisar respuestas', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar rutina', exact: true }).click();
  await expect(page.getByTestId('today-card')).toContainText('Con padre');
  await expect(page.getByTestId('next-change-card')).toContainText('9 de octubre de 2026');
});
