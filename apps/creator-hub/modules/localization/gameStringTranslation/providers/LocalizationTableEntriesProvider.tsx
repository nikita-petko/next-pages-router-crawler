import type { FunctionComponent } from 'react';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type {
  FailedModifiedEntry,
  PatchEntry,
  TranslationEntryTable,
} from '@modules/clients/localizationTables';
import localizationTableClient from '@modules/clients/localizationTables';
import { getResponseFromError } from '@modules/clients/utils';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import {
  maxRetryTimes,
  placeHolderTableName,
  maxAllowedPatchEntriesBatchSize,
  maxAllowedTranslationsPerBatch,
} from '../constants';
import calculateProgress from '../utils/ProgressCalculator';
import LocalizationTableEntriesContext from './LocalizationTableEntriesContext';

interface LocalizationTableEntriesProviderProps {
  gameId: number | null;
}

const LocalizationTableEntriesProvider: FunctionComponent<
  React.PropsWithChildren<LocalizationTableEntriesProviderProps>
> = ({ gameId, children }) => {
  const { entryTableId } = useEntryManagementMetadata();
  const [fullEntryTable, setFullEntryTable] = useState<TranslationEntryTable>([]);
  const [fetchFullEntryTableError, setFetchFullEntryTableError] = useState<Error | null>(null);
  const [isFetchingFullEntryTable, setIsFetchingFullEntryTable] = useState<boolean>(false);
  const [isUpdatingLocalizationTables, setIsUpdatingLocalizationTables] = useState<boolean>(false);
  const [updateTableErrorMsg, setUpdateTableErrorMsg] = useState<string | null>(null);
  const [failedEntries, setFailedEntries] = useState<FailedModifiedEntry[]>([]);
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const numEntriesLoaded = useRef<number>(0);
  const percentageLoaded = useRef<number>(0);
  const entryTableCount = useRef<number>(0);
  const batchedEntries = useRef<TranslationEntryTable>([]);

  useEffect(() => {
    let isMounted = true;
    if (!gameId) {
      throw new Error('Game Id is invalid');
    }
    if (!entryTableId) {
      return () => {
        isMounted = false;
      };
    }
    // get fullTableCount to calculate progress
    localizationTableClient
      .getTableEntriesCount({
        tableId: entryTableId,
        gameId,
      })
      .then((response) => {
        const { entryCount } = response;
        if (entryCount !== undefined) {
          entryTableCount.current = entryCount;
        }
      })
      .catch(() => {
        setFetchFullEntryTableError(Error('failed to fetch entry table count'));
      })
      .finally(() => {
        setFetchFullEntryTableError(null);
      });

    const recursivelyFetchFullTableInfo = async (
      nextPageCursor: string | undefined,
      retryTimes: number,
    ) => {
      setIsFetchingFullEntryTable(true);
      if (!isMounted || typeof nextPageCursor === 'undefined') {
        setIsFetchingFullEntryTable(false);
        setFetchFullEntryTableError(null);
        return;
      }
      if (retryTimes <= 0) {
        const catchedError = Error(
          `Failed to fetch localization table entries after ${retryTimes} times`,
        );
        setFetchFullEntryTableError(catchedError);
        setIsFetchingFullEntryTable(false);
        return;
      }
      try {
        const response = await localizationTableClient.getTranslationEntries({
          tableId: entryTableId,
          gameId,
          cursor: nextPageCursor,
        });
        if (response?.data === undefined) {
          throw new Error('Entry table is undefined');
        }
        if (response.data.length > 0 || response.data !== null) {
          // set entry table after each call so that users still have access to existing table even if the client times out later
          batchedEntries.current = response.data;
          numEntriesLoaded.current += batchedEntries.current.length;
          setFullEntryTable((entryTable) => [...entryTable, ...batchedEntries.current]);
          percentageLoaded.current = calculateProgress(
            numEntriesLoaded.current,
            entryTableCount.current,
          );
          // sets the loading progress of the table
          await recursivelyFetchFullTableInfo(response.nextPageCursor, maxRetryTimes);
        } else {
          await recursivelyFetchFullTableInfo(undefined, 0);
        }
      } catch {
        await recursivelyFetchFullTableInfo(nextPageCursor, retryTimes - 1);
      }
    };
    setFetchFullEntryTableError(null);
    recursivelyFetchFullTableInfo('', maxRetryTimes);
    return () => {
      isMounted = false;
    };
  }, [gameId, entryTableId]);

  const isFullTableLoadingNotStarted = useMemo(() => {
    return isFetchingFullEntryTable && fullEntryTable?.length === 0;
  }, [isFetchingFullEntryTable, fullEntryTable]);

  const getBatchSlice = (startIndex: number, entriesToPatch: PatchEntry[]) => {
    const totalLength = entriesToPatch.length;
    let endIndex = startIndex + maxAllowedPatchEntriesBatchSize;

    // Bound the end index to the total length of the entries
    if (endIndex > totalLength) {
      endIndex = totalLength;
    }

    const currEntries = entriesToPatch.slice(startIndex, endIndex);

    let totalTranslations = 0;
    // Double check that the current slice doesn't contain too many translations
    for (let i = 0; i < currEntries.length; i += 1) {
      const translations = currEntries[i].translations ?? [];
      totalTranslations += translations.length;
      // If the current slice contains too many translations, break and return the previous slice
      if (totalTranslations > maxAllowedTranslationsPerBatch) {
        endIndex = startIndex + i;
        break;
      }
    }

    return entriesToPatch.slice(startIndex, endIndex);
  };

  // recursive function for modifying localization table
  const updateLocalizationTables = useCallback(
    async (entriesToPatch: PatchEntry[], universeId: number, tableId: string) => {
      setFailedEntries([]);
      const totalLength = entriesToPatch.length;
      const recursivelyUpdateLocalizationTables = async (startIndex: number) => {
        setIsUpdatingLocalizationTables(true);
        const progress = calculateProgress(startIndex, totalLength);
        setUpdateProgress(progress);
        if (startIndex >= totalLength) {
          setIsUpdatingLocalizationTables(false);
          setUpdateTableErrorMsg(null);
          return;
        }
        try {
          const currEntries = getBatchSlice(startIndex, entriesToPatch);
          if (currEntries) {
            const endIndex = startIndex + currEntries.length;
            const response = await localizationTableClient.modifyEntry({
              gameId: universeId,
              tableId,
              request: {
                entries: currEntries,
                name: placeHolderTableName,
              },
            });
            if (response === undefined) {
              throw new Error('LocalizationTables patch request an undefined response');
            }
            const failedResponse = response.failedEntriesAndTranslations;
            if (failedResponse && failedResponse?.length > 0) {
              setFailedEntries((prev) => [...prev, ...failedResponse]);
            }
            recursivelyUpdateLocalizationTables(endIndex);
          } else {
            recursivelyUpdateLocalizationTables(entriesToPatch.length);
          }
        } catch (e) {
          const responseError = getResponseFromError(e);
          const catchedErrors = await responseError?.json();
          if (catchedErrors?.errors?.length > 0) {
            setUpdateTableErrorMsg(catchedErrors.errors[0].message);
          }
          setIsUpdatingLocalizationTables(false);
        }
      };
      recursivelyUpdateLocalizationTables(0);
    },
    [],
  );

  const providerValue = useMemo(() => {
    return {
      updateLocalizationTables,
      entryTableCount: entryTableCount.current,
      percentageLoaded: percentageLoaded.current > 100 ? 100 : percentageLoaded.current,
      updateProgress,
      fullEntryTable,
      batchedEntries: batchedEntries.current,
      failedEntries,
      fetchFullEntryTableError,
      updateTableErrorMsg,
      isFetchingFullEntryTable,
      isFullTableLoadingNotStarted,
      isUpdatingLocalizationTables,
    };
  }, [
    updateLocalizationTables,
    failedEntries,
    fetchFullEntryTableError,
    fullEntryTable,
    isFetchingFullEntryTable,
    isFullTableLoadingNotStarted,
    isUpdatingLocalizationTables,
    updateProgress,
    updateTableErrorMsg,
  ]);

  return (
    <LocalizationTableEntriesContext.Provider value={providerValue}>
      {children}
    </LocalizationTableEntriesContext.Provider>
  );
};

export default LocalizationTableEntriesProvider;
