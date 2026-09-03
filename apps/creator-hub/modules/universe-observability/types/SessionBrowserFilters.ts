import type {
  UniverseSessionExitReason,
  UniverseSessionOperatingSystem,
  UniverseSessionPlatform,
} from '@modules/clients/analytics/universeSessionMetadataApi';
import { DateRangePreset, type DateRangeSelection } from './Filters';

export type SessionBrowserNumericRange = {
  readonly min?: number;
  readonly max?: number;
};

/** Drawer form fields; absent or empty means "do not filter". */
export type SessionBrowserDrawerFilters = {
  readonly placeIds?: readonly string[];
  readonly placeVersions?: readonly number[];
  readonly funnelTags?: readonly string[];
  readonly customTags?: readonly string[];
  readonly hasBugReport?: boolean;
  readonly platforms?: readonly UniverseSessionPlatform[];
  readonly operatingSystems?: readonly UniverseSessionOperatingSystem[];
  readonly deviceRamMegabytes?: SessionBrowserNumericRange;
  readonly durationMinutes?: SessionBrowserNumericRange;
  readonly minFps?: SessionBrowserNumericRange;
  readonly usedMemoryMegabytes?: SessionBrowserNumericRange;
  readonly exitReasons?: readonly UniverseSessionExitReason[];
};

/** Shareable filter state with the page-level date range. */
export type SessionBrowserFilters = SessionBrowserDrawerFilters & {
  readonly dateRange: DateRangeSelection;
};

/** Empty range object so RHF `setValue` never writes `undefined` (which restores prior defaults). */
export const EMPTY_SESSION_BROWSER_NUMERIC_RANGE: SessionBrowserNumericRange = {};

/** RHF multi-selects use `[]` and the bug-report switch uses `false`; `undefined` restores prior defaults during reset.
 * Applied and URL state omit these empty values via `compactDrawerFilters`. */
export const DEFAULT_SESSION_BROWSER_DRAWER_FILTERS: SessionBrowserDrawerFilters = {
  placeIds: [],
  placeVersions: [],
  funnelTags: [],
  customTags: [],
  hasBugReport: false,
  platforms: [],
  operatingSystems: [],
  deviceRamMegabytes: EMPTY_SESSION_BROWSER_NUMERIC_RANGE,
  durationMinutes: EMPTY_SESSION_BROWSER_NUMERIC_RANGE,
  minFps: EMPTY_SESSION_BROWSER_NUMERIC_RANGE,
  usedMemoryMegabytes: EMPTY_SESSION_BROWSER_NUMERIC_RANGE,
  exitReasons: [],
};

export const DEFAULT_SESSION_BROWSER_FILTERS: SessionBrowserFilters = {
  dateRange: { preset: DateRangePreset.Last1Day },
};
