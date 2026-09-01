import {
  CsvUploadFailureStatusToWarnings,
  maxCsvRowCount,
  maxTableEntriesCount,
} from '../constants/CsvParsingConstants';
import CsvUploadFailureStatus from '../enums/CsvUploadFailureStatus';
import type { CsvParsingErrorInfo } from '../types/CsvParsingErrorInfo';
import { parseToString } from './CsvParser';

/** Known API error codes from localization table patch responses → translation keys with guidance. */
const LOCALIZATION_TABLE_API_ERROR_KEYS: Record<string, string> = {
  LocalizationTargetNotSupported: 'Description.CsvApiErrorLocalizationTargetNotSupported',
};

function getFriendlyLocalizationTableApiError(
  rawMessage: string,
  translate: (
    key: string,
    args?: {
      [key: string]: string;
    },
  ) => string,
): string {
  const code = rawMessage.trim();
  const translationKey = LOCALIZATION_TABLE_API_ERROR_KEYS[code];
  if (translationKey) {
    return translate(translationKey);
  }
  return translate('Description.CsvApiErrorGeneric', { message: code });
}

function formatFailedEntryLine(
  entryDetails: string[],
  translate: (
    key: string,
    args?: {
      [key: string]: string;
    },
  ) => string,
): string {
  const source = parseToString(entryDetails[0]);
  const context = parseToString(entryDetails[1]);
  const rawError = parseToString(entryDetails[2]);
  const friendlyError = getFriendlyLocalizationTableApiError(rawError, translate);
  if (context.trim() !== '') {
    return `${translate('Description.FailedEntryDetailsWithContext', {
      source,
      context,
      errorMessage: friendlyError,
    })} \n`;
  }
  return `${translate('Description.FailedEntryDetailsNoContext', {
    source,
    errorMessage: friendlyError,
  })} \n`;
}

export function parseErrorsToMessage(
  error: CsvParsingErrorInfo,
  translate: (
    key: string,
    args?: {
      [key: string]: string;
    },
  ) => string,
) {
  switch (error.errorType) {
    case CsvUploadFailureStatus.TooManyCsvRows:
      return `${translate(CsvUploadFailureStatusToWarnings[error.errorType], {
        userCsvRowCount: parseToString(error.failedTexts),
        maxCsvRowCount: parseToString(maxCsvRowCount),
      })} \n`;
    case CsvUploadFailureStatus.LocalizationTableTooLarge:
      return `${translate(CsvUploadFailureStatusToWarnings[error.errorType], {
        maxTableSize: parseToString(maxTableEntriesCount),
      })} \n`;
    case CsvUploadFailureStatus.ModifyTableFailure:
      return `${translate(CsvUploadFailureStatusToWarnings[error.errorType], {
        errorMsg: parseToString(error.failedTexts),
      })} \n`;
    case CsvUploadFailureStatus.EntryUpdateFailed:
    case CsvUploadFailureStatus.DeleteEntryFailed: {
      const entryDetails = error.failedTexts as string[];
      return formatFailedEntryLine(entryDetails, translate);
    }
    case CsvUploadFailureStatus.MissingMandatoryHeaders:
    case CsvUploadFailureStatus.InvalidSupportedLanguage:
      return `${translate(CsvUploadFailureStatusToWarnings[error.errorType])} ${parseToString(
        error.failedTexts,
      )} \n`;
    case CsvUploadFailureStatus.TooManyFiles:
    case CsvUploadFailureStatus.InvalidFileType:
    case CsvUploadFailureStatus.FileSizeTooLarge:
    case CsvUploadFailureStatus.FailedToFetchSupportingLanguage:
    case CsvUploadFailureStatus.EmptyCSV:
    case CsvUploadFailureStatus.AddLanguagesFailure:
    case CsvUploadFailureStatus.FailedToLoadCurrentTable:
      return `${translate(CsvUploadFailureStatusToWarnings[error.errorType])} \n`;
    default:
      return '';
  }
}

export function getErrorMessages(
  errors: CsvParsingErrorInfo[],
  translate: (
    key: string,
    args?: {
      [key: string]: string;
    },
  ) => string,
) {
  return errors.reduce((errorString, error) => {
    return errorString + parseErrorsToMessage(error, translate);
  }, '');
}
