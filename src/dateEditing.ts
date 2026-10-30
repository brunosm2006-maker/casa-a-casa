export type DateSelection = { start: number; end: number };
const digits = (text: string) => text.replace(/\D/g, '');
function format(value: string): string {
  return value.slice(0, 2) + (value.length > 2 ? '/' + value.slice(2, 4) : '') + (value.length > 4 ? '/' + value.slice(4) : '');
}
function position(value: string, digitCount: number): number {
  if (!digitCount) return 0;
  let seen = 0;
  for (let i = 0; i < value.length; i++) if (/\d/.test(value[i]!) && ++seen === digitCount) return i + 1;
  return value.length;
}
export function editDate(previous: string, raw: string, before: DateSelection, rawCaret?: number, key?: string): { value: string; selection: DateSelection } {
  let prefix = 0, suffix = 0;
  while (prefix < previous.length && prefix < raw.length && previous[prefix] === raw[prefix]) prefix++;
  while (suffix < previous.length - prefix && suffix < raw.length - prefix && previous[previous.length - suffix - 1] === raw[raw.length - suffix - 1]) suffix++;
  const removed = previous.slice(prefix, previous.length - suffix);
  const inserted = raw.slice(prefix, raw.length - suffix);
  let valueDigits = digits(raw);
  let caretDigits = digits(raw.slice(0, rawCaret ?? prefix + inserted.length)).length;
  // Removing an automatic separator should also remove the adjacent digit.
  if (removed === '/' && inserted === '' && before.start === before.end) {
    const backwards = key ? key === 'Backspace' : before.start > prefix;
    const index = digits(previous.slice(0, prefix)).length - (backwards ? 1 : 0);
    if (index >= 0) {
      valueDigits = valueDigits.slice(0, index) + valueDigits.slice(index + 1);
      caretDigits = index;
    }
  }
  const value = format(valueDigits.slice(0, 8));
  const caret = position(value, Math.min(caretDigits, 8));
  return { value, selection: { start: caret, end: caret } };
}
