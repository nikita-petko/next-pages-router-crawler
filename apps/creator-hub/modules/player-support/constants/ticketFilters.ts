import { DateRangePreset } from '@rbx/date-range-picker';
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
  [PlayerSupportViewFilter.Read]: CreatorTicketReadFilter.Read,
  [PlayerSupportViewFilter.Unread]: CreatorTicketReadFilter.Unread,
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

/**
 * Bounds the request list by each ticket's updated time. `AllTime` leaves both
 * bounds open; `Custom` uses dates the creator picks in the calendar.
 */
export const PlayerSupportDateFilter = {
  AllTime: 'allTime',
  Last7Days: 'last7Days',
  Last28Days: 'last28Days',
  Last56Days: 'last56Days',
  Last90Days: 'last90Days',
  Custom: 'custom',
} as const;
export type PlayerSupportDateFilter =
  (typeof PlayerSupportDateFilter)[keyof typeof PlayerSupportDateFilter];

/** Preset rows shown in the popover, in order. The Custom row is appended by the control. */
export const PLAYER_SUPPORT_DATE_FILTER_OPTIONS: readonly PlayerSupportDateFilter[] = [
  PlayerSupportDateFilter.AllTime,
  PlayerSupportDateFilter.Last7Days,
  PlayerSupportDateFilter.Last28Days,
  PlayerSupportDateFilter.Last56Days,
  PlayerSupportDateFilter.Last90Days,
];

/** Rolling windows delegate their date math to the shared picker's presets. */
export const PLAYER_SUPPORT_DATE_FILTER_PRESETS: Partial<
  Record<PlayerSupportDateFilter, DateRangePreset>
> = {
  [PlayerSupportDateFilter.Last7Days]: DateRangePreset.Last7Days,
  [PlayerSupportDateFilter.Last28Days]: DateRangePreset.Last28Days,
  [PlayerSupportDateFilter.Last56Days]: DateRangePreset.Last56Days,
  [PlayerSupportDateFilter.Last90Days]: DateRangePreset.Last90Days,
};

/** How far back the custom-range calendar lets creators reach. `AllTime` covers older tickets. */
export const PLAYER_SUPPORT_CUSTOM_RANGE_LOOKBACK_DAYS = 730;

export const isPlayerSupportDateFilter = (value: unknown): value is PlayerSupportDateFilter =>
  typeof value === 'string' &&
  Object.values(PlayerSupportDateFilter).some((option) => option === value);

export const isPlayerSupportViewFilter = (value: unknown): value is PlayerSupportViewFilter =>
  typeof value === 'string' &&
  PLAYER_SUPPORT_VIEW_FILTER_OPTIONS.some((option) => option === value);

export const isPlayerSupportCategoryFilter = (
  value: unknown,
): value is PlayerSupportCategoryFilter =>
  typeof value === 'string' &&
  PLAYER_SUPPORT_CATEGORY_FILTER_OPTIONS.some((option) => option === value);
