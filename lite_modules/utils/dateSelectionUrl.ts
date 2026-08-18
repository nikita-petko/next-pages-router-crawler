import { DateRangePreset } from '@rbx/date-range-picker';
import moment from 'moment-timezone';
import { NextRouter } from 'next/router';

import DateFilteringTimePeriod from '@constants/dateFilteringTimePeriod';
import { DATE_RANGE_DEFAULT_PRESET, DATE_RANGE_PRESETS } from '@constants/dateRangePresetMapping';
import { REPORTING_TIMEZONE_DB_NAME } from '@constants/reportingStatsConstants';
import { CaptureException } from '@utils/error';

/**
 * URL query-param contract for date range persistence. Names mirror the
 * creator-hub analytics stack (`rangeType`, `minTime`, `maxTime`) so links
 * feel consistent across the creator hub even though the accepted preset
 * *values* below differ (WACAM has its own preset vocabulary).
 *
 * Bumping any of these keys or accepted values is a breaking URL contract
 * change — bookmarks, deep links, and error-report URLs depend on them.
 */
const DATE_URL_PARAMS = {
  MaxTime: 'maxTime',
  MinTime: 'minTime',
  RangeType: 'rangeType',
} as const;

// Backend expects `customStartDate` / `customEndDate` in YYYY-MM-DD. The URL
// encodes bounds as epoch ms (`minTime` / `maxTime`); anchor the write side at
// UTC midnight and the read side at UTC components so the roundtrip is
// timezone-independent (a link written in LA parses the same in Sydney).
const DAY_MS = 24 * 60 * 60 * 1000;
const CUSTOM_DATE_FORMAT = 'YYYY-MM-DD';

const pad2 = (value: number): string => value.toString().padStart(2, '0');

const epochMsToYyyyMmDd = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
};

const yyyyMmDdToEpochMs = (value: string): number | undefined => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return undefined;
  }
  const [, y, m, d] = match;
  const utcMs = Date.UTC(Number(y), Number(m) - 1, Number(d));
  return Number.isFinite(utcMs) ? utcMs : undefined;
};

