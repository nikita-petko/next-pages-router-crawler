import {
  EstimateDisplay,
  formatForecastBudgetMicroUsd,
  formatForecastPlays,
} from '@components/forecast/ForecastEstimator.utils';
import { UNAVAILABLE_VALUE_DISPLAY } from '@constants/displayConstants';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

type ForecastResultStatCardProps = {
  estimateDisplay: EstimateDisplay | null;
  mode: 'plays' | 'budget';
  showLifetimeLayout: boolean;
};

const ForecastResultStatCard = ({
  estimateDisplay,
  mode,
  showLifetimeLayout,
}: ForecastResultStatCardProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Forecast);
  const isBudget = mode === 'budget';
  const heading = translate(isBudget ? 'Heading.Budget' : 'Heading.Plays');

  let primaryValue = UNAVAILABLE_VALUE_DISPLAY;
  if (estimateDisplay) {
    primaryValue = isBudget
      ? formatForecastBudgetMicroUsd(estimateDisplay.primaryBudgetMicroUsd)
      : formatForecastPlays(estimateDisplay.primaryPlays);
  }

  let dailyValue = UNAVAILABLE_VALUE_DISPLAY;
  if (estimateDisplay) {
    dailyValue = isBudget
      ? formatForecastBudgetMicroUsd(estimateDisplay.dailyBudgetMicroUsd)
      : formatForecastPlays(estimateDisplay.dailyPlays);
  }

  return (
    // `shift-200` is the fill Foundation's `Card variant='Emphasis'` uses, which is what the
    // reporting summary cards are built from. Being a translucent overlay rather than a fixed
    // surface, it reads as one step above whatever it sits on in either mode, where the
    // `surface-200` this used to carry is only lighter than its parent in dark mode and
    // collapses to plain white in light mode.
    <div className='box-border flex min-width-0 grow basis-0 flex-col gap-medium radius-medium bg-shift-200 padding-medium'>
      <span className='text-label-large content-emphasis'>{heading}</span>
      <div className='flex flex-col gap-small'>
        <div className='flex min-width-0 flex-row items-center gap-small no-wrap'>
          <span className='text-heading-medium content-emphasis min-width-0 shrink clip text-no-wrap'>
            {primaryValue}
          </span>
          <span className='text-body-medium content-muted shrink-0'>
            {translate(showLifetimeLayout ? 'Label.PeriodTotal' : 'Label.PeriodPerDay')}
          </span>
        </div>

        {showLifetimeLayout ? (
          <div className='flex min-width-0 flex-row items-center gap-xsmall no-wrap'>
            <span className='text-body-medium content-muted min-width-0 shrink clip text-no-wrap'>
              {dailyValue}
            </span>
            <span className='text-body-medium content-muted shrink-0'>
              {translate('Label.PeriodPerDay')}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ForecastResultStatCard;
