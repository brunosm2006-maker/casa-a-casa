import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { assignRange, fromInput, inputDate, type Home, type Schedule } from './calendar';
import { Button } from './ui';
import { colors, s } from './theme';

export function StayEditor({ day, schedule, saving, storageError, onSave, onClose }: {
  day: string; schedule: Schedule; saving: boolean; storageError: string;
  onSave: (schedule: Schedule, start: string) => Promise<boolean>; onClose: () => void;
}) {
  const [start, setStart] = useState(inputDate(day));
  const [end, setEnd] = useState(inputDate(day));
  const [home, setHome] = useState<Home | null>(schedule[day] ?? 'madre');
  const [error, setError] = useState('');

  async function save() {
    setError('');
    try {
      const first = fromInput(start);
      const next = assignRange(schedule, first, fromInput(end), home);
      if (await onSave(next, first)) onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'Revisa las fechas.'); }
  }

  return <Modal visible animationType="none" onRequestClose={() => { if (!saving) onClose(); }}>
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.between}>
          <Text style={s.eyebrow}>EDITAR CALENDARIO</Text>
          <Button label="Cancelar" secondary onPress={onClose} disabled={saving} />
        </View>
        <Text accessibilityRole="header" style={s.title}>Organiza una estancia</Text>
        <Text style={s.body}>Asigna un día o varios días seguidos. Para un solo día, usa la misma fecha en ambos campos.</Text>
        <View style={s.card}>
          <Text style={s.body}>Desde · DD/MM/AAAA</Text>
          <TextInput autoFocus accessibilityLabel="Fecha inicial" placeholder="DD/MM/AAAA" placeholderTextColor={colors.muted}
            value={start} onChangeText={setStart} style={s.input} maxLength={10} editable={!saving} autoCorrect={false} />
          <Text style={s.body}>Hasta · DD/MM/AAAA</Text>
          <TextInput accessibilityLabel="Fecha final" placeholder="DD/MM/AAAA" placeholderTextColor={colors.muted}
            value={end} onChangeText={setEnd} style={s.input} maxLength={10} editable={!saving} autoCorrect={false} />
          <Text style={s.muted}>Ambas fechas están incluidas. Hasta 366 días por estancia.</Text>
        </View>
        <Text accessibilityRole="header" style={s.heading}>¿Con quién?</Text>
        {(['madre', 'padre', null] as const).map(option => <Pressable key={option ?? 'borrar'}
          accessibilityRole="radio" accessibilityState={{ checked: home === option, disabled: saving }} disabled={saving}
          onPress={() => setHome(option)} style={[s.choice, home === option && s.chosen]}>
          <Text style={s.body}>{option === null ? 'Quitar asignación' : option === 'madre' ? 'Con madre' : 'Con padre'}{home === option ? ' · Seleccionado' : ''}</Text>
        </Pressable>)}
        <Text style={s.muted}>Al guardar se sustituirá la asignación de los días del tramo. El resto del calendario se conserva.</Text>
        {!!(error || storageError) && <Text accessibilityRole="alert" style={s.error}>{error || storageError}</Text>}
        <Button label={saving ? 'Guardando…' : 'Guardar estancia'} disabled={saving} onPress={() => { void save(); }} />
        <Text style={s.muted}>Los cambios se guardan solo aquí. No se enviarán avisos ni se compartirán con otra cuenta.</Text>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}
