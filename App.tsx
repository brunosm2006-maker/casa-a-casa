import { FamilyScreen } from './src/FamilyScreen';
import { BackpackScreen, type BagTarget } from './src/BackpackScreen';
import { useBackpacks } from './src/useBackpacks';
import { useReminders } from './src/useReminders';
import { ReminderSettings } from './src/ReminderSettings';
import { TodayScreen } from './src/TodayScreen';
import { useLocalDate } from './src/useLocalDate';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CalendarScreen } from './src/CalendarScreen';
import { ProfileScreen, profileLabel } from './src/ProfileScreen';
import { StayEditor } from './src/StayEditor';
import { RoutineScreen } from './src/RoutineScreen';
import { moveMonth, parseDate } from './src/calendar';
import { useLocalState } from './src/useLocalState';
import { Button } from './src/ui';
import { colors, s } from './src/theme';

function CalendarApp({ onFamily }: { onFamily(): void }) {
  const { state, loading, saving, error, loadFailed, reload, commit } = useLocalState();
  const today = useLocalDate();
  const backpacks = useBackpacks();
  const reminderCalendarReady = loading || backpacks.loading ? null : !!state.profile && !loadFailed;
  const reminders = useReminders(today, reminderCalendarReady, state.schedule, state.routine, backpacks.bags);
  const [bagTarget, setBagTarget] = useState<BagTarget | null>(null);
  const [visible, setVisible] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }));
  const [screen, setScreen] = useState<'today' | 'calendar' | 'profile' | 'routine' | 'bags'>('today');
  const [editing, setEditing] = useState<string | null>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scrollTop = () => scroll.current?.scrollTo({ y: 0, animated: false });
  useEffect(scrollTop, [screen]);
  useEffect(() => {
    if (!loading && state.profile && !state.setupComplete) setScreen('routine');
  }, [loading, state.profile, state.setupComplete]);

  if (loading || loadFailed) return <SafeAreaView style={s.root}><View style={s.content}>
    <Text style={s.heading}>{loading ? 'Abriendo tu calendario…' : 'No se pudo abrir el calendario'}</Text>
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    {loadFailed && <Button label="Volver a intentar" onPress={() => { void reload(); }} />}
  </View></SafeAreaView>;

  return <SafeAreaView style={s.root}>
    <StatusBar style="dark" />
    <ScrollView ref={scroll} contentContainerStyle={s.content}>
      <View style={s.between}>
        <Text style={s.eyebrow}>CASA A CASA</Text>
        <Text style={s.muted}>{state.profile ? profileLabel[state.profile] : 'Primera versión'}</Text>
      </View>
      <Button label="Cuenta y familia" secondary onPress={onFamily} />
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      {(!state.profile || screen === 'profile') ? <ProfileScreen profile={state.profile} saving={saving} onChoose={async profile => {
        if (await commit({ ...state, profile })) setScreen(state.profile ? 'today' : 'routine');
      }} /> : screen === 'routine' ? <RoutineScreen routine={state.routine} exceptions={state.schedule} profile={state.profile} today={today} saving={saving} storageError={error} onStep={scrollTop}
        onClose={async () => { if (state.setupComplete || await commit({ ...state, setupComplete: true })) setScreen(state.setupComplete ? 'today' : 'calendar'); }} onSave={async routine => {
          const success = await commit({ ...state, routine, setupComplete: true });
          if (success) { const date = parseDate(routine.start); setVisible({ year: date.getFullYear(), month: date.getMonth() }); setScreen('today'); }
          return success;
        }} /> : screen === 'bags' ? <BackpackScreen key={bagTarget?.listId ?? bagTarget?.date ?? 'all'} store={backpacks} onStep={scrollTop} target={bagTarget} exceptions={state.schedule} routine={state.routine} profile={state.profile}
        onCalendar={date => { if (date) { const value = parseDate(date); setVisible({ year: value.getFullYear(), month: value.getMonth() }); setBagTarget({ date }); } setScreen('calendar'); }} /> : screen === 'today' ? <TodayScreen backpacks={backpacks} onBackpack={target => { setBagTarget(target); setScreen('bags'); }} today={today} exceptions={state.schedule} routine={state.routine} profile={state.profile}
        onCalendar={() => { const date = parseDate(today); setVisible({ year: date.getFullYear(), month: date.getMonth() }); setScreen('calendar'); }}
        onRoutine={() => setScreen('routine')} /> : <CalendarScreen {...visible} today={today} exceptions={state.schedule} routine={state.routine} profile={state.profile}
        onRoutine={() => setScreen('routine')}
        onMonth={direction => setVisible(current => moveMonth(current.year, current.month, direction))}
        onToday={() => { const date = parseDate(today); setVisible({ year: date.getFullYear(), month: date.getMonth() }); }}
        onEdit={setEditing} />}
      {state.profile && screen === 'profile' && <ReminderSettings store={reminders} />}
      <Text style={s.muted}>Solo en este dispositivo · Sin cuentas vinculadas</Text>
    </ScrollView>
    {!!state.profile && <View style={[s.nav, { gap: 4, padding: 4 }]}>
      {([{ id: 'today', label: 'Hoy y mañana' }, { id: 'calendar', label: 'Calendario' }, { id: 'bags', label: 'Mochila' }, { id: 'routine', label: 'Rutina' }, { id: 'profile', label: 'Perfil' }] as const).map(tab => <Pressable key={tab.id}
        accessibilityRole="tab" aria-selected={screen === tab.id} accessibilityState={{ selected: screen === tab.id }} onPress={() => { if (tab.id === 'bags') setBagTarget(null); setScreen(tab.id); }}
        style={[s.navItem, screen === tab.id && { backgroundColor: colors.soft }]}>
        <Text style={[s.body, { fontSize: 12, textAlign: 'center', fontWeight: screen === tab.id ? '700' : '400' }]}>{tab.label}</Text>
      </Pressable>)}
    </View>}
    {editing && <StayEditor key={editing} day={editing} schedule={state.schedule} routine={state.routine} saving={saving} storageError={error}
      onClose={() => setEditing(null)} onSave={async (schedule, start) => {
        const success = await commit({ ...state, schedule });
        if (success) { const date = parseDate(start); setVisible({ year: date.getFullYear(), month: date.getMonth() }); }
        return success;
      }} />}
  </SafeAreaView>;
}

export default function App() {
  const [familyMode, setFamilyMode] = useState(false);
  return <SafeAreaProvider>{familyMode ? <FamilyScreen onClose={() => setFamilyMode(false)} /> : <CalendarApp onFamily={() => setFamilyMode(true)} />}</SafeAreaProvider>;
}
