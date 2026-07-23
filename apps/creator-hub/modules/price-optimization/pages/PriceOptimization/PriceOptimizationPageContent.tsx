import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { StatusCodes } from '@rbx/core';
import { SystemBanner } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Typography, Tabs, Tab, Divider } from '@rbx/ui';
import { useIsManagedPricingAvailable } from '@modules/managed-pricing/hooks/useIsManagedPricingAvailable';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import CurrentOptimization from '../../components/CurrentOptimization/CurrentOptimization';
import ErrorBanner from '../../components/ErrorBanner/ErrorBanner';
import OptimizationMenu from '../../components/OptimizationMenu/OptimizationMenu';
import StatusBanner from '../../components/StatusBanner/StatusBanner';
import { isOngoingExperiment } from '../../helpers/experimentUtils';
import { useFormatters } from '../../helpers/useFormatters';
import { PricingErrorProvider, usePricingError } from '../../providers/PricingErrorProvider';
import { useGetLatestExperiment } from '../../queries/useGetLatestExperiment';
import { useGetPriceExperimentationEligibility } from '../../queries/useGetPriceExperimentationEligibility';
import { useInvalidateProducts } from '../../queries/useGetProducts';
import usePriceOptimizationPageContentStyles from './PriceOptimizationPage.styles';

// For MVP "Current" will be the only tab.
enum TabValue {
  Current,
}

function PriceOptimizationPageContent({ universeId }: { universeId: number }) {
  const router = useRouter();
  const { ready: areTranslationsReady, translate, translateHTML } = useTranslation();
  const { isEligible, isLoading: isLoadingEligibility } = useGetPriceExperimentationEligibility();
  const {
    latestExperiment: currentExperiment,
    isLoading: isLoadingExperiment,
    isError: isErrorExperiment,
  } = useGetLatestExperiment();

  const { data: isManagedPricingAvailable } = useIsManagedPricingAvailable(universeId);

  useEffect(() => {
    if (isManagedPricingAvailable) {
      void router.replace(dashboard.getManagedPricingUrl(universeId));
    }
  }, [isManagedPricingAvailable, router, universeId]);

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

  const isLoading = !areTranslationsReady || isLoadingEligibility || isLoadingExperiment;

  if (!isLoadingEligibility && !isEligible) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (isLoading || isErrorExperiment || isManagedPricingAvailable) {
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

  const isActiveExperiment = isOngoingExperiment(currentExperiment?.state);

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

      {!isActiveExperiment && (
        // Maintenance freeze banner for Managed Pricing transition
        <SystemBanner
          title={translate('Heading.PriceOptimizationMaintenanceTitle')}
          description={translate('Description.PriceOptimizationMaintenance')}
          variant='Standard'
          severity='Info'
        />
      )}

      <StatusBanner />
      <ErrorBanner />

      <div>
        <div className={classes.tabContainer}>
          <Tabs value={activeTab} onChange={(_, value: TabValue) => setActiveTab(value)}>
            {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string -- lol */}
            <Tab label='Current' value={activeTab} />
          </Tabs>
          <OptimizationMenu />
        </div>
        <Divider />
      </div>
      {renderedTab}
    </div>
  );
}

const PriceOptimizationPageContentWithError = ({ universeId }: { universeId: number }) => (
  <PricingErrorProvider>
    <PriceOptimizationPageContent universeId={universeId} />
  </PricingErrorProvider>
);

export default withTranslation(PriceOptimizationPageContentWithError, [
  TranslationNamespace.Controls,
  TranslationNamespace.Table,
  TranslationNamespace.PriceOptimization,
]);
