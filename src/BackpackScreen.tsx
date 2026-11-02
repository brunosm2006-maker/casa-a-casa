import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { displayDate, type Schedule } from './calendar';
import { type Routine } from './routine';
import { type Profile } from './persistence';
import { bagDestinationStatus, type PackingList } from './backpacks';
import { type useBackpacks } from './useBackpacks';
import { BagCreateForm } from './BagCreateForm';
import { BagDetails } from './BagDetails';
import { PackingProgress } from './PackingProgress';
import { Button } from './ui';
import { s } from './theme';

export type BagTarget = { date?: string; listId?: string };
export function BackpackScreen({ store, exceptions, routine, profile, target, onCalendar, onStep }: {
  store: ReturnType<typeof useBackpacks>; exceptions: Schedule; routine: Routine | null; profile: Profile;
  target: BagTarget | null; onCalendar: (date?: string) => void; onStep: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(target?.listId ?? null);
  const [form, setForm] = useState<{ date?: string; sourceId?: string } | null>(target?.date && !target.listId ? { date: target.date } : null);
  const selected = store.bags.find(bag => bag.id === selectedId);
  const back = () => { setForm(null); setSelectedId(null); onStep(); };
  const open = (id: string) => { setForm(null); setSelectedId(id); onStep(); };
  const save = async (next: PackingList[]) => { const success = await store.commit(next); if (!success) onStep(); return success; };
  const showForm = (value: { date?: string; sourceId?: string }) => { setForm(value); onStep(); };
  if (store.loading) return <Text style={s.body}>Abriendo tus mochilas…</Text>;
  if (store.loadFailed) return <View style={s.card}>
    <Text accessibilityRole="alert" style={s.error}>{store.error}</Text>
    <Button label="Volver a abrir Mochila" onPress={() => { void store.reload(); }} />
  </View>;
  return <View style={{ gap: 20 }}>
    {!!store.error && <Text accessibilityRole="alert" style={s.error}>{store.error}</Text>}
    {form ? <BagCreateForm key={(form.date ?? '') + ':' + (form.sourceId ?? '')}
      bags={store.bags} exceptions={exceptions} routine={routine} initialDate={form.date} initialSource={form.sourceId}
      saving={store.saving} onSave={save} onOpen={open} onCancel={() => { setForm(null); onStep(); }} onCalendar={onCalendar} /> :
      selected ? <BagDetails key={selected.id} bag={selected} bags={store.bags} exceptions={exceptions} routine={routine}
        saving={store.saving} onSave={save} onBack={back} onStep={onStep} onCopy={() => showForm({ sourceId: selected.id })} /> : <>
      <Text accessibilityRole="header" style={s.title}>Mochila</Text>
      <Text style={s.body}>{profile === 'hijo' || profile === 'hija' ? 'Prepara lo que quieres llevar a cada estancia.' : 'Organiza lo que tu hijo o hija llevará a cada estancia.'}</Text>
      <Button label="Nueva lista" onPress={() => showForm({})} />
      {!store.bags.length && <View style={s.card}>
        <Text style={s.heading}>Tu primera mochila</Text>
        <Text style={s.body}>Elige una fecha con destino asignado en el calendario y añade tus objetos. Puedes preparar estancias futuras y reutilizar listas anteriores.</Text>
      </View>}
      {[...store.bags].sort((a,b) => a.date.localeCompare(b.date)).map(bag => <Pressable key={bag.id}
        accessibilityRole="button" accessibilityLabel={'Abrir mochila del ' + displayDate(bag.date) + ' con ' + bag.destination}
        onPress={() => open(bag.id)} style={s.card}>
        <Text style={s.heading}>{displayDate(bag.date)}</Text><Text style={s.body}>Con {bag.destination}</Text>
        <PackingProgress bag={bag} />
        {bagDestinationStatus(bag, exceptions, routine).changed && <Text style={s.error}>El calendario ha cambiado. Revisa el destino de esta lista.</Text>}
      </Pressable>)}
      <Text style={s.muted}>Listas locales de este calendario. Los permisos familiares todavía no están definidos.</Text>
    </>}
  </View>;
}
