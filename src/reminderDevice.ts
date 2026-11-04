import { type Reminder } from './reminders';

export type ReminderPermission = 'allowed' | 'ask' | 'settings' | 'channel';
export interface ReminderDevice {
  permission(): Promise<ReminderPermission>;
  request(): Promise<void>;
  pending(): Promise<string[]>;
  cancel(id: string): Promise<void>;
  schedule(reminder: Reminder): Promise<void>;
}
export const device: ReminderDevice | null = null;
