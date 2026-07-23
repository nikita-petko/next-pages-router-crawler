import { Link } from '@rbx/foundation-ui';
import { Alert, Typography } from '@rbx/ui';
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
        <Typography className={heading} variant='h5'>
          {translate('Heading.RevenueShareForecast')}
        </Typography>
        <Alert severity='warning'>{translate('Message.RevenueShareForecastEffectiveDate')}</Alert>
        <Typography className={description} variant='body2'>
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
        </Typography>
        {isError && (
          <Typography className={errorText} variant='body2'>
            {translate('Message.RevenueShareEstimateError')}
          </Typography>
        )}
      </div>

      <div className={card}>
        <div className={cardLabelRow}>
          <Typography className={cardLabel} variant='body1'>
            {translate('Label.RevenueShareCost')}
          </Typography>
          <InfoTooltip placement='top' text={translate('Description.RevenueShareCostTooltip')} />
        </div>
        <Typography className={cardValue} variant='h4'>
          {costValue}
        </Typography>
        <Typography className={cardDescription} variant='body2'>
          {translate('Description.RevenueShareCost')}
        </Typography>
      </div>

      <div className={card}>
        <Typography className={cardLabel} variant='body1'>
          {translate('Label.RevenueShareCampaignDuration')}
        </Typography>
        <Typography className={cardValue} variant='h4'>
          {durationValue}
        </Typography>
        <Typography className={cardDescription} variant='body2'>
          {translate('Description.RevenueShareCampaignDuration')}
        </Typography>
      </div>

      <div className={metricsRow}>
        <div className={metric}>
          <Typography className={cardLabel} variant='body1'>
            {translate('Label.RevenueShareAvgDailyVisits')}
          </Typography>
          <Typography className={cardValue} variant='h5'>
            {avgDailyVisitsValue}
          </Typography>
          <Typography className={cardDescription} variant='body2'>
            {translate('Description.RevenueShareAvgDailyVisits')}
          </Typography>
        </div>
        <div className={metric}>
          <Typography className={cardLabel} variant='body1'>
            {translate('Label.RevenueShareWeightedCptv')}
          </Typography>
          <Typography className={cardValue} variant='h5'>
            {weightedCptvValue}
          </Typography>
          <Typography className={cardDescription} variant='body2'>
            {translate('Description.RevenueShareWeightedCptv')}
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default RevenueShareEstimateTile;
