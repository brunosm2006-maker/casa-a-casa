import { test, expect, type Page } from '@playwright/test';

async function begin(page: Page, profile: string, pattern: string) {
  await page.clock.install({ time: new Date('2026-10-29T12:00:00+01:00') });
  await page.goto('/');
  await page.getByRole('radio', { name: profile, exact: true }).click();
  await expect(page.getByRole('heading', { name: profile === 'Hija' ? '¿Cómo os organizáis habitualmente?' : '¿Cómo os organizáis habitualmente?' })).toBeVisible();
  if (profile === 'Hija') await page.screenshot({ path: 'test-results/cuestionario-inicio.png' });
  await page.getByRole('radio', { name: pattern, exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('textbox', { name: 'Inicio de la rutina' }).fill('26/10/2026');
}

async function finish(page: Page) {
  await page.getByRole('button', { name: 'Revisar respuestas', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Revisa tus respuestas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'El tiempo en cada casa' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Guardar rutina', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hoy y mañana', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Calendario', exact: true }).click();
  await page.getByRole('tab', { name: 'Calendario', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'El tiempo en cada casa' })).toBeVisible();
}

async function editDay(page: Page, name: string, choice: string) {
  await page.getByRole('button', { name, exact: true }).click();
  await page.getByRole('radio', { name: new RegExp(`^${choice}`) }).click();
  await page.getByRole('button', { name: 'Guardar cambio puntual', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cambio puntual' })).toHaveCount(0);
}

test('perfil → cuestionario semanal → revisión → calendario, excepciones y años siguientes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await begin(page, 'Hija', 'Días fijos y fines de semana alternos');
  await page.getByRole('button', { name: 'Revisar respuestas', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Elige un viernes');
  await page.getByRole('textbox', { name: 'Viernes de referencia' }).fill('29/10/2026');
  await page.getByRole('radio', { name: 'Fin de semana de referencia: Madre', exact: true }).click();
  await page.getByRole('button', { name: 'Revisar respuestas', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('debe ser un viernes');
  await page.getByRole('textbox', { name: 'Viernes de referencia' }).fill('30/10/2026');
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: 'test-results/cuestionario-semanal.png' });
  await finish(page);
  await expect(page.getByRole('button', { name: '26 de octubre de 2026, con madre', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '28 de octubre de 2026, con padre', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '30 de octubre de 2026, con madre', exact: true })).toBeVisible();
  await editDay(page, '30 de octubre de 2026, con madre', 'Dejar sin asignar');
  await expect(page.getByRole('button', { name: '30 de octubre de 2026, sin asignar', exact: true })).toBeVisible();
  await editDay(page, '30 de octubre de 2026, sin asignar', 'Quitar cambio puntual');
  await expect(page.getByRole('button', { name: '30 de octubre de 2026, con madre', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await expect(page.getByRole('button', { name: '6 de noviembre de 2026, con padre', exact: true })).toBeVisible();
  await editDay(page, '2 de noviembre de 2026, con madre', 'Con padre');
  await page.reload();
  await page.getByRole('tab', { name: 'Calendario', exact: true }).click();
  await page.getByRole('tab', { name: 'Calendario', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'El tiempo en cada casa' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '¿Cómo os organizáis habitualmente?' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await expect(page.getByRole('button', { name: '2 de noviembre de 2026, con padre', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '3 de noviembre de 2026, con madre', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cambiar rutina', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('radio', { name: 'Martes: Padre', exact: true }).click();
  await finish(page);
  await page.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await expect(page.getByRole('button', { name: '2 de noviembre de 2026, con padre', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '3 de noviembre de 2026, con padre', exact: true })).toBeVisible();
  await editDay(page, '2 de noviembre de 2026, con padre', 'Quitar cambio puntual');
  await expect(page.getByRole('button', { name: '2 de noviembre de 2026, con madre', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await page.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await expect(page.getByRole('button', { name: '1 de enero de 2027, con padre', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '8 de enero de 2027, con madre', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('padre con un fin de semana de cada dos, sin asignar el resto y sin editar 14 días', async ({ page }) => {
  await begin(page, 'Padre', 'Principalmente con uno');
  await expect(page.getByRole('radio', { name: 'Lunes: Madre', exact: true })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Viernes de referencia' }).fill('30/10/2026');
  await page.getByRole('radio', { name: 'Progenitor de las otras estancias: Padre', exact: true }).click();
  await finish(page);
  await expect(page.getByRole('button', { name: '26 de octubre de 2026, sin asignar', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '30 de octubre de 2026, con padre', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await expect(page.getByRole('button', { name: '1 de noviembre de 2026, con padre', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '6 de noviembre de 2026, sin asignar', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '13 de noviembre de 2026, con padre', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: 'Calendario', exact: true }).click();
  await page.getByRole('tab', { name: 'Calendario', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'El tiempo en cada casa' })).toBeVisible();
  await expect(page.getByRole('button', { name: '30 de octubre de 2026, con padre', exact: true })).toBeVisible();
});

test('datos antiguos conservados, configuración posterior sin forzar nuevo inicio', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-29T12:00:00+01:00') });
  await page.addInitScript(() => localStorage.setItem('custodia.calendario.v1', JSON.stringify({ version: 1, profile: 'madre', schedule: { '2026-10-26': 'padre' } })));
  await page.goto('/');
  await page.getByRole('tab', { name: 'Calendario', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'El tiempo en cada casa' })).toBeVisible();
  await expect(page.getByRole('button', { name: '26 de octubre de 2026, con padre', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Configurar rutina', exact: true }).click();
  await page.getByRole('radio', { name: 'Días fijos y fines de semana alternos', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('textbox', { name: 'Inicio de la rutina' }).fill('26/10/2026');
  await page.getByRole('textbox', { name: 'Viernes de referencia' }).fill('30/10/2026');
  await page.getByRole('radio', { name: 'Fin de semana de referencia: Madre', exact: true }).click();
  await finish(page);
  await expect(page.getByRole('button', { name: '26 de octubre de 2026, con padre', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: 'Calendario', exact: true }).click();
  await expect(page.getByRole('button', { name: '26 de octubre de 2026, con padre', exact: true })).toBeVisible();
});

test('una plantilla sin confirmar no se guarda y el primer uso incompleto vuelve al cuestionario', async ({ page }) => {
  await begin(page, 'Hija', 'Días fijos y fines de semana alternos');
  await page.getByRole('textbox', { name: 'Viernes de referencia' }).fill('30/10/2026');
  await page.getByRole('radio', { name: 'Fin de semana de referencia: Madre', exact: true }).click();
  await page.getByRole('button', { name: 'Revisar respuestas', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Revisa tus respuestas' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: '¿Cómo os organizáis habitualmente?' })).toBeVisible();
  await page.getByRole('button', { name: 'Ahora no · usar calendario manual' }).click();
  await expect(page.getByText('Tu calendario empieza aquí', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: 'Calendario', exact: true }).click();
  await expect(page.getByText('Tu calendario empieza aquí', { exact: true })).toBeVisible();
});
