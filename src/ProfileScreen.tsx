import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { type Profile } from './persistence';
import { s } from './theme';

export const profileLabel = { hijo: 'Hijo o hija', madre: 'Madre', padre: 'Padre' };

export function ProfileScreen({ profile, saving, onChoose }: {
  profile: Profile | null; saving: boolean; onChoose: (profile: Profile) => void;
}) {
  return <View style={{ gap: 20 }}>
    <View style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={s.title}>{profile ? 'Tu perfil' : '¿Cómo usarás el calendario?'}</Text>
      <Text style={s.body}>Elige la vista que te resulte útil. Puedes cambiarla cuando quieras.</Text>
    </View>
    <View style={s.card}>
      {(['hijo', 'madre', 'padre'] as const).map(option => <Pressable key={option}
        accessibilityRole="radio" accessibilityLabel={profileLabel[option]} accessibilityState={{ checked: profile === option, disabled: saving }}
        disabled={saving} onPress={() => onChoose(option)} style={[s.choice, profile === option && s.chosen]}>
        <Text style={[s.body, { fontWeight: '600' }]}>{profileLabel[option]}{profile === option ? ' · Seleccionado' : ''}</Text>
        <Text style={s.muted}>{option === 'hijo' ? 'Consulta con quién estás y cuándo cambias de casa.' : 'Consulta cuándo estará tu hijo o hija contigo.'}</Text>
      </Pressable>)}
    </View>
    <Text style={s.muted}>Esta selección se guarda solo en este dispositivo. No necesitas un nombre ni una cuenta.</Text>
    <View style={s.card}>
      <Text accessibilityRole="header" style={s.heading}>Primera versión</Text>
      <Text style={s.body}>Ya puedes organizar el calendario. Después prepararemos «Hoy y mañana» y, más adelante, «Mochila».</Text>
      <Text style={s.muted}>Las cuentas familiares y los permisos se definirán más adelante. Por ahora, todos los perfiles pueden probar la edición local.</Text>
    </View>
  </View>;
}
