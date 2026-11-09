import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { type User, type Session } from '@supabase/supabase-js';
import { familyClient } from './familyClient';

export function useFamilyAccount() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(!!familyClient);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const generation = useRef(0);
  const working = useRef(false);

  useEffect(() => {
    const client = familyClient;
    if (!client) return;
    let live = true;
    async function verify(session: Session | null) {
      const request = ++generation.current;
      setUser(null);
      setChecking(!!session);
      if (!session) return;
      try {
        const result = await client!.auth.getUser();
        if (!live || request !== generation.current) return;
        setUser(result.error ? null : result.data.user);
        setError(result.error ? 'No se pudo verificar la sesión. Vuelve a iniciar sesión.' : '');
      } catch {
        if (live && request === generation.current) setError('No se pudo verificar la sesión. Vuelve a iniciar sesión.');
      } finally {
        if (live && request === generation.current) setChecking(false);
      }
    }
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      // Leave the auth callback before making another auth request.
      setTimeout(() => { if (live) void verify(session); }, 0);
    });
    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!live) return;
      if (sessionError) { setError('No se pudo recuperar la sesión.'); setChecking(false); }
      else void verify(data.session);
    }).catch(() => {
      if (live) { setError('No se pudo recuperar la sesión.'); setChecking(false); }
    });
    const active = AppState.addEventListener('change', status => {
      if (Platform.OS !== 'web') {
        if (status === 'active') client.auth.startAutoRefresh();
        else client.auth.stopAutoRefresh();
      }
    });
    return () => { live = false; generation.current++; subscription.unsubscribe(); active.remove(); };
  }, []);

  async function authenticate(email: string, password: string, signup: boolean) {
    if (!familyClient || working.current) return;
    working.current = true;
    setBusy(true); setError(''); setNotice('');
    try {
      if (!email.trim() || password.length < 8) throw new Error('Escribe un correo y una contraseña de al menos ocho caracteres.');
      const result = signup
        ? await familyClient.auth.signUp({ email: email.trim(), password })
        : await familyClient.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      if (signup && !result.data.session) setNotice('Revisa tu correo para confirmar la cuenta. Después vuelve aquí e inicia sesión.');
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo acceder a la cuenta.'); }
    finally { working.current = false; setBusy(false); }
  }

  async function signOut() {
    if (!familyClient || working.current) return;
    working.current = true; setBusy(true); setError('');
    generation.current++;
    setUser(null);
    try {
      const { error: signoutError } = await familyClient.auth.signOut({ scope: 'local' });
      if (signoutError) throw signoutError;
    } catch {
      setError('No se pudo completar el cierre de sesión. Vuelve a intentarlo.');
    } finally { working.current = false; setBusy(false); }
  }
  return { user, checking, busy, error, notice, authenticate, signOut };
}
