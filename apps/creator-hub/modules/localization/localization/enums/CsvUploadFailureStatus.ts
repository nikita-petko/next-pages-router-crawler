enum CsvUploadFailureStatus {
  MissingMandatoryHeaders,
  EmptyCSV,
  FailedToFetchSupportingLanguage,
  InvalidSupportedLanguage,
  TooManyCsvRows,
  LocalizationTableTooLarge,
  FailedToLoadCurrentTable,
  AddLanguagesFailure,
  ModifyTableFailure,
  EntryUpdateFailed,
  DeleteEntryFailed,
  TooManyFiles,
  FileSizeTooLarge,
  InvalidFileType,
}

export default CsvUploadFailureStatus;
