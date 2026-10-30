import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { type Home } from './calendar';
import { colors, s } from './theme';
export function Choice<T extends string | null>({ title, value, options, onChange, disabled = false }: {
  title: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void; disabled?: boolean;
}) {
  return <View style={{ gap: 8 }}><Text style={[s.body, { fontWeight: '600' }]}>{title}</Text>
    <View style={s.row}>{options.map(option => <Pressable key={option.value ?? 'empty'} accessibilityRole="radio"
      accessibilityLabel={title + ': ' + option.label} aria-checked={option.value === value} accessibilityState={{ checked: option.value === value, disabled }} disabled={disabled}
      onPress={() => onChange(option.value)} style={[s.choice, option.value === value && s.chosen]}>
      <Text style={s.body}>{option.label}{option.value === value ? ' ✓' : ''}</Text>
    </Pressable>)}</View></View>;
}
export const homeOptions: { value: Home; label: string }[] = [{ value: 'madre', label: 'Madre' }, { value: 'padre', label: 'Padre' }];
export function StartField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <View style={s.card}><Text style={s.heading}>¿Desde qué fecha?</Text><Text style={s.muted}>Inicio de la rutina · DD/MM/AAAA</Text>
    <TextInput accessibilityLabel="Inicio de la rutina" value={value} onChangeText={onChange} maxLength={10} style={s.input} autoCorrect={false}
      placeholder="DD/MM/AAAA" placeholderTextColor={colors.muted} />
  </View>;
}
