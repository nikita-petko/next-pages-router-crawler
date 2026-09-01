import { computeRangeForPreset } from '@rbx/date-range-picker';
import {
  PLAYER_SUPPORT_CUSTOM_RANGE_LOOKBACK_DAYS,
  PLAYER_SUPPORT_DATE_FILTER_PRESETS,
  PlayerSupportDateFilter,
} from '../constants/ticketFilters';

/**
 * Inclusive bounds on a ticket's updated time. Both sides are independently
 * optional; the search and export endpoints leave an omitted side open.
 */
export interface PlayerSupportUpdatedTimeRange {
  startTime?: string;
  endTime?: string;
}

/** A calendar day the creator picked, serialized for the URL as `YYYY-MM-DD`. */
export type PlayerSupportDateParam = string;

const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * Serialize a local calendar day. `toISOString` would shift the day for
 * creators west of UTC, so the local year/month/day are written out directly.
 */
export const formatDateParam = (date: Date): PlayerSupportDateParam =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Parse a `YYYY-MM-DD` URL value back into a local calendar day. */
export const parseDateParam = (value: unknown): Date | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return undefined;
  }
  const [, year, month, day] = match.map(Number);
  const parsed = new Date(year, month - 1, day);
  // Rejects values like 2026-02-31, which Date silently rolls into March.
  return parsed.getMonth() === month - 1 && parsed.getDate() === day ? parsed : undefined;
};

/** Oldest day the custom-range calendar allows. */
export const getMinSelectableDate = (now: Date = new Date()): Date => {
  const min = startOfDay(now);
  min.setDate(min.getDate() - PLAYER_SUPPORT_CUSTOM_RANGE_LOOKBACK_DAYS);
  return min;
};

/**
 * Resolve the selected filter into the bounds sent to the API. `AllTime`
 * returns no bounds, and `Custom` returns nothing until both dates are picked.
 */
export const getUpdatedTimeRange = (
  dateFilter: PlayerSupportDateFilter,
  customStartDate?: Date,
  customEndDate?: Date,
): PlayerSupportUpdatedTimeRange => {
  if (dateFilter === PlayerSupportDateFilter.Custom) {
    if (!customStartDate || !customEndDate) {
      return {};
    }
    return {
      startTime: startOfDay(customStartDate).toISOString(),
      endTime: endOfDay(customEndDate).toISOString(),
    };
  }

  const preset = PLAYER_SUPPORT_DATE_FILTER_PRESETS[dateFilter];
  if (preset === undefined) {
    return {};
  }
  const range = computeRangeForPreset(preset);
  if (range === null) {
    return {};
  }
  return {
    startTime: startOfDay(range.startDate).toISOString(),
    endTime: endOfDay(range.endDate).toISOString(),
  };
};
