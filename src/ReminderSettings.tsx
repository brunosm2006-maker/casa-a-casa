import React, { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { reminderDays, reminderKinds, type ReminderKind, type ReminderOption, type ReminderSettings as Settings } from './reminders';
import { type useReminders } from './useReminders';
import { Button } from './ui';
import { s } from './theme';

const labels = { change: 'Cambio de casa', bag: 'Preparar la mochila' };

function ReminderFields({ kind, option, saving, onChange }: {
  kind: ReminderKind; option: ReminderOption; saving: boolean; onChange(option: ReminderOption): void;
}) {
  const label = labels[kind];
  return <View style={s.card}>
    <Text accessibilityRole="header" style={s.heading}>{label}</Text>
    <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked: option.enabled }}
      aria-checked={option.enabled} disabled={saving} style={[s.choice, option.enabled && s.chosen]}
      onPress={() => onChange({ ...option, enabled: !option.enabled })}>
      <Text style={s.body}>{option.enabled ? '✓ Activado' : 'Desactivado'}</Text>
    </Pressable>
    <Text style={s.body}>Días antes del cambio (0–7)</Text>
    <TextInput accessibilityLabel={'Días antes · ' + label} inputMode="numeric" maxLength={1}
      style={s.input} editable={!saving} value={Number.isNaN(option.daysBefore) ? '' : String(option.daysBefore)}
      onChangeText={value => onChange({ ...option, daysBefore: /^[0-7]$/.test(value) ? Number(value) : NaN })} />
    <Text style={s.muted}>Usa 0 para avisar el mismo día.</Text>
    <Text style={s.body}>Hora local (HH:MM)</Text>
    <TextInput accessibilityLabel={'Hora local · ' + label} autoCorrect={false} autoCapitalize="none" maxLength={5}
      style={s.input} editable={!saving} value={option.time} onChangeText={time => onChange({ ...option, time })} />
    {kind === 'bag' && <Text style={s.muted}>Para cambios con una lista de esa fecha y destino que aún esté por preparar.</Text>}
  </View>;
}

function ReminderForm({ store, initial }: { store: ReturnType<typeof useReminders>; initial: Settings }) {
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(false);
  return <>
    {reminderKinds.map(kind => <ReminderFields key={kind} kind={kind} option={draft[kind]} saving={store.saving}
      onChange={option => { setSaved(false); setDraft(value => ({ ...value, [kind]: option })); }} />)}
    {!!store.saveError && <Text accessibilityRole="alert" style={s.error}>{store.saveError}</Text>}
    <Button label={store.saving ? 'Guardando…' : 'Guardar recordatorios'} disabled={store.saving}
      onPress={async () => setSaved(await store.save(draft))} />
    {saved && <Text accessibilityLiveRegion="polite" style={s.body}>Preferencias guardadas en este dispositivo.</Text>}
  </>;
}

export function ReminderSettings({ store }: { store: ReturnType<typeof useReminders> }) {
  return <View style={{ gap: 12 }}>
    <Text accessibilityRole="header" style={s.title}>Recordatorios</Text>
    <Text style={s.body}>El horario inicial de cada aviso es el día anterior a las 18:00. Puedes cambiarlo y activar cada aviso por separado.</Text>
    {store.native ? <>
      <Text style={s.muted}>{'Se revisan los cambios de los próximos ' + reminderDays + ' días al volver a la app. Los avisos muestran un mensaje breve sin detalles de la estancia.'}</Text>
      {Platform.OS === 'android' && <Text style={s.muted}>Android puede retrasar los avisos según los ajustes de batería.</Text>}
      {store.permission === 'allowed' ? <Text style={s.body}>Notificaciones permitidas en el teléfono.</Text>
        : store.permission && <>
          <Text style={s.body}>{store.permission === 'ask'
            ? 'Permite las notificaciones del teléfono para recibir los avisos que actives.'
            : 'Las notificaciones están bloqueadas. Puedes habilitarlas en los ajustes del teléfono.'}</Text>
          <Button label={store.permission === 'ask' ? 'Permitir notificaciones' : 'Abrir ajustes del teléfono'}
            disabled={store.requesting} onPress={() => { void store.requestPermission(); }} />
        </>}
      {!!store.permissionError && <Text accessibilityRole="alert" style={s.error}>{store.permissionError}</Text>}
      {!!store.deviceError && <>
        <Text accessibilityRole="alert" style={s.error}>{store.deviceError}</Text>
        <Button label="Volver a comprobar los avisos" secondary onPress={store.retry} />
      </>}
    </> : <Text style={s.body}>Puedes guardar y probar los ajustes aquí. Los avisos del sistema solo se programan en la app de iOS o Android.</Text>}
    {store.settings ? <ReminderForm store={store} initial={store.settings} />
      : <Text accessibilityRole={store.readError ? 'alert' : undefined} style={store.readError ? s.error : s.muted}>
        {store.readError ? 'No se pudieron leer los ajustes guardados. Vuelve a abrir la aplicación para intentarlo de nuevo.' : 'Cargando recordatorios…'}
      </Text>}
  </View>;
}
