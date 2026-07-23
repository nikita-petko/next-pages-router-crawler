import { compileCSV, CSVData } from '@rbx/core';
import {
  mandatoryCsvHeaders,
  optionalCsvHeaders,
  translatorTypeHeader,
} from '../constants/CsvParsingConstants';
import { EntryCsvInfo } from '../types/EntryCsvInfo';

export function replaceHyphensWithUnderscores(input: string): string {
  return input.replace(/-/g, '_');
}

export function replaceUnderscoresWithHyphens(input: string): string {
  return input.replace(/_/g, '-');
}

/** Ensures each row has one cell per header so trailing empty fields are still read (Excel often drops them). */
export function padCsvRowToHeaderCount(row: string[], headerCount: number): string[] {
  if (row.length >= headerCount) {
    return row.slice(0, headerCount);
  }
  return row.concat(Array(headerCount - row.length).fill(''));
}

/**
 * Canonical form for matching API locale codes with CSV column headers (hyphen vs underscore, casing).
 * Chinese-related codes stay hyphenated in CSV (zh-hans, zh-hant, zh-cjv); other locales use underscores.
 */
export function normalizeLocaleCodeForCsv(localeCode: string): string {
  const trimmed = localeCode.trim().toLowerCase();
  const underscored = replaceHyphensWithUnderscores(trimmed);
  if (underscored === 'zh_hans') {
    return 'zh-hans';
  }
  if (underscored === 'zh_hant') {
    return 'zh-hant';
  }
  if (underscored === 'zh_cjv') {
    return 'zh-cjv';
  }
  return underscored;
}

const getEscapedString = (source: string | null | undefined) => {
  if (!source) {
    return '';
  }
  // check if comma exists, if it does we don't have to escape it again
  if (source?.indexOf(',') > -1) {
    return source;
  }
  return `"${source.replace(/"/g, '""')}"`;
};

export function getFilename(universeId: string): string {
  return `${universeId} localization table.csv`;
}

export function generateCSV(
  entryData: EntryCsvInfo[],
  supportedLanguagesAndLocales: string[],
): CSVData {
  const lines: string[][] = [];
  const mandatoryHeaders = Array.from(mandatoryCsvHeaders);
  const optionalHeaders = Array.from(optionalCsvHeaders);
  // The locales should be hyphenated in the header we write to the csv
  const supportedLanguagesAndLocalesHyphenated = supportedLanguagesAndLocales.map((s) =>
    replaceUnderscoresWithHyphens(s),
  );
  const csvHeader = [
    ...mandatoryHeaders,
    ...optionalHeaders,
    ...supportedLanguagesAndLocalesHyphenated,
  ];
  lines.push(csvHeader);

  const rowBuilder = [...mandatoryHeaders, ...optionalHeaders, ...supportedLanguagesAndLocales];
  entryData.forEach((entry) => {
    const row: string[] = [];
    // For each entry, we create a row for it, based off the info in the rowBuilder
    rowBuilder.forEach((headerInfo) => {
      if (mandatoryCsvHeaders.has(headerInfo)) {
        switch (headerInfo) {
          case 'Source':
            row.push(getEscapedString(entry.source));
            break;
          case 'Context':
            row.push(getEscapedString(entry.context));
            break;
          case 'Key':
            row.push(getEscapedString(entry.key));
            break;
          case 'Example':
            row.push(getEscapedString(entry.example));
            break;
          default:
            break;
        }
      } else if (optionalCsvHeaders.has(headerInfo)) {
        // right now the only optional header is gameLocations
        row.push(getEscapedString(entry.gameLocations));
      }
      // language code or translator type column
      else {
        if (headerInfo.includes(translatorTypeHeader)) {
          return;
        }
        const translation = entry.translationDetails.find((translationDetail) => {
          return (
            normalizeLocaleCodeForCsv(translationDetail.languageCode) ===
            normalizeLocaleCodeForCsv(headerInfo)
          );
        });
        row.push(getEscapedString(translation?.translation ?? ''));
        row.push(getEscapedString(translation?.changeAgentType ?? ''));
      }
    });
    lines.push(row);
  });
  return compileCSV(lines);
}

export function getMissingCsvHeaders(headers: string[]) {
  const missingCsvHeaders: string[] = [];
  mandatoryCsvHeaders.forEach((mandatoryHeader) => {
    if (!headers.includes(mandatoryHeader.toLowerCase())) {
      missingCsvHeaders.push(mandatoryHeader);
    }
  });
  return missingCsvHeaders;
}

export function getNewTableCount(newEntriesCount: number, currTableCount: number) {
  return newEntriesCount + currTableCount;
}

export function parseToString(str: string[] | string | number | undefined) {
  switch (typeof str) {
    case 'undefined':
      return '';
    case 'number':
      return str?.toString();
    case 'string':
      return str;
    default:
      return str.length > 1 ? str.join(', ') : str.toString();
  }
}
