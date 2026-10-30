import React, { useRef, useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { editDate, type DateSelection } from './dateEditing';
import { colors, s } from './theme';

type Props = Pick<TextInputProps, 'accessibilityLabel' | 'autoFocus' | 'editable' | 'style' | 'placeholder' | 'placeholderTextColor' | 'autoCorrect'> & {
  value: string; onChangeText: (value: string) => void;
};
export function DateInput({ value, onChangeText, style = s.input, placeholder = 'DD/MM/AAAA', placeholderTextColor = colors.muted, ...props }: Props) {
  const lastSelection = useRef<DateSelection>({ start: value.length, end: value.length });
  const lastKey = useRef<string | undefined>(undefined);
  const [selection, setSelection] = useState<DateSelection | undefined>();
  return <TextInput {...props} value={value} style={style} placeholder={placeholder} placeholderTextColor={placeholderTextColor}
    keyboardType="number-pad" autoCorrect={false} selection={selection}
    onKeyPress={event => { lastKey.current = event.nativeEvent.key; }}
    onSelectionChange={event => {
      const next = event.nativeEvent.selection;
      lastSelection.current = next;
      setSelection(current => current?.start === next.start && current.end === next.end ? current : next);
    }}
    onChange={event => {
      // Web exposes the post-edit caret; native uses its selection events and text diff.
      const target = event.target as unknown as { selectionStart?: number | null };
      const result = editDate(value, event.nativeEvent.text, lastSelection.current,
        typeof target?.selectionStart === 'number' ? target.selectionStart : undefined, lastKey.current);
      lastKey.current = undefined;
      lastSelection.current = result.selection;
      setSelection(result.selection);
      onChangeText(result.value);
    }} />;
}
