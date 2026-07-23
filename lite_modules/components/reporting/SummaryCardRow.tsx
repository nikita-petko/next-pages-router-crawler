import { FormHelperText, Grid } from '@rbx/ui';

import SummaryCard from '@components/reporting/SummaryCard';
import useSummaryCardStyles from '@components/reporting/SummaryCard.styles';
import { UNAVAILABLE_VALUE_DISPLAY } from '@constants/displayConstants';
import { TranslationNamespace } from '@constants/localization';
import ReportingStatType from '@constants/reportingStatsConstants';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { GetSummaryCardDisplayValue } from '@utils/reportingStats';

const SummaryCardRow = () => {
  const { translate: translateBilling } = useNamespacedTranslation(TranslationNamespace.Billing);
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: { cardRow, formHelperText },
  } = useSummaryCardStyles();

  const {
    data: summaryStats,
    isError,
    isLoading,
  } = useNewFlowStore((state: NewFlowStoreType) => state.summaryStatsState);

  const usdSpendDisplayValue = GetSummaryCardDisplayValue(
    ReportingStatType.REPORTING_STAT_SPEND,
    summaryStats?.usd_display_spending,
  );
  const adCreditDisplayValue = GetSummaryCardDisplayValue(
    ReportingStatType.REPORTING_STAT_SPEND,
    summaryStats?.ad_credit_display_spending,
  );
  const playtime7dDisplayValue = GetSummaryCardDisplayValue(
    ReportingStatType.REPORTING_STAT_TOTAL_PLAY_TIME_7D,
    summaryStats?.total_play_time_hours_7d,
  );
  // If both are UNAVAILABLE_VALUE_DISPLAY, show no units
  let amountSpentFirstValue = {
    units: '',
    value: <span>{usdSpendDisplayValue}</span>,
  };
  let amountSpentSecondValue;
  const adCreditDisplay = {
    units: translateBilling('Label.AdCredit'),
    value: <span>{adCreditDisplayValue}</span>,
  };
  if (usdSpendDisplayValue !== UNAVAILABLE_VALUE_DISPLAY) {
    amountSpentFirstValue.units = translateReport('Label.USD');
    if (adCreditDisplayValue !== UNAVAILABLE_VALUE_DISPLAY) {
      amountSpentSecondValue = adCreditDisplay;
    }
  } else if (adCreditDisplayValue !== UNAVAILABLE_VALUE_DISPLAY) {
    amountSpentFirstValue = adCreditDisplay;
  }
  const amountSpentCard = (
    <SummaryCard
      firstValue={amountSpentFirstValue}
      isLoading={isLoading}
      secondValue={amountSpentSecondValue}
      title={translateReport('Label.AmountSpent')}
      useSkeletonLoading
    />
  );

  return (
    <Grid container maxWidth='1680px' rowGap='3px'>
      <Grid className={cardRow} container>
        {amountSpentCard}
        <SummaryCard
          firstValue={{
            value: (
              <span>
                {GetSummaryCardDisplayValue(
                  ReportingStatType.REPORTING_STAT_IMPRESSIONS,
                  summaryStats?.impression_count,
                )}
              </span>
            ),
          }}
          isLoading={isLoading}
          title={translateReport('Label.Impressions')}
          useSkeletonLoading
        />
        <SummaryCard
          firstValue={{
            value: (
              <span>
                {GetSummaryCardDisplayValue(
                  ReportingStatType.REPORTING_STAT_PLAYS,
                  summaryStats?.play_count,
                )}
              </span>
            ),
          }}
          isLoading={isLoading}
          title={translateCampaign('Label.Plays')}
          useSkeletonLoading
        />
        <SummaryCard
          firstValue={{
            units:
              playtime7dDisplayValue !== UNAVAILABLE_VALUE_DISPLAY
                ? translateReport('Label.Hours')
                : undefined,
            value: <span>{playtime7dDisplayValue}</span>,
          }}
          isLoading={isLoading}
          title={translateReport('Label.Playtime')}
          useSkeletonLoading
        />
      </Grid>
      {isError && (
        <FormHelperText className={formHelperText} error>
          {translateReport('Description.SummaryDataFailedToFetch')}
        </FormHelperText>
      )}
      {!isError && (
        <FormHelperText className={formHelperText}>
          {translateReport('Description.StatsDelayedUnifiedAttribution')}
        </FormHelperText>
      )}
    </Grid>
  );
};

export default SummaryCardRow;
