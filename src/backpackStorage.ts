import { parseDate } from './calendar';
import { type PackingList } from './backpacks';
const KEY = 'custodia.mochilas.v1';
export function decodeBackpacks(raw: string): PackingList[] {
  const value = JSON.parse(raw);
  if (!value || value.version !== 1 || !Array.isArray(value.lists) || value.lists.length > 100) throw new Error('Las mochilas guardadas no tienen un formato válido.');
  const ids = new Set<string>(), dates = new Set<string>();
  for (const bag of value.lists) {
    if (!bag || typeof bag.id !== 'string' || !bag.id || ids.has(bag.id) || !['madre', 'padre'].includes(bag.destination) || !Array.isArray(bag.items) || bag.items.length > 100) throw new Error('Lista guardada no válida.');
    parseDate(bag.date);
    const key = bag.date + ':' + bag.destination;
    if (dates.has(key)) throw new Error('Hay dos listas para la misma fecha y destino.');
    ids.add(bag.id); dates.add(key);
    const items = new Set<string>();
    for (const item of bag.items) {
      if (!item || typeof item.id !== 'string' || !item.id || items.has(item.id) || typeof item.text !== 'string' || !item.text.trim() || item.text.length > 120 || typeof item.prepared !== 'boolean') throw new Error('Objeto guardado no válido.');
      items.add(item.id);
    }
  }
  return value.lists.map((bag: PackingList) => ({ ...bag, items: bag.items.map(item => ({ ...item })) }));
}
export async function loadBackpacks(storage: { getItem(key: string): Promise<string | null> }): Promise<PackingList[]> {
  const raw = await storage.getItem(KEY);
  return raw === null ? [] : decodeBackpacks(raw);
}
export async function saveBackpacks(storage: { setItem(key: string, value: string): Promise<void> }, lists: PackingList[]): Promise<void> {
  const raw = JSON.stringify({ version: 1, lists });
  decodeBackpacks(raw);
  await storage.setItem(KEY, raw);
}
