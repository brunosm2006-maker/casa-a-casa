import { expect, test, type Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

test.skip(process.env.CASA_FAMILY_BROWSER !== '1', 'Requiere el paquete web aislado con API de prueba');
let server: Server;
let origin: string;
test.beforeAll(async () => {
  await mkdir('docs/revision', { recursive: true });
  const root = resolve('test-results/family-web');
  server = createServer(async (req, res) => {
    try {
      const path = resolve(root, '.' + new URL(req.url!, 'http://local').pathname.replace(/\/$/, '/index.html'));
      if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
      const body = await readFile(path);
      res.writeHead(200, { 'Content-Type': extname(path) === '.js' ? 'application/javascript' : 'text/html' }).end(body);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  origin = 'http://127.0.0.1:' + (server.address() as { port: number }).port;
});
test.afterAll(async () => { if (server) await new Promise<void>(done => server.close(() => done())); });

const ids = {
  user: '00000000-0000-4000-8000-000000000001', childUser: '00000000-0000-4000-8000-000000000002',
  family: '00000000-0000-4000-8000-000000000003', other: '00000000-0000-4000-8000-000000000004',
  parent: '00000000-0000-4000-8000-000000000005', child: '00000000-0000-4000-8000-000000000006',
  calendar: '00000000-0000-4000-8000-000000000007', sibling: '00000000-0000-4000-8000-000000000008',
};
async function fixture(page: Page, child = false) {
  await page.clock.install({ time: new Date('2026-11-09T12:00:00+01:00') });
  const user = { id: child ? ids.childUser : ids.user, email: child ? 'hijo@example.invalid' : 'madre@example.invalid', aud: 'authenticated' };
  const members = [
    { id: ids.parent, family_id: ids.family, user_id: ids.user, name: 'Progenitora de prueba', role: 'parent', profile: 'madre' },
    { id: ids.child, family_id: ids.family, user_id: ids.childUser, name: 'Hijo de prueba', role: 'child', profile: 'hijo' },
    ...child ? [] : [{ id: ids.sibling, family_id: ids.family, user_id: null, name: 'Hermana de prueba', role: 'child', profile: 'hija' }],
  ];
  const calendar = { id: ids.calendar, family_id: ids.family, child_id: ids.child, revision: 0,
    payload: { schedule: { '2026-11-09': 'madre', '2026-11-10': 'padre' }, routine: null } };
  const proposals: any[] = child ? [] : [{ id: 'p1', calendar_id: ids.calendar, author_id: ids.child,
    first_day: '2026-11-10', last_day: '2026-11-10', destination: 'madre', explanation: 'Explicación de prueba',
    base_revision: 0, status: 'pending', resolved_by: null, resolved_at: null }];
  const calls: { action: string; args: any }[] = [];
  let offline = false;
  const access = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url') + '.' +
    Buffer.from(JSON.stringify({ sub: user.id, aud: 'authenticated', exp: 2200000000 })).toString('base64url') + '.test';
  await page.route('https://family-review.supabase.co/**', async route => {
    if (offline) { await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'Servidor de pruebas inaccesible' }) }); return; }
    const url = new URL(route.request().url());
    const respond = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.pathname.includes('/auth/v1/token')) return respond({ access_token: access, refresh_token: 'test-only', token_type: 'bearer', expires_in: 3600, user });
    if (url.pathname.includes('/auth/v1/user')) return respond(user);
    if (url.pathname.includes('/auth/v1/logout')) return respond({});
    if (url.pathname.endsWith('/casa_families')) return respond([{ id: ids.family, name: 'Familia de prueba' }, ...child ? [] : [{ id: ids.other, name: 'Otra familia de prueba' }]]);
    if (url.pathname.endsWith('/casa_members')) return respond(url.searchParams.get('family_id')?.includes(ids.other) ? [] : members);
    if (url.pathname.endsWith('/casa_calendars')) return respond(url.searchParams.get('family_id')?.includes(ids.other) ? [] : [calendar, ...child ? [] : [{
      ...calendar, id: ids.sibling, child_id: ids.sibling, payload: { schedule: {}, routine: null },
    }]]);
    if (url.pathname.endsWith('/casa_proposals')) return respond(proposals);
    if (url.pathname.endsWith('/rpc/casa_command')) {
      const { action, args } = route.request().postDataJSON();
      calls.push({ action, args });
      if (action === 'resolve') {
        const proposal = proposals.find(item => item.id === args.proposal_id)!;
        proposal.status = args.decision;
        proposal.resolved_by = ids.parent;
        proposal.resolved_at = '2026-11-09T12:00:00Z';
        if (args.decision === 'accepted') { calendar.payload.schedule['2026-11-10'] = 'madre'; calendar.revision++; }
        return respond(proposal);
      }
      if (action === 'propose') {
        const proposal = { ...args, status: 'pending', base_revision: args.revision, author_id: ids.child, resolved_by: null };
        proposals.push(proposal);
        return respond(proposal);
      }
      return respond({ message: 'Acción no implementada en esta API de prueba' }, 400);
    }
    return respond({ message: 'Endpoint de prueba no encontrado' }, 404);
  });
  await page.addInitScript(() => {
    localStorage.setItem('custodia.calendario.v2', JSON.stringify({
      version: 2, profile: 'hija', schedule: { '2026-12-01': 'padre' }, routine: null, setupComplete: true,
    }));
    localStorage.setItem('custodia.mochilas.v1', JSON.stringify({ version: 1, lists: [{ id: 'privada', date: '2026-11-10', destination: 'padre', items: [{ id: 'objeto', text: 'Objeto individual privado', prepared: false }] }] }));
  });
  await page.goto(origin);
  await page.getByRole('button', { name: 'Cuenta y familia', exact: true }).click();
  await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill(user.email);
  await page.getByLabel('Contraseña', { exact: true }).fill('ClaveSoloParaPruebas');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await page.getByRole('button', { name: 'Familia de prueba', exact: true }).click();
  await page.getByRole('button', { name: 'Calendario de Hijo de prueba', exact: true }).click();
  return { calls, offline: () => { offline = true; } };
}

