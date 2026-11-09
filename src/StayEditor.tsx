import { DateInput } from './DateInput';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fromInput, inputDate, type Home, type Schedule } from './calendar';
import { effectiveHome, setExceptionRange, type Routine } from './routine';
import { Button } from './ui';
import { colors, s } from './theme';

export function StayEditor({ day, schedule, routine, saving, storageError, onSave, onClose, shared = false }: {
  day: string; schedule: Schedule; routine: Routine | null; saving: boolean; storageError: string;
  shared?: boolean;
  onSave: (schedule: Schedule, start: string) => Promise<boolean>; onClose: () => void;
}) {
  const [start, setStart] = useState(inputDate(day));
  const [end, setEnd] = useState(inputDate(day));
  const [home, setHome] = useState<Home | null | 'rutina'>(effectiveHome(schedule, routine, day));
  const [error, setError] = useState('');

  async function save() {
    setError('');
    try {
      const first = fromInput(start);
      const next = setExceptionRange(schedule, first, fromInput(end), home);
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
        <Text accessibilityRole="header" style={s.title}>Cambio puntual</Text>
        <Text style={s.body}>Para vacaciones, festivos u otros cambios. La rutina continuará fuera de estas fechas. Para un solo día, usa la misma fecha en ambos campos.</Text>
        {Object.hasOwn(schedule, day) && <Text style={s.muted}>Este día tiene un cambio puntual guardado.</Text>}
        <View style={s.card}>
          <Text style={s.body}>Desde · DD/MM/AAAA</Text>
          <DateInput autoFocus accessibilityLabel="Fecha inicial" placeholder="DD/MM/AAAA" placeholderTextColor={colors.muted}
            value={start} onChangeText={setStart} style={s.input} editable={!saving} autoCorrect={false} />
          <Text style={s.body}>Hasta · DD/MM/AAAA</Text>
          <DateInput accessibilityLabel="Fecha final" placeholder="DD/MM/AAAA" placeholderTextColor={colors.muted}
            value={end} onChangeText={setEnd} style={s.input} editable={!saving} autoCorrect={false} />
          <Text style={s.muted}>Ambas fechas están incluidas. Hasta 366 días por estancia.</Text>
        </View>
        <Text accessibilityRole="header" style={s.heading}>¿Con quién?</Text>
        {(['madre', 'padre', null, 'rutina'] as const).map(option => <Pressable key={option ?? 'borrar'}
          accessibilityRole="radio" accessibilityState={{ checked: home === option, disabled: saving }} disabled={saving}
          onPress={() => setHome(option)} style={[s.choice, home === option && s.chosen]}>
          <Text style={s.body}>{option === null ? 'Dejar sin asignar' : option === 'rutina' ? 'Quitar cambio puntual · recuperar rutina' : option === 'madre' ? 'Con madre' : 'Con padre'}{home === option ? ' · Seleccionado' : ''}</Text>
        </Pressable>)}
        <Text style={s.muted}>«Dejar sin asignar» deja esos días vacíos, aunque haya rutina. «Quitar cambio puntual» recupera la rutina; si no hay una, los deja vacíos. El resto del calendario se conserva.</Text>
        {!!(error || storageError) && <Text accessibilityRole="alert" style={s.error}>{error || storageError}</Text>}
        <Button label={saving ? 'Guardando…' : 'Guardar cambio puntual'} disabled={saving} onPress={() => { void save(); }} />
        <Text style={s.muted}>{shared ? 'Al guardar se actualiza el calendario familiar confirmado.' : 'Los cambios se guardan en tu calendario individual.'}</Text>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}
