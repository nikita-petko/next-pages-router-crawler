import { FailedModifiedEntry, PatchEntry, TranslationEntryTable } from '@modules/clients';
import { createContext } from 'react';

export interface LocalizationTableEntriesValue {
  updateLocalizationTables: (
    entriesToPatch: PatchEntry[],
    universeId: number,
    tableId: string,
  ) => Promise<void>;
  entryTableCount: number;
  percentageLoaded: number;
  updateProgress: number;
  fullEntryTable: TranslationEntryTable;
  batchedEntries: TranslationEntryTable;
  failedEntries: FailedModifiedEntry[];
  fetchFullEntryTableError: Error | null;
  updateTableErrorMsg: string | null;
  isFetchingFullEntryTable: boolean;
  isFullTableLoadingNotStarted: boolean;
  isUpdatingLocalizationTables: boolean;
}

const LocalizationTableEntriesContext = createContext<LocalizationTableEntriesValue>({
  updateLocalizationTables: () =>
    Promise.reject(new Error('updateLocalizationTables not implemented')),
  entryTableCount: 0,
  percentageLoaded: 0,
  updateProgress: 0,
  fullEntryTable: [],
  batchedEntries: [],
  fetchFullEntryTableError: null,
  updateTableErrorMsg: null,
  isFetchingFullEntryTable: false,
  isFullTableLoadingNotStarted: false,
  isUpdatingLocalizationTables: false,
  failedEntries: [],
});
LocalizationTableEntriesContext.displayName = 'localizationTableEntries';

export default LocalizationTableEntriesContext;
