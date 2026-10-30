import { type Home } from './calendar';
import { otherHome, type Block, type CycleRoutine, type CycleTemplate, type MonthlyRoutine, type Routine, type WeeklyRoutine } from './routineTypes';
import { validateRoutine } from './routineValidation';
export type Pattern = 'weeks' | 'long' | 'weekly' | 'cycles' | 'primary' | 'custom';
export const patternOptions: { id: Pattern; title: string; text: string }[] = [
  { id: 'weeks', title: 'Semanas alternas', text: 'Siete días con cada progenitor.' },
  { id: 'long', title: 'Periodos más largos', text: 'Turnos de 14 o 15 días, o meses naturales.' },
  { id: 'weekly', title: 'Días fijos y fines de semana alternos', text: 'Elige el reparto habitual de cada día de la semana.' },
  { id: 'cycles', title: 'Ciclos de varios días', text: 'Plantillas 2–2–3, 2–2–5–5 y 3–4–4–3, con sus turnos completos.' },
  { id: 'primary', title: 'Principalmente con uno', text: 'Un hogar habitual y días completos con el otro. También puedes dejar el resto sin asignar.' },
  { id: 'custom', title: 'Crear mi propio reparto', text: 'Define bloques que se repiten. Por ejemplo, 9 días con uno y 5 con el otro.' },
];
export function blockTemplate(template: '223' | '2255' | '3443', first: Home): Block[] {
  const sizes = template === '223' ? [2,2,3,2,2,3] : template === '2255' ? [2,2,5,5] : [3,4,4,3];
  return sizes.map((days, i) => ({ days, home: i % 2 ? otherHome(first) : first }));
}
export function makeCycle(start: string, blocks: Block[], template: CycleTemplate): CycleRoutine {
  const rule: CycleRoutine = { kind: 'cycle', start, blocks, template }; validateRoutine(rule); return rule;
}
export function makeMonths(start: string, firstHome: Home): MonthlyRoutine {
  const rule: MonthlyRoutine = { kind: 'months', start, firstHome }; validateRoutine(rule); return rule;
}
export function detectPattern(rule: Routine | null): Pattern | null {
  if (!rule) return null;
  if (rule.kind === 'months') return 'long';
  if (rule.kind === 'cycle') return ['223','2255','3443'].includes(rule.template) ? 'cycles' : rule.template as Pattern;
  const matchesPrimary = rule.referenceHome !== null && rule.referenceHome !== rule.otherWeekendHome && rule.days.slice(0, 4).every(day => day === rule.otherWeekendHome) && rule.days.slice(4).every(day => day === 'alterno');
  return rule.primary || matchesPrimary ? 'primary' : 'weekly';
}
export function makePrimary(start: string, settings: NonNullable<WeeklyRoutine['primary']>, friday: string | null): WeeklyRoutine {
  const hasAlternation = settings.alternate && settings.visitDays.some(day => day >= 4);
  const rule: WeeklyRoutine = {
    kind: 'weekly', start, primary: settings,
    days: Array.from({ length: 7 }, (_, day) => settings.visitDays.includes(day) ? (settings.alternate && day >= 4 ? 'alterno' : settings.guest) : settings.home),
    referenceFriday: hasAlternation ? friday : null, referenceHome: hasAlternation ? settings.guest : null, otherWeekendHome: hasAlternation ? settings.home : null,
  }; validateRoutine(rule); return rule;
}
