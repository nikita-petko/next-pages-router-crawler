/* istanbul ignore file */
import { useState, useEffect } from 'react';
import { Typography, Tabs, Tab, Divider } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/common';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useLocalStorage } from '@rbx/react-utilities';
import { PricingErrorProvider, usePricingError } from '../../providers/PricingErrorProvider';
import useGetLatestExperiment from '../../queries/useGetLatestExperiment';
import useGetPriceExperimentationEligibility from '../../queries/useGetPriceExperimentationEligibility';
import usePriceOptimizationPageContentStyles from './PriceOptimizationPage.styles';
import CurrentOptimization from '../../components/CurrentOptimization/CurrentOptimization';
import OptimizationMenu from '../../components/OptimizationMenu/OptimizationMenu';
import useFormatters from '../../helpers/useFormatters';
import StatusBanner from '../../components/StatusBanner/StatusBanner';
import { useInvalidateProducts } from '../../queries/useGetProducts';
import ErrorBanner from '../../components/ErrorBanner/ErrorBanner';
import { priceOptimizationPageViewedKey } from '../../constants/bannerConstants';
import FreezeBanner from '../../components/FreezeBanner/FreezeBanner';

// For MVP "Current" will be the only tab.
enum TabValue {
  Current,
}

const PriceOptimizationPageContent = () => {
  const { ready: areTranslationsReady, translate, translateHTML } = useTranslation();
  const { isEligible, isLoading: isLoadingEligibility } = useGetPriceExperimentationEligibility();
  const {
    universeId,
    isLoading: isLoadingExperiment,
    isError: isErrorExperiment,
  } = useGetLatestExperiment();

  // Refresh data on page load
  useInvalidateProducts(universeId);

  const { dateFormatter } = useFormatters();

  // We don't check errors for this call since it's not too important
  // Only used to display date of last price optimization run
  const { latestExperiment: lastCompletedExperiment } = useGetLatestExperiment({ completed: true });

  usePricingError(isErrorExperiment);

  const { classes } = usePriceOptimizationPageContentStyles();

  const [activeTab, setActiveTab] = useState<TabValue>(TabValue.Current);

  let renderedTab;
  switch (activeTab) {
    case TabValue.Current:
      renderedTab = <CurrentOptimization />;
      break;
    default:
      renderedTab = null;
  }

  // Store the last viewed time of page in local storage for conditional banner render
  const [, setLastViewedTime] = useLocalStorage<number | null>(
    priceOptimizationPageViewedKey,
    null,
  );

  useEffect(() => {
    setLastViewedTime(Date.now());
  }, [setLastViewedTime]);

  const isLoading = !areTranslationsReady || isLoadingEligibility || isLoadingExperiment;

  if (!isLoadingEligibility && !isEligible) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (isLoading || isErrorExperiment) {
    return (
      <div>
        <ErrorBanner />
        <PageLoading />
      </div>
    );
  }

  const dateString =
    lastCompletedExperiment && lastCompletedExperiment.endTime
      ? dateFormatter.format(lastCompletedExperiment.endTime)
      : '—';
  const lastExperimentRunString = translateHTML('Label.LastOptimized', [
    {
      opening: 'dateStart',
      closing: 'dateEnd',
      content: () => <Typography className={classes.boldText}>{dateString}</Typography>,
    },
  ]);

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <span className={classes.subtitleContainer}>
          <Typography variant='body1' component='p'>
            {translate('Description.PriceOptimization')}
          </Typography>
          <Typography>{lastExperimentRunString}</Typography>
        </span>
      </div>

      <FreezeBanner />
      <StatusBanner />
      <ErrorBanner />

      <div>
        <div className={classes.tabContainer}>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
            <Tab label='Current' value={activeTab} />
          </Tabs>
          <OptimizationMenu />
        </div>
        <Divider />
      </div>
      {renderedTab}
    </div>
  );
};

const PriceOptimizationPageContentWithError = () => (
  <PricingErrorProvider>
    <PriceOptimizationPageContent />
  </PricingErrorProvider>
);

export default withTranslation(PriceOptimizationPageContentWithError, [
  TranslationNamespace.Controls,
  TranslationNamespace.Table,
  TranslationNamespace.PriceOptimization,
]);
