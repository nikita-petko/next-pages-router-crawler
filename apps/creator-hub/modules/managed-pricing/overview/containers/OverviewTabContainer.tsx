/* istanbul ignore file */
import type { GiftingTradingStatus } from '@rbx/client-developer-products-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import SingleDateType from '@modules/charts-generic/enums/SingleDateType';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { AnalyticsContextLayerInnerProvider } from '@modules/experience-analytics-shared/context/AnalyticsContextLayerProvider';
import getUniverseAnalyticsTabLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsTabLayout';
import type { CreatorAnalyticsPageSurfaceConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AnalyticsCharts from '../components/AnalyticsCharts';
import OverviewSummaryContainer from '../components/OverviewSummaryContainer';
import TopProductsTable from '../components/TopProductsTable';
import { useProductCountSummary } from '../hooks/useProductCountSummary';

const pageConfig: CreatorAnalyticsPageSurfaceConfig = {
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  filterDimensions: [],
  breakdownDimensions: [],
  timeRangeOptions: {
    type: 'singleDay',
    supportedDates: [SingleDateType.MostRecent],
    defaultDate: SingleDateType.MostRecent,
  },
  surfaceAnnotationOptions: {
    supportedAnnotationTypes: [],
    defaultAnnotationTypes: [],
    showAnnotationsControl: false,
  },
  body: [],
};

function AnalyticsProviders({ children }: { children: React.ReactNode }) {
  return getUniverseAnalyticsTabLayout(
    <AnalyticsContextLayerInnerProvider config={pageConfig}>
      {children}
    </AnalyticsContextLayerInnerProvider>,
  );
}

function OverviewTabContainer({
  universeId,
  giftingTradingStatus,
}: {
  universeId: number;
  giftingTradingStatus?: GiftingTradingStatus;
}) {
  const { translate } = useTranslation();
  const { hasEligibleProducts, isLoading, isError, isLocalError } =
    useProductCountSummary(universeId);

  // Individual components will handle their loading state respectively,
  // so we only need to show empty state when data is loaded and there are no eligible products.
  if (!hasEligibleProducts && !isLoading && !isError && !isLocalError) {
    return (
      <EmptyState
        title={translate('Heading.Overview')}
        description={translate('Description.ManageItemsEmptyState')}
        size='small'
        illustration='chart'
      />
    );
  }

  return (
    <AnalyticsProviders>
      <div className='flex flex-col gap-xxlarge'>
        <OverviewSummaryContainer universeId={universeId} />
        <TopProductsTable universeId={universeId} giftingTradingStatus={giftingTradingStatus} />
        <AnalyticsCharts universeId={universeId} />
      </div>
    </AnalyticsProviders>
  );
}

export default withTranslation(OverviewTabContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.Analytics,
  TranslationNamespace.Creations,
  TranslationNamespace.Error,
  TranslationNamespace.Table,
  TranslationNamespace.ManagedPricing,
]);
