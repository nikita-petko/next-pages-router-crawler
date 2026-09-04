import { createContext } from 'react';
import type { AssetTranslationEntryTable } from '@modules/clients/localizationTables';

export interface ImageLocalizationTableEntriesValue {
  fullEntryTable: AssetTranslationEntryTable;
  batchedEntries: AssetTranslationEntryTable;
  fetchFullEntryTableError: Error | null;
  isFetchingFullEntryTable: boolean;
  isFullTableLoadingNotStarted: boolean;
  percentageLoaded: number;
}

const ImageLocalizationTableEntriesContext = createContext<ImageLocalizationTableEntriesValue>({
  fullEntryTable: [],
  batchedEntries: [],
  fetchFullEntryTableError: null,
  isFetchingFullEntryTable: false,
  isFullTableLoadingNotStarted: false,
  percentageLoaded: 0,
});
ImageLocalizationTableEntriesContext.displayName = 'imageLocalizationTableEntries';

export default ImageLocalizationTableEntriesContext;
