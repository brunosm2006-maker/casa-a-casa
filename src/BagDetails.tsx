import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { displayDate, type Schedule } from './calendar';
import { type Routine } from './routine';
import { addBagItem, bagDestinationStatus, editBagItem, removeBag, removeBagItem, toggleBagItem, type PackingList } from './backpacks';
import { PackingProgress } from './PackingProgress';
import { BagItemRow } from './BagItemRow';
import { Button } from './ui';
import { s } from './theme';

export function BagDetails({ bag, bags, exceptions, routine, saving, onSave, onBack, onCopy, onStep }: {
  bag: PackingList; bags: PackingList[]; exceptions: Schedule; routine: Routine | null; saving: boolean;
  onSave: (bags: PackingList[]) => Promise<boolean>; onBack: () => void; onCopy: () => void; onStep: () => void;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const status = bagDestinationStatus(bag, exceptions, routine);
  async function run(action: () => PackingList[]): Promise<boolean> {
    setError('');
    try { return await onSave(action()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Revisa el objeto.'); onStep(); return false; }
  }
  return <View style={{ gap: 20 }}>
    <Button label="Todas las listas" secondary onPress={onBack} disabled={saving} />
    <Text accessibilityRole="header" style={s.title}>Tu lista de Mochila</Text>
    <Text style={s.heading}>{displayDate(bag.date)} · con {bag.destination}</Text>
    <PackingProgress bag={bag} />
    {status.changed && <View style={s.card} testID="bag-calendar-warning">
      <Text style={s.heading}>El calendario ha cambiado</Text>
      <Text style={s.body}>Ahora indica {status.current ? 'una estancia con ' + status.current : 'un día sin asignar'}. Esta lista sigue guardada para {bag.destination}, en su fecha original.</Text>
      <Text style={s.muted}>No se ha reasignado ni borrado. Puedes copiar sus objetos a una lista para otra fecha o destino.</Text>
    </View>}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    {bag.items.map(item => <BagItemRow key={item.id} item={item} saving={saving}
      onToggle={() => { void run(() => toggleBagItem(bags, bag.id, item.id)); }}
      onEdit={value => run(() => editBagItem(bags, bag.id, item.id, value))}
      onRemove={() => run(() => removeBagItem(bags, bag.id, item.id))} />)}
    <View style={s.card}>
      <Text style={s.heading}>Añadir objeto</Text>
      <TextInput accessibilityLabel="Nombre del objeto" value={text} onChangeText={setText}
        maxLength={120} editable={!saving} style={s.input} placeholder="¿Qué quieres llevar?" />
      <Button label="Añadir objeto" disabled={saving} onPress={async () => {
        if (await run(() => addBagItem(bags, bag.id, text))) setText('');
      }} />
      <Text style={s.muted}>Los cambios se conservan cuando termina el guardado.</Text>
    </View>
    <Button label="Copiar esta lista" secondary disabled={saving} onPress={onCopy} />
    {!deleting ? <Button label="Eliminar lista" secondary disabled={saving} onPress={() => setDeleting(true)} /> :
      <View style={s.card}>
        <Text style={s.heading}>¿Eliminar esta lista?</Text>
        <Text style={s.body}>Se eliminarán sus {bag.items.length} objetos y sus marcas. Esta acción no se puede deshacer.</Text>
        <Button label="Sí, eliminar esta lista" disabled={saving} onPress={async () => {
          if (await run(() => removeBag(bags, bag.id))) onBack();
        }} />
        <Button label="Conservar lista" secondary disabled={saving} onPress={() => setDeleting(false)} />
      </View>}
  </View>;
}
