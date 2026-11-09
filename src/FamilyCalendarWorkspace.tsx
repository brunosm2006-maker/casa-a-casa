import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { BackpackScreen, type BagTarget } from './BackpackScreen';
import { CalendarScreen } from './CalendarScreen';
import { FamilyProposals } from './FamilyProposals';
import { ProposalForm } from './FamilyForms';
import { ReminderSettings } from './ReminderSettings';
import { RoutineScreen } from './RoutineScreen';
import { StayEditor } from './StayEditor';
import { TodayScreen } from './TodayScreen';
import { moveMonth, parseDate } from './calendar';
import { type FamilyCalendar, type FamilyMember, type FamilySnapshot } from './familyTypes';
import { type AppState } from './persistence';
import { useBackpacks } from './useBackpacks';
import { useReminders } from './useReminders';
import { Button } from './ui';
import { s } from './theme';

export function FamilyCalendarWorkspace({ calendar, snapshot, member, today, busy, local, command, onStep }: {
  calendar: FamilyCalendar; snapshot: FamilySnapshot; member: FamilyMember; today: string; busy: boolean; local: AppState;
  command(action: string, args: Record<string, unknown>): Promise<unknown>; onStep(): void;
}) {
  const scope = member.user_id + ':' + calendar.id;
  const bags = useBackpacks(scope);
  const reminders = useReminders(today, bags.loading ? null : true, calendar.payload.schedule, calendar.payload.routine, bags.bags, scope);
  const [page, setPage] = useState<'today' | 'calendar' | 'routine' | 'proposals' | 'bags' | 'reminders'>('today');
  const [visible, setVisible] = useState(() => ({ year: parseDate(today).getFullYear(), month: parseDate(today).getMonth() }));
  const [editing, setEditing] = useState<{ day: string; base: FamilyCalendar } | null>(null);
  const [routineBase, setRoutineBase] = useState(calendar);
  const [proposing, setProposing] = useState<string | null>(null);
  const [importBase, setImportBase] = useState<FamilyCalendar | null>(null);
  const [bagTarget, setBagTarget] = useState<BagTarget | null>(null);
  const [error, setError] = useState('');
  const parental = member.role === 'parent';
  const childName = snapshot.members.find(item => item.id === calendar.child_id)?.name ?? member.name;
  function go(next: typeof page) { setPage(next); setProposing(null); onStep(); }
  function routine() { if (parental) { setRoutineBase(calendar); go('routine'); } }
  async function save(base: FamilyCalendar, payload: FamilyCalendar['payload']) {
    if (!parental) return false;
    setError('');
    try {
      await command('save_calendar', { calendar_id: base.id, revision: base.revision, payload });
      return true;
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar el calendario.'); onStep(); return false; }
  }
  const calendarProps = {
    today, exceptions: calendar.payload.schedule, routine: calendar.payload.routine, profile: member.profile,
    editable: parental, shared: true,
  };
  return <View style={{ gap: 16 }}>
    <Text accessibilityRole="header" style={s.title}>Calendario de {childName}</Text>
    <Text style={s.muted}>Se consulta al entrar, al volver a la app y cada 15 segundos con conexión.</Text>
    <View style={s.row}>
      <Button label="Hoy y mañana" secondary onPress={() => go('today')} />
      <Button label="Calendario" secondary onPress={() => go('calendar')} />
      <Button label="Propuestas" secondary onPress={() => go('proposals')} />
      <Button label="Mi mochila" secondary onPress={() => { setBagTarget(null); go('bags'); }} />
      <Button label="Mis recordatorios" secondary onPress={() => go('reminders')} />
    </View>
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    {page === 'today' && <TodayScreen {...calendarProps} backpacks={bags}
      onBackpack={target => { setBagTarget(target); go('bags'); }}
      onCalendar={() => go('calendar')} onRoutine={routine} />}
    {page === 'calendar' && <CalendarScreen {...visible} {...calendarProps} onRoutine={routine}
      onMonth={direction => setVisible(current => moveMonth(current.year, current.month, direction))}
      onToday={() => setVisible({ year: parseDate(today).getFullYear(), month: parseDate(today).getMonth() })}
      onEdit={day => { if (parental) setEditing({ day, base: calendar }); else { setProposing(day); onStep(); } }} />}
    {page === 'routine' && parental && <RoutineScreen key={routineBase.id + ':' + routineBase.revision}
      routine={routineBase.payload.routine} exceptions={routineBase.payload.schedule} profile={member.profile}
      today={today} saving={busy} storageError={error} onStep={onStep} onClose={() => go('calendar')}
      onSave={async next => { const ok = await save(routineBase, { ...routineBase.payload, routine: next }); if (ok) go('calendar'); return ok; }} />}
    {page === 'proposals' && <>
      {!parental && <Button label="Nueva propuesta" disabled={busy} onPress={() => setProposing(today)} />}
      <FamilyProposals proposals={snapshot.proposals.filter(item => item.calendar_id === calendar.id)}
        members={snapshot.members} revision={calendar.revision} parental={parental} busy={busy} command={command} />
    </>}
    {proposing && !parental && <ProposalForm key={proposing} calendar={calendar} today={proposing} busy={busy}
      onClose={() => setProposing(null)} onSubmit={async args => {
        await command('propose', args);
        go('proposals');
        return true;
      }} />}
    {page === 'bags' && <BackpackScreen key={bagTarget?.listId ?? bagTarget?.date ?? 'all'} store={bags} target={bagTarget}
      exceptions={calendar.payload.schedule} routine={calendar.payload.routine} profile={member.profile} onStep={onStep}
      onCalendar={date => { if (date) setVisible({ year: parseDate(date).getFullYear(), month: parseDate(date).getMonth() }); go('calendar'); }} />}
    {page === 'reminders' && <ReminderSettings store={reminders} />}
    <Text style={s.muted}>Tu mochila y tus recordatorios pertenecen a esta cuenta y este calendario en este dispositivo. Los avisos se preparan para el calendario que tienes abierto y se actualizan al cambiar.</Text>
    {parental && local.profile && <View style={s.card}>
      <Text style={s.heading}>Importar mi calendario individual</Text>
      <Text style={s.body}>Puedes copiar su rutina y sus cambios puntuales al calendario de {childName}.</Text>
      {importBase ? <>
        <Text style={s.body}>Se sustituirá el calendario confirmado de {childName}. Se copiarán {Object.keys(local.schedule).length} fechas con cambio puntual y {local.routine ? 'una rutina' : 'ninguna rutina'}. Tu calendario individual se conserva.</Text>
        <Button label="Confirmar importación" disabled={busy} onPress={async () => {
          if (await save(importBase, { schedule: local.schedule, routine: local.routine })) setImportBase(null);
        }} />
        <Button label="Cancelar importación" secondary disabled={busy} onPress={() => setImportBase(null)} />
      </> : <Button label="Revisar importación" secondary disabled={busy} onPress={() => setImportBase(calendar)} />}
    </View>}
    {editing && parental && <StayEditor shared day={editing.day} schedule={editing.base.payload.schedule}
      routine={editing.base.payload.routine} saving={busy} storageError={error} onClose={() => setEditing(null)}
      onSave={async schedule => save(editing.base, { ...editing.base.payload, schedule })} />}
  </View>;
}
