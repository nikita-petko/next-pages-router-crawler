import { useCallback, useState } from 'react';
import { EntryTranslation, GameLocation, PatchEntry } from '@modules/clients';
import { CSVStringToArray, downloadBlob } from '@rbx/core';
import useEntryInformation from '../../gameStringTranslation/hooks/useEntryInformation';
import calculateProgress from '../../gameStringTranslation/utils/ProgressCalculator';
import getIdentifier from '../../translation/utils/getIdentifier';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import {
  getFilename,
  getMissingCsvHeaders,
  getNewTableCount,
  generateCSV,
  normalizeLocaleCodeForCsv,
  padCsvRowToHeaderCount,
  replaceHyphensWithUnderscores,
} from '../utils/CsvParser';
import CsvUploadFailureStatus from '../enums/CsvUploadFailureStatus';
import useLanguageManagement from './useLanguageManagement';
import { CsvParsingErrorInfo } from '../types/CsvParsingErrorInfo';
import {
  mandatoryCsvHeaders,
  maxCsvRowCount,
  maxTableEntriesCount,
  optionalCsvHeaders,
  translatorTypeHeader,
} from '../constants/CsvParsingConstants';
import useCsvEntriesMap from './useCsvEntriesMap';

/** Parsed CSV headers are lowercased; mandatory/optional sets use title case */
const mandatoryCsvHeadersLower = new Set(
  Array.from(mandatoryCsvHeaders).map((h) => h.toLowerCase()),
);
const optionalCsvHeadersLower = new Set(Array.from(optionalCsvHeaders).map((h) => h.toLowerCase()));

function parseGameLocationPathsFromCell(cell: string): GameLocation[] | undefined {
  const paths = cell
    .split(', ')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  if (paths.length === 0) {
    return undefined;
  }
  return paths.map((path) => ({ path }));
}

/** Matches join in useCsvEntriesMap.parseGameLocations — round-trips Download Table CSV. */
function gameLocationsFromCsvRow(
  row: string[],
  gameLocationsCol: number,
  existingLocationsDisplay: string | null | undefined,
): GameLocation[] | undefined {
  if (gameLocationsCol >= 0) {
    const cell = (row[gameLocationsCol] ?? '').trim();
    if (!cell) {
      return undefined;
    }
    return parseGameLocationPathsFromCell(cell);
  }
  const fallback = (existingLocationsDisplay ?? '').trim();
  if (!fallback) {
    return undefined;
  }
  return parseGameLocationPathsFromCell(fallback);
}

