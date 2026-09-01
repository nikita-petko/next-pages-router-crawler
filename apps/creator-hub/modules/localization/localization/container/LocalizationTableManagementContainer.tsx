import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { Grid } from '@rbx/ui';
import useEntryInformation from '../../gameStringTranslation/hooks/useEntryInformation';
import LocalizationTablesDeleter from '../components/csv/LocalizationTablesDeleter';
import LocalizationTablesDownloader from '../components/csv/LocalizationTablesDownloader';
import LocalizationTablesUploader from '../components/csv/LocalizationTablesUploader';
import CsvUploadFailureStatus from '../enums/CsvUploadFailureStatus';
import useCsvEntriesMap from '../hooks/useCsvEntriesMap';

const LocalizationTableManagementContainer: FunctionComponent<React.PropsWithChildren> = () => {
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
    return Math.min(100, percentageLoaded);
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
