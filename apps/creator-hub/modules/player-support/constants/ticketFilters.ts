import {
  CreatorTicketReadFilter,
  TicketCategory,
  type CreatorTicketReadFilter as CreatorTicketReadFilterValue,
} from '@modules/clients/creatorCommunication';

export const PLAYER_SUPPORT_SEARCH_DEBOUNCE_DELAY_MS = 500;

export const PlayerSupportViewFilter = {
  All: 'all',
  Read: 'read',
  Unread: 'unread',
} as const;
export type PlayerSupportViewFilter =
  (typeof PlayerSupportViewFilter)[keyof typeof PlayerSupportViewFilter];

export const PLAYER_SUPPORT_VIEW_FILTER_OPTIONS: readonly PlayerSupportViewFilter[] =
  Object.values(PlayerSupportViewFilter);

export const PLAYER_SUPPORT_VIEW_FILTER_VALUES: Record<
  PlayerSupportViewFilter,
  CreatorTicketReadFilterValue | undefined
> = {
  [PlayerSupportViewFilter.All]: undefined,
  [PlayerSupportViewFilter.Read]: CreatorTicketReadFilter.NUMBER_1,
  [PlayerSupportViewFilter.Unread]: CreatorTicketReadFilter.NUMBER_2,
};

export const PlayerSupportCategoryFilter = {
  All: 'all',
  BugReport: TicketCategory.BugReport,
  DataRestoreRequest: TicketCategory.DataRestoreRequest,
  PurchasingIssue: TicketCategory.PurchasingIssue,
  Other: TicketCategory.Other,
} as const;
export type PlayerSupportCategoryFilter =
  (typeof PlayerSupportCategoryFilter)[keyof typeof PlayerSupportCategoryFilter];

export const PLAYER_SUPPORT_CATEGORY_FILTER_OPTIONS: readonly PlayerSupportCategoryFilter[] =
  Object.values(PlayerSupportCategoryFilter);

export const isPlayerSupportViewFilter = (value: unknown): value is PlayerSupportViewFilter =>
  typeof value === 'string' &&
  PLAYER_SUPPORT_VIEW_FILTER_OPTIONS.some((option) => option === value);

export const isPlayerSupportCategoryFilter = (
  value: unknown,
): value is PlayerSupportCategoryFilter =>
  typeof value === 'string' &&
  PLAYER_SUPPORT_CATEGORY_FILTER_OPTIONS.some((option) => option === value);
