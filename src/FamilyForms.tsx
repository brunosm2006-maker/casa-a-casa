import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { DateInput } from './DateInput';
import { fromInput, inputDate, type Home } from './calendar';
import { type Profile } from './persistence';
import { type FamilyCalendar } from './familyTypes';
import { Button } from './ui';
import { s } from './theme';

export function FamilyField({ label, value, onChange, password = false, disabled = false }: {
  label: string; value: string; onChange(value: string): void; password?: boolean; disabled?: boolean;
}) {
  return <View style={{ gap: 6 }}>
    <Text style={s.body}>{label}</Text>
    <TextInput accessibilityLabel={label} style={s.input} value={value} onChangeText={onChange}
      secureTextEntry={password} autoCapitalize="none" autoCorrect={false} editable={!disabled} maxLength={password ? 200 : 1000} />
  </View>;
}

export function ProfileChoices({ value, onChange, parental = false }: { value: Profile; onChange(value: Profile): void; parental?: boolean }) {
  const options: Profile[] = parental ? ['madre', 'padre'] : ['hijo', 'hija', 'madre', 'padre'];
  return <View style={s.row}>{options.map(profile => <Pressable key={profile} style={[s.choice, profile === value && s.chosen]}
    accessibilityRole="radio" accessibilityLabel={'Perfil familiar ' + profile} aria-checked={profile === value}
    accessibilityState={{ checked: profile === value }} onPress={() => onChange(profile)}>
    <Text style={s.body}>{profile}{profile === value ? ' ✓' : ''}</Text>
  </Pressable>)}</View>;
}

export function ProposalForm({ calendar, today, busy, onSubmit, onClose }: {
  calendar: FamilyCalendar; today: string; busy: boolean;
  onSubmit(args: Record<string, unknown>): Promise<boolean>; onClose(): void;
}) {
  const [base] = useState(calendar.revision);
  const [first, setFirst] = useState(inputDate(today));
  const [last, setLast] = useState(inputDate(today));
  const [destination, setDestination] = useState<Home | null | 'rutina'>('madre');
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');
  // This id makes retries idempotent. Authorization always comes from the server session.
  const [requestId] = useState(() => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const random = Math.floor(Math.random() * 16);
    return (char === 'x' ? random : (random & 3) | 8).toString(16);
  }));
  return <View style={s.card}>
    <Text accessibilityRole="header" style={s.heading}>Proponer un cambio</Text>
    <Text style={s.body}>El calendario confirmado cambiará cuando un progenitor acepte tu propuesta.</Text>
    <Text style={s.body}>Desde</Text>
    <DateInput accessibilityLabel="Inicio de la propuesta" value={first} onChangeText={setFirst} editable={!busy} />
    <Text style={s.body}>Hasta</Text>
    <DateInput accessibilityLabel="Fin de la propuesta" value={last} onChangeText={setLast} editable={!busy} />
    {(['madre','padre',null,'rutina'] as const).map(home => <Pressable key={home ?? 'empty'}
      accessibilityRole="radio" accessibilityLabel={home === null ? 'Proponer sin asignar' : 'Proponer ' + home}
      accessibilityState={{ checked: home === destination }} aria-checked={home === destination}
      disabled={busy} onPress={() => setDestination(home)} style={[s.choice, home === destination && s.chosen]}>
      <Text style={s.body}>{home === null ? 'Sin asignar' : home === 'rutina' ? 'Recuperar rutina' : 'Con ' + home}</Text>
    </Pressable>)}
    <FamilyField label="Explicación opcional" value={explanation} onChange={setExplanation} disabled={busy} />
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Button label="Enviar propuesta" disabled={busy} onPress={async () => {
      try {
        setError('');
        if (explanation.length > 1000) throw new Error('La explicación admite hasta 1000 caracteres.');
        if (await onSubmit({ id: requestId, calendar_id: calendar.id, revision: base,
          first_day: fromInput(first), last_day: fromInput(last), destination, explanation })) onClose();
      } catch (err) { setError(err instanceof Error ? err.message : 'Revisa la propuesta.'); }
    }} />
    <Button label="Cancelar propuesta" secondary disabled={busy} onPress={onClose} />
  </View>;
}
