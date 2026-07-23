import { useTranslation } from '@rbx/intl';
import { Divider, Grid, Typography } from '@rbx/ui';
import React, { Fragment, FunctionComponent, useEffect, useMemo, useState } from 'react';
import LocalizationTableManagementItem from './LocalizationTableManagementItem';
import LocalizationTableManagementItemStyles from './LocalizationTableManagementItem.styles';
import LocalizationTableProgress from './LocalizationTableProgress';
import CsvProgressType from '../../enums/CsvProgressType';
import useLocalizationTableCsvParser from '../../hooks/useLocalizationTableCsvParser';
import {
  CsvUploadProgressTypeToDescription,
  CsvUploadProgressTypeToDialogTitle,
} from '../../constants/CsvParsingConstants';

export interface LocalizationTablesDownloaderProps {
  isLoadingCurrentTable: boolean;
  downloadProgress: number;
  downloadError: Error | null;
}

const LocalizationTablesDownloader: FunctionComponent<
  React.PropsWithChildren<LocalizationTablesDownloaderProps>
> = ({ isLoadingCurrentTable, downloadProgress, downloadError }) => {
  const { translate } = useTranslation();
  const { downloadCsvFile } = useLocalizationTableCsvParser();
  const [isDownloadRequested, setIsDownloadRequested] = useState<boolean>(false);
  const {
    classes: { divider },
  } = LocalizationTableManagementItemStyles();
  const [showDownloadProgressBar, setShowDownloadProgressBar] = useState<boolean>(false);

  const downloadProgressType = useMemo(() => {
    return downloadProgress < 100 ? CsvProgressType.Downloading : CsvProgressType.ReadyForDownload;
  }, [downloadProgress]);

  const downloadProgressTitle = useMemo(() => {
    return translate(CsvUploadProgressTypeToDescription[downloadProgressType]);
  }, [downloadProgressType]);

  const downloadDialogTitle = useMemo(() => {
    return translate(CsvUploadProgressTypeToDialogTitle[downloadProgressType]);
  }, [downloadProgressType]);

  const downloadDialogContent = (
    <Typography variant='captionBody' style={{ whiteSpace: 'pre-line' }}>
      {`${translate('Description.FailedToLoadCurrentTable')} \n`}
    </Typography>
  );

  const downloadButtonText = (
    <Typography variant='captionBody'>{translate('Description.DownloadCsv')}</Typography>
  );

  const handleClickDownload = () => {
    setShowDownloadProgressBar(true);
    setIsDownloadRequested(true);
  };

  useEffect(() => {
    if (!isLoadingCurrentTable && downloadProgress > 0 && !downloadError && isDownloadRequested) {
      downloadCsvFile();
      setIsDownloadRequested(false);
    }
  }, [isLoadingCurrentTable, downloadProgress, downloadError, isDownloadRequested]);

  return (
    <Grid>
      <LocalizationTableManagementItem
        buttonText={translate('Label.DownloadCsv')}
        infoText={downloadButtonText}
        ariaLabel='download-csv'
        isButtonDestructive={false}
        onClick={handleClickDownload}
      />
      {showDownloadProgressBar && (
        <LocalizationTableProgress
          progress={downloadProgress}
          progressType={downloadProgressType}
          progressTitle={downloadProgressTitle}
          errorDialogTitle={downloadDialogTitle}
          errorDialogContent={downloadDialogContent}
          shouldShowErrors={downloadError !== null}
        />
      )}
      <Divider className={divider} />
    </Grid>
  );
};

export default LocalizationTablesDownloader;
