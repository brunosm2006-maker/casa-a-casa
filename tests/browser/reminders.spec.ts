import { expect, test } from '@playwright/test';

test('Perfil guarda y recupera recordatorios independientes sin pedir permiso en web', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('custodia.calendario.v2')) {
      localStorage.setItem('custodia.calendario.v2', JSON.stringify({ version: 2, profile: 'hija', schedule: {}, routine: null, setupComplete: true }));
    }
    Object.defineProperty(window, 'Notification', { get() { throw new Error('La web no debe acceder al permiso de notificaciones'); } });
  });
  await page.goto('/');
  const profile = page.getByRole('tab', { name: 'Perfil', exact: true });
  const change = page.getByRole('checkbox', { name: 'Cambio de casa', exact: true });
  const bag = page.getByRole('checkbox', { name: 'Preparar la mochila', exact: true });
  const hour = page.getByRole('textbox', { name: 'Hora local · Cambio de casa', exact: true });
  const days = page.getByRole('textbox', { name: 'Días antes · Cambio de casa', exact: true });
  const save = page.getByRole('button', { name: 'Guardar recordatorios', exact: true });
  await profile.click();
  await expect(page.getByRole('heading', { name: 'Recordatorios', exact: true })).toBeVisible();
  await expect(page.getByText('Los avisos del sistema solo se programan', { exact: false })).toBeVisible();
  await expect(change).not.toBeChecked();
  await expect(bag).not.toBeChecked();
  await expect(hour).toHaveValue('18:00');
  await expect(days).toHaveValue('1');
  await change.click();
  await days.fill('0');
  await hour.fill('24:00');
  await save.click();
  await expect(page.getByRole('alert')).toContainText('HH:MM');
  await hour.fill('09:15');
  await save.click();
  await expect(page.getByText('Preferencias guardadas en este dispositivo.')).toBeVisible();
  await page.reload();
  await profile.click();
  await expect(change).toBeChecked();
  await expect(bag).not.toBeChecked();
  await expect(hour).toHaveValue('09:15');
  await expect(days).toHaveValue('0');
  await change.click();
  await bag.click();
  await save.click();
  await expect(page.getByText('Preferencias guardadas en este dispositivo.')).toBeVisible();
  await page.reload();
  await profile.click();
  await expect(change).not.toBeChecked();
  await expect(bag).toBeChecked();
  await expect(page.getByRole('textbox', { name: 'Hora local · Preparar la mochila', exact: true })).toHaveValue('18:00');
});
