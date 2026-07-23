import { useCallback, useEffect, useState } from 'react';
import type {
  FailedModifiedEntry,
  GameLocation,
  PatchEntry,
  TranslationEntryTable,
} from '@modules/clients/localizationTables';
import { ChangeAgentType } from '@modules/clients/localizationTables';
import useEntryInformation from '../../gameStringTranslation/hooks/useEntryInformation';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import getIdentifier from '../../translation/utils/getIdentifier';
import CsvUploadFailureStatus from '../enums/CsvUploadFailureStatus';
import type { CsvParsingErrorInfo } from '../types/CsvParsingErrorInfo';
import type { EntryCsvInfo, TranslationDetails } from '../types/EntryCsvInfo';
import { normalizeLocaleCodeForCsv } from '../utils/CsvParser';

const useCsvEntriesMap = () => {
  const {
    batchedEntries,
    failedEntries,
    updateLocalizationTables,
    updateTableErrorMsg,
    isUpdatingLocalizationTables,
  } = useEntryInformation();
  const { entryTableId, gameId } = useEntryManagementMetadata();
  const [parsedEntriesMap, setParsedEntriesMap] = useState<Map<string, EntryCsvInfo>>(new Map());
  const [isParsingMapFromTable, setIsParsingMapFromTable] = useState<boolean>(false);
  const [isDeletingTable, setIsDeletingTable] = useState<boolean>(false);
  const [entriesMapForUpload, setEntriesMapForUpload] = useState<Map<string, PatchEntry> | null>(
    null,
  );
  const [failedUpdateErrors, setFailedUpdateErrors] = useState<CsvParsingErrorInfo[] | null>(null);

  const parseGameLocations = (locations: GameLocation[] | undefined) => {
    if (!locations) {
      return '';
    }
    return locations.map((location) => location.path ?? '').join(', ');
  };

  const setEntryCsvInfoFromTable = useCallback((entries: TranslationEntryTable) => {
    setIsParsingMapFromTable(true);
    entries.forEach((entry) => {
      const source = entry.identifier?.source ?? '';
      const key = entry.identifier?.key ?? '';
      const context = entry.identifier?.context ?? '';
      const example = entry.metadata?.example ?? '';
      const identifier = getIdentifier(
        entry.identifier?.source ?? null,
        entry.identifier?.context ?? null,
      );
      const gameLocations = parseGameLocations(entry.metadata?.gameLocations);
      const translationDetails: TranslationDetails[] = [];
      entry.translations?.forEach((translation) => {
        if (translation.locale) {
          translationDetails.push({
            languageCode: normalizeLocaleCodeForCsv(translation.locale),
            translation: translation.translationText ?? '',
            changeAgentType: translation.translator?.agentType,
          });
        }
      });
      const parsedEntry: EntryCsvInfo = {
        source,
        context,
        key,
        example,
        gameLocations,
        translationDetails,
      };
      setParsedEntriesMap((prev) => {
        prev.set(identifier, parsedEntry);
        return prev;
      });
    });
    setIsParsingMapFromTable(false);
  }, []);

  const parseFailedEntryError = (entries: FailedModifiedEntry[]) => {
    const newUpdateErrors: CsvParsingErrorInfo[] = entries.map((entry) => {
      const entryDetails = [
        entry.identifier?.source ?? '',
        entry.identifier?.context ?? '',
        entry.error?.errorMessage ?? '',
      ];
      return {
        errorType: CsvUploadFailureStatus.EntryUpdateFailed,
        failedTexts: entryDetails,
      };
    });
    return newUpdateErrors;
  };

  const deleteEntryCsvInfoMap = (failedDeleteEntryIdentifiers: Set<string>) => {
    if (failedDeleteEntryIdentifiers.size === 0) {
      setParsedEntriesMap(new Map());
    } else {
      setParsedEntriesMap((prev) => {
        const updatedMap: Map<string, EntryCsvInfo> = new Map();
        failedDeleteEntryIdentifiers.forEach((identifier) => {
          const currEntryCsvInfo = prev.get(identifier);
          if (currEntryCsvInfo) {
            updatedMap.set(identifier, currEntryCsvInfo);
          }
        });
        return updatedMap;
      });
    }
  };

  const modifyEntryCsvInfoMap = useCallback(
    (patchedEntriesMap: Map<string, PatchEntry>) => {
      patchedEntriesMap.forEach((entry, identifier) => {
        if (entry.translations) {
          // turn updated translations into translationDetails
          const newTranslationDetails: TranslationDetails[] = entry.translations?.map(
            (translation) => {
              return {
                languageCode: translation.locale ?? '',
                // _delete is a property from the LT client response - this cannot be changed
                // eslint-disable-next-line no-underscore-dangle -- see above
                translation: translation._delete ? '' : (translation.translationText ?? ''),
              };
            },
          );
          const currParsedInfo = parsedEntriesMap.get(identifier);
          // entry exists
          if (typeof currParsedInfo !== 'undefined') {
            const currTranslationDetails = [...currParsedInfo.translationDetails];
            newTranslationDetails.forEach((newDetail) => {
              const currTranslation = currTranslationDetails.find(
                (currTranslationDetail) =>
                  normalizeLocaleCodeForCsv(currTranslationDetail.languageCode) ===
                  normalizeLocaleCodeForCsv(newDetail.languageCode),
              );
              // existing language - updated translation
              if (currTranslation) {
                currTranslation.translation = newDetail.translation;
                currTranslation.changeAgentType = ChangeAgentType.User;
              }
              // new language - add translationDetail
              else {
                currTranslationDetails.push({
                  translation: newDetail.translation,
                  languageCode: newDetail.languageCode,
                  changeAgentType: ChangeAgentType.User,
                });
              }
            });
            // currParsedInfo definitely exists here
            setParsedEntriesMap((prev) => {
              prev.set(identifier, {
                ...currParsedInfo,
                key: entry.identifier?.key ?? '',
                example: entry.metadata?.example ?? '',
                translationDetails: currTranslationDetails,
              });
              return prev;
            });
          } // new entry
          else {
            const parsedEntry: EntryCsvInfo = {
              source: entry.identifier?.source ?? '',
              context: entry.identifier?.context ?? '',
              key: entry.identifier?.key ?? '',
              example: entry.metadata?.example ?? '',
              gameLocations: parseGameLocations(entry.metadata?.gameLocations),
              translationDetails: newTranslationDetails,
            };
            setParsedEntriesMap((prev) => {
              prev.set(identifier, parsedEntry);
              return prev;
            });
          }
        }
      });
    },
    [parsedEntriesMap],
  );

  const modifyEntries = useCallback(
    async (entriesMap: Map<string, PatchEntry>) => {
      setEntriesMapForUpload(entriesMap);
      if (gameId && entryTableId) {
        await updateLocalizationTables(Array.from(entriesMap.values()), gameId, entryTableId);
      }
    },
    [gameId, entryTableId, updateLocalizationTables],
  );

  const deleteFullLocalizationTable = useCallback(async () => {
    setIsDeletingTable(true);
    const currTable = Array.from(parsedEntriesMap.values());
    const deletedEntries: PatchEntry[] = currTable.map((entry) => {
      return {
        identifier: {
          source: entry.source,
          context: entry.context ?? '',
          key: entry.key ?? '',
        },
        _delete: true,
      };
    });
    if (gameId && entryTableId) {
      await updateLocalizationTables(deletedEntries, gameId, entryTableId);
    }
  }, [parsedEntriesMap, gameId, entryTableId, updateLocalizationTables]);

  useEffect(() => {
    setEntryCsvInfoFromTable(batchedEntries);
  }, [batchedEntries, setEntryCsvInfoFromTable]);

  useEffect(() => {
    if (isUpdatingLocalizationTables) {
      return;
    }
    if (updateTableErrorMsg !== null) {
      const modifyTableFailure = {
        errorType: CsvUploadFailureStatus.ModifyTableFailure,
        failedTexts: updateTableErrorMsg,
      };
      setFailedUpdateErrors((prev) => {
        if (prev === null) {
          return [modifyTableFailure];
        }
        return [...prev, modifyTableFailure];
      });
      return;
    }
    if (failedEntries.length > 0) {
      setFailedUpdateErrors(parseFailedEntryError(failedEntries));
      if (isDeletingTable) {
        const updateFailedEntryIdentifiers: Set<string> = new Set();
        failedEntries.forEach((entry) => {
          const identifier = getIdentifier(
            entry.identifier?.source ?? '',
            entry.identifier?.context ?? '',
          );
          updateFailedEntryIdentifiers.add(identifier);
        });
        deleteEntryCsvInfoMap(updateFailedEntryIdentifiers);
        setIsDeletingTable(false);
      } else if (entriesMapForUpload !== null) {
        failedEntries.forEach((entry) => {
          // remove from entries that failed to update
          const identifier = getIdentifier(
            entry.identifier?.source ?? '',
            entry.identifier?.context ?? '',
          );
          setEntriesMapForUpload((prev) => {
            prev?.delete(identifier);
            return prev;
          });
        });
        modifyEntryCsvInfoMap(entriesMapForUpload);
        setEntriesMapForUpload(null);
      }
    }
  }, [
    isUpdatingLocalizationTables,
    isDeletingTable,
    entriesMapForUpload,
    failedEntries,
    updateTableErrorMsg,
    modifyEntryCsvInfoMap,
  ]);

  return {
    parsedEntriesMap,
    isParsingMapFromTable,
    modifyEntries,
    deleteFullLocalizationTable,
    failedUpdateErrors,
  };
};

export default useCsvEntriesMap;
