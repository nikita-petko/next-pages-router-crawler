import React, { FunctionComponent, useCallback, useState } from 'react';

import { useTranslation, withTranslation } from '@rbx/intl';
import { Alert, Button, DownloadIcon, Tooltip, useSnackbar } from '@rbx/ui';

import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useMarketplaceFiatServiceProvider } from '@modules/marketplaceFiatService/MarketplaceFiatServiceProvider';
import { saveAs } from 'file-saver';
import { RobloxMarketplaceFiatSharedV1Beta1PurchasePriceFilter as PurchasePriceFilter } from '@rbx/clients/marketplaceFiatService';
import { StoreTableType } from '../constants/StoreTableType';

export type ExportReportProps = {
  storeTableType: StoreTableType;
  endDate?: Date;
  startDate?: Date;
  priceFilter?: PurchasePriceFilter;
};

const ExportReport: FunctionComponent<React.PropsWithChildren<ExportReportProps>> = ({
  startDate,
  storeTableType,
  endDate,
  priceFilter,
}) => {
  const { translate } = useTranslation();
  const { enqueue } = useSnackbar();
  const { fetchPurchaserPaymentsReport, fetchSellerPaymentsReport } =
    useMarketplaceFiatServiceProvider();

  const [isReportDownloadLoading, setIsReportDownloadLoading] = useState<boolean>(false);

  const showError = useCallback(
    (errorText?: string) => {
      enqueue(
        {
          anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
          autoHide: false,
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
    const reportEndpoint =
      storeTableType === StoreTableType.IncomingPayments
        ? fetchSellerPaymentsReport
        : fetchPurchaserPaymentsReport;
    const reportFileName =
      storeTableType === StoreTableType.IncomingPayments ? 'seller' : 'purchaser';
    try {
      const fileBlob = await reportEndpoint(startDate, endDate, priceFilter);
      const date = Date.now();
      saveAs(fileBlob, `${reportFileName}Report_${date.toString()}.csv`);
      setIsReportDownloadLoading(false);
    } catch {
      setIsReportDownloadLoading(false);
      showError(translate('Message.ReportDownloadError'));
    }
  }, [
    endDate,
    fetchPurchaserPaymentsReport,
    fetchSellerPaymentsReport,
    priceFilter,
    showError,
    startDate,
    storeTableType,
    translate,
  ]);

  return (
    <Tooltip arrow placement='bottom' title={translate('Label.DownloadReport')}>
      <Button
        aria-label='export report button'
        data-testid='export-report-button-id'
        disabled={isReportDownloadLoading}
        loading={isReportDownloadLoading}
        onClick={onClick}
        size='small'>
        {/* NOTE: Button Loading icon will replace this icon */}
        {!isReportDownloadLoading && (
          <DownloadIcon color='action' data-testid='export-report-icon-id' />
        )}
      </Button>
    </Tooltip>
  );
};

export default withTranslation(ExportReport, [TranslationNamespace.Transactions]);
