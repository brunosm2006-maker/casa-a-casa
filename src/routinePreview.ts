import { addDays, dateKey, parseDate, type Home, type Schedule } from './calendar';
import { cycleDays, effectiveHome, type Routine } from './routine';
export type PreviewSegment = { start: string; end: string; home: Home | null; usualHome: Home | null; exception: boolean; days: number };
export type PreviewCycle = { start: string; end: string; segments: PreviewSegment[] };
export function previewCycles(rule: Routine, exceptions: Schedule): PreviewCycle[] {
  const result: PreviewCycle[] = []; let start = rule.start;
  for (let cycle = 0; cycle < 2; cycle++) {
    const date = parseDate(start);
    const next = rule.kind === 'months' ? dateKey(new Date(date.getFullYear(), date.getMonth() + 2, 1, 12)) : addDays(start, cycleDays(rule));
    if (next > '2101-01-01') throw new Error('Elige un inicio anterior para revisar dos ciclos completos dentro de 1900–2100.');
    const end = next === '2101-01-01' ? '2100-12-31' : addDays(next, -1);
    const segments: PreviewSegment[] = []; let day = start;
    for (;;) {
      const home = effectiveHome(exceptions, rule, day), usualHome = effectiveHome({}, rule, day), exception = Object.hasOwn(exceptions, day);
      const previous = segments[segments.length - 1];
      if (previous && previous.home === home && previous.usualHome === usualHome && previous.exception === exception) { previous.end = day; previous.days++; }
      else segments.push({ start: day, end: day, home, usualHome, exception, days: 1 });
      if (day === end) break; day = addDays(day, 1);
    }
    result.push({ start, end, segments }); start = next;
  }
  return result;
}
