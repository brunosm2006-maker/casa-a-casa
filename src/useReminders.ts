import { useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type PackingList } from './backpacks';
import { type Schedule } from './calendar';
import { device, type ReminderPermission } from './reminderDevice';
import { loadReminders, planReminders, reconcileReminders, saveReminders, type ReminderSettings } from './reminders';
import { type Routine } from './routine';
let systemQueue = Promise.resolve();

export function useReminders(today: string, calendarReady: boolean | null, exceptions: Schedule, routine: Routine | null, bags: PackingList[], scope?: string) {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [readError, setReadError] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [permissionError, setPermissionError] = useState('');
  const [deviceError, setDeviceError] = useState('');
  const [permission, setPermission] = useState<ReminderPermission | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [saving, setSaving] = useState(false);
  const writeBusy = useRef(false);
  const permissionBusy = useRef(false);


  useEffect(() => {
    let current = true;
    loadReminders(AsyncStorage, scope).then(
      value => { if (current) setSettings(value); },
      () => { if (current) setReadError(true); },
    );
    return () => { current = false; };
  }, []);

  useEffect(() => {
    if (!device) return;
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') setRefresh(value => value + 1);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const api = device;
    if (!api || (!settings && !readError) || calendarReady === null || requesting) return;
    let current = true;
    // Only one reconciliation may write to the system queue at a time.
    systemQueue = systemQueue.then(async () => {
      if (!current) return;
      try {
        const access = await api.permission();
        if (!current) return;
        setPermission(access);
        const planned = calendarReady && access === 'allowed' && settings
          ? planReminders(new Date(), settings, exceptions, routine, bags)
          : [];
        await reconcileReminders(planned, api, () => current);
        if (current) setDeviceError('');
      } catch {
        if (current) setDeviceError('No se pudieron actualizar los avisos del teléfono. Vuelve a intentarlo.');
      }
    });
    return () => { current = false; };
  }, [today, refresh, calendarReady, exceptions, routine, bags, settings, readError, requesting]);

  useEffect(() => () => {
    const api = device;
    if (api && scope) systemQueue = systemQueue.then(() => reconcileReminders([], api)).catch(() => {});
  }, []);

  async function save(next: ReminderSettings) {
    if (writeBusy.current || !settings) return false;
    writeBusy.current = true;
    setSaving(true);
    setSaveError('');
    try {
      await saveReminders(AsyncStorage, next, scope);
      setSettings(next);
      return true;
    } catch (error) {
      setSaveError(error instanceof RangeError
        ? error.message
        : 'No se pudieron guardar los ajustes. Tus preferencias anteriores se conservan.');
      return false;
    } finally {
      setSaving(false);
      writeBusy.current = false;
    }
  }

  async function requestPermission() {
    if (!device || permissionBusy.current || !permission || permission === 'allowed') return;
    permissionBusy.current = true;
    setPermissionError('');
    setRequesting(true);
    try {
      if (permission === 'ask') await device.request();
      else await Linking.openSettings();
    } catch {
      setPermissionError('No se pudieron abrir los permisos de notificaciones.');
    } finally {
      permissionBusy.current = false;
      setRequesting(false);
    }
  }

  return {
    settings, readError, saveError, deviceError, permissionError, permission, requesting, saving, native: !!device,
    save, requestPermission, retry: () => setRefresh(value => value + 1),
  };
}
