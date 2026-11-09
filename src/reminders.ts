import { bagProgress, type PackingList } from './backpacks';
import { addDays, dateKey, parseDate, type Schedule } from './calendar';
import { effectiveHome, type Routine } from './routine';

export const reminderKinds = ['change', 'bag'] as const;
export type ReminderKind = typeof reminderKinds[number];
export type ReminderOption = { enabled: boolean; daysBefore: number; time: string };
export type ReminderSettings = Record<ReminderKind, ReminderOption>;
export type Reminder = { id: string; kind: ReminderKind; at: number };
export const reminderDays = 30;
export const reminderPrefix = 'casa-a-casa-reminder-v1:';
export const defaultReminders: ReminderSettings = {
  change: { enabled: false, daysBefore: 1, time: '18:00' },
  bag: { enabled: false, daysBefore: 1, time: '18:00' },
};

const storageKey = 'custodia.recordatorios.v1';

function validOption(value: unknown): value is ReminderOption {
  if (!value || typeof value !== 'object') return false;
  const { enabled, daysBefore, time } = value as Partial<ReminderOption>;
  return typeof enabled === 'boolean' && typeof daysBefore === 'number' &&
    Number.isInteger(daysBefore) && daysBefore >= 0 && daysBefore <= 7 &&
    typeof time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export async function loadReminders(storage: { getItem(key: string): Promise<string | null> }, scope?: string): Promise<ReminderSettings> {
  const raw = await storage.getItem(scope ? storageKey + ':' + scope : storageKey);
  if (raw === null) return defaultReminders;
  const value = JSON.parse(raw);
  if (value?.version !== 1 || !validOption(value.change) || !validOption(value.bag)) {
    throw new Error('Los ajustes guardados de recordatorios no se pueden leer.');
  }
  return { change: value.change, bag: value.bag };
}

export async function saveReminders(storage: { setItem(key: string, value: string): Promise<void> }, settings: ReminderSettings, scope?: string) {
  for (const option of Object.values(settings)) {
    if (!Number.isInteger(option.daysBefore) || option.daysBefore < 0 || option.daysBefore > 7) {
      throw new RangeError('Indica entre 0 y 7 días antes del cambio.');
    }
    if (!validOption(option)) throw new RangeError('Usa una hora válida en formato HH:MM.');
  }
  await storage.setItem(scope ? storageKey + ':' + scope : storageKey, JSON.stringify({ version: 1, ...settings }));
}

export function planReminders(now: Date, settings: ReminderSettings, exceptions: Schedule, routine: Routine | null, bags: PackingList[]) {
  const result: Reminder[] = [];
  const today = dateKey(now);
  if (today < '1900-01-01' || today > '2100-12-31') return result;
  let previous = effectiveHome(exceptions, routine, addDays(today, -1));
  for (let offset = 0; offset < reminderDays; offset++) {
    const day = addDays(today, offset);
    if (day > '2100-12-31') break;
    const home = effectiveHome(exceptions, routine, day);
    const isChange = previous && home && previous !== home;
    previous = home;
    if (!isChange) continue;
    const bag = bags.find(list => list.date === day && list.destination === home);
    for (const kind of reminderKinds) {
      const option = settings[kind];
      if (!option.enabled || (kind === 'bag' && (!bag || bagProgress(bag).complete))) continue;
      if (option.daysBefore > offset) continue;
      const [hour, minute] = option.time.split(':').map(Number);
      const at = parseDate(addDays(day, -option.daysBefore)).setHours(hour!, minute!, 0, 0);
      if (at <= now.getTime()) continue;
      result.push({ kind, at, id: reminderPrefix + kind + ':' + day + ':' + home + ':' + at });
    }
  }
  return result.sort((a, b) => a.at - b.at);
}

export async function reconcileReminders(
  planned: Reminder[],
  api: { pending(): Promise<string[]>; cancel(id: string): Promise<void>; schedule(reminder: Reminder): Promise<void> },
  isCurrent = () => true,
) {
  const pending = new Set(await api.pending());
  const desired = new Set(planned.map(reminder => reminder.id));
  for (const id of pending) {
    if (!isCurrent()) return;
    if (id.startsWith(reminderPrefix) && !desired.has(id)) await api.cancel(id);
  }
  for (const reminder of planned) {
    if (!isCurrent()) return;
    if (!pending.has(reminder.id) && reminder.at > Date.now()) await api.schedule(reminder);
  }
}
