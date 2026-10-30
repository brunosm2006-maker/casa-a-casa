import { parseDate } from './calendar';
import { type Routine } from './routineTypes';
const home = (value: unknown) => value === 'madre' || value === 'padre';
export function validateRoutine(value: unknown): asserts value is Routine {
  if (!value || typeof value !== 'object') throw new Error('Revisa la rutina.');
  const rule = value as Routine;
  const start = parseDate(rule.start);
  if (rule.kind === 'cycle') {
    if (!['weeks','long','223','2255','3443','custom'].includes(rule.template)) throw new Error('Elige un tipo de ciclo válido.');
    if (!Array.isArray(rule.blocks) || rule.blocks.length < 2 || rule.blocks.length > 12) throw new Error('El ciclo debe tener entre 2 y 12 bloques.');
    if (rule.blocks.some(block => !block || !home(block.home) || !Number.isInteger(block.days) || block.days < 1 || block.days > 60)) throw new Error('Cada bloque necesita un progenitor y de 1 a 60 días enteros.');
    if (rule.blocks.reduce((sum, block) => sum + block.days, 0) > 90) throw new Error('El ciclo completo puede tener hasta 90 días.');
    if (new Set(rule.blocks.map(block => block.home)).size < 2) throw new Error('Incluye a ambos progenitores en el ciclo.');
    return;
  }
  if (rule.kind === 'months') {
    if (start.getDate() !== 1) throw new Error('Para meses naturales, el inicio debe ser el primer día de un mes.');
    if (!home(rule.firstHome)) throw new Error('Elige con quién empieza el primer mes.');
    return;
  }
  if (rule.kind !== undefined && rule.kind !== 'weekly') throw new Error('Tipo de rutina no válido.');
  if (!Array.isArray(rule.days) || rule.days.length !== 7 || rule.days.some((day, i) => day !== null && !home(day) && !(day === 'alterno' && i >= 4))) throw new Error('Revisa los siete días habituales.');
  if (rule.days.includes('alterno') && (!rule.referenceFriday || !rule.referenceHome)) throw new Error('Elige un viernes de referencia y con quién empieza ese fin de semana.');
  if (rule.referenceFriday !== null && parseDate(rule.referenceFriday).getDay() !== 5) throw new Error('La fecha de referencia debe ser un viernes.');
  if (rule.referenceHome !== null && !home(rule.referenceHome)) throw new Error('Elige madre o padre para el fin de semana de referencia.');
  if (rule.otherWeekendHome !== null && !home(rule.otherWeekendHome)) throw new Error('Revisa los otros fines de semana.');
  if (rule.primary) {
    const p = rule.primary;
    if ((p.home !== null && !home(p.home)) || !home(p.guest) || p.home === p.guest || typeof p.alternate !== 'boolean' || !Array.isArray(p.visitDays) || !p.visitDays.length || p.visitDays.some(day => !Number.isInteger(day) || day < 0 || day > 6)) throw new Error('Revisa el progenitor habitual y sus días de estancia.');
  }
}
