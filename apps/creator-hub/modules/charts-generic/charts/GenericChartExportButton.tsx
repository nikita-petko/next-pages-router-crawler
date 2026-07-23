import React, { useCallback, useMemo } from 'react';
import CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { useTranslation } from '@rbx/intl';
import {
  GetAppOutlinedIcon,
  Grid,
  IconButton,
  InfoOutlinedIcon,
  Tooltip,
  Typography,
  useSnackbar,
} from '@rbx/ui';

import {
  FormattedText,
  useTranslationWrapper,
  translationKeyWithoutNamespace,
  TranslationKey,
  translationKey,
} from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import GenericChartHeaderButton from './GenericChartHeaderButton';
import GenericCsvExporter from './exporters/GenericCsvExporter';
import { useIsInAnalyticsExploreMode } from '../context/AnalyticsExploreModeContext';

const ExportButtonControlContainerForExploreModePage = ({
  tooltip,
  children,
}: {
  tooltip: FormattedText;
  children: React.ReactNode;
}) => {
  return (
    <Tooltip title={tooltip} arrow placement='top'>
      <IconButton aria-label={tooltip} style={{ margin: '0 8px 16px 0' }}>
        {children}
      </IconButton>
    </Tooltip>
  );
};

export const useExportOnClick = ({
  kpiType,
  exporter,
}: {
  kpiType: string;
  exporter: GenericCsvExporter;
}) => {
  const { trackerClient } = useEventTrackerProvider();
  const { translate } = useTranslationWrapper(useTranslation());
  const chartExportErrorMessage = translate(
    translationKeyWithoutNamespace('Description.ChartExportError'),
  );
  const { enqueue, close: closeSnackbar } = useSnackbar();

  const logEvent = useCallback(
    (success: boolean) => {
      trackerClient.sendEvent({
        eventType: CreatorDashboardEventType.ExportKpiChart,
        context: CreatorDashboardContext.Click,
        additionalProperties: {
          KpiType: kpiType,
          ErrorMessage: success ? '' : chartExportErrorMessage,
        },
      });
    },
    [chartExportErrorMessage, kpiType, trackerClient],
  );

  const onError = useCallback(() => {
    enqueue({
      message: (
        <Grid container direction='row' alignItems='center' spacing={1}>
          <InfoOutlinedIcon />
          <Typography>{chartExportErrorMessage}</Typography>
        </Grid>
      ),
      anchorOrigin: { vertical: 'top', horizontal: 'center' },
      autoHideDuration: 5000,
      autoHide: true,
      onClose: closeSnackbar,
    });
    logEvent(false);
  }, [chartExportErrorMessage, closeSnackbar, enqueue, logEvent]);

  const onSuccess = useCallback(() => {
    logEvent(true);
  }, [logEvent]);

  return useCallback(async () => {
    exporter.download({ onError, onSuccess });
  }, [exporter, onError, onSuccess]);
};

export const useDownloadAction = ({
  kpiType,
  exporter,
}: {
  kpiType: string;
  exporter: GenericCsvExporter;
}) => {
  const inExploreMode = useIsInAnalyticsExploreMode();
  const { translate } = useTranslationWrapper(useTranslation());
  const onClick = useExportOnClick({ kpiType, exporter });

  return useMemo(() => {
    if (inExploreMode) return undefined;
    return {
      onClick,
      tooltip: translate(translationKeyWithoutNamespace('Description.ChartExportEnabled')),
    };
  }, [onClick, inExploreMode, translate]);
};

export type TGenericChartExportConfig = {
  link: string;
  definitionTooltipKey?: TranslationKey;
};

const GenericChartExportButton = ({
  kpiType,
  exporter,
  inExploreModePage = false,
  exportButtonConfig,
}: {
  kpiType: string;
  exporter: GenericCsvExporter;
  inExploreModePage?: boolean;
  exportButtonConfig?: TGenericChartExportConfig;
}) => {
  const handleExport = useExportOnClick({ kpiType, exporter });
  const { translate } = useTranslationWrapper(useTranslation());
  const chartExportEnabledTooltip = exportButtonConfig?.definitionTooltipKey
    ? translate(exportButtonConfig.definitionTooltipKey)
    : translate(translationKey('Description.ChartExportEnabled', TranslationNamespace.Analytics));

  const { ButtonContainer, fontSize } = useMemo(() => {
    if (inExploreModePage) {
      return {
        ButtonContainer: ExportButtonControlContainerForExploreModePage,
        fontSize: 'large' as const,
      };
    }
    return {
      ButtonContainer: GenericChartHeaderButton,
      fontSize: undefined,
    };
  }, [inExploreModePage]);

  const handleOnClick = useCallback(() => {
    if (exportButtonConfig?.link) {
      window.location.href = exportButtonConfig.link;
    } else {
      handleExport();
    }
  }, [exportButtonConfig, handleExport]);

  return (
    <ButtonContainer tooltip={chartExportEnabledTooltip}>
      <GetAppOutlinedIcon
        color='action'
        aria-label={chartExportEnabledTooltip}
        onClick={handleOnClick}
        fontSize={fontSize}
        data-testid='chart-export-button'
      />
    </ButtonContainer>
  );
};
export default GenericChartExportButton;
