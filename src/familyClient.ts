import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';

// Bound requests so a lost connection produces a visible error.
async function familyFetch(input: RequestInfo | URL, options?: RequestInit) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  options?.signal?.addEventListener('abort', abort);
  if (options?.signal?.aborted) controller.abort();
  const timer = setTimeout(abort, 8000);
  try { return await fetch(input, { ...options, signal: controller.signal }); }
  finally {
    clearTimeout(timer);
    options?.signal?.removeEventListener('abort', abort);
  }
}

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const configured = !!url && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url) && key?.startsWith('sb_publishable_');
export const familyClient = configured
  ? createClient(url!, key!, {
      global: { fetch: familyFetch },
      auth: {
        storage: AsyncStorage,
        storageKey: 'custodia.cuenta.v1',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    })
  : null;
