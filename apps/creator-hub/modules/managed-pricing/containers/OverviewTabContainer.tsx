/* istanbul ignore file */
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { SingleDateType } from '@modules/charts-generic';
import {
  AnalyticsContextLayerInnerProvider,
  CreatorAnalyticsPageSurfaceConfig,
  getUniverseAnalyticsTabLayout,
} from '@modules/experience-analytics-shared';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import OverviewSummaryContainer from '../analytics/components/OverviewSummaryContainer';
import TopProductsTable from '../analytics/components/TopProductsTable';
import AnalyticsCharts from '../analytics/components/AnalyticsCharts';

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

function OverviewTabContainer({ universeId }: { universeId: number }) {
  return (
    <AnalyticsProviders>
      <div className='flex flex-col gap-xxlarge'>
        <OverviewSummaryContainer universeId={universeId} />
        <TopProductsTable universeId={universeId} />
        <AnalyticsCharts universeId={universeId} />
      </div>
    </AnalyticsProviders>
  );
}

export default withTranslation(OverviewTabContainer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Creations,
  TranslationNamespace.Error,
  TranslationNamespace.Table,
  TranslationNamespace.ManagedPricing,
]);
