import { parseDate, type Schedule } from './calendar';

export type Profile = 'hijo' | 'madre' | 'padre';
export type AppState = { version: 1; profile: Profile | null; schedule: Schedule };
const STORAGE_KEY = 'custodia.calendario.v1';
export const initialState = (): AppState => ({ version: 1, profile: null, schedule: {} });

export function decodeState(raw: string): AppState {
  const value = JSON.parse(raw);
  if (!value || value.version !== 1 || ![null, 'hijo', 'madre', 'padre'].includes(value.profile)
    || !value.schedule || typeof value.schedule !== 'object' || Array.isArray(value.schedule)) {
    throw new Error('Los datos guardados no tienen un formato válido.');
  }
  for (const [day, home] of Object.entries(value.schedule)) {
    parseDate(day);
    if (home !== 'madre' && home !== 'padre') throw new Error('Asignación no válida.');
  }
  return { version: 1, profile: value.profile, schedule: { ...value.schedule } };
}

export async function loadState(storage: { getItem(key: string): Promise<string | null> }): Promise<AppState> {
  const raw = await storage.getItem(STORAGE_KEY);
  return raw === null ? initialState() : decodeState(raw);
}

export async function saveState(storage: { setItem(key: string, value: string): Promise<void> }, state: AppState): Promise<void> {
  await storage.setItem(STORAGE_KEY, JSON.stringify(state));
}