const useLocalizationTableCsvParser = () => {
  const {
    isLanguageCodeValid,
    isLoadingSupportedLanguages,
    supportedLanguagesBriefInfoList,
    supportedLocalesBriefInfoList,
    handleAddLanguage,
    fetchSupportedLanguagesError,
  } = useLanguageManagement();
  const { gameId } = useEntryManagementMetadata();
  const { parsedEntriesMap, modifyEntries } = useCsvEntriesMap();
  const { entryTableCount } = useEntryInformation();
  const [csvParsingErrors, setCsvParsingErrors] = useState<CsvParsingErrorInfo[]>([]);
  const [modifiedEntriesMap, setModifiedEntriesMap] = useState<Map<string, PatchEntry>>(new Map());
  const [newSupportedLanguages, setnewSupportedLanguages] = useState<Set<string>>(new Set());
  const [parsingPercentage, setParsingPercentage] = useState<number>(0);
  /** Set after each successful parse so the confirm dialog shows real totals (refs do not re-render). */
  const [uploadPreviewStats, setUploadPreviewStats] = useState({
    addedEntriesCount: 0,
    modifiedTranslationsCount: 0,
    deletedTranslationsCount: 0,
  });

  const resetStates = () => {
    setUploadPreviewStats({
      addedEntriesCount: 0,
      modifiedTranslationsCount: 0,
      deletedTranslationsCount: 0,
    });
    setModifiedEntriesMap(new Map());
  };

  const getNewOrUpdatedEntries = useCallback(
    (headers: string[], rowValues: string[][]) => {
      resetStates();
      if (rowValues.length === 0 || headers.length === 0) {
        return;
      }
      const sourceCol = headers.indexOf('source');
      const contextCol = headers.indexOf('context');
      const keyCol = headers.indexOf('key');
      const exampleCol = headers.indexOf('example');
      const gameLocationsCol = headers.indexOf('game locations');
      const colToLocalizationCodeMap = new Map<number, string>();
      headers.forEach((header, col) => {
        if (mandatoryCsvHeadersLower.has(header) || optionalCsvHeadersLower.has(header)) {
          return;
        }
        if (header.includes(translatorTypeHeader)) {
          return;
        }
        const canonicalLocale = normalizeLocaleCodeForCsv(header);
        if (isLanguageCodeValid(header) || isLanguageCodeValid(canonicalLocale)) {
          colToLocalizationCodeMap.set(col, canonicalLocale);
        } else if (
          supportedLocalesBriefInfoList?.some((loc) => {
            const supportedLocaleCode = normalizeLocaleCodeForCsv(loc.localeCode ?? '');
            return supportedLocaleCode !== '' && supportedLocaleCode === canonicalLocale;
          })
        ) {
          colToLocalizationCodeMap.set(col, canonicalLocale);
        }
      });

      const innerModifiedEntriesMap: Map<string, PatchEntry> = new Map();
      let addedEntries = 0;
      let modifiedTranslations = 0;
      let deletedTranslations = 0;
      const headerCount = headers.length;
      rowValues.forEach((row, currIndex) => {
        const progress = calculateProgress(currIndex + 1, rowValues.length);
        setParsingPercentage(progress);
        const paddedRow = padCsvRowToHeaderCount(row, headerCount);
        const source = paddedRow[sourceCol];
        if (source) {
          const context = paddedRow[contextCol];
          const identifier = getIdentifier(source, context);
          const existingEntry = parsedEntriesMap.get(identifier);
          const gameLocations = gameLocationsFromCsvRow(
            paddedRow,
            gameLocationsCol,
            existingEntry?.gameLocations,
          );
          // new entry - check if any translations have been provided for each language
          let translations: EntryTranslation[] = [];
          paddedRow.forEach((localizedText, colIndex) => {
            const locale = colToLocalizationCodeMap.get(colIndex);
            if (locale) {
              translations.push({
                locale,
                translationText: localizedText,
                _delete: false,
              });
            }
          });
          const entry: PatchEntry = {
            identifier: {
              source: source ?? '',
              key: paddedRow[keyCol] ?? '',
              context: context ?? '',
            },
            metadata: {
              example: paddedRow[exampleCol] ?? '',
              ...(gameLocations ? { gameLocations } : {}),
            },
            translations: [],
          };
          // new entry, update for all languages with translations in csv file
          if (!existingEntry) {
            translations = translations.filter(
              (translation) => (translation.translationText ?? '').trim() !== '',
            );
            entry.translations = translations;
            innerModifiedEntriesMap.set(identifier, entry);
            addedEntries += 1;
            modifiedTranslations += translations.length;
          } else {
            // existing entry: add, update, or remove translations per locale
            const modifiedTranslationsList: EntryTranslation[] = [];
            translations.forEach((translation) => {
              const locale = normalizeLocaleCodeForCsv(translation.locale ?? '');
              const csvText = (translation.translationText ?? '').trim();
              const currTranslation = existingEntry.translationDetails.find((details) => {
                return normalizeLocaleCodeForCsv(details.languageCode) === locale;
              })?.translation;
              const storedText = (currTranslation ?? '').trim();
              if (csvText === storedText) {
                return;
              }
              if (csvText) {
                modifiedTranslationsList.push({
                  locale,
                  translationText: csvText,
                  _delete: false,
                });
                modifiedTranslations += 1;
              } else if (storedText) {
                const newTranslation = {
                  ...translation,
                  locale,
                  translationText: currTranslation ?? '',
                  _delete: true,
                };
                modifiedTranslationsList.push(newTranslation);
                deletedTranslations += 1;
              }
            });

            if (modifiedTranslationsList.length > 0) {
              entry.translations = modifiedTranslationsList;
              innerModifiedEntriesMap.set(identifier, entry);
            }
          }
        }
      });
      setUploadPreviewStats({
        addedEntriesCount: addedEntries,
        modifiedTranslationsCount: modifiedTranslations,
        deletedTranslationsCount: deletedTranslations,
      });
      // make sure that new entries added will not result in a loc table that's
      // over the size limit
      const tableSizeExceededCount =
        getNewTableCount(addedEntries, entryTableCount) - maxTableEntriesCount;
      if (tableSizeExceededCount > 0) {
        setCsvParsingErrors((prev) => [
          ...prev,
          {
            errorType: CsvUploadFailureStatus.LocalizationTableTooLarge,
            failedTexts: tableSizeExceededCount.toString(),
          },
        ]);
      } else {
        setModifiedEntriesMap(innerModifiedEntriesMap);
      }
    },
    [entryTableCount, isLanguageCodeValid, supportedLocalesBriefInfoList, parsedEntriesMap],
  );

  const getUpdatedLanguages = useCallback(
    (headers: string[]) => {
      if (!headers) {
        return;
      }
      if (isLoadingSupportedLanguages) {
        return;
      }
      if (fetchSupportedLanguagesError !== null) {
        setCsvParsingErrors((prev) => [
          ...prev,
          {
            errorType: CsvUploadFailureStatus.FailedToFetchSupportingLanguage,
          },
        ]);
        return;
      }
      // compare current and new supported languages
      const currSupportedLanguageCodes = new Set(
        supportedLanguagesBriefInfoList.map((language) => language.languageCode),
      );
      const mandatoryHeader = Array.from(mandatoryCsvHeaders).map((header) => header.toLowerCase());
      const optionalHeader = Array.from(optionalCsvHeaders).map((header) => header.toLowerCase());
      const candidateHeaders = headers
        .map((candidateHeader) => candidateHeader.toLowerCase())
        .filter(
          (header) =>
            !mandatoryHeader.includes(header) &&
            !header.includes(translatorTypeHeader) &&
            !optionalHeader.includes(header),
        );

      // From remaining headers, they are either language codes, locale codes, or completely invalid
      const nonLanguageCodeHeaders: string[] = candidateHeaders.filter((candidateLanguageCode) => {
        const isValidLanguageCode = isLanguageCodeValid(candidateLanguageCode);
        if (isValidLanguageCode && !currSupportedLanguageCodes.has(candidateLanguageCode)) {
          // Valid language codes not in the supported languages list should be added as new supported languages
          setnewSupportedLanguages((prev) => prev.add(candidateLanguageCode));
        }
        return !isValidLanguageCode;
      });

      const invalidHeaders: string[] = nonLanguageCodeHeaders.filter((candidateLocaleCode) => {
        const normalizedCandidateLocaleCode = replaceHyphensWithUnderscores(candidateLocaleCode);
        // ensure the normalized locale is present in the supported locales list
        const isCandidateLocaleCodeSupported = supportedLocalesBriefInfoList?.some((loc) => {
          const supportedLocaleCode = (loc.localeCode ?? '').toLowerCase();
          return (
            supportedLocaleCode !== '' &&
            supportedLocaleCode === normalizedCandidateLocaleCode.toLowerCase()
          );
        });
        return !isCandidateLocaleCodeSupported;
      });

      if (invalidHeaders.length > 0) {
        setCsvParsingErrors((prev) => [
          ...prev,
          {
            errorType: CsvUploadFailureStatus.InvalidSupportedLanguage,
            failedTexts: invalidHeaders,
          },
        ]);
      }
    },
    [
      isLoadingSupportedLanguages,
      fetchSupportedLanguagesError,
      supportedLanguagesBriefInfoList,
      supportedLocalesBriefInfoList,
      isLanguageCodeValid,
    ],
  );

  const parseCsvFile = (file: File) => {
    const fr = new FileReader();
    setCsvParsingErrors([]);
    setUploadPreviewStats({
      addedEntriesCount: 0,
      modifiedTranslationsCount: 0,
      deletedTranslationsCount: 0,
    });
    fr.onload = () => {
      const csvOutput = fr.result;
      if (csvOutput) {
        const encoder = new TextDecoder();
        const str = encoder.decode(csvOutput as ArrayBuffer);
        const parsedArray = CSVStringToArray(str);
        const headers = parsedArray[0].map((header) => header.toLowerCase());
        // check if all mandatory headers are present in csv
        const missingHeaders = getMissingCsvHeaders(headers);
        if (missingHeaders.length > 0) {
          setCsvParsingErrors((prev) => [
            ...prev,
            {
              errorType: CsvUploadFailureStatus.MissingMandatoryHeaders,
              failedTexts: missingHeaders,
            },
          ]);
          return;
        }
        // csv headers are valid, check if there are actual entries
        const parsedRowValues = parsedArray.slice(1);
        if (
          !parsedRowValues ||
          parsedRowValues.every((row) => {
            return !row.length;
          })
        ) {
          setCsvParsingErrors((prev) => [
            ...prev,
            {
              errorType: CsvUploadFailureStatus.EmptyCSV,
            },
          ]);
          return;
        }
        if (parsedRowValues.length > maxCsvRowCount) {
          setCsvParsingErrors((prev) => [
            ...prev,
            {
              errorType: CsvUploadFailureStatus.TooManyCsvRows,
              failedTexts: parsedRowValues.length,
            },
          ]);
          return;
        }
        getUpdatedLanguages(headers);
        getNewOrUpdatedEntries(headers, parsedRowValues);
      }
    };
    fr.readAsArrayBuffer(file);
  };

  const handleConfirmCsvUpload = () => {
    modifyEntries(modifiedEntriesMap);
    handleAddLanguage(Array.from(newSupportedLanguages));
  };

  const handleRejectedFile = useCallback((error: CsvUploadFailureStatus) => {
    setCsvParsingErrors((prev) => [
      ...prev,
      {
        errorType: error,
      },
    ]);
  }, []);

  const downloadCsvFile = useCallback(() => {
    const supportedLanguagesAndTranslatorType: string[] = [];
    supportedLanguagesBriefInfoList.forEach((lang) => {
      const { languageCode } = lang;
      supportedLanguagesAndTranslatorType.push(languageCode);
      supportedLanguagesAndTranslatorType.push(languageCode + translatorTypeHeader);
    });

    supportedLocalesBriefInfoList?.forEach((supportedLocale) => {
      supportedLanguagesAndTranslatorType.push(supportedLocale.localeCode);
      supportedLanguagesAndTranslatorType.push(supportedLocale.localeCode + translatorTypeHeader);
    });

    const csvFile = generateCSV(
      Array.from(parsedEntriesMap.values()),
      supportedLanguagesAndTranslatorType,
    );
    const bytes = new TextEncoder().encode(csvFile);
    // add BOM so that non-English characters show up correctly in Excel
    const exportBlob = new Blob(['\ufeff', bytes], {
      type: 'text/csv;charset=utf-8',
    });
    const filename = getFilename(gameId?.toString() ?? '');
    downloadBlob(exportBlob, filename);
  }, [supportedLanguagesBriefInfoList, supportedLocalesBriefInfoList, parsedEntriesMap, gameId]);

  return {
    addedEntriesCount: uploadPreviewStats.addedEntriesCount,
    deletedTranslationsCount: uploadPreviewStats.deletedTranslationsCount,
    modifiedTranslationsCount: uploadPreviewStats.modifiedTranslationsCount,
    newSupportedLanguagesCount: newSupportedLanguages.size,
    parsingPercentage,
    csvParsingErrors,
    parseCsvFile,
    downloadCsvFile,
    handleConfirmCsvUpload,
    handleRejectedFile,
  };
};

export default useLocalizationTableCsvParser;
