import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@rbx/foundation-ui';
import { type ReactElement } from 'react';

import styles from '@components/adIntegrations/dialogs/RevenueShareBreakdownDialog.module.css';
import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import UniverseFilterAvatar from '@components/common/UniverseFilterAvatar';
import { TranslationNamespace } from '@constants/localization';
import { PerUniverseRevenueShareEstimate } from '@hooks/adIntegrations/useMultiRevenueShareEstimatePreview';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { ThumbnailStoreType, useThumbnailStore } from '@stores/thumbnailStoreProvider';
import {
  formatMicroUsdToUsdDisplay,
  POST_TIER_CPTV_MICRO_USD,
  REVENUE_SHARE_BILLING_TIER_DAYS,
} from '@utils/revenueShareEstimate';

const EMPTY_VALUE_PLACEHOLDER = '--';

interface RevenueShareBreakdownDialogProps extends BaseInjectedDialogProps {
  billableDays: number;
  estimates: PerUniverseRevenueShareEstimate[];
  totalAvgDailyVisits?: number;
  totalMaxRevenueShareMicroUsd?: number;
  totalWeightedCptvMicroUsd?: number;
  universeNameById: Record<number, string>;
}

const formatVisits = (visits?: number): string =>
  visits === undefined ? EMPTY_VALUE_PLACEHOLDER : visits.toLocaleString('en-US');

const formatCurrency = (microUsd?: number): string =>
  microUsd === undefined ? EMPTY_VALUE_PLACEHOLDER : formatMicroUsdToUsdDisplay(microUsd);

const RevenueShareBreakdownDialog = ({
  billableDays,
  estimates,
  onClose,
  totalAvgDailyVisits,
  totalMaxRevenueShareMicroUsd,
  totalWeightedCptvMicroUsd,
  universeNameById,
}: RevenueShareBreakdownDialogProps): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { translate: translateCreativeLibrary } = useNamespacedTranslation(
    TranslationNamespace.CreativeLibrary,
  );
  const { translate: translateForecast } = useNamespacedTranslation(TranslationNamespace.Forecast);
  const thumbnailsByUniverseId = useThumbnailStore(
    (state: ThumbnailStoreType) => state.thumbnailsByUniverseId,
  );
  const duration = translate(
    billableDays === 1
      ? 'Label.RevenueShareCampaignDurationDay'
      : 'Label.RevenueShareCampaignDurationDays',
    { days: billableDays.toString() },
  );

  return (
    <BaseDialog
      dialogBody={
        <div className='scroll-x'>
          <Table className={styles.table} size='XSmall' variant='Framed'>
            <TableHeader>
              <TableRow>
                <TableHeaderCell className={`width-[25%] ${styles.headerCell}`}>
                  {translateCreativeLibrary('Label.Game')}
                </TableHeaderCell>
                <TableHeaderCell className={`width-[25%] ${styles.headerCell}`}>
                  {translate('Label.RevenueShareCost')}
                </TableHeaderCell>
                <TableHeaderCell className={`width-[25%] ${styles.headerCell}`}>
                  {translate('Label.RevenueShareAvgDailyVisits')}
                </TableHeaderCell>
                <TableHeaderCell className={`width-[25%] ${styles.headerCell}`}>
                  {translate('Label.RevenueShareAvgWeightedCptv')}
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estimates.map((estimate, index) => {
                const universeName =
                  universeNameById[estimate.universeId] ?? estimate.universeId.toString();
                const isLastEstimate = index === estimates.length - 1;
                const cellClassName = isLastEstimate
                  ? `${styles.bodyCell} ${styles.lastEstimateCell}`
                  : styles.bodyCell;

                return (
                  <TableRow key={estimate.universeId}>
                    <TableCell className={cellClassName}>
                      <div className='flex width-full min-width-0 items-center gap-small'>
                        <span className='flex shrink-0'>
                          <UniverseFilterAvatar
                            src={thumbnailsByUniverseId[estimate.universeId]?.data?.imageUrl}
                          />
                        </span>
                        <span
                          className='min-width-0 fill text-body-small text-no-wrap text-truncate-end'
                          title={universeName}>
                          {universeName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={cellClassName}>
                      {formatCurrency(estimate.maxRevenueShareMicroUsd)}
                    </TableCell>
                    <TableCell className={cellClassName}>
                      {formatVisits(estimate.avgDailyVisits)}
                    </TableCell>
                    <TableCell className={cellClassName}>
                      {formatCurrency(estimate.weightedCptvMicroUsd)}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell className={styles.bodyCell}>
                  <span className='text-label-medium'>
                    {translateForecast('Label.PeriodTotal')}
                  </span>
                </TableCell>
                <TableCell className={styles.bodyCell}>
                  {formatCurrency(totalMaxRevenueShareMicroUsd)}
                </TableCell>
                <TableCell className={styles.bodyCell}>
                  {formatVisits(totalAvgDailyVisits)}
                </TableCell>
                <TableCell className={styles.bodyCell}>
                  {formatCurrency(totalWeightedCptvMicroUsd)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      }
      dialogDescription={translate('Description.RevenueShareBreakdownDuration', {
        billingPeriod: REVENUE_SHARE_BILLING_TIER_DAYS.toString(),
        cptvFee: formatMicroUsdToUsdDisplay(POST_TIER_CPTV_MICRO_USD),
        duration,
      })}
      dialogFooter={
        <Button onClick={onClose} size='Medium' variant='Standard'>
          {translate('Action.Close')}
        </Button>
      }
      dialogTitle={translate('Heading.RevenueShareBreakdown')}
    />
  );
};

interface OpenRevenueShareBreakdownDialogParams {
  billableDays: number;
  estimates: PerUniverseRevenueShareEstimate[];
  totalAvgDailyVisits?: number;
  totalMaxRevenueShareMicroUsd?: number;
  totalWeightedCptvMicroUsd?: number;
  universeNameById: Record<number, string>;
}

export const openRevenueShareBreakdownDialog = (
  props: OpenRevenueShareBreakdownDialogParams,
): void => {
  openDialog({
    component: RevenueShareBreakdownDialog,
    options: { size: 'Large' },
    props,
  });
};

export default RevenueShareBreakdownDialog;
