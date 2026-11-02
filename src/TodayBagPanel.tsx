import React from 'react';
import { Text, View } from 'react-native';
import { displayDate, type Home } from './calendar';
import { nearbyBagChange } from './backpacks';
import { type useBackpacks } from './useBackpacks';
import { type BagTarget } from './BackpackScreen';
import { type Profile } from './persistence';
import { PackingProgress } from './PackingProgress';
import { Button } from './ui';
import { s } from './theme';
export function TodayBagPanel({ today, change, store, profile, onOpen }: {
  today: string; change: { date: string; home: Home } | null; store: ReturnType<typeof useBackpacks>; profile: Profile;
  onOpen: (target: BagTarget) => void;
}) {
  if (!change || !nearbyBagChange(today, change)) return null;
  const bag = store.bags.find(bag => bag.date === change.date && bag.destination === change.home);
  const previousDestination = store.bags.some(bag => bag.date === change.date && bag.destination !== change.home);
  return <View style={s.card} testID="today-backpack">
    <Text accessibilityRole="header" style={s.heading}>Mochila del próximo cambio</Text>
    <Text style={s.body}>{displayDate(change.date)} · con {change.home}</Text>
    {store.loading ? <Text style={s.muted}>Abriendo las mochilas guardadas…</Text> : store.loadFailed ? <>
      <Text style={s.error}>No se han podido abrir las mochilas guardadas.</Text>
      <Button label="Abrir Mochila" onPress={() => onOpen({})} />
    </> : <>
      {bag ? <PackingProgress bag={bag} /> : <Text style={s.body}>{profile === 'hijo' || profile === 'hija' ? 'Prepara la lista de lo que quieres llevar.' : 'Prepara la lista para la estancia de tu hijo o hija.'}</Text>}
      {previousDestination && <Text style={s.muted}>Hay una lista para esta fecha con otro destino. Se conserva en Mochila y no se ha reasignado.</Text>}
      <Button label={bag ? 'Ver mochila' : 'Preparar mochila'} onPress={() => onOpen(bag ? { listId: bag.id } : { date: change.date })} />
    </>}
    <Text style={s.muted}>Este acceso aparece el día anterior y el propio día del cambio. Los avisos del sistema siguen pendientes.</Text>
  </View>;
}
