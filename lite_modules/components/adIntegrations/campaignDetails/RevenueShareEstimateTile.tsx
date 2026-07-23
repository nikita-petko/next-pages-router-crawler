import { Link } from '@rbx/foundation-ui';
import { Alert } from '@rbx/ui';
import { ReactElement } from 'react';

import useRevenueShareEstimateTileStyles from '@components/adIntegrations/campaignDetails/RevenueShareEstimateTile.styles';
import InfoTooltip from '@components/reporting/InfoTooltip';
import { AdIntegrationRevenueShareDocsUrl } from '@constants/adIntegrationsUrls';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { formatMicroUsdToUsdDisplay } from '@utils/revenueShareEstimate';

const EMPTY_VALUE_PLACEHOLDER = '--';

interface RevenueShareEstimateTileProps {
  avgDailyVisits?: number;
  billableDays?: number;
  isError: boolean;
  maxRevenueShareMicroUsd?: number;
  weightedCptvMicroUsd?: number;
}

const RevenueShareEstimateTile = ({
  avgDailyVisits,
  billableDays,
  isError,
  maxRevenueShareMicroUsd,
  weightedCptvMicroUsd,
}: RevenueShareEstimateTileProps): ReactElement => {
  const { translate, translateHTML } = useNamespacedTranslation(TranslationNamespace.Misc);
  const {
    classes: {
      card,
      cardDescription,
      cardLabel,
      cardLabelRow,
      cardValue,
      container,
      description,
      errorText,
      header,
      heading,
      metric,
      metricsRow,
    },
  } = useRevenueShareEstimateTileStyles();

  const costValue =
    maxRevenueShareMicroUsd !== undefined
      ? formatMicroUsdToUsdDisplay(maxRevenueShareMicroUsd)
      : EMPTY_VALUE_PLACEHOLDER;
  const durationValue =
    billableDays !== undefined && billableDays > 0
      ? translate(
          // @rbx/intl only does plain {var} substitution (no ICU plural), so
          // pick the singular/plural key explicitly based on the day count.
          billableDays === 1
            ? 'Label.RevenueShareCampaignDurationDay'
            : 'Label.RevenueShareCampaignDurationDays',
          { days: billableDays.toString() },
        )
      : EMPTY_VALUE_PLACEHOLDER;
  const avgDailyVisitsValue =
    avgDailyVisits !== undefined ? avgDailyVisits.toLocaleString('en-US') : EMPTY_VALUE_PLACEHOLDER;
  const weightedCptvValue =
    weightedCptvMicroUsd !== undefined
      ? formatMicroUsdToUsdDisplay(weightedCptvMicroUsd)
      : EMPTY_VALUE_PLACEHOLDER;

  return (
    <div className={container}>
      <div className={header}>
        <span className={`text-heading-small ${heading}`}>
          {translate('Heading.RevenueShareForecast')}
        </span>
        <Alert severity='warning'>{translate('Message.RevenueShareForecastEffectiveDate')}</Alert>
        <span className={`text-body-medium ${description}`}>
          {translateHTML('Description.RevenueShareForecast', [
            {
              closing: 'linkEnd',
              content: (chunks) => (
                <Link
                  href={AdIntegrationRevenueShareDocsUrl}
                  rel='noopener noreferrer'
                  target='_blank'
                  underline='always'>
                  {chunks}
                </Link>
              ),
              opening: 'linkStart',
            },
          ])}
        </span>
        {isError && (
          <span className={`text-body-medium ${errorText}`}>
            {translate('Message.RevenueShareEstimateError')}
          </span>
        )}
      </div>
      <div className={card}>
        <div className={cardLabelRow}>
          <span className={`text-body-large ${cardLabel}`}>
            {translate('Label.RevenueShareCost')}
          </span>
          <InfoTooltip placement='top' text={translate('Description.RevenueShareCostTooltip')} />
        </div>
        <span className={`text-heading-medium ${cardValue}`}>{costValue}</span>
        <span className={`text-body-medium ${cardDescription}`}>
          {translate('Description.RevenueShareCost')}
        </span>
      </div>
      <div className={card}>
        <span className={`text-body-large ${cardLabel}`}>
          {translate('Label.RevenueShareCampaignDuration')}
        </span>
        <span className={`text-heading-medium ${cardValue}`}>{durationValue}</span>
        <span className={`text-body-medium ${cardDescription}`}>
          {translate('Description.RevenueShareCampaignDuration')}
        </span>
      </div>
      <div className={metricsRow}>
        <div className={metric}>
          <span className={`text-body-large ${cardLabel}`}>
            {translate('Label.RevenueShareAvgDailyVisits')}
          </span>
          <span className={`text-heading-small ${cardValue}`}>{avgDailyVisitsValue}</span>
          <span className={`text-body-medium ${cardDescription}`}>
            {translate('Description.RevenueShareAvgDailyVisits')}
          </span>
        </div>
        <div className={metric}>
          <span className={`text-body-large ${cardLabel}`}>
            {translate('Label.RevenueShareWeightedCptv')}
          </span>
          <span className={`text-heading-small ${cardValue}`}>{weightedCptvValue}</span>
          <span className={`text-body-medium ${cardDescription}`}>
            {translate('Description.RevenueShareWeightedCptv')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RevenueShareEstimateTile;
