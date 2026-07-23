import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { saveAs } from 'file-saver';
import { ReviewCategoryTypeFromJSON } from '@rbx/client-player-generated-reviews-service/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Alert, Button, DownloadIcon, Tooltip, useSnackbar } from '@rbx/ui';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { downloadAssetReviews } from '@modules/react-query/playerFeedback/playerFeedbackRequests';
import { CategoryType } from './constants/PlayerFeedbackTableConfigs';
import useTableExportButtonStyles from './TableExportButton.styles';

export type ExportReportProps = {
  rootPlaceId: number;
  pageSize?: number;
  startDate?: Date;
  endDate?: Date;
  categoryType?: CategoryType;
  deviceType?: Array<string>;
  operatingSystemType?: Array<string>;
};

const ExportReport: FunctionComponent<React.PropsWithChildren<ExportReportProps>> = ({
  rootPlaceId,
  pageSize,
  startDate,
  endDate,
  categoryType,
  deviceType,
  operatingSystemType,
}) => {
  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { enqueue } = useSnackbar();
  const {
    classes: { button },
  } = useTableExportButtonStyles();

  const [isReportDownloadLoading, setIsReportDownloadLoading] = useState<boolean>(false);

  const showError = useCallback(
    (errorText?: string) => {
      enqueue(
        {
          anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
          autoHide: true,
          children: (
            <Alert severity='error'>{errorText ?? translate('Response.UnknownError')}</Alert>
          ),
        },
        (reason) => reason === 'timeout',
      );
    },
    [enqueue, translate],
  );

  const onClick = useCallback(async () => {
    setIsReportDownloadLoading(true);
    try {
      // Track the download event
      unifiedLogger.logClickEvent({
        eventName: CreatorDashboardEventType.DownloadPlayerFeedbackCommentsClick,
        parameters: {
          assetId: rootPlaceId.toString(),
          startTime: startDate ? startDate.toISOString() : '',
          endTime: endDate ? endDate.toISOString() : '',
        },
      });

      const fileBlob = await downloadAssetReviews({
        assetId: rootPlaceId,
        limit: pageSize,
        startTime: startDate ? startDate.toISOString() : undefined,
        endTime: endDate ? endDate.toISOString() : undefined,
        // ReviewCategoryTypeFromJSON preserves the wire value without using an unsafe cast.
        categoryType:
          categoryType === CategoryType.All ? undefined : ReviewCategoryTypeFromJSON(categoryType),
        deviceType: deviceType && deviceType?.length > 0 ? deviceType : undefined,
        operatingSystemType:
          operatingSystemType && operatingSystemType?.length > 0 ? operatingSystemType : undefined,
      });
      saveAs(fileBlob, `Report_${Date.now().toString()}.csv`);
      setIsReportDownloadLoading(false);
    } catch {
      setIsReportDownloadLoading(false);
      showError(translate('Message.ReportDownloadError'));
    }
  }, [
    rootPlaceId,
    pageSize,
    categoryType,
    startDate,
    endDate,
    showError,
    translate,
    unifiedLogger,
    deviceType,
    operatingSystemType,
  ]);

  return (
    <Tooltip arrow placement='bottom' title={translate('Description.ChartExportEnabled')}>
      <Button
        aria-label='export report button'
        data-testid='export-report-button-id'
        disabled={isReportDownloadLoading}
        loading={isReportDownloadLoading}
        onClick={onClick}
        className={button}
        color='secondary'
        variant='contained'
        size='small'>
        {/* NOTE: Button Loading icon will replace this icon */}
        {!isReportDownloadLoading && (
          <DownloadIcon fontSize='small' data-testid='export-report-icon-id' />
        )}
      </Button>
    </Tooltip>
  );
};

export default withTranslation(ExportReport, [
  TranslationNamespace.PlayerFeedback,
  TranslationNamespace.Analytics,
]);
