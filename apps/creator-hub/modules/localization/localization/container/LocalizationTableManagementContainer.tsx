import React, { FunctionComponent, useMemo } from 'react';
import { Grid } from '@rbx/ui';
import useEntryInformation from '../../gameStringTranslation/hooks/useEntryInformation';
import LocalizationTablesUploader from '../components/csv/LocalizationTablesUploader';
import LocalizationTablesDownloader from '../components/csv/LocalizationTablesDownloader';
import LocalizationTablesDeleter from '../components/csv/LocalizationTablesDeleter';
import useCsvEntriesMap from '../hooks/useCsvEntriesMap';
import CsvUploadFailureStatus from '../enums/CsvUploadFailureStatus';

const LocalizationTableManagementContainer: FunctionComponent<
  React.PropsWithChildren<unknown>
> = () => {
  const { updateProgress, percentageLoaded, fetchFullEntryTableError, isFetchingFullEntryTable } =
    useEntryInformation();
  const { isParsingMapFromTable } = useCsvEntriesMap();

  const loadTableError = useMemo(() => {
    if (fetchFullEntryTableError) {
      return {
        errorType: CsvUploadFailureStatus.FailedToLoadCurrentTable,
      };
    }
    return null;
  }, [fetchFullEntryTableError]);

  const isLoadingCurrentTable = useMemo(() => {
    return isFetchingFullEntryTable || isParsingMapFromTable;
  }, [isFetchingFullEntryTable, isParsingMapFromTable]);

  // prevents progress from showing >100 if some entries have been added
  // locally after CSV upload but before we make another call
  // to LT client to update table entry count
  const fullTableProgress = useMemo(() => {
    return percentageLoaded > 100 ? 100 : percentageLoaded;
  }, [percentageLoaded]);

  return (
    <Grid>
      <LocalizationTablesUploader
        isLoadingCurrentTable={isLoadingCurrentTable}
        uploadProgress={updateProgress}
        tableLoadProgress={fullTableProgress}
        loadTableError={loadTableError}
      />
      <LocalizationTablesDownloader
        isLoadingCurrentTable={isLoadingCurrentTable}
        downloadProgress={fullTableProgress}
        downloadError={fetchFullEntryTableError}
      />
      <LocalizationTablesDeleter
        isLoadingCurrentTable={isLoadingCurrentTable}
        deleteProgress={updateProgress}
        tableLoadProgress={fullTableProgress}
        loadTableError={loadTableError}
      />
    </Grid>
  );
};

export default LocalizationTableManagementContainer;
