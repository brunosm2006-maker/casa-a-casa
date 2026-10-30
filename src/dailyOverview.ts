import { addDays, type Schedule } from './calendar';
import { effectiveHome, effectiveNextChange, type Routine } from './routine';
export function dailyOverview(today: string, exceptions: Schedule, routine: Routine | null) {
  const day = (date: string) => ({ date, home: effectiveHome(exceptions, routine, date), exception: Object.hasOwn(exceptions, date) });
  return {
    today: day(today),
    tomorrow: today < '2100-12-31' ? day(addDays(today, 1)) : null,
    change: effectiveNextChange(exceptions, routine, today),
  };
}
export function millisecondsToMidnight(now: Date): number {
  return Math.max(50, new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime() + 50);
}
