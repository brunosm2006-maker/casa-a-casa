import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { addDays, displayDate, fromInput, type Home } from './calendar';
import { type DayRule } from './routine';
import { colors, s } from './theme';

export const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export type Pattern = 'weekly' | 'weekends';
const label = (home: DayRule) => home === null ? 'Sin asignar' : home === 'alterno' ? 'Alterno' : home === 'madre' ? 'Madre' : 'Padre';

function Choices({ title, value, options, onChange, disabled }: {
  title: string; value: DayRule; options: DayRule[]; onChange: (value: DayRule) => void; disabled: boolean;
}) {
  return <View style={{ gap: 8 }}><Text style={[s.body, { fontWeight: '600' }]}>{title}</Text>
    <View style={[s.row, { gap: 8 }]}>{options.map(home => <Pressable key={home ?? 'empty'} accessibilityRole="radio"
      accessibilityLabel={`${title}: ${label(home)}`} aria-checked={value === home} accessibilityState={{ checked: value === home, disabled }} disabled={disabled}
      onPress={() => onChange(home)} style={[s.choice, { minHeight: 46 }, value === home && s.chosen]}>
      <Text style={s.body}>{label(home)}{value === home ? ' ✓' : ''}</Text>
    </Pressable>)}</View>
  </View>;
}

export function RoutineFields({ pattern, start, setStart, days, setDays, friday, setFriday, referenceHome, setReferenceHome, otherWeekendHome, setOtherWeekendHome, saving }: {
  pattern: Pattern; start: string; setStart: (value: string) => void; days: DayRule[]; setDays: (value: DayRule[]) => void;
  friday: string; setFriday: (value: string) => void; referenceHome: Home | null; setReferenceHome: (value: Home) => void;
  otherWeekendHome: Home | null; setOtherWeekendHome: (value: Home | null) => void; saving: boolean;
}) {
  let referenceLabel = '';
  try { if (friday) { const key = fromInput(friday); referenceLabel = `${displayDate(key)} al ${displayDate(addDays(key, 2))}`; } } catch { /* Validated before review. */ }
  return <>
    <View style={s.card}>
      <Text style={s.heading}>¿Desde qué fecha?</Text><Text style={s.muted}>Inicio de la rutina · DD/MM/AAAA</Text>
      <TextInput accessibilityLabel="Inicio de la rutina" value={start} onChangeText={setStart} editable={!saving}
        style={s.input} maxLength={10} placeholder="DD/MM/AAAA" placeholderTextColor={colors.muted} autoCorrect={false} />
    </View>
    <View style={s.card}>
      <Text accessibilityRole="header" style={s.heading}>{pattern === 'weekly' ? 'Días habituales' : 'De lunes a jueves'}</Text>
      {pattern === 'weekly' ? dayNames.map((name, index) => <Choices key={name} title={name} value={days[index] ?? null}
        options={index >= 4 ? ['madre', 'padre', 'alterno', null] : ['madre', 'padre', null]}
        disabled={saving} onChange={home => setDays(days.map((value, i) => i === index ? home : value))} />) : <>
        <Text style={s.body}>¿Con quién están los días entre semana? Si no quieres definirlos todavía, déjalos sin asignar.</Text>
        <Choices title="Entre semana" value={days[0] ?? null} options={['madre', 'padre', null]} disabled={saving}
          onChange={home => setDays([home, home, home, home, 'alterno', 'alterno', 'alterno'])} />
      </>}
    </View>
    {days.includes('alterno') && <View style={s.card}>
      <Text accessibilityRole="header" style={s.heading}>Un fin de semana de referencia</Text>
      <Text style={s.body}>Elige un viernes conocido. Los días alternos de ese fin de semana serán con el progenitor que indiques; el turno se repetirá cada dos semanas.</Text>
      <Text style={s.muted}>Viernes de referencia · DD/MM/AAAA</Text>
      <TextInput accessibilityLabel="Viernes de referencia" value={friday} onChangeText={setFriday} editable={!saving}
        style={s.input} maxLength={10} placeholder="DD/MM/AAAA" placeholderTextColor={colors.muted} autoCorrect={false} />
      {!!referenceLabel && <Text style={s.muted}>Del {referenceLabel}.</Text>}
      <Choices title="Fin de semana de referencia" value={referenceHome} options={['madre', 'padre']} disabled={saving}
        onChange={home => { if (home === 'madre' || home === 'padre') setReferenceHome(home); }} />
      <Choices title="Los otros fines de semana" value={otherWeekendHome} options={['madre', 'padre', null]} disabled={saving}
        onChange={home => { if (home !== 'alterno') setOtherWeekendHome(home); }} />
      <Text style={s.muted}>Los días «Alterno» de viernes a domingo comparten turno. Los demás días mantienen su asignación fija.</Text>
    </View>}
  </>;
}
