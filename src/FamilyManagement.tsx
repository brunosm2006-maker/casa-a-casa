import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { type Profile } from './persistence';
import { type FamilySnapshot } from './familyTypes';
import { FamilyField, ProfileChoices } from './FamilyForms';
import { Button } from './ui';
import { s } from './theme';

export function FamilyManagement({ snapshot, parental, busy, command }: {
  snapshot: FamilySnapshot; parental: boolean; busy: boolean;
  command(action: string, args: Record<string, unknown>): Promise<unknown>;
}) {
  const [name, setName] = useState('');
  const [profile, setProfile] = useState<Profile>('hijo');
  const [error, setError] = useState('');
  const [invitation, setInvitation] = useState<{ token: string; expires_at: string; member: string } | null>(null);
  async function invite(memberId: string, memberName: string) {
    setError(''); setInvitation(null);
    try {
      const result = await command('create_invitation', { member_id: memberId }) as { token: string; expires_at: string };
      setInvitation({ ...result, member: memberName });
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo crear la invitación.'); }
  }
  return <View style={{ gap: 16 }}>
    <Text accessibilityRole="header" style={s.title}>{snapshot.family.name}</Text>
    <Text style={s.body}>Cada hijo tiene su calendario. El perfil describe la vista y el permiso familiar determina quién puede editar.</Text>
    {snapshot.members.map(member => <View style={s.card} key={member.id}>
      <Text style={s.heading}>{member.name}</Text>
      <Text style={s.body}>{member.profile} · {member.role === 'parent' ? 'Puede gestionar y resolver propuestas' : 'Puede consultar su calendario y proponer cambios'}</Text>
      <Text style={s.muted}>{member.user_id ? 'Cuenta vinculada' : 'Representado sin cuenta'}</Text>
      {parental && !member.user_id && <Button label={'Invitar a ' + member.name} secondary disabled={busy}
        onPress={() => { void invite(member.id, member.name); }} />}
    </View>)}
    {parental && <View style={s.card}>
      <Text accessibilityRole="header" style={s.heading}>Añadir miembro</Text>
      <FamilyField label="Nombre del miembro" value={name} onChange={setName} disabled={busy} />
      <ProfileChoices value={profile} onChange={setProfile} />
      <Text style={s.muted}>Al añadir un hijo o hija se crea su calendario. Puedes invitar a esa persona después.</Text>
      <Button label="Añadir a la familia" disabled={busy || !name.trim()} onPress={async () => {
        setError('');
        try {
          await command('add_member', { family_id: snapshot.family.id, name: name.trim(), profile });
          setName('');
        } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo añadir el miembro.'); }
      }} />
    </View>}
    {invitation && <View style={s.card}>
      <Text style={s.heading}>Invitación para {invitation.member}</Text>
      <Text style={s.body}>Comparte este código manualmente con esa persona. Caduca en 48 horas y se usa con una cuenta. Crear otro código invalida el anterior.</Text>
      <TextInput accessibilityLabel="Código de invitación para compartir" style={s.input} multiline value={invitation.token} editable={false} selectTextOnFocus />
      <Text style={s.muted}>{'Caduca el ' + new Date(invitation.expires_at).toLocaleString('es-ES')}</Text>
    </View>}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
  </View>;
}
