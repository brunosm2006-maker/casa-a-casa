import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialState, loadState, saveState, type AppState } from './persistence';

export function useLocalState() {
  const [state, setState] = useState<AppState>(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);
  const busy = useRef(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setState(await loadState(AsyncStorage));
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
      setError('No se han podido leer los datos guardados. No se ha cambiado tu calendario. Intenta abrirlo de nuevo.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const commit = async (next: AppState): Promise<boolean> => {
    if (busy.current || loadFailed || loading) return false;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      await saveState(AsyncStorage, next);
      setState(next);
      return true;
    } catch {
      setError('No se han podido guardar los cambios. Tu calendario anterior se conserva. Vuelve a intentarlo.');
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return { state, loading, saving, error, loadFailed, reload, commit };
}
