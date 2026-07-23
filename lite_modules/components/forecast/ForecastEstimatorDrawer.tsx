import {
  Button,
  FeedbackBanner,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
} from '@rbx/foundation-ui';
import { useCallback, useEffect, useRef } from 'react';

import { formatCppDisplay } from '@components/forecast/ForecastEstimator.utils';
import ForecastForm from '@components/forecast/ForecastForm';
import ForecastResultStatCard from '@components/forecast/ForecastResultStatCard';
import { UNAVAILABLE_VALUE_DISPLAY } from '@constants/displayConstants';
import { TranslationNamespace } from '@constants/localization';
import { useForecastEstimator } from '@hooks/useForecastEstimator';
import { useForecastEstimatorDrawerUrl } from '@hooks/useForecastEstimatorDrawerUrl';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const FORM_ID = 'forecast-estimator-form';

const ForecastEstimatorDrawer = () => {
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { translate: translateForecast } = useNamespacedTranslation(TranslationNamespace.Forecast);

  const { close: closeForecastEstimator, isOpen: isForecastEstimatorOpen } =
    useForecastEstimatorDrawerUrl();

  const handleClose = useCallback(() => {
    closeForecastEstimator();
  }, [closeForecastEstimator]);

  const {
    budgetFieldError,
    budgetFieldLabel,
    budgetHasInput,
    budgetUsd,
    calculatedBudgetUsd,
    calculatedPlays,
    durationInDays,
    error,
    estimateDisplay,
    handleDurationChange,
    hasFieldValidationError,
    isForecastEstimatorEnabled,
    loading,
    plays,
    playsFieldError,
    playsFieldLabel,
    playsHasInput,
    resetInputs,
    result,
    runDefaultEstimate,
    setFormInputs,
    showLifetimeEstimatedResultsLayout,
    submitForecast,
  } = useForecastEstimator();

  const hasAutoCalculated = useRef(false);

  useEffect(() => {
    if (isForecastEstimatorOpen && !hasAutoCalculated.current) {
      hasAutoCalculated.current = true;
      runDefaultEstimate();
    }
  }, [isForecastEstimatorOpen, runDefaultEstimate]);

  if (!isForecastEstimatorEnabled) {
    return null;
  }

  return (
    <SheetRoot
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      open={isForecastEstimatorOpen}>
      <SheetContent
        closeLabel={translateMisc('Action.Close')}
        largeScreenClassName='!max-width-[440px] width-full'
        largeScreenVariant='side'
        onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetTitle>{translateForecast('Title.CampaignForecaster')}</SheetTitle>
        <SheetBody>
          <form className='flex flex-col gap-large' id={FORM_ID} onSubmit={submitForecast}>
            <section className='flex flex-col gap-medium'>
              {error ? (
                <FeedbackBanner
                  layout='Stacked'
                  severity='Error'
                  showIcon
                  title={error}
                  variant='Standard'
                />
              ) : null}
              <div className='flex flex-col gap-xsmall'>
                <span className='text-title-medium content-emphasis'>
                  {translateForecast('Heading.EstimatedResults')}
                </span>
                <div className='text-body-small content-muted'>
                  {translateForecast('Description.CampaignForecastDisclaimer')}
                </div>
              </div>
              <div className='box-border radius-medium bg-surface-200 padding-medium gap-small flex flex-col wrap'>
                <div className='text-label-large content-emphasis'>
                  {translateForecast('Heading.CostPerPlay')}
                </div>
                <div className='flex min-width-0 flex-row wrap items-center gap-small'>
                  <span className='text-heading-medium content-emphasis'>
                    {result != null && result.cppMicroUsd != null
                      ? `$${formatCppDisplay(result.cppMicroUsd)}`
                      : UNAVAILABLE_VALUE_DISPLAY}
                  </span>
                </div>
              </div>

              <div className='flex width-full min-width-0 flex-row gap-medium no-wrap'>
                <ForecastResultStatCard
                  estimateDisplay={estimateDisplay}
                  mode='plays'
                  showLifetimeLayout={showLifetimeEstimatedResultsLayout}
                />
                <ForecastResultStatCard
                  estimateDisplay={estimateDisplay}
                  mode='budget'
                  showLifetimeLayout={showLifetimeEstimatedResultsLayout}
                />
              </div>
            </section>

            <ForecastForm
              budgetFieldError={budgetFieldError}
              budgetFieldLabel={budgetFieldLabel}
              budgetHasInput={budgetHasInput}
              budgetUsd={budgetUsd}
              calculatedBudgetUsd={calculatedBudgetUsd}
              calculatedPlays={calculatedPlays}
              durationInDays={durationInDays}
              onBudgetUsdChange={(value) => {
                setFormInputs((prev) => ({ ...prev, budgetUsd: value }));
              }}
              onDurationChange={handleDurationChange}
              onPlaysChange={(value) => {
                setFormInputs((prev) => ({ ...prev, plays: value }));
              }}
              onResetInputs={resetInputs}
              plays={plays}
              playsFieldError={playsFieldError}
              playsFieldLabel={playsFieldLabel}
              playsHasInput={playsHasInput}
            />
          </form>
        </SheetBody>
        <SheetActions className='flex flex-row wrap items-center gap-medium'>
          <Button
            form={FORM_ID}
            isDisabled={
              loading ||
              (!budgetHasInput && !playsHasInput) ||
              (budgetHasInput && playsHasInput) ||
              hasFieldValidationError
            }
            size='Medium'
            type='submit'
            variant='Emphasis'>
            {translateForecast('Action.Calculate')}
          </Button>
          <Button onClick={handleClose} size='Medium' type='button' variant='Standard'>
            {translateMisc('Action.Close')}
          </Button>
        </SheetActions>
      </SheetContent>
    </SheetRoot>
  );
};

export default ForecastEstimatorDrawer;
