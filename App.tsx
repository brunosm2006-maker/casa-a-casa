import React, { useEffect, useRef, useState } from 'react';
import { AppState as NativeAppState, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CalendarScreen } from './src/CalendarScreen';
import { ProfileScreen, profileLabel } from './src/ProfileScreen';
import { StayEditor } from './src/StayEditor';
import { RoutineScreen } from './src/RoutineScreen';
import { dateKey, moveMonth, parseDate } from './src/calendar';
import { useLocalState } from './src/useLocalState';
import { Button } from './src/ui';
import { colors, s } from './src/theme';

function CalendarApp() {
  const { state, loading, saving, error, loadFailed, reload, commit } = useLocalState();
  const [today, setToday] = useState(() => dateKey(new Date()));
  const [visible, setVisible] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }));
  const [screen, setScreen] = useState<'calendar' | 'profile' | 'routine'>('calendar');
  const [editing, setEditing] = useState<string | null>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scrollTop = () => scroll.current?.scrollTo({ y: 0, animated: false });
  useEffect(scrollTop, [screen]);
  useEffect(() => {
    if (!loading && state.profile && !state.setupComplete) setScreen('routine');
  }, [loading, state.profile, state.setupComplete]);

  useEffect(() => {
    const refresh = () => setToday(dateKey(new Date()));
    const timer = setInterval(refresh, 30_000);
    const listener = NativeAppState.addEventListener('change', status => { if (status === 'active') refresh(); });
    return () => { clearInterval(timer); listener.remove(); };
  }, []);

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
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      {(!state.profile || screen === 'profile') ? <ProfileScreen profile={state.profile} saving={saving} onChoose={async profile => {
        if (await commit({ ...state, profile })) setScreen(state.profile ? 'calendar' : 'routine');
      }} /> : screen === 'routine' ? <RoutineScreen routine={state.routine} profile={state.profile} today={today} saving={saving} storageError={error} onStep={scrollTop}
        onClose={async () => { if (state.setupComplete || await commit({ ...state, setupComplete: true })) setScreen('calendar'); }} onSave={async routine => {
          const success = await commit({ ...state, routine, setupComplete: true });
          if (success) { const date = parseDate(routine.start); setVisible({ year: date.getFullYear(), month: date.getMonth() }); setScreen('calendar'); }
          return success;
        }} /> : <CalendarScreen {...visible} today={today} exceptions={state.schedule} routine={state.routine} profile={state.profile}
        onRoutine={() => setScreen('routine')}
        onMonth={direction => setVisible(current => moveMonth(current.year, current.month, direction))}
        onToday={() => { const date = parseDate(today); setVisible({ year: date.getFullYear(), month: date.getMonth() }); }}
        onEdit={setEditing} />}
      <Text style={s.muted}>Solo en este dispositivo · Sin cuentas vinculadas</Text>
    </ScrollView>
    {!!state.profile && <View style={s.nav}>
      {([{ id: 'calendar', label: 'Calendario' }, { id: 'routine', label: 'Rutina' }, { id: 'profile', label: 'Perfil' }] as const).map(tab => <Pressable key={tab.id}
        accessibilityRole="tab" accessibilityState={{ selected: screen === tab.id }} onPress={() => setScreen(tab.id)}
        style={[s.navItem, screen === tab.id && { backgroundColor: colors.soft }]}>
        <Text style={[s.body, { fontWeight: screen === tab.id ? '700' : '400' }]}>{tab.label}</Text>
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
  return <SafeAreaProvider><CalendarApp /></SafeAreaProvider>;
}
