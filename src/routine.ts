import { addDays, parseDate, type Home, type Schedule } from './calendar';
import { otherHome, type DayRule, type Routine } from './routineTypes';
export { validateRoutine } from './routineValidation';
export { isWeekly } from './routineTypes';
export type { Routine, DayRule, WeeklyRoutine, CycleRoutine, MonthlyRoutine, Block } from './routineTypes';
export const templateDays: DayRule[] = ['madre', 'madre', 'padre', 'padre', 'alterno', 'alterno', 'alterno'];
function civilDay(key: string): number {
  const date = parseDate(key); return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;
}
export function cycleDays(rule: Routine): number {
  if (rule.kind === 'months') return 62;
  if (rule.kind === 'cycle') return rule.blocks.reduce((sum, block) => sum + block.days, 0);
  return rule.days.includes('alterno') ? 14 : 7;
}
export function effectiveHome(exceptions: Schedule, routine: Routine | null, day: string): Home | null {
  if (Object.hasOwn(exceptions, day)) return exceptions[day] ?? null;
  if (!routine || day < routine.start) return null;
  if (routine.kind === 'months') {
    const date = parseDate(day), start = parseDate(routine.start);
    const months = (date.getFullYear() - start.getFullYear()) * 12 + date.getMonth() - start.getMonth();
    return months % 2 ? otherHome(routine.firstHome) : routine.firstHome;
  }
  if (routine.kind === 'cycle') {
    let offset = (civilDay(day) - civilDay(routine.start)) % cycleDays(routine);
    for (const block of routine.blocks) { if (offset < block.days) return block.home; offset -= block.days; }
    return null;
  }
  const rule = routine.days[(parseDate(day).getDay() + 6) % 7];
  if (rule !== 'alterno') return rule ?? null;
  if (!routine.referenceFriday || !routine.referenceHome) return null;
  const weeks = Math.floor((civilDay(day) - civilDay(routine.referenceFriday)) / 7);
  return weeks % 2 === 0 ? routine.referenceHome : routine.otherWeekendHome;
}
export function setExceptionRange(exceptions: Schedule, start: string, end: string, home: Home | null | 'rutina'): Schedule {
  parseDate(start); parseDate(end);
  if (end < start) throw new Error('La fecha final debe ser igual o posterior a la inicial.');
  const next = { ...exceptions }; let day = start;
  for (let count = 0; ; count++) {
    if (count >= 366) throw new Error('Puedes asignar hasta 366 días de una vez.');
    if (home === 'rutina') delete next[day]; else next[day] = home;
    if (day === end) return next; day = addDays(day, 1);
  }
}
export function effectiveMonth(exceptions: Schedule, routine: Routine | null, dates: (string | null)[]): Schedule {
  return Object.fromEntries(dates.filter((date): date is string => date !== null).map(day => [day, effectiveHome(exceptions, routine, day)]));
}
export function effectiveNextChange(exceptions: Schedule, routine: Routine | null, today: string): { date: string; home: Home } | null {
  // A complete period after each event covers long cycles. Merge overlapping windows.
  const horizon = routine ? cycleDays(routine) : 1;
  const anchors = [today, ...Object.keys(exceptions).filter(day => day >= today)];
  if (routine && routine.start > today) anchors.push(routine.start);
  const max = civilDay('2100-12-31'), min = civilDay('1900-01-01');
  const windows = anchors.map(day => ({ start: civilDay(day), end: Math.min(max, civilDay(day) + horizon) })).sort((a,b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const window of windows) {
    const previous = merged[merged.length - 1];
    if (previous && window.start <= previous.end + 1) previous.end = Math.max(previous.end, window.end);
    else merged.push({ ...window });
  }
  for (const window of merged) for (let index = window.start; index <= window.end; index++) {
    if (index <= min) continue;
    const day = new Date(index * 86_400_000).toISOString().slice(0, 10);
    const previous = effectiveHome(exceptions, routine, addDays(day, -1)), home = effectiveHome(exceptions, routine, day);
    if (previous && home && previous !== home) return { date: day, home };
  }
  return null;
}
