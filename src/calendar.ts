export type Home = 'madre' | 'padre';
export type Schedule = Record<string, Home | null>;

export function dateKey(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Local noon avoids UTC conversion and midnight daylight-saving boundaries.
export function parseDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Usa una fecha válida.');
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(year, month - 1, day, 12);
  if (year < 1900 || year > 2100 || dateKey(date) !== value) throw new Error('La fecha no existe o está fuera de 1900–2100.');
  return date;
}

export function addDays(value: string, count: number): string {
  const date = parseDate(value);
  date.setDate(date.getDate() + count);
  return dateKey(date);
}

export function moveMonth(year: number, month: number, direction: number) {
  const date = new Date(year, month + direction, 1, 12);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function monthCells(year: number, month: number): (string | null)[] {
  const offset = (new Date(year, month, 1, 12).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0, 12).getDate();
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let day = 1; day <= days; day++) cells.push(dateKey(new Date(year, month, day, 12)));
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function assignRange(schedule: Schedule, start: string, end: string, home: Home | null): Schedule {
  parseDate(start);
  parseDate(end);
  if (end < start) throw new Error('La fecha final debe ser igual o posterior a la inicial.');
  const next = { ...schedule };
  let day = start;
  for (let count = 0; ; count++) {
    if (count >= 366) throw new Error('Puedes asignar hasta 366 días de una vez.');
    if (home) next[day] = home;
    else delete next[day];
    if (day === end) return next;
    day = addDays(day, 1);
  }
}

export function nextChange(schedule: Schedule, today: string): { date: string; home: Home } | null {
  // A change is known only when both adjacent days have explicit assignments.
  for (const day of Object.keys(schedule).filter(day => day >= today).sort()) {
    const previous = schedule[addDays(day, -1)];
    const home = schedule[day];
    if (previous && home && previous !== home) return { date: day, home };
  }
  return null;
}

export function displayDate(value: string): string {
  return parseDate(value).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function inputDate(value: string): string {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function fromInput(value: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) throw new Error('Escribe las fechas con el formato DD/MM/AAAA.');
  const key = `${match[3]}-${match[2]}-${match[1]}`;
  parseDate(key);
  return key;
}
