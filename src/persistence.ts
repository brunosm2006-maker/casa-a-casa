import { parseDate, type Schedule } from './calendar';
import { validateRoutine, type Routine } from './routine';

export type Profile = 'hijo' | 'hija' | 'madre' | 'padre';
export type AppState = { version: 2; profile: Profile | null; schedule: Schedule; routine: Routine | null; setupComplete: boolean };
const STORAGE_KEY = 'custodia.calendario.v2';
const LEGACY_KEY = 'custodia.calendario.v1';
export const initialState = (): AppState => ({ version: 2, profile: null, schedule: {}, routine: null, setupComplete: false });

export function decodeState(raw: string): AppState {
  const value = JSON.parse(raw);
  if (!value || ![1, 2].includes(value.version) || ![null, 'hijo', 'hija', 'madre', 'padre'].includes(value.profile)
    || !value.schedule || typeof value.schedule !== 'object' || Array.isArray(value.schedule)) {
    throw new Error('Los datos guardados no tienen un formato válido.');
  }
  for (const [day, home] of Object.entries(value.schedule)) {
    parseDate(day);
    if (home !== 'madre' && home !== 'padre' && !(value.version === 2 && home === null)) throw new Error('Asignación no válida.');
  }
  const routine = value.version === 1 ? null : value.routine;
  if (routine !== null) validateRoutine(routine);
  if (value.setupComplete !== undefined && typeof value.setupComplete !== 'boolean') throw new Error('Estado de configuración no válido.');
  return { version: 2, profile: value.profile, schedule: { ...value.schedule }, routine, setupComplete: value.version === 1 || value.setupComplete === undefined ? true : value.setupComplete };
}

export async function loadState(storage: { getItem(key: string): Promise<string | null> }): Promise<AppState> {
  const raw = (await storage.getItem(STORAGE_KEY)) ?? (await storage.getItem(LEGACY_KEY));
  return raw === null ? initialState() : decodeState(raw);
}

export async function saveState(storage: { setItem(key: string, value: string): Promise<void> }, state: AppState): Promise<void> {
  await storage.setItem(STORAGE_KEY, JSON.stringify(state));
}
