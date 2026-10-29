import { addDays, dateKey, parseDate, type Home, type Schedule } from './calendar';

export type DayRule = Home | 'alterno' | null;
export type Routine = { start: string; days: DayRule[]; referenceFriday: string | null; referenceHome: Home | null; otherWeekendHome: Home | null };
export const templateDays: DayRule[] = ['madre', 'madre', 'padre', 'padre', 'alterno', 'alterno', 'alterno'];

export function validateRoutine(value: unknown): asserts value is Routine {
  if (!value || typeof value !== 'object') throw new Error('Revisa la rutina.');
  const rule = value as Routine;
  parseDate(rule.start);
  if (!Array.isArray(rule.days) || rule.days.length !== 7 || rule.days.some((home, i) =>
    home !== null && home !== 'madre' && home !== 'padre' && !(home === 'alterno' && i >= 4))) {
    throw new Error('Asigna cada día. La alternancia está disponible de viernes a domingo.');
  }
  if (rule.days.includes('alterno')) {
    if (!rule.referenceFriday || !rule.referenceHome) throw new Error('Elige un viernes de referencia y con quién empieza ese fin de semana.');
  }
  if (rule.referenceFriday !== null && parseDate(rule.referenceFriday).getDay() !== 5) throw new Error('La fecha de referencia debe ser un viernes.');
  if (rule.referenceHome !== null && rule.referenceHome !== 'madre' && rule.referenceHome !== 'padre') throw new Error('Elige madre o padre para el fin de semana de referencia.');
  if (rule.otherWeekendHome !== null && rule.otherWeekendHome !== 'madre' && rule.otherWeekendHome !== 'padre') throw new Error('Revisa los otros fines de semana.');
}

function civilDay(key: string): number {
  const date = parseDate(key);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;
}

export function effectiveHome(exceptions: Schedule, routine: Routine | null, day: string): Home | null {
  if (Object.hasOwn(exceptions, day)) return exceptions[day] ?? null;
  if (!routine || day < routine.start) return null;
  const rule = routine.days[(parseDate(day).getDay() + 6) % 7];
  if (rule !== 'alterno') return rule ?? null;
  if (!routine.referenceFriday || !routine.referenceHome) return null;
  const weeks = Math.floor((civilDay(day) - civilDay(routine.referenceFriday)) / 7);
  return weeks % 2 === 0 ? routine.referenceHome : routine.otherWeekendHome;
}

export function setExceptionRange(exceptions: Schedule, start: string, end: string, home: Home | null | 'rutina'): Schedule {
  parseDate(start);
  parseDate(end);
  if (end < start) throw new Error('La fecha final debe ser igual o posterior a la inicial.');
  const next = { ...exceptions };
  let day = start;
  for (let count = 0; ; count++) {
    if (count >= 366) throw new Error('Puedes asignar hasta 366 días de una vez.');
    if (home === 'rutina') delete next[day];
    else next[day] = home;
    if (day === end) return next;
    day = addDays(day, 1);
  }
}

export function effectiveMonth(exceptions: Schedule, routine: Routine | null, dates: (string | null)[]): Schedule {
  return Object.fromEntries(dates.filter((date): date is string => date !== null).map(day => [day, effectiveHome(exceptions, routine, day)]));
}

export function effectiveNextChange(exceptions: Schedule, routine: Routine | null, today: string): { date: string; home: Home } | null {
  // Outside exceptions, the pattern repeats every 14 days. Candidate windows
  // cover the initial cycle, routine start and every exception/return to routine.
  const candidates = new Set<string>();
  const anchors = [today, ...Object.keys(exceptions).filter(day => day >= today)];
  if (routine && routine.start > today) anchors.push(routine.start);
  for (const anchor of anchors) {
    const date = parseDate(anchor);
    for (let i = 0; i <= 14; i++) {
      const key = dateKey(date);
      if (key > '2100-12-31') break;
      candidates.add(key);
      date.setDate(date.getDate() + 1);
    }
  }
  for (const day of [...candidates].sort()) {
    if (day === '1900-01-01') continue;
    const previous = effectiveHome(exceptions, routine, addDays(day, -1));
    const home = effectiveHome(exceptions, routine, day);
    if (previous && home && previous !== home) return { date: day, home };
  }
  return null;
}
