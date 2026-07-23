import { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { downloadBlob } from '@rbx/core';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { DownloadIcon, Grid, InfoOutlinedIcon, Typography, useSnackbar } from '@rbx/ui';
import { isIpLicensingEarningsEnabled } from '@generated/flags/contentLicensing';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import type { AnnotationType } from '@modules/clients/analytics';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import contentLicensingClient from '@modules/clients/contentLicensing';
import {
  ChartActionsProvider,
  type ChartActionsPolicy,
} from '@modules/experience-analytics-shared/components/RAQIV2/ChartActionsContext';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import getCreatorAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getCreatorAnalyticsPageLayout';
import type {
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsEmbeddedSurfaceConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { CreatorAnalyticsPageMode } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import useCurrentAccount from '@modules/ip/rights/hooks/useCurrentAccount';
import { PageLoading } from '@modules/miscellaneous/components';
import { PageNotFound } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { tabbedChartConfigIphEarnings } from './chartConfigs';
import IphGatewayInterceptor from './IphGatewayInterceptor';
import { tableConfigIphEarnings } from './tableConfigs';

const surfaceAnnotationOptions: {
  supportedAnnotationTypes: AnnotationType[];
  defaultAnnotationTypes: AnnotationType[];
  showAnnotationsControl: boolean;
} = {
  supportedAnnotationTypes: [],
  defaultAnnotationTypes: [],
  showAnnotationsControl: false,
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Syncs the layout's current date range into a ref owned by the parent page.
// Runs inside the layout's analytics context where useAnalyticsCurrentDateRangeBundle is available.
const DateRangeSync: FC<{ onSync: (startDate: Date, endDate: Date) => void }> = ({ onSync }) => {
  const { startDate, endDate } = useAnalyticsCurrentDateRangeBundle();
  useEffect(() => {
    onSync(startDate, endDate);
  }, [startDate, endDate, onSync]);
  return null;
};

/**
 * Analytics page for IP holders (IPHs) to view and export earnings data for their
 * licensed IP across all Roblox experiences. Gated by the isIpLicensingEarningsEnabled
 * flag — only accessible to onboarded rights holders.
 */
const IpLicensingEarningsPage = () => {
  const { ready: isFlagReady, value: isEnabled } = useFlag(isIpLicensingEarningsEnabled);
  const { account, isPending: isAccountPending } = useCurrentAccount();
  const [isDownloading, setIsDownloading] = useState(false);
  const dateRangeRef = useRef<{ startDate: Date; endDate: Date } | null>(null);
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { enqueue: enqueueSnackbar, close: closeSnackbar } = useSnackbar();

  const accountId = account?.id;
  const isDisabled = isAccountPending || !accountId || isDownloading;

  const handleDownload = useCallback(async () => {
    if (!accountId || !dateRangeRef.current) {
      return;
    }
    setIsDownloading(true);
    try {
      const { startDate, endDate } = dateRangeRef.current;
      const start = formatDate(startDate);
      const end = formatDate(endDate);
      const blob = await contentLicensingClient.exportEarnings(accountId, start, end);
      downloadBlob(blob, `earnings_${accountId}_${start}_${end}.xlsx`);
    } catch {
      enqueueSnackbar({
        message: (
          <Grid container direction='row' alignItems='center' spacing={1}>
            <InfoOutlinedIcon />
            <Typography>
              {tPendingTranslation(
                'Failed to download earnings report. Please try again.',
                'Error shown when the earnings CSV download fails',
                translationKey('Message.DownloadEarningsFailed', TranslationNamespace.Analytics),
              )}
            </Typography>
          </Grid>
        ),
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 5000,
        autoHide: true,
        onClose: closeSnackbar,
      });
    } finally {
      setIsDownloading(false);
    }
  }, [accountId, closeSnackbar, enqueueSnackbar, tPendingTranslation]);

  const downloadAction = useMemo(
    () => ({
      id: 'download-earnings',
      kind: 'button' as const,
      label: tPendingTranslation(
        'Download earnings',
        'Aria label for download earnings button',
        translationKey('Action.DownloadEarnings', TranslationNamespace.Analytics),
      ),
      onClick: handleDownload,
      icon: <DownloadIcon fontSize='small' />,
      disabled: isDisabled,
      testId: 'download-earnings-button',
    }),
    [handleDownload, isDisabled, tPendingTranslation],
  );

  const chartActionsPolicy: ChartActionsPolicy = useMemo(
    () => ({ actions: [downloadAction] }),
    [downloadAction],
  );

  const handleDateSync = useCallback((startDate: Date, endDate: Date) => {
    dateRangeRef.current = { startDate, endDate };
  }, []);

  const dateSyncConfig: ArbitraryComponentConfig = useMemo(
    () => ({
      type: AnalyticsComponentType.NonGeneric,
      metrics: [],
      renderer: {
        type: 'isolated',
        render: () => <DateRangeSync onSync={handleDateSync} />,
      },
    }),
    [handleDateSync],
  );

  const config: CreatorAnalyticsEmbeddedSurfaceConfig = useMemo(
    () => ({
      mode: CreatorAnalyticsPageMode.Embedded,
      resourceTypes: [RAQIV2ChartResourceType.User],
      granularity: {
        options: [RAQIV2MetricGranularity.OneWeek, RAQIV2MetricGranularity.OneMonth],
      },
      breakdownDimensions: [
        RAQIV2Dimension.IpFamilyName,
        RAQIV2Dimension.LicenseName,
        RAQIV2Dimension.EarningsType,
      ],
      defaultBreakdown: [RAQIV2Dimension.EarningsType],
      filterDimensions: [
        RAQIV2Dimension.IpFamilyName,
        RAQIV2Dimension.LicenseName,
        RAQIV2Dimension.EarningsType,
      ],
      timeRangeOptions: {
        type: 'dateRange',
        supportedRanges: [
          RAQIV2DateRangeType.Last28Days,
          RAQIV2DateRangeType.Last90Days,
          RAQIV2DateRangeType.Last365Days,
          RAQIV2DateRangeType.Custom,
        ],
        defaultRange: RAQIV2DateRangeType.Last90Days,
      } as const satisfies AnalyticsPageConfigDateOptions,
      surfaceAnnotationOptions,
      body: [
        {
          type: RAQIV2SpecialLayoutType.FullWidthLayout,
          items: [tabbedChartConfigIphEarnings],
        },
        {
          type: RAQIV2SpecialLayoutType.FullWidthLayout,
          items: [tableConfigIphEarnings],
        },
        dateSyncConfig,
      ],
    }),
    [dateSyncConfig],
  );

  if (!isFlagReady) {
    return <PageLoading />;
  }

  if (!isEnabled) {
    return <PageNotFound />;
  }

  return getCreatorAnalyticsPageLayout(
    <IphGatewayInterceptor>
      <ChartActionsProvider value={chartActionsPolicy}>
        <CreatorAnalyticsLayout config={config} />
      </ChartActionsProvider>
    </IphGatewayInterceptor>,
  );
};

export default IpLicensingEarningsPage;
