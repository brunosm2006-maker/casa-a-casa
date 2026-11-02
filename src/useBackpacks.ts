import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type PackingList } from './backpacks';
import { loadBackpacks, saveBackpacks } from './backpackStorage';
export function useBackpacks() {
  const [bags, setBags] = useState<PackingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const reload = useCallback(async () => {
    setLoading(true); setError('');
    try { setBags(await loadBackpacks(AsyncStorage)); setLoadFailed(false); }
    catch { setLoadFailed(true); setError('No se han podido abrir las mochilas guardadas. No se ha borrado ninguna lista.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  const commit = async (next: PackingList[]): Promise<boolean> => {
    if (busy.current || loading || loadFailed) return false;
    busy.current = true; setSaving(true); setError('');
    try { await saveBackpacks(AsyncStorage, next); setBags(next); return true; }
    catch { setError('No se han podido guardar los cambios de Mochila. Las listas anteriores se conservan. Vuelve a intentarlo.'); return false; }
    finally { busy.current = false; setSaving(false); }
  };
  return { bags, loading, saving, loadFailed, error, reload, commit };
}
