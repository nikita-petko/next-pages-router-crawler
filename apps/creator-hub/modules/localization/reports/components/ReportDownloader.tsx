import { Button, Grid, ReportProblemOutlinedIcon, Typography } from '@rbx/ui';
import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  gameInternationalizationClient,
  TranslationAnalyticsMetadataResponse,
  RequestReportType,
  DownloadReportType,
  ReportStatus,
  ErrorType,
  getErrorStatus,
} from '@modules/clients';
import { useTranslation, useLocalization, Locale } from '@rbx/intl';
import { downloadBlob } from '@rbx/core';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { downloadContributorReportEventModel } from '@modules/eventStream/constants/eventConstants';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { getResponseFromError } from '@modules/clients/utils';
import DateRangeSelector from './DateRangeSelector';
import getDateRange from '../utils/getDateRange';
import useReportDownloaderStyles from './ReportDownloader.styles';
import getReportFileName from '../utils/getReportFileName';
import { DateRange } from '../types';
import defaultRequestPollingIntervalSeconds from '../constants';
import DownloadState from '../enums/DownloadState';
import ReportType from '../enums/ReportType';

export interface ReportDownloaderProps {
  gameId: number;
  reportType: ReportType;
  reportTypeTargetId: number;
  translatorName?: string | null;
}

