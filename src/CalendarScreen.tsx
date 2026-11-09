import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { displayDate, monthCells, parseDate, type Schedule } from './calendar';
import { effectiveHome, effectiveMonth, effectiveNextChange, type Routine } from './routine';
import { type Profile } from './persistence';
import { colors, s } from './theme';
import { Button } from './ui';

export function CalendarScreen({ year, month, today, exceptions, routine, profile, onMonth, onToday, onEdit, onRoutine, editable = true, shared = false }: {
  year: number; month: number; today: string; exceptions: Schedule; routine: Routine | null; profile: Profile;
  onMonth: (direction: number) => void; onToday: () => void; onEdit: (date: string) => void;
  onRoutine: () => void; editable?: boolean; shared?: boolean;
}) {
  const cells = monthCells(year, month);
  const child = profile === 'hijo' || profile === 'hija';
  const schedule = effectiveMonth(exceptions, routine, cells);
  const change = effectiveNextChange(exceptions, routine, today);
  const current = effectiveHome(exceptions, routine, today);
  const monthName = new Date(year, month, 1, 12).toLocaleDateString('es-ES', { month: 'long' });
  const count = cells.filter(day => day && schedule[day] === profile).length;
  const total = cells.filter(day => day && schedule[day]).length;
  return <View style={{ gap: 20 }}>
    <View style={{ gap: 8 }}>
      <Text style={s.eyebrow}>TU ORGANIZACIÓN FAMILIAR</Text>
      <Text accessibilityRole="header" style={s.title}>El tiempo en cada casa</Text>
      <Text style={s.body}>{child ? 'Consulta tus días y prepara el próximo cambio.' : 'Consulta los días que tu hijo o hija estará contigo.'}</Text>
      {editable && <Button label={routine ? 'Cambiar rutina' : 'Configurar rutina'} secondary onPress={onRoutine} />}
      {routine && <Text style={s.muted}>Rutina desde el {displayDate(routine.start)} · Se aplica también en los próximos años.</Text>}
    </View>
    <View style={[s.card, { backgroundColor: colors.soft, borderWidth: 0 }]}>
      <Text style={s.eyebrow}>PRÓXIMO CAMBIO</Text>
      <Text accessibilityRole="header" style={s.heading}>{change ? `${displayDate(change.date)} · con ${change.home}` : 'Sin cambios definidos'}</Text>
      <Text style={s.muted}>{current ? (child ? `Hoy estás con ${current}.` : current === profile ? 'Hoy tu hijo o hija está contigo.' : `Hoy tu hijo o hija está con ${current}.`) : 'Hoy todavía no tiene una casa asignada.'} {!change && 'El próximo cambio aparecerá cuando haya dos días seguidos con casas distintas.'}</Text>
    </View>
    <View style={styles.calendar}>
      <View style={[s.between, { paddingHorizontal: 12, paddingTop: 12 }]}>
        <View>
          <Text accessibilityRole="header" style={[s.heading, { textTransform: 'capitalize' }]}>{monthName}</Text>
          <Text style={s.muted}>{year}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Mes anterior" disabled={year === 1900 && month === 0}
            onPress={() => onMonth(-1)} style={styles.arrow}><Text style={styles.arrowText}>‹</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Mes siguiente" disabled={year === 2100 && month === 11}
            onPress={() => onMonth(1)} style={styles.arrow}><Text style={styles.arrowText}>›</Text></Pressable>
        </View>
      </View>
      <View style={styles.grid}>
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((label, i) => <View key={`week-${i}`} style={styles.week}><Text style={s.muted}>{label}</Text></View>)}
        {cells.map((day, i) => <View key={day ?? `blank-${i}`} style={styles.cellWrap}>
          {day && <Pressable accessibilityRole="button" accessibilityLabel={`${displayDate(day)}, ${schedule[day] ? `con ${schedule[day]}` : 'sin asignar'}${day === today ? ', hoy' : ''}`}
            onPress={() => onEdit(day)} style={({ pressed }) => [styles.cell,
              schedule[day] === 'madre' && { backgroundColor: colors.madre },
              schedule[day] === 'padre' && { backgroundColor: colors.padre },
              day === today && { borderColor: colors.green, borderWidth: 2 }, pressed && { opacity: 0.65 }]}>
            <Text style={styles.day}>{parseDate(day).getDate()}</Text>
            <Text numberOfLines={1} style={[styles.home, { color: schedule[day] === 'madre' ? colors.madreInk : schedule[day] === 'padre' ? colors.padreInk : colors.muted }]}>{schedule[day] === 'madre' ? 'Madre' : schedule[day] === 'padre' ? 'Padre' : '—'}{Object.hasOwn(exceptions, day) ? '*' : ''}</Text>
          </Pressable>}
        </View>)}
      </View>
      <View style={[s.row, { padding: 12 }]}>
        <Text style={[s.muted, { color: colors.madreInk }]}>● Madre</Text>
        <Text style={[s.muted, { color: colors.padreInk }]}>● Padre</Text>
        <Text style={s.muted}>— Sin asignar</Text>
        <Text style={s.muted}>Borde verde: hoy</Text>
        <Text style={s.muted}>* Cambio puntual</Text>
      </View>
    </View>
    <View style={s.row}>
      <View style={{ flex: 1 }}><Button label={editable ? "Añadir cambio puntual" : "Proponer cambio"} onPress={() => onEdit(year === parseDate(today).getFullYear() && month === parseDate(today).getMonth() ? today : `${year}-${String(month + 1).padStart(2, '0')}-01`)} /></View>
      <Button label="Ir a hoy" secondary onPress={onToday} />
    </View>
    <Text style={s.muted}>{child ? `${total} días asignados este mes.` : `${count} días contigo este mes.`} {editable ? 'Toca un día para modificarlo.' : 'Toca un día para proponer un cambio.'}</Text>
    {!routine && Object.keys(exceptions).length === 0 && <View style={s.card}>
      <Text accessibilityRole="header" style={s.heading}>Tu calendario empieza aquí</Text>
      <Text style={s.body}>Configura tu rutina para completar el calendario automáticamente o añade una estancia manual.</Text>
    </View>}
    <Text style={s.muted}>{shared ? 'Calendario familiar confirmado. Los hijos proponen y los progenitores resuelven.' : 'Calendario individual guardado en este dispositivo.'}</Text>
  </View>;
}

const styles = StyleSheet.create({
  calendar: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  week: { width: '14.285714%', height: 40, alignItems: 'center', justifyContent: 'center' },
  cellWrap: { width: '14.285714%', padding: 2 },
  cell: { minHeight: 58, paddingVertical: 6, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#F7F8F4', borderWidth: 2, borderColor: 'transparent' },
  day: { fontSize: 17, color: colors.ink, fontWeight: '600' },
  home: { fontSize: 10, fontWeight: '600' },
  arrow: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.soft },
  arrowText: { fontSize: 30, lineHeight: 34, color: colors.ink },
});
