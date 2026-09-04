import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import type { AssetEntry } from '@modules/clients/localizationTables';
import localizationTableClient from '@modules/clients/localizationTables';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import useRecursivePagedEntryTable from '../../translation/hooks/useRecursivePagedEntryTable';
import { maxRetryTimes } from '../constants';
import ImageLocalizationTableEntriesContext from './ImageLocalizationTableEntriesContext';

interface ImageLocalizationTableEntriesProviderProps {
  gameId: number | null;
}

/**
 * Fetches the table's image (asset) entries via the localization-tables `asset-entries` endpoint,
 * mirroring the strings `LocalizationTableEntriesProvider`. Fetch/retry/paging is shared via
 * `useRecursivePagedEntryTable`.
 */
const ImageLocalizationTableEntriesProvider: FunctionComponent<
  React.PropsWithChildren<ImageLocalizationTableEntriesProviderProps>
> = ({ gameId, children }) => {
  const { entryTableId } = useEntryManagementMetadata();

  const fetchPage = useCallback(
    (cursor: string) =>
      localizationTableClient.getAssetTranslationEntries({
        tableId: entryTableId,
        gameId: gameId ?? undefined,
        cursor,
      }),
    [entryTableId, gameId],
  );

  const value = useRecursivePagedEntryTable<AssetEntry>({
    gameId,
    entryTableId,
    maxRetryTimes,
    fetchPage,
    errorLabel: 'asset entries',
  });

  return (
    <ImageLocalizationTableEntriesContext.Provider value={value}>
      {children}
    </ImageLocalizationTableEntriesContext.Provider>
  );
};

export default ImageLocalizationTableEntriesProvider;
