import { test, expect, type Page } from '@playwright/test';
async function start(page: Page, pattern: string, date: string) {
  await page.clock.install({ time: new Date('2026-10-30T12:00:00+01:00') });
  await page.goto('/');
  await page.getByRole('radio', { name: 'Madre', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¿Cómo os organizáis habitualmente?', exact: true })).toBeVisible();
  await page.getByRole('radio', { name: pattern, exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('textbox', { name: 'Inicio de la rutina' }).fill(date);
}
async function review(page: Page) {
  await page.getByRole('button', { name: 'Revisar respuestas', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Revisa tus respuestas', exact: true })).toBeVisible();
  await expect(page.getByTestId('preview-cycle-1')).toBeVisible();
  await expect(page.getByTestId('preview-cycle-2')).toBeAttached();
}
async function save(page: Page) {
  await page.getByRole('button', { name: 'Guardar rutina', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hoy y mañana', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Calendario', exact: true }).click();
  await page.getByRole('tab', { name: 'Calendario', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'El tiempo en cada casa' })).toBeVisible();
}
const day = (page: Page, date: string, home: string) => page.getByRole('button', { name: date + ', ' + home, exact: true });

test('semanas alternas en miércoles: dos ciclos fechados, recarga y edición posterior', async ({ page }) => {
  await start(page, 'Semanas alternas', '28/10/2026');
  await page.getByRole('radio', { name: 'Primer progenitor: Padre', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Viernes de referencia' })).toHaveCount(0);
  await review(page);
  await expect(page.getByTestId('preview-cycle-1')).toContainText('28 de octubre de 2026 al 10 de noviembre de 2026');
  await expect(page.getByTestId('preview-cycle-2')).toContainText('11 de noviembre de 2026 al 24 de noviembre de 2026');
  await save(page);
  await expect(day(page, '28 de octubre de 2026', 'con padre')).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: 'Calendario', exact: true }).click();
  await page.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await expect(day(page, '3 de noviembre de 2026', 'con padre')).toBeVisible();
  await expect(day(page, '4 de noviembre de 2026', 'con madre')).toBeVisible();
  await page.getByRole('button', { name: 'Cambiar rutina', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Primer progenitor: Padre', exact: true })).toBeChecked();
  await expect(page.getByRole('textbox', { name: 'Inicio de la rutina' })).toHaveValue('28/10/2026');
});

test('quince días atraviesan febrero bisiesto sin anclaje en viernes', async ({ page }) => {
  await start(page, 'Periodos más largos', '20/02/2028');
  await page.getByRole('radio', { name: 'Duración de cada turno: 15 días', exact: true }).click();
  await page.getByRole('radio', { name: 'Primer progenitor: Madre', exact: true }).click();
  await review(page);
  await expect(page.getByTestId('preview-cycle-1')).toContainText('20 de febrero de 2028 al 20 de marzo de 2028');
  await save(page);
  await expect(day(page, '29 de febrero de 2028', 'con madre')).toBeVisible();
  await page.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await expect(day(page, '5 de marzo de 2028', 'con madre')).toBeVisible();
  await expect(day(page, '6 de marzo de 2028', 'con padre')).toBeVisible();
});

test('meses naturales exigen día uno y muestran cuatro meses reales', async ({ page }) => {
  await start(page, 'Periodos más largos', '15/01/2028');
  await page.getByRole('radio', { name: 'Duración de cada turno: Meses naturales', exact: true }).click();
  await page.getByRole('radio', { name: 'Primer progenitor: Madre', exact: true }).click();
  await page.getByRole('button', { name: 'Revisar respuestas', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('primer día de un mes');
  await page.getByRole('textbox', { name: 'Inicio de la rutina' }).fill('01/01/2028');
  await review(page);
  await expect(page.getByTestId('preview-cycle-1')).toContainText('1 de enero de 2028 al 29 de febrero de 2028');
  await expect(page.getByTestId('preview-cycle-2')).toContainText('1 de marzo de 2028 al 30 de abril de 2028');
  await page.screenshot({ path: 'test-results/meses-naturales-revision.png' });
  await save(page);
  await expect(day(page, '31 de enero de 2028', 'con madre')).toBeVisible();
  await expect(page.getByRole('heading', { name: '1 de febrero de 2028 · con padre', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await expect(day(page, '29 de febrero de 2028', 'con padre')).toBeVisible();
});

test('plantilla 2–2–5–5 muestra dos ciclos e identifica las fechas de cada bloque', async ({ page }) => {
  await start(page, 'Ciclos de varios días', '26/10/2026');
  await page.getByRole('radio', { name: 'Tipo de ciclo: 2–2–5–5', exact: true }).click();
  await page.getByRole('radio', { name: 'Primer progenitor: Madre', exact: true }).click();
  await review(page);
  await expect(page.getByTestId('preview-cycle-1')).toContainText('26 de octubre de 2026 al 8 de noviembre de 2026');
  await expect(page.getByTestId('preview-cycle-2')).toContainText('9 de noviembre de 2026 al 22 de noviembre de 2026');
  await page.screenshot({ path: 'test-results/ciclos-revision.png' });
  await save(page);
  await expect(day(page, '30 de octubre de 2026', 'con madre, hoy')).toBeVisible();
  await page.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await expect(day(page, '2 de noviembre de 2026', 'con madre')).toBeVisible();
  await expect(day(page, '4 de noviembre de 2026', 'con padre')).toBeVisible();
});

test('reparto 9/5: validación, añadir y quitar bloques, confirmación y recarga', async ({ page }) => {
  await start(page, 'Crear mi propio reparto', '01/10/2026');
  await page.getByRole('textbox', { name: 'Días del bloque 1', exact: true }).fill('');
  await page.getByRole('button', { name: 'Revisar respuestas', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('número entero');
  await page.getByRole('textbox', { name: 'Días del bloque 1', exact: true }).fill('9');
  await page.getByRole('button', { name: 'Añadir bloque', exact: true }).click();
  await page.getByRole('button', { name: 'Quitar bloque 3', exact: true }).click();
  await review(page);
  await expect(page.getByTestId('preview-cycle-1')).toContainText('1 de octubre de 2026 al 14 de octubre de 2026');
  await expect(page.getByTestId('preview-cycle-2')).toContainText('15 de octubre de 2026 al 28 de octubre de 2026');
  await save(page);
  await expect(day(page, '9 de octubre de 2026', 'con madre')).toBeVisible();
  await expect(day(page, '10 de octubre de 2026', 'con padre')).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: 'Calendario', exact: true }).click();
  await expect(day(page, '15 de octubre de 2026', 'con madre')).toBeVisible();
});

test('hogar habitual y días completos con el otro, con fin de semana alterno', async ({ page }) => {
  await start(page, 'Principalmente con uno', '26/10/2026');
  await page.getByRole('radio', { name: 'Progenitor habitual: Madre', exact: true }).click();
  await page.getByRole('radio', { name: 'Progenitor de las otras estancias: Padre', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Estancia: Miércoles', exact: true }).click();
  await page.getByRole('textbox', { name: 'Viernes de referencia' }).fill('30/10/2026');
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await review(page);
  await save(page);
  await expect(day(page, '26 de octubre de 2026', 'con madre')).toBeVisible();
  await expect(day(page, '28 de octubre de 2026', 'con padre')).toBeVisible();
  await expect(day(page, '30 de octubre de 2026', 'con padre, hoy')).toBeVisible();
  await page.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await expect(day(page, '6 de noviembre de 2026', 'con madre')).toBeVisible();
});

test('rutina v2 antigua conserva días habituales aunque el otro fin de semana sea desconocido', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-30T12:00:00+01:00') });
  await page.addInitScript(() => localStorage.setItem('custodia.calendario.v2', JSON.stringify({
    version: 2, profile: 'madre', setupComplete: true, schedule: {},
    routine: { start: '2026-10-26', days: ['madre','madre','madre','madre','alterno','alterno','alterno'], referenceFriday: '2026-10-30', referenceHome: 'padre', otherWeekendHome: null },
  })));
  await page.goto('/');
  await page.getByRole('button', { name: 'Cambiar rutina', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Lunes: Madre', exact: true })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Los otros fines de semana: Sin asignar', exact: true })).toBeChecked();
  await review(page);
  await save(page);
  await page.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await expect(day(page, '2 de noviembre de 2026', 'con madre')).toBeVisible();
  await expect(day(page, '6 de noviembre de 2026', 'sin asignar')).toBeVisible();
});
