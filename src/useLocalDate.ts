import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { dateKey } from './calendar';
import { millisecondsToMidnight } from './dailyOverview';
export function useLocalDate(): string {
  const [today, setToday] = useState(() => dateKey(new Date()));
  useEffect(() => {
    let current = dateKey(new Date());
    let midnight: ReturnType<typeof setTimeout>;
    const refresh = () => {
      const now = new Date();
      current = dateKey(now);
      setToday(current);
      clearTimeout(midnight);
      midnight = setTimeout(refresh, millisecondsToMidnight(now));
    };
    refresh();
    const fallback = setInterval(() => { if (dateKey(new Date()) !== current) refresh(); }, 30_000);
    const subscription = AppState.addEventListener('change', status => { if (status === 'active') refresh(); });
    const visible = () => { if (!document.hidden) refresh(); };
    if (Platform.OS === 'web') {
      window.addEventListener('focus', refresh);
      document.addEventListener('visibilitychange', visible);
    }
    return () => {
      clearTimeout(midnight); clearInterval(fallback); subscription.remove();
      if (Platform.OS === 'web') {
        window.removeEventListener('focus', refresh);
        document.removeEventListener('visibilitychange', visible);
      }
    };
  }, []);
  return today;
}
