import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { displayDate, fromInput, inputDate, type Schedule } from './calendar';
import { effectiveHome, type Routine } from './routine';
import { createBag, type PackingList } from './backpacks';
import { DateInput } from './DateInput';
import { Button } from './ui';
import { s } from './theme';

export function BagCreateForm({ bags, exceptions, routine, initialDate, initialSource, saving, onSave, onOpen, onCancel, onCalendar }: {
  bags: PackingList[]; exceptions: Schedule; routine: Routine | null; initialDate?: string; initialSource?: string; saving: boolean;
  onSave: (bags: PackingList[]) => Promise<boolean>; onOpen: (id: string) => void; onCancel: () => void; onCalendar: (date?: string) => void;
}) {
  const [dateText, setDateText] = useState(initialDate ? inputDate(initialDate) : '');
  const [sourceId, setSourceId] = useState<string | undefined>(initialSource);
  const [error, setError] = useState('');
  let date: string | undefined;
  try { date = fromInput(dateText); } catch { /* Validation is shown when creating. */ }
  const destination = date ? effectiveHome(exceptions, routine, date) : null;
  const existing = bags.find(bag => bag.date === date && bag.destination === destination);
  async function create() {
    setError('');
    try {
      const next = createBag(bags, fromInput(dateText), exceptions, routine, sourceId);
      if (await onSave(next)) onOpen(next[next.length - 1]!.id);
    } catch (err) { setError(err instanceof Error ? err.message : 'Revisa la fecha.'); }
  }
  return <View style={{ gap: 20 }}>
    <Text accessibilityRole="header" style={s.title}>Nueva lista de Mochila</Text>
    <Text style={s.body}>Elige una fecha de la estancia. El destino se tomará del calendario; no se supondrá cuánto dura.</Text>
    <View style={s.card}>
      <Text style={s.body}>Fecha de la estancia · DD/MM/AAAA</Text>
      <DateInput accessibilityLabel="Fecha de la mochila" value={dateText} onChangeText={setDateText} editable={!saving} />
      <Text style={s.body}>{destination ? 'Destino previsto: con ' + destination + '.' : date ? 'Esta fecha no tiene destino asignado en el calendario.' : 'Escribe una fecha para consultar su destino.'}</Text>
      {date && !destination && <Button label="Completar esta fecha en el calendario" secondary onPress={() => onCalendar(date)} />}
      {date && destination && <Text style={s.muted}>La lista se vincula a esta fecha y destino. No se afirma que sea el inicio ni el final de la estancia.</Text>}
    </View>
    {existing ? <View style={s.card}><Text style={s.body}>Ya tienes una lista para esta fecha y destino.</Text>
      <Button label="Abrir la lista existente" onPress={() => onOpen(existing.id)} /></View> : <>
      <View style={s.card}>
        <Text style={s.heading}>¿De dónde partimos?</Text>
        <Pressable accessibilityRole="radio" accessibilityLabel="Empezar una lista vacía" aria-checked={!sourceId}
          disabled={saving} onPress={() => setSourceId(undefined)} style={[s.choice, !sourceId && s.chosen]}>
          <Text style={s.body}>Empezar una lista vacía{!sourceId ? ' ✓' : ''}</Text>
        </Pressable>
        {bags.map(bag => <Pressable key={bag.id} accessibilityRole="radio"
          accessibilityLabel={'Copiar lista del ' + displayDate(bag.date) + ' con ' + bag.destination} aria-checked={sourceId === bag.id}
          disabled={saving} onPress={() => setSourceId(bag.id)} style={[s.choice, sourceId === bag.id && s.chosen]}>
          <Text style={s.body}>Copiar objetos del {displayDate(bag.date)} · con {bag.destination}{sourceId === bag.id ? ' ✓' : ''}</Text>
        </Pressable>)}
        <Text style={s.muted}>Al copiar, todos los objetos empiezan pendientes. La lista original y sus marcas se conservan.</Text>
      </View>
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      <Button label={saving ? 'Guardando…' : 'Crear lista'} disabled={saving} onPress={() => { void create(); }} />
    </>}
    <Button label="Cancelar" secondary disabled={saving} onPress={onCancel} />
  </View>;
}
