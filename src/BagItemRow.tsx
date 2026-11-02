import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { type PackingItem } from './backpacks';
import { Button } from './ui';
import { colors, s } from './theme';

export function BagItemRow({ item, saving, onEdit, onToggle, onRemove }: {
  item: PackingItem; saving: boolean; onEdit: (text: string) => Promise<boolean>; onToggle: () => void; onRemove: () => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const [deleting, setDeleting] = useState(false);
  return <View style={s.card}>
    <Pressable accessibilityRole="checkbox" accessibilityLabel={item.text} aria-checked={item.prepared}
      accessibilityState={{ checked: item.prepared, disabled: saving || editing }} disabled={saving || editing} onPress={onToggle}
      style={{ minHeight: 48, gap: 6, justifyContent: 'center' }}>
      <Text style={[s.body, { fontWeight: '600' }, item.prepared && { color: colors.muted, textDecorationLine: 'line-through' }]}>{item.text}</Text>
      <Text style={s.muted}>{item.prepared ? '✓ Preparado' : '○ Pendiente'}</Text>
    </Pressable>
    {editing ? <>
      <TextInput accessibilityLabel={'Nuevo texto de ' + item.text} value={text} onChangeText={setText}
        maxLength={120} editable={!saving} style={s.input} autoFocus />
      <Button label="Guardar texto" disabled={saving} onPress={async () => { if (await onEdit(text)) setEditing(false); }} />
      <Button label="Cancelar edición" secondary disabled={saving} onPress={() => { setText(item.text); setEditing(false); }} />
    </> : <View style={s.row}>
      <Pressable accessibilityRole="button" accessibilityLabel={'Editar ' + item.text} disabled={saving}
        onPress={() => { setText(item.text); setEditing(true); setDeleting(false); }} style={[s.button, s.secondary]}>
        <Text style={[s.buttonText, s.secondaryText]}>Editar</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={'Quitar ' + item.text} disabled={saving}
        onPress={() => setDeleting(true)} style={[s.button, s.secondary]}>
        <Text style={[s.buttonText, s.secondaryText]}>Quitar</Text>
      </Pressable>
    </View>}
    {deleting && <View style={{ gap: 12 }}>
      <Text style={s.body}>¿Eliminar este objeto de la lista?</Text>
      <Button label="Eliminar objeto" disabled={saving} onPress={async () => { await onRemove(); }} />
      <Button label="Conservar objeto" secondary disabled={saving} onPress={() => setDeleting(false)} />
    </View>}
  </View>;
}