test('API simulada: progenitor acepta, consulta varios hijos y cambia de familia sin arrastrar datos', async ({ page }) => {
  const state = await fixture(page);
  await page.getByRole('button', { name: 'Propuestas', exact: true }).click();
  await expect(page.getByText('Pendiente', { exact: true })).toBeVisible();
  await page.getByRole('heading', { name: 'Propuestas de cambio', exact: true }).locator('..').screenshot({ path: 'docs/revision/familia-progenitor-propuesta.png' });
  await page.getByRole('button', { name: 'Aceptar propuesta', exact: true }).click();
  await expect(page.getByText('Aceptada', { exact: true })).toBeVisible();
  await expect(page.getByText(/Resuelta por Progenitora/)).toBeVisible();
  expect(state.calls.filter(call => call.action === 'resolve')).toHaveLength(1);
  await page.getByRole('button', { name: 'Hoy y mañana', exact: true }).click();
  await expect(page.getByTestId('tomorrow-card')).toContainText('Estancia contigo');
  await page.getByRole('button', { name: 'Mi mochila', exact: true }).click();
  await expect(page.getByText('Objeto individual privado')).toHaveCount(0);
  await page.getByRole('button', { name: 'Calendario de Hermana de prueba', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Calendario de Hermana de prueba', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cambiar de familia', exact: true }).click();
  await page.getByRole('button', { name: 'Otra familia de prueba', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Calendario de Hijo de prueba', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible();
  await expect(page.getByText('Familia de prueba', { exact: true })).toHaveCount(0);
});

test('API simulada: hijo propone y el calendario confirmado conserva sus fechas', async ({ page }) => {
  const state = await fixture(page, true);
  await expect(page.getByRole('button', { name: 'Cambiar rutina', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Configurar rutina', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Calendario de Hermana de prueba', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Propuestas', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva propuesta', exact: true }).click();
  await page.getByRole('textbox', { name: 'Inicio de la propuesta', exact: true }).fill('10112026');
  await page.getByRole('textbox', { name: 'Fin de la propuesta', exact: true }).fill('10112026');
  await page.getByRole('textbox', { name: 'Explicación opcional', exact: true }).fill('Quiero cambiar este día');
  await page.getByRole('button', { name: 'Enviar propuesta', exact: true }).click();
  await expect(page.getByText('Pendiente', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aceptar propuesta', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Rechazar propuesta', exact: true })).toHaveCount(0);
  expect(state.calls.filter(call => call.action === 'save_calendar')).toHaveLength(0);
  await page.getByRole('heading', { name: 'Propuestas de cambio', exact: true }).locator('..').screenshot({ path: 'docs/revision/familia-hijo-pendiente.png' });
  await page.getByRole('button', { name: 'Hoy y mañana', exact: true }).click();
  await expect(page.getByTestId('tomorrow-card')).toContainText('Con padre');
  state.offline();
  await page.getByRole('button', { name: 'Actualizar familia', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('No se pudieron consultar');
  await expect(page.getByRole('heading', { name: 'Calendario de Hijo de prueba', exact: true })).toHaveCount(0);
});