const parseEpochMs = (raw: string | string[] | undefined): number | undefined => {
  if (typeof raw !== 'string') {
    return undefined;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

/**
 * Resolves a `Last<N>Days` preset into concrete YYYY-MM-DD bounds anchored
 * to "today" in the WACAM reporting timezone (see
 * `REPORTING_TIMEZONE_DB_NAME`). Shared between the URL parser (fallback
 * for preset-only URLs like `?rangeType=Last28Days`) and the picker
 * (converts every menu click into a CUSTOM dispatch), so both derive
 * identical bounds for the same preset name.
 *
 * Returns null for presets that don't fit the `Last<N>Days` shape.
 */
const LAST_N_DAYS_PATTERN = /^Last(\d+)Days$/;
export const resolveLastNDaysInReportingTz = (
  preset: DateRangePreset,
): { customEndDate: string; customStartDate: string } | null => {
  const match = LAST_N_DAYS_PATTERN.exec(preset);
  if (!match) {
    return null;
  }
  const n = Number(match[1]);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  const nowInReportingTz = moment.tz(REPORTING_TIMEZONE_DB_NAME);
  return {
    customEndDate: nowInReportingTz.format(CUSTOM_DATE_FORMAT),
    customStartDate: nowInReportingTz
      .clone()
      .subtract(n - 1, 'days')
      .format(CUSTOM_DATE_FORMAT),
  };
};

// Accepted `rangeType` values. Deliberately excludes legacy presets like
// `Today` / `Yesterday` / `ThisMonth` — those are only used by the control
// arm, which persists selection in the store, not the URL. Keeping the URL
// contract tight prevents ambiguous parses and matches what the treatment
// arm ever writes.
const PRESET_VALUE_SET: ReadonlySet<string> = new Set([
  ...DATE_RANGE_PRESETS,
  DateRangePreset.Custom,
]);

const parseRangeType = (raw: string | string[] | undefined): DateRangePreset | undefined => {
  if (typeof raw !== 'string' || !PRESET_VALUE_SET.has(raw)) {
    return undefined;
  }
  return raw as DateRangePreset;
};

type ParsedDateSelectionUrl = {
  currentSelection: DateFilteringTimePeriod;
  customEndDate?: string;
  customStartDate?: string;
};

/**
 * Parses `?rangeType=...&minTime=...&maxTime=...` into a plain
 * `{ currentSelection, customStartDate?, customEndDate? }` value. Returns
 * `undefined` when the URL doesn't carry a valid selection so callers can
 * fall back to their own default.
 *
 * Rules:
 *   1. `rangeType=Custom` requires valid `min/maxTime` — otherwise the URL
 *      is unusable and we return `undefined`.
 *   2. `rangeType=<preset>` with valid `min/maxTime` hydrates as CUSTOM with
 *      those bounds. The trigger label is derived downstream by matching
 *      bounds against the reporting-tz preset windows, so we don't need to
 *      preserve the preset name here.
 *   3. `rangeType=<preset>` alone (no bounds) resolves the window in the
 *      reporting timezone via `resolveLastNDaysInReportingTz` — matches
 *      what the picker would have written, so a bookmarked link renders
 *      the same window today as it will tomorrow.
 */
export const parseDateSelectionFromQuery = (
  query: NextRouter['query'],
): ParsedDateSelectionUrl | undefined => {
  const preset = parseRangeType(query[DATE_URL_PARAMS.RangeType]);
  if (preset === undefined) {
    return undefined;
  }
  const minMs = parseEpochMs(query[DATE_URL_PARAMS.MinTime]);
  const maxMs = parseEpochMs(query[DATE_URL_PARAMS.MaxTime]);
  const hasValidBounds = minMs !== undefined && maxMs !== undefined && minMs <= maxMs;

  if (hasValidBounds) {
    return {
      currentSelection: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM,
      customEndDate: epochMsToYyyyMmDd(maxMs),
      customStartDate: epochMsToYyyyMmDd(minMs),
    };
  }
  // Custom without bounds is unusable; a preset alone resolves in reporting tz.
  if (preset === DateRangePreset.Custom) {
    return undefined;
  }
  const resolved = resolveLastNDaysInReportingTz(preset);
  return resolved
    ? { currentSelection: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM, ...resolved }
    : undefined;
};

// SSR-safe wrapper for callers outside the React tree (e.g. store actions).
export const parseDateSelectionFromWindowLocation = (): ParsedDateSelectionUrl | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const params = new URLSearchParams(window.location.search);
  return parseDateSelectionFromQuery({
    [DATE_URL_PARAMS.MaxTime]: params.get(DATE_URL_PARAMS.MaxTime) ?? undefined,
    [DATE_URL_PARAMS.MinTime]: params.get(DATE_URL_PARAMS.MinTime) ?? undefined,
    [DATE_URL_PARAMS.RangeType]: params.get(DATE_URL_PARAMS.RangeType) ?? undefined,
  });
};

// Treatment-arm default (`DATE_RANGE_DEFAULT_PRESET` in reporting tz).
// Returns undefined + logs if the default becomes unresolvable (bug).
export const resolveDefaultTreatmentSelection = (): ParsedDateSelectionUrl | undefined => {
  const bounds = resolveLastNDaysInReportingTz(DATE_RANGE_DEFAULT_PRESET);
  if (!bounds) {
    CaptureException(
      new Error(`DATE_RANGE_DEFAULT_PRESET (${DATE_RANGE_DEFAULT_PRESET}) is not resolvable`),
    );
    return undefined;
  }
  return { currentSelection: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM, ...bounds };
};

// Match YMD bounds against each `Last<N>Days` preset by inclusive day count.
// Shape-based (not anchor-based) so a Last28Days window captured last week
// still resolves to Last28Days. UTC parsing avoids DST off-by-one.
export const derivePresetFromBounds = (
  customStartDate: string,
  customEndDate: string,
  candidates: readonly DateRangePreset[] = DATE_RANGE_PRESETS,
): DateRangePreset | undefined => {
  const days =
    moment
      .utc(customEndDate, CUSTOM_DATE_FORMAT, true)
      .diff(moment.utc(customStartDate, CUSTOM_DATE_FORMAT, true), 'days') + 1;
  return candidates.find((preset) => {
    const match = LAST_N_DAYS_PATTERN.exec(preset);
    return match !== null && Number(match[1]) === days;
  });
};

/**
 * Writes `rangeType=<preset>&minTime=<ms>&maxTime=<ms>` into `router.query`,
 * preserving other params and using `replace(..., { shallow: true })` so
 * `getServerSideProps` doesn't re-run and history doesn't balloon. Bounds
 * are frozen so bookmarks stay honest; `rangeType` is computed from the
 * bounds shape (or `Custom` when no preset matches).
 */
export const writeDateSelectionToUrl = (
  router: NextRouter,
  customStartDate: string,
  customEndDate: string,
): void => {
  if (!router.isReady) {
    return;
  }
  const startMs = yyyyMmDdToEpochMs(customStartDate);
  const endMsMidnight = yyyyMmDdToEpochMs(customEndDate);
  if (startMs === undefined || endMsMidnight === undefined) {
    return;
  }
  // Anchor end at end-of-day so a same-day range isn't zero-length.
  const endMs = endMsMidnight + DAY_MS - 1;
  const rangeType =
    derivePresetFromBounds(customStartDate, customEndDate) ?? DateRangePreset.Custom;
  router.replace(
    {
      pathname: router.pathname,
      query: {
        ...router.query,
        [DATE_URL_PARAMS.MaxTime]: String(endMs),
        [DATE_URL_PARAMS.MinTime]: String(startMs),
        [DATE_URL_PARAMS.RangeType]: rangeType,
      },
    },
    undefined,
    { shallow: true },
  );
};
