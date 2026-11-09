import { decodeState, type Profile } from './persistence';
import { type Routine } from './routine';
import { type Schedule } from './calendar';

export type Family = { id: string; name: string };
export type FamilyMember = { id: string; family_id: string; user_id: string | null; name: string; role: 'parent' | 'child'; profile: Profile };
export type FamilyCalendar = { id: string; family_id: string; child_id: string; revision: number; payload: { schedule: Schedule; routine: Routine | null } };
export type FamilyProposal = {
  id: string; calendar_id: string; author_id: string; first_day: string; last_day: string;
  destination: 'madre' | 'padre' | 'rutina' | null; explanation: string; base_revision: number;
  status: 'pending' | 'accepted' | 'rejected'; resolved_by: string | null; resolved_at: string | null;
};
export type FamilySnapshot = { family: Family; members: FamilyMember[]; calendars: FamilyCalendar[]; proposals: FamilyProposal[] };

export function decodeFamilyCalendar(value: FamilyCalendar): FamilyCalendar {
  const decoded = decodeState(JSON.stringify({ version: 2, profile: null, setupComplete: true, ...value.payload }));
  return { ...value, payload: { schedule: decoded.schedule, routine: decoded.routine } };
}
