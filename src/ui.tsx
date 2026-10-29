import React from 'react';
import { Pressable, Text } from 'react-native';
import { s } from './theme';

export function Button({ label, onPress, secondary = false, disabled = false }: {
  label: string; onPress: () => void; secondary?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, (disabled || pressed) && s.disabled]}>
    <Text style={[s.buttonText, secondary && s.secondaryText]}>{label}</Text>
  </Pressable>;
}
