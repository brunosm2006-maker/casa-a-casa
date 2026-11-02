import { addDays, parseDate, type Home, type Schedule } from './calendar';
import { effectiveHome, type Routine } from './routine';
export type PackingItem = { id: string; text: string; prepared: boolean };
export type PackingList = { id: string; date: string; destination: Home; items: PackingItem[] };
let counter = 0;
function id(): string { return Date.now().toString(36) + '-' + (++counter).toString(36) + '-' + Math.random().toString(36).slice(2, 9); }
function itemText(value: string): string {
  const text = value.trim();
  if (!text) throw new Error('Escribe un nombre para el objeto.');
  if (text.length > 120) throw new Error('El nombre del objeto puede tener hasta 120 caracteres.');
  return text;
}
function changeBag(bags: PackingList[], listId: string, action: (bag: PackingList) => PackingList): PackingList[] {
  if (!bags.some(bag => bag.id === listId)) throw new Error('No se encuentra esta lista.');
  return bags.map(bag => bag.id === listId ? action(bag) : bag);
}
function changeItem(bags: PackingList[], listId: string, itemId: string, action: (item: PackingItem) => PackingItem): PackingList[] {
  return changeBag(bags, listId, bag => {
    if (!bag.items.some(item => item.id === itemId)) throw new Error('No se encuentra este objeto.');
    return { ...bag, items: bag.items.map(item => item.id === itemId ? action(item) : item) };
  });
}
export function createBag(bags: PackingList[], date: string, exceptions: Schedule, routine: Routine | null, sourceId?: string): PackingList[] {
  parseDate(date);
  const destination = effectiveHome(exceptions, routine, date);
  if (!destination) throw new Error('Asigna un destino a esta fecha en el calendario antes de crear su lista.');
  if (bags.some(bag => bag.date === date && bag.destination === destination)) throw new Error('Ya hay una lista para esta fecha y destino. Ábrela desde Mochila.');
  if (bags.length >= 100) throw new Error('Puedes conservar hasta 100 listas. Elimina alguna que ya no necesites.');
  const source = sourceId ? bags.find(bag => bag.id === sourceId) : undefined;
  if (sourceId && !source) throw new Error('No se encuentra la lista que quieres copiar.');
  const bag: PackingList = { id: id(), date, destination, items: source ? source.items.map(item => ({ id: id(), text: item.text, prepared: false })) : [] };
  return [...bags, bag];
}
export function addBagItem(bags: PackingList[], listId: string, text: string): PackingList[] {
  const name = itemText(text);
  return changeBag(bags, listId, bag => {
    if (bag.items.length >= 100) throw new Error('Cada lista admite hasta 100 objetos.');
    return { ...bag, items: [...bag.items, { id: id(), text: name, prepared: false }] };
  });
}
export const editBagItem = (bags: PackingList[], listId: string, itemId: string, text: string) =>
  changeItem(bags, listId, itemId, item => ({ ...item, text: itemText(text) }));
export const toggleBagItem = (bags: PackingList[], listId: string, itemId: string) =>
  changeItem(bags, listId, itemId, item => ({ ...item, prepared: !item.prepared }));
export function removeBagItem(bags: PackingList[], listId: string, itemId: string): PackingList[] {
  return changeBag(bags, listId, bag => {
    if (!bag.items.some(item => item.id === itemId)) throw new Error('No se encuentra este objeto.');
    return { ...bag, items: bag.items.filter(item => item.id !== itemId) };
  });
}
export function removeBag(bags: PackingList[], listId: string): PackingList[] {
  if (!bags.some(bag => bag.id === listId)) throw new Error('No se encuentra esta lista.');
  return bags.filter(bag => bag.id !== listId);
}
export function bagProgress(bag: PackingList) {
  const total = bag.items.length, ready = bag.items.filter(item => item.prepared).length;
  return { total, ready, pending: total - ready, complete: total > 0 && ready === total };
}
export function bagDestinationStatus(bag: PackingList, exceptions: Schedule, routine: Routine | null) {
  const current = effectiveHome(exceptions, routine, bag.date);
  return { changed: current !== bag.destination, current };
}
export function nearbyBagChange(today: string, change: { date: string; home: Home } | null): boolean {
  return !!change && (change.date === today || change.date === addDays(today, 1));
}
