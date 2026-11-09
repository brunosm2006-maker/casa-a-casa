import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { displayDate } from './calendar';
import { type FamilyMember, type FamilyProposal } from './familyTypes';
import { Button } from './ui';
import { s } from './theme';

const statuses = { pending: 'Pendiente', accepted: 'Aceptada', rejected: 'Rechazada' };
export function FamilyProposals({ proposals, members, parental, revision, busy, command }: {
  proposals: FamilyProposal[]; members: FamilyMember[]; parental: boolean; revision: number; busy: boolean;
  command(action: string, args: Record<string, unknown>): Promise<unknown>;
}) {
  const [error, setError] = useState('');
  const name = (id: string | null) => members.find(member => member.id === id)?.name ?? 'Miembro familiar';
  async function resolve(id: string, decision: 'accepted' | 'rejected') {
    setError('');
    try { await command('resolve', { proposal_id: id, decision }); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo resolver la propuesta.'); }
  }
  return <View style={{ gap: 16 }}>
    <Text accessibilityRole="header" style={s.title}>Propuestas de cambio</Text>
    {!proposals.length && <Text style={s.body}>Todavía no hay propuestas para este calendario.</Text>}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    {proposals.map(proposal => <View key={proposal.id} style={s.card}>
      <Text style={s.heading}>{statuses[proposal.status]}</Text>
      <Text style={s.body}>{displayDate(proposal.first_day)} → {displayDate(proposal.last_day)}</Text>
      <Text style={s.body}>{proposal.destination === 'rutina' ? 'Recuperar la rutina' : proposal.destination ? 'Con ' + proposal.destination : 'Sin asignar'}</Text>
      <Text style={s.muted}>Propuesta de {name(proposal.author_id)}</Text>
      {!!proposal.explanation && <Text style={s.body}>{proposal.explanation}</Text>}
      {proposal.status === 'pending' && proposal.base_revision !== revision && <Text style={s.error}>El calendario ha cambiado. Hace falta una propuesta nueva para aplicar estas fechas.</Text>}
      {proposal.resolved_by && <Text style={s.muted}>{'Resuelta por ' + name(proposal.resolved_by) +
        (proposal.resolved_at ? ' · ' + new Date(proposal.resolved_at).toLocaleString('es-ES') : '')}</Text>}
      {parental && proposal.status === 'pending' && <>
        <Button label="Aceptar propuesta" disabled={busy || proposal.base_revision !== revision} onPress={() => { void resolve(proposal.id, 'accepted'); }} />
        <Button label="Rechazar propuesta" secondary disabled={busy} onPress={() => { void resolve(proposal.id, 'rejected'); }} />
      </>}
    </View>)}
  </View>;
}
