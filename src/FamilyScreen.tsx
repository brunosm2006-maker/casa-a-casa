import React, { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { familyClient } from './familyClient';
import { FamilyField, ProfileChoices } from './FamilyForms';
import { FamilyManagement } from './FamilyManagement';
import { FamilyCalendarWorkspace } from './FamilyCalendarWorkspace';
import { useFamilyAccount } from './useFamilyAccount';
import { useFamilyData } from './useFamilyData';
import { useLocalState } from './useLocalState';
import { useLocalDate } from './useLocalDate';
import { type Profile } from './persistence';
import { Button } from './ui';
import { s } from './theme';

function FamilyAccess({ account }: { account: ReturnType<typeof useFamilyAccount> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return <View style={s.card}>
    <Text accessibilityRole="header" style={s.heading}>Tu cuenta de acceso</Text>
    <FamilyField label="Correo electrónico" value={email} onChange={setEmail} disabled={account.busy || !familyClient} />
    <FamilyField label="Contraseña" value={password} onChange={setPassword} password disabled={account.busy || !familyClient} />
    <Button label="Iniciar sesión" disabled={account.busy || !familyClient}
      onPress={() => { void account.authenticate(email, password, false); }} />
    <Button label="Crear cuenta" secondary disabled={account.busy || !familyClient}
      onPress={() => { void account.authenticate(email, password, true); }} />
    <Text style={s.muted}>Tu permiso familiar se asigna al crear la familia o aceptar una invitación. El perfil individual de la app sirve para adaptar la vista.</Text>
  </View>;
}

function ConnectedFamily({ userId, onStep }: { userId: string; onStep(): void }) {
  const data = useFamilyData(userId);
  const local = useLocalState();
  const today = useLocalDate();
  const [name, setName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [profile, setProfile] = useState<Profile>('madre');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [calendarId, setCalendarId] = useState<string | null>(null);
  const current = data.snapshot?.members.find(member => member.user_id === userId);
  const selected = data.snapshot?.calendars.find(calendar => calendar.id === calendarId);
  async function create() {
    setError('');
    try {
      const result = await data.command('create_family', { name: name.trim(), member_name: memberName.trim(), profile }) as { id: string };
      data.selectFamily(result.id); setName(''); setMemberName('');
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo crear la familia.'); }
  }
  async function join() {
    setError('');
    try {
      const result = await data.command('redeem_invitation', { token: token.trim() }) as { family_id: string };
      setToken(''); data.selectFamily(result.family_id);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo usar la invitación.'); }
  }
  return <View style={{ gap: 20 }}>
    {!!(error || data.error) && <Text accessibilityRole="alert" style={s.error}>{error || data.error}</Text>}
    <Button label="Actualizar familia" secondary disabled={data.busy} onPress={() => { void data.reload(); }} />
    {data.loading && <Text style={s.muted}>Consultando la familia…</Text>}
    {data.snapshot && current ? <>
      <Button label="Cambiar de familia" secondary disabled={data.busy} onPress={() => { setCalendarId(null); data.selectFamily(null); onStep(); }} />
      <View style={s.row}>
        {data.snapshot.calendars.map(calendar => <Button key={calendar.id}
          label={'Calendario de ' + (data.snapshot!.members.find(member => member.id === calendar.child_id)?.name ?? current.name)}
          secondary disabled={data.busy} onPress={() => { setCalendarId(calendar.id); onStep(); }} />)}
      </View>
      {selected && <FamilyCalendarWorkspace key={userId + ':' + selected.id} calendar={selected}
        snapshot={data.snapshot} member={current} today={today} busy={data.busy} local={local.state}
        command={data.command} onStep={onStep} />}
      <FamilyManagement key={data.snapshot.family.id} snapshot={data.snapshot} parental={current.role === 'parent'}
        busy={data.busy} command={data.command} />
    </> : !data.loading && <>
      <Text style={s.heading}>Tus familias</Text>
      {data.families.map(family => <Button label={family.name} key={family.id} secondary disabled={data.busy}
        onPress={() => { setCalendarId(null); data.selectFamily(family.id); }} />)}
      {!data.families.length && !data.error && <Text style={s.body}>Todavía no perteneces a una familia. Puedes crearla o entrar con un código.</Text>}
      <View style={s.card}>
        <Text style={s.heading}>Entrar mediante invitación</Text>
        <FamilyField label="Código de invitación" value={token} onChange={setToken} disabled={data.busy} />
        <Button label="Usar invitación" disabled={data.busy || !token.trim()} onPress={() => { void join(); }} />
      </View>
      <View style={s.card}>
        <Text style={s.heading}>Crear una familia como progenitor</Text>
        <FamilyField label="Nombre de la familia" value={name} onChange={setName} disabled={data.busy} />
        <FamilyField label="Tu nombre familiar" value={memberName} onChange={setMemberName} disabled={data.busy} />
        <ProfileChoices value={profile} onChange={setProfile} parental />
        <Button label="Crear familia" disabled={data.busy || !name.trim() || !memberName.trim()} onPress={() => { void create(); }} />
      </View>
    </>}
  </View>;
}

export function FamilyScreen({ onClose }: { onClose(): void }) {
  const account = useFamilyAccount();
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  return <SafeAreaView style={s.root}>
    <ScrollView ref={scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.eyebrow}>CASA A CASA</Text>
      <Text accessibilityRole="header" style={s.title}>Cuenta y familia</Text>
      <Button label="Volver al modo individual" secondary disabled={account.busy} onPress={onClose} />
      {!familyClient && <View style={s.card}>
        <Text accessibilityRole="header" style={s.heading}>Conexión familiar pendiente</Text>
        <Text style={s.body}>El servidor elegido está pendiente de conexión. Las cuentas y el calendario compartido estarán disponibles cuando se autorice el acceso y termine la configuración.</Text>
        <Text style={s.muted}>La preparación incluye familias, un calendario por hijo e invitaciones con el permiso asignado por un progenitor.</Text>
        <Text style={s.body}>Los hijos podrán proponer fechas y destino. Un progenitor podrá aceptar o rechazar. Cada propuesta mostrará su estado y quién la resolvió.</Text>
      </View>}
      {!!account.error && <Text accessibilityRole="alert" style={s.error}>{account.error}</Text>}
      {!!account.notice && <Text accessibilityLiveRegion="polite" style={s.body}>{account.notice}</Text>}
      {account.checking ? <Text style={s.body}>Verificando la cuenta…</Text> : account.user ? <>
        <Text style={s.body}>{account.user.email}</Text>
        <Button label="Cerrar sesión" secondary disabled={account.busy} onPress={() => { void account.signOut(); }} />
        <ConnectedFamily key={account.user.id} userId={account.user.id}
          onStep={() => scroll.current?.scrollTo({ y: 0, animated: false })} />
      </> : <FamilyAccess account={account} />}
    </ScrollView>
  </SafeAreaView>;
}
