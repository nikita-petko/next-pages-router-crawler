import CsvProgressType from '../enums/CsvProgressType';
import CsvUploadFailureStatus from '../enums/CsvUploadFailureStatus';

const maxCsvFileSizeMB = 2;
const maxCsvRowCount = 1000;
const maxTableEntriesCount = 10000;
const mandatoryCsvHeaders = new Set(['Key', 'Example', 'Source', 'Context']);
const optionalCsvHeaders = new Set(['Game Locations']);
const translatorTypeHeader = ' translator type';

const acceptedCsvMimeTypes = new Set([
  'text/csv',
  'text/x-csv',
  'text/plain',
  'text/comma-separated-values',
  'application/excel',
  'application/vnd.ms-excel',
  'application/csv',
  'application/vnd.msexcel',
]);

const CsvUploadFailureStatusToWarnings: Record<CsvUploadFailureStatus, string> = {
  [CsvUploadFailureStatus.MissingMandatoryHeaders]: 'Description.MissingMandatoryHeaders',
  [CsvUploadFailureStatus.EmptyCSV]: 'Description.EmptyCsv',
  [CsvUploadFailureStatus.FailedToFetchSupportingLanguage]:
    'Description.FailedToFetchSupportedLanguage',
  [CsvUploadFailureStatus.InvalidSupportedLanguage]: 'Description.InvalidSupportedLanguage',
  [CsvUploadFailureStatus.TooManyCsvRows]: 'Description.TooManyRows',
  [CsvUploadFailureStatus.LocalizationTableTooLarge]: 'Description.LocalizationTableTooLarge',
  [CsvUploadFailureStatus.FailedToLoadCurrentTable]: 'Description.FailedToLoadCurrentTable',
  [CsvUploadFailureStatus.AddLanguagesFailure]: 'Description.AddLanguagesFailure',
  [CsvUploadFailureStatus.ModifyTableFailure]: 'Description.UploadFailureMsg',
  [CsvUploadFailureStatus.EntryUpdateFailed]: 'Description.FailedEntryDetails',
  [CsvUploadFailureStatus.DeleteEntryFailed]: 'Description.FailedEntryDetails',
  [CsvUploadFailureStatus.TooManyFiles]: 'Description.TooManyFiles',
  [CsvUploadFailureStatus.FileSizeTooLarge]: 'Description.FileTooLarge',
  [CsvUploadFailureStatus.InvalidFileType]: 'Description.WrongFormat',
};

const CsvUploadProgressTypeToDescription: Record<CsvProgressType, string> = {
  [CsvProgressType.AnalyzingTable]: 'Label.AnalyzingTable',
  [CsvProgressType.Parsing]: 'Label.ParsingFile',
  [CsvProgressType.Uploading]: 'Label.UploadProgress',
  [CsvProgressType.Downloading]: 'Label.PreparingFile',
  [CsvProgressType.ReadyForDownload]: 'Label.FileReady',
  [CsvProgressType.Deleting]: 'Label.DeletingTable',
};

const CsvUploadProgressTypeToDialogTitle: Record<CsvProgressType, string> = {
  [CsvProgressType.AnalyzingTable]: 'Title.LoadingError',
  [CsvProgressType.Parsing]: 'Title.UploadErrors',
  [CsvProgressType.Uploading]: 'Title.UploadErrors',
  [CsvProgressType.Downloading]: 'Title.DownloadError',
  [CsvProgressType.ReadyForDownload]: 'Title.DownloadError',
  [CsvProgressType.Deleting]: 'Title.DeleteTableErrors',
};

export {
  maxCsvFileSizeMB,
  acceptedCsvMimeTypes,
  mandatoryCsvHeaders,
  maxCsvRowCount,
  maxTableEntriesCount,
  translatorTypeHeader,
  CsvUploadFailureStatusToWarnings,
  CsvUploadProgressTypeToDescription,
  CsvUploadProgressTypeToDialogTitle,
  optionalCsvHeaders,
};
