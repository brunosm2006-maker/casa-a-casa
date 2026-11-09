import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { familyClient } from './familyClient';
import { decodeFamilyCalendar, type Family, type FamilyCalendar, type FamilyMember, type FamilyProposal, type FamilySnapshot } from './familyTypes';

export function useFamilyData(userId: string) {
  const [families, setFamilies] = useState<Family[]>([]);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<FamilySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const reads = useRef(0);
  const writes = useRef(false);
  const live = useRef(true);

  useEffect(() => { live.current = true; return () => { live.current = false; reads.current++; }; }, []);
  const reload = useCallback(async () => {
    if (!familyClient) return;
    const request = ++reads.current;
    setLoading(true);
    try {
      const { data: visible, error: familyError } = await familyClient.from('casa_families').select('id,name').order('name');
      if (familyError) throw familyError;
      let next: FamilySnapshot | null = null;
      const family = (visible as Family[]).find(item => item.id === familyId);
      if (family) {
        const [members, calendars] = await Promise.all([
          familyClient.from('casa_members').select('*').eq('family_id', family.id),
          familyClient.from('casa_calendars').select('*').eq('family_id', family.id),
        ]);
        if (members.error) throw members.error;
        if (calendars.error) throw calendars.error;
        const decoded = (calendars.data as FamilyCalendar[]).map(decodeFamilyCalendar);
        const calendarIds = decoded.map(item => item.id);
        let proposals: FamilyProposal[] = [];
        if (calendarIds.length) {
          const response = await familyClient.from('casa_proposals').select('*').in('calendar_id', calendarIds).order('created_at', { ascending: false });
          if (response.error) throw response.error;
          proposals = response.data as FamilyProposal[];
        }
        next = { family, members: members.data as FamilyMember[], calendars: decoded, proposals };
      }
      if (!live.current || reads.current !== request) return;
      setFamilies(visible as Family[]);
      setSnapshot(next);
      setError('');
    } catch {
      if (!live.current || reads.current !== request) return;
      setSnapshot(null); setFamilies([]);
      setError('No se pudieron consultar los datos familiares. Comprueba la conexión y la sesión.');
    } finally { if (live.current && reads.current === request) setLoading(false); }
  }, [familyId, userId]);

  useEffect(() => { setSnapshot(null); void reload(); }, [reload]);
  useEffect(() => {
    const timer = setInterval(() => { void reload(); }, 15000);
    const foreground = AppState.addEventListener('change', status => { if (status === 'active') void reload(); });
    const focus = () => { void reload(); };
    if (Platform.OS === 'web') window.addEventListener('focus', focus);
    return () => {
      clearInterval(timer); foreground.remove();
      if (Platform.OS === 'web') window.removeEventListener('focus', focus);
    };
  }, [reload]);

  async function command(action: string, args: Record<string, unknown>) {
    if (!familyClient || writes.current) throw new Error('Espera a que termine el guardado.');
    writes.current = true; setBusy(true);
    try {
      const { data, error: failure } = await familyClient.rpc('casa_command', { action, args });
      if (failure) throw new Error(failure.message);
      if (live.current) await reload();
      return data;
    } finally { writes.current = false; if (live.current) setBusy(false); }
  }
  function selectFamily(id: string | null) {
    reads.current++;
    setSnapshot(null);
    setFamilyId(id);
  }
  return { families, snapshot, familyId, loading, busy, error, command, reload, selectFamily };
}