const ReportDownloader: FunctionComponent<React.PropsWithChildren<ReportDownloaderProps>> = ({
  gameId,
  reportType,
  reportTypeTargetId,
  translatorName,
}) => {
  const { trackerClient } = useEventTrackerProvider();
  const {
    classes: { descriptionText, downloadButton, errorText, translatorText },
  } = useReportDownloaderStyles();
  const [metaData, setMetaData] = useState<TranslationAnalyticsMetadataResponse>();
  const [downloadState, setDownloadState] = useState<DownloadState>(DownloadState.Idle);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | null>(null);
  const [downloadDisabled, setDownloadDisabled] = useState<boolean>(true);
  const [downloadLoading, setDownloadLoading] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<Error | null>(null);
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const { error } = useMetricsMonitoring();

  const getMetaDataInfo = useCallback(async () => {
    const getMetaData = await gameInternationalizationClient.getTranslationAnalyticsMetadata();
    setMetaData(getMetaData);
  }, []);

  useEffect(() => {
    getMetaDataInfo();
  }, [getMetaDataInfo]);

  const reportTypeForRequest = useMemo(() => {
    if (reportType === ReportType.GameTranslationStatus) {
      return RequestReportType.GameTranslationStatus;
    }
    if (reportType === ReportType.GameTranslationStatusForTranslator) {
      return RequestReportType.GameTranslationStatusForTranslator;
    }
    return RequestReportType.GameTranslationStatusForTranslatorGroup;
  }, [reportType]);

  const reportTypeForDownload = useMemo(() => {
    if (reportType === ReportType.GameTranslationStatus) {
      return DownloadReportType.GameTranslationStatus;
    }
    if (reportType === ReportType.GameTranslationStatusForTranslator) {
      return DownloadReportType.GameTranslationStatusForTranslator;
    }
    return DownloadReportType.GameTranslationStatusForTranslatorGroup;
  }, [reportType]);

  const requestPollingIntervalSeconds = useMemo(() => {
    if (!metaData?.reportRequestPollingIntervalSeconds) {
      return defaultRequestPollingIntervalSeconds;
    }
    return metaData.reportRequestPollingIntervalSeconds;
  }, [metaData]);

  const dateRangeSpan = useMemo(() => {
    const startDate = metaData?.minimumDateTimeForAnalyticsReport
      ? new Date(metaData.minimumDateTimeForAnalyticsReport)
      : new Date();
    return getDateRange(startDate, new Date(), locale ?? Locale.English);
  }, [metaData, locale]);

  const handleSelectDateRange = useCallback((dateRangeValue: DateRange) => {
    setDownloadDisabled(false);
    setSelectedDateRange(dateRangeValue);
  }, []);

  const handleClickDownload = useCallback(() => {
    setDownloadLoading(true);
    setDownloadError(null);
    setDownloadState(DownloadState.Preparing);
  }, []);

  const clearIntervalIfNotNull = (timerHandle: NodeJS.Timeout | null) => {
    if (timerHandle !== null) {
      clearInterval(timerHandle);
    }
    return timerHandle === null;
  };

  const requestReport = useCallback(() => {
    return gameInternationalizationClient.requestTranslationAnalyticsReport({
      gameId,
      request: {
        startDateTime: selectedDateRange?.startDate,
        endDateTime: selectedDateRange?.endDate,
        reportType: reportTypeForRequest,
        reportSubjectTargetId: reportTypeTargetId,
      },
    });
  }, [
    gameId,
    selectedDateRange?.startDate,
    selectedDateRange?.endDate,
    reportTypeForRequest,
    reportTypeTargetId,
  ]);

  const initiateDownload = useCallback(async () => {
    try {
      if (typeof reportTypeTargetId === 'undefined') {
        throw new Error('Report type id is undefined');
      }
      const cvsBlob = await gameInternationalizationClient.downloadTranslationAnalyticsReport({
        gameId,
        startDateTime: selectedDateRange?.startDate ?? new Date(),
        endDateTime: selectedDateRange?.endDate ?? new Date(),
        reportType: reportTypeForDownload,
        reportSubjectTargetId: reportTypeTargetId,
      });
      downloadBlob(cvsBlob, getReportFileName(gameId, selectedDateRange?.id ?? ''));
      trackerClient.sendEvent(
        downloadContributorReportEventModel(
          gameId,
          selectedDateRange?.startDate ?? new Date(),
          selectedDateRange?.endDate ?? new Date(),
          reportTypeForDownload,
          reportTypeTargetId,
          200,
        ),
      );
    } catch (e) {
      const catchedError = e as Error;
      error(catchedError.message);
      setDownloadError(catchedError);
      const errorStatus = getErrorStatus(e, 500);
      trackerClient.sendEvent(
        downloadContributorReportEventModel(
          gameId,
          selectedDateRange?.startDate ?? new Date(),
          selectedDateRange?.endDate ?? new Date(),
          reportTypeForDownload,
          reportTypeTargetId,
          errorStatus,
        ),
      );
    } finally {
      setDownloadLoading(false);
    }
  }, [
    gameId,
    selectedDateRange?.startDate,
    selectedDateRange?.endDate,
    selectedDateRange?.id,
    reportTypeForDownload,
    reportTypeTargetId,
    trackerClient,
    error,
  ]);

  // Ask for report status every interval, begin download when report is ready
  useEffect(() => {
    let timerHandle: NodeJS.Timeout | null = null;
    let isTimerHandleNull = false;
    if (downloadState === DownloadState.Preparing) {
      timerHandle = setInterval(async () => {
        try {
          const response = await requestReport();
          if (response && response.reportGenerationStatus === ReportStatus.Ready) {
            initiateDownload();
            setDownloadState(DownloadState.Done);
            isTimerHandleNull = clearIntervalIfNotNull(timerHandle);
          }
        } catch (e) {
          const errorRes = getResponseFromError(e);
          const catchedError = e as Error;
          error(catchedError.message);
          const errorResponse = (await errorRes?.json()) as ErrorType;
          if (errorResponse.errors.length > 0 && errorResponse.errors[0].code !== 503) {
            setDownloadError(catchedError);
            setDownloadLoading(false);
            setDownloadState(DownloadState.Idle);
            isTimerHandleNull = clearIntervalIfNotNull(timerHandle);
          }
        } finally {
          if (isTimerHandleNull) {
            timerHandle = null;
          }
        }
      }, requestPollingIntervalSeconds * 1000);
    }
    return () => {
      if (clearIntervalIfNotNull(timerHandle)) {
        timerHandle = null;
      }
    };
  }, [downloadState, initiateDownload, requestReport, requestPollingIntervalSeconds, error]);

  return (
    <Grid container direction='column'>
      <Typography className={descriptionText} variant='subtitle1'>
        {translate('Title.DownloadReport')}
      </Typography>
      {translatorName && (
        <Typography className={translatorText} variant='subtitle2'>
          {translate('Label.Translator')}: {translatorName}
        </Typography>
      )}
      <Grid container direction='column' XSmall={3}>
        <DateRangeSelector
          value={selectedDateRange?.id ?? ''}
          dateRangeSpan={dateRangeSpan}
          onSelectDateRange={handleSelectDateRange}
        />
        <Button
          className={downloadButton}
          variant='contained'
          disabled={downloadDisabled}
          loading={downloadLoading}
          onClick={handleClickDownload}>
          {translate('Action.Download')}
        </Button>
      </Grid>
      {downloadError && (
        <Grid container alignItems='center'>
          <ReportProblemOutlinedIcon fontSize='small' />
          <Typography className={errorText} variant='footer'>
            {translate('Message.DownloadReportError')}
          </Typography>
        </Grid>
      )}
    </Grid>
  );
};

export default ReportDownloader;
