import type {
  RobloxGroupsApiBreakingChangeEntry,
  RobloxGroupsApiGroupMigrationStatusResponse,
  RobloxGroupsApiGroupMigrationBreakingChangesResponse,
} from '@rbx/client-groups/v1';

export type { RobloxGroupsApiBreakingChangeEntry as BreakingChangeEntry };
export type { RobloxGroupsApiGroupMigrationStatusResponse as MigrationStatusResponse };
export type { RobloxGroupsApiGroupMigrationBreakingChangesResponse as MigrationBreakingChangesResponse };

export const MIGRATION_STATUS = {
  NOT_MIGRATED: 'NotMigrated',
  MIGRATING: 'Migrating',
  MIGRATED: 'Migrated',
} as const;

export type MigrationStatus = (typeof MIGRATION_STATUS)[keyof typeof MIGRATION_STATUS];

export enum ModalState {
  None,
  Breaking,
  NonBreaking,
  Migrated,
}

export const LINKED_OUT_MODAL_SUPPRESSION_QUERY_PARAM = 'suppressUnificationModal';
export const AssignSameRolePermission = 'Organization.AssignSameRole';
// TODO: Swap for unification devforum post
export const DEVFORUM_URL = 'https://devforum.roblox.com';

export const SNOOZE_DURATION_MS = 5 * 60 * 1000;

export function isUnificationModalSuppressed(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return new URLSearchParams(window.location.search).has(LINKED_OUT_MODAL_SUPPRESSION_QUERY_PARAM);
}

export function getSnoozeKey(groupId: number): string {
  return `group-unification-snoozed-${groupId}`;
}

export function isSnoozed(groupId: number): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const raw = window.localStorage.getItem(getSnoozeKey(groupId));
  if (!raw) {
    return false;
  }
  const expiresAt = Number(raw);
  return Date.now() < expiresAt;
}

export function snooze(groupId: number): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(getSnoozeKey(groupId), String(Date.now() + SNOOZE_DURATION_MS));
}
