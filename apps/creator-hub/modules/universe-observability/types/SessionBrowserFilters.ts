import { DateRangePreset, type DateRangeSelection } from './Filters';

export type SessionBrowserFilters = {
  readonly dateRange: DateRangeSelection;
};

export const DEFAULT_SESSION_BROWSER_FILTERS: SessionBrowserFilters = {
  dateRange: { preset: DateRangePreset.Last1Day },
};
