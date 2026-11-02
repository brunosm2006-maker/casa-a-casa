import React from 'react';
import { Text } from 'react-native';
import { bagProgress, type PackingList } from './backpacks';
import { s } from './theme';
export function PackingProgress({ bag }: { bag: PackingList }) {
  const progress = bagProgress(bag);
  return <Text style={s.body} aria-live="polite">{progress.total
    ? progress.ready + ' de ' + progress.total + (progress.total === 1 ? ' preparado' : ' preparados') + (progress.complete ? ' · Lista completada' : ' · ' + progress.pending + (progress.pending === 1 ? ' pendiente' : ' pendientes'))
    : 'Lista vacía · Añade objetos para empezar.'}</Text>;
}
