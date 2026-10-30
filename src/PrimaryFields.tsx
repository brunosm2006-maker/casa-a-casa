import { DateInput } from './DateInput';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { type Home } from './calendar';
import { Choice, homeOptions } from './RoutineControls';
import { dayNames } from './RoutineFields';
import { s } from './theme';
export function PrimaryFields({ home, setHome, guest, setGuest, days, setDays, alternate, setAlternate, friday, setFriday }: {
  home: Home | null; setHome: (value: Home | null) => void; guest: Home | null; setGuest: (value: Home) => void;
  days: number[]; setDays: (value: number[]) => void; alternate: boolean; setAlternate: (value: boolean) => void; friday: string; setFriday: (value: string) => void;
}) {
  return <>
    <View style={s.card}>
      <Choice title="Progenitor habitual" value={home} options={[...homeOptions, { value: null, label: 'Sin asignar el resto' }]} onChange={setHome} />
      <Choice title="Progenitor de las otras estancias" value={guest} options={homeOptions} onChange={value => { if (value) setGuest(value); }} />
      <Text style={s.muted}>Si solo conoces los fines de semana, deja el resto sin asignar. No se completará con datos supuestos.</Text>
    </View>
    <View style={s.card}>
      <Text style={s.heading}>Días completos de las otras estancias</Text>
      {dayNames.map((name, index) => <Pressable key={name} accessibilityRole="checkbox" accessibilityLabel={'Estancia: ' + name}
        aria-checked={days.includes(index)} accessibilityState={{ checked: days.includes(index) }} onPress={() => setDays(days.includes(index) ? days.filter(day => day !== index) : [...days, index].sort())}
        style={[s.choice, days.includes(index) && s.chosen]}><Text style={s.body}>{name}{days.includes(index) ? ' ✓' : ''}</Text></Pressable>)}
      <Choice title="Fines de semana" value={alternate ? 'alternos' : 'todos'} onChange={value => setAlternate(value === 'alternos')}
        options={[{ value: 'alternos', label: 'Alternos' }, { value: 'todos', label: 'Todas las semanas' }]} />
      <Text style={s.muted}>Los días elegidos de lunes a jueves se repiten cada semana. La alternancia se aplica solo a los días elegidos de viernes a domingo.</Text>
    </View>
    {alternate && days.some(day => day >= 4) && <View style={s.card}>
      <Text style={s.heading}>Primer fin de semana de esas estancias</Text>
      <Text style={s.body}>Indica el viernes de un fin de semana con el progenitor de las otras estancias. Ese turno se repetirá cada dos semanas.</Text>
      <Text style={s.muted}>Viernes de referencia · DD/MM/AAAA</Text>
      <DateInput accessibilityLabel="Viernes de referencia" value={friday} onChangeText={setFriday} style={s.input} autoCorrect={false} placeholder="DD/MM/AAAA" />
    </View>}
  </>;
}
