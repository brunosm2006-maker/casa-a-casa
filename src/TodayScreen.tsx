import React from 'react';
import { Text, View } from 'react-native';
import { displayDate, type Home, type Schedule } from './calendar';
import { type Routine } from './routine';
import { type Profile } from './persistence';
import { dailyOverview } from './dailyOverview';
import { Button } from './ui';
import { colors, s } from './theme';

export function TodayScreen({ today, exceptions, routine, profile, onCalendar, onRoutine }: {
  today: string; exceptions: Schedule; routine: Routine | null; profile: Profile;
  onCalendar: () => void; onRoutine: () => void;
}) {
  const overview = dailyOverview(today, exceptions, routine);
  const child = profile === 'hijo' || profile === 'hija';
  const assignment = (home: Home | null) => !home ? 'Sin asignar' : child ? 'Con ' + home : home === profile ? 'Estancia contigo' : 'Con su ' + home;
  const change = overview.change;
  return <View style={{ gap: 20 }}>
    <View style={{ gap: 8 }}>
      <Text style={s.eyebrow}>LAS PRÓXIMAS ESTANCIAS</Text>
      <Text accessibilityRole="header" style={s.title}>Hoy y mañana</Text>
      <Text style={s.body}>{child ? 'Consulta con quién tienes prevista tu estancia.' : 'Consulta las estancias previstas de tu hijo o hija.'}</Text>
      <Text style={s.muted}>Según tu calendario local. Las fechas indican días completos, sin horarios dentro del día.</Text>
    </View>
    {[{ label: 'Hoy', id: 'today', day: overview.today }, { label: 'Mañana', id: 'tomorrow', day: overview.tomorrow }].map(({ label, id, day }) =>
      <View key={id} testID={id + '-card'} style={[s.card, { borderLeftWidth: 5,
        borderLeftColor: day?.home === 'madre' ? colors.madreInk : day?.home === 'padre' ? colors.padreInk : colors.line,
        backgroundColor: day?.home === 'madre' ? colors.madre : day?.home === 'padre' ? colors.padre : colors.surface }]}>
        <View style={{ gap: 4 }}>
          <Text style={s.eyebrow}>{label.toUpperCase()}</Text>
          <Text style={s.muted}>{day ? displayDate(day.date) : 'Fuera del intervalo de fechas admitido'}</Text>
        </View>
        <Text accessibilityRole="header" style={s.heading}>{day ? assignment(day.home) : 'Sin información disponible'}</Text>
        {day && <Text style={s.body}>{!day.home ? 'Este día no tiene una casa asignada. Puedes completarlo en el calendario.' :
          child ? 'Tienes prevista una estancia con ' + day.home + '.' :
          day.home === profile ? 'Tu hijo o hija tiene prevista una estancia contigo.' : 'Tu hijo o hija tiene prevista una estancia con su ' + day.home + '.'}</Text>}
        {day?.exception && <Text style={s.muted}>Cambio puntual guardado para esta fecha.</Text>}
      </View>)}
    <View testID="next-change-card" style={[s.card, { backgroundColor: colors.soft }]}>
      <Text style={s.eyebrow}>PRÓXIMO CAMBIO DE CASA</Text>
      <Text accessibilityRole="header" style={s.heading}>{change ? change.date === today ? 'El cambio está previsto para hoy' : displayDate(change.date) : 'Aún no se puede determinar'}</Text>
      <Text style={s.body}>{change ? child ? 'Destino previsto: con ' + change.home + '.' :
        change.home === profile ? 'Tu hijo o hija tiene previsto venir contigo.' : 'Tu hijo o hija tiene previsto ir con su ' + change.home + '.' :
        'Hace falta conocer dos días seguidos con casas distintas. Un día sin asignar no se interpreta como una estancia con el otro progenitor.'}</Text>
      {change && <Text style={s.muted}>{change.date === today ? displayDate(today) + ' · ' : ''}No hay una hora de cambio definida.</Text>}
    </View>
    {!routine && <View style={s.card}>
      <Text accessibilityRole="header" style={s.heading}>Sin rutina configurada</Text>
      <Text style={s.body}>Puedes usar las fechas que añadas manualmente o configurar una rutina para completar el calendario.</Text>
    </View>}
    <Button label="Ver calendario" onPress={onCalendar} />
    <Button label={routine ? 'Cambiar rutina' : 'Configurar rutina'} secondary onPress={onRoutine} />
  </View>;
}
