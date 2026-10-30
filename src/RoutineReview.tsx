import React from 'react';
import { Text, View } from 'react-native';
import { displayDate } from './calendar';
import { type PreviewCycle } from './routinePreview';
import { type Routine } from './routine';
import { colors, s } from './theme';
export function RoutineReview({ routine, cycles }: { routine: Routine; cycles: PreviewCycle[] }) {
  return <>
    <Text style={s.body}>Revisa dos ciclos completos antes de confirmar. Todas las fechas de cada tramo están incluidas.</Text>
    <Text style={s.muted}>Cada fecha asigna una casa para el día completo y su noche. Esta versión no divide el día en horas ni distingue estancias solo de tarde o solo de noche.</Text>
    {routine.kind === 'months' && <Text style={s.body}>Cada ciclo reúne dos meses naturales: un mes con cada progenitor. Aquí verás cuatro meses reales.</Text>}
    {routine.kind === 'cycle' && <View style={s.card}>
      <Text style={s.heading}>Orden que se repite</Text>
      <Text style={s.body}>{routine.blocks.map(block => block.days + ' días con ' + block.home).join(' → ')}</Text>
    </View>}
    {(!routine.kind || routine.kind === 'weekly') && routine.referenceFriday && <Text style={s.muted}>Viernes de referencia: {displayDate(routine.referenceFriday)}, con {routine.referenceHome}.</Text>}
    {cycles.map((cycle, index) => <View key={cycle.start} style={{ gap: 12 }} testID={'preview-cycle-' + (index + 1)}>
      <Text accessibilityRole="header" style={s.heading}>Ciclo {index + 1}</Text>
      <Text style={s.muted}>{displayDate(cycle.start)} al {displayDate(cycle.end)}</Text>
      {cycle.segments.map(segment => <View key={segment.start} style={[s.card, { padding: 14, gap: 4, borderLeftWidth: 5,
        borderLeftColor: segment.home === 'madre' ? colors.madreInk : segment.home === 'padre' ? colors.padreInk : colors.muted,
        backgroundColor: segment.home === 'madre' ? colors.madre : segment.home === 'padre' ? colors.padre : colors.surface }]}>
        <Text style={[s.body, { fontWeight: '600' }]}>{segment.home ? 'Con ' + segment.home : 'Sin asignar'} · {segment.days} {segment.days === 1 ? 'día' : 'días'}</Text>
        <Text style={s.body}>{displayDate(segment.start)}{segment.start === segment.end ? '' : ' al ' + displayDate(segment.end)}</Text>
        {segment.exception && <Text style={s.muted}>Cambio puntual guardado. La rutina aquí sería: {segment.usualHome ? 'con ' + segment.usualHome : 'sin asignar'}.</Text>}
      </View>)}
    </View>)}
    <Text style={s.muted}>La vista incluye tus cambios puntuales guardados. Mantienen prioridad aunque cambies de plantilla.</Text>
  </>;
}
