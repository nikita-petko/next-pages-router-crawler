import type { ApplicantRowViewModel } from '../types';

export type UserNameRecord = { id?: number; name?: string | null };

export function getSubmittedAtTime(submittedAt: unknown) {
  if (!submittedAt) {
    return 0;
  }
  if (
    !(submittedAt instanceof Date) &&
    typeof submittedAt !== 'string' &&
    typeof submittedAt !== 'number'
  ) {
    return 0;
  }
  const date = submittedAt instanceof Date ? submittedAt : new Date(submittedAt);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function getApplicantUserIdsNeedingUsernameLookup(
  applicants: ApplicantRowViewModel[],
): number[] {
  return Array.from(
    new Set(
      applicants
        .filter((applicant) => !applicant.talentUsername)
        .map((applicant) => applicant.talentUserId)
        .filter((userId): userId is number => typeof userId === 'number'),
    ),
  );
}

export function toUsernamesById(users: UserNameRecord[] | undefined): Map<number, string> {
  const usernames = new Map<number, string>();
  users?.forEach((user) => {
    if (typeof user.id === 'number' && user.name) {
      usernames.set(user.id, user.name);
    }
  });
  return usernames;
}

function isUsernameMap(value: unknown): value is Map<number, string> {
  if (!(value instanceof Map)) {
    return false;
  }
  return Array.from(value.entries()).every(
    ([key, entryValue]) => typeof key === 'number' && typeof entryValue === 'string',
  );
}

export function applyApplicantUsernames(
  applicants: ApplicantRowViewModel[],
  usernamesById: unknown,
): ApplicantRowViewModel[] {
  if (!isUsernameMap(usernamesById)) {
    return applicants;
  }

  return applicants.map((applicant) => {
    if (applicant.talentUsername || applicant.talentUserId === undefined) {
      return applicant;
    }
    const username = usernamesById.get(applicant.talentUserId);
    return username ? { ...applicant, talentUsername: username } : applicant;
  });
}

export const ARROW_UP_PATH =
  'M14.19 11.34c0 .35-.28.63-.63.63a.63.63 0 01-.62-.63V4.01l-2.25 2.25a.62.62 0 01-.88-.88l3.31-3.32a.62.62 0 01.88 0l3.32 3.32a.62.62 0 11-.88.88l-2.25-2.25v7.33z';
export const ARROW_DOWN_PATH =
  'M6.06 8.84c0-.35.28-.63.63-.63.35 0 .62.28.62.63v7.33l2.25-2.25a.62.62 0 01.88.88l-3.31 3.32a.62.62 0 01-.88 0L2.93 14.8a.62.62 0 11.88-.88l2.25 2.25V8.84z';

export type SortDir = 'asc' | 'desc';
export type SortColumn = 'date' | 'starred';

export function getAriaSort(column: SortColumn, activeColumn: SortColumn, direction: SortDir) {
  if (column !== activeColumn) {
    return undefined;
  }
  return direction === 'asc' ? 'ascending' : 'descending';
}

export function isMainTab(value: string): value is 'applications' | 'details' {
  return value === 'applications' || value === 'details';
}
