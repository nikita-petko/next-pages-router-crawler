import { useMemo } from 'react';
import { StatusCodes } from '@rbx/core';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsCommerceNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsFixedTabPageConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { CreatorAnalyticsPageMode } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import {
  gmvAndQuantityTabbedChartConfigs,
  productEventsTabbedChartConfigs,
} from '../analytics/chartConfigs';
import DefinitionsTableWithTranslation from '../analytics/DefinitionsTable';
import { commerceEventsTableConfig } from '../analytics/tableConfigs';
import { CommerceDocLinks } from '../constants';
import useCommerce from '../hooks/useCommerce';
import isBaselineEligible from '../utils/isBaselineEligible';
import CommerceEligibilityContent from './tabs/CommerceEligibilityContent';
import CommerceItemsTabContent from './tabs/CommerceItemsTabContent';
import CommerceProductsTabContent from './tabs/CommerceProductsTabContent';

const defaultTimeRangeOptions = {
  type: 'dateRange',
  supportedRanges: [
    RAQIV2DateRangeType.Last7Days,
    RAQIV2DateRangeType.Last28Days,
    RAQIV2DateRangeType.Last56Days,
    RAQIV2DateRangeType.Last90Days,
    RAQIV2DateRangeType.Custom,
  ],
  defaultRange: RAQIV2DateRangeType.Last28Days,
  excludeEndDateInRange: false,
  maxEndDateOffset: 0,
  maxStartDateOffsetDays: 365,
} as const satisfies AnalyticsPageConfigDateOptions;

enum CommercePageTabKey {
  Creations = 'Creations',
  ImportedCatalog = 'ImportedCatalog',
  Analytics = 'Analytics',
}
const commerceAnalyticsTabTimeRangeOptions = {
  type: 'dateRange',
  supportedRanges: [
    RAQIV2DateRangeType.Last1Day,
    RAQIV2DateRangeType.Last7Days,
    RAQIV2DateRangeType.Last28Days,
    RAQIV2DateRangeType.Last56Days,
    RAQIV2DateRangeType.Last90Days,
    RAQIV2DateRangeType.Custom,
  ],
  defaultRange: RAQIV2DateRangeType.Last28Days,
  maxStartDateOffsetDays: 365 * 2,
  minStartDate: new Date('05/15/2025'),
} as const satisfies AnalyticsPageConfigDateOptions;

const commerceSurfaceAnnotationOptions = {
  supportedAnnotationTypes: [
    AnnotationType.PlaceVersion,
    AnnotationType.LiveEvent,
    AnnotationType.ConfigVersion,
    AnnotationType.Announcement,
  ],
  defaultAnnotationTypes: [],
  showAnnotationsControl: false,
} as const satisfies AnalyticsPageConfigAnnotationOptions;

const CommercePageContent = () => {
  const { canConfigure, isLoadingGame } = useCurrentGame();
  const { eligibilityStatus, isAnalyticsEnabled } = useCommerce();

  const isEligible = isBaselineEligible(eligibilityStatus?.baselineEligibility);

  const componentConfigCommerceProductsTabContent = useMemo(
    () =>
      ({
        type: AnalyticsComponentType.NonGeneric,
        metrics: [],
        renderer: {
          type: 'isolated',
          render: () => <CommerceProductsTabContent />,
        },
      }) as const satisfies ArbitraryComponentConfig,
    [],
  );

  const componentConfigCommerceItemsTabContent = useMemo(
    () =>
      ({
        type: AnalyticsComponentType.NonGeneric,
        metrics: [],
        renderer: {
          type: 'isolated',
          render: () => <CommerceItemsTabContent />,
        },
      }) as const satisfies ArbitraryComponentConfig,
    [],
  );

  if (isLoadingGame) {
    return (
      <EmptyGrid>
        <CircularProgress color='secondary' />
      </EmptyGrid>
    );
  }

  if (!canConfigure) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (!isEligible) {
    return <CommerceEligibilityContent />;
  }

  const commercePageConfig: CreatorAnalyticsFixedTabPageConfig<CommercePageTabKey> = {
    mode: CreatorAnalyticsPageMode.FixedTab,
    debugPageName: 'Commerce',
    docLinks: CommerceDocLinks,
    title: analyticsCommerceNavigationItem.title,
    navigationItem: analyticsCommerceNavigationItem,
    description: {
      standard: translationKey('Description.TakeActionCommerce', TranslationNamespace.Analytics),
    },
    tabOrder: [
      CommercePageTabKey.Creations,
      CommercePageTabKey.ImportedCatalog,
      ...(isAnalyticsEnabled ? [CommercePageTabKey.Analytics] : []),
    ],
    tabs: {
      [CommercePageTabKey.Creations]: {
        tabKey: CommercePageTabKey.Creations,
        label: translationKey('Heading.Creations', TranslationNamespace.Navigation),
        resourceTypes: [RAQIV2ChartResourceType.Universe],
        filterDimensions: [],
        breakdownDimensions: [],
        timeRangeOptions: defaultTimeRangeOptions,
        surfaceAnnotationOptions: commerceSurfaceAnnotationOptions,
        body: [
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [componentConfigCommerceProductsTabContent],
          },
        ],
      },
      [CommercePageTabKey.ImportedCatalog]: {
        tabKey: CommercePageTabKey.ImportedCatalog,
        label: translationKey('Heading.ImportedCatalog', TranslationNamespace.Navigation),
        resourceTypes: [RAQIV2ChartResourceType.Universe],
        filterDimensions: [],
        breakdownDimensions: [],
        timeRangeOptions: defaultTimeRangeOptions,
        surfaceAnnotationOptions: commerceSurfaceAnnotationOptions,
        body: [
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [componentConfigCommerceItemsTabContent],
          },
        ],
      },
      [CommercePageTabKey.Analytics]: {
        tabKey: CommercePageTabKey.Analytics,
        label: translationKey('Heading.Analytics', TranslationNamespace.Analytics),
        resourceTypes: [RAQIV2ChartResourceType.Universe],
        filterDimensions: [
          RAQIV2Dimension.Gender,
          RAQIV2Dimension.OperatingSystem,
          RAQIV2Dimension.Platform,
        ],
        breakdownDimensions: [
          RAQIV2Dimension.CommerceProductId,
          RAQIV2Dimension.Gender,
          RAQIV2Dimension.OperatingSystem,
          RAQIV2Dimension.Platform,
        ],
        granularity: { fixed: RAQIV2MetricGranularity.OneDay },
        timeRangeOptions: commerceAnalyticsTabTimeRangeOptions,
        surfaceAnnotationOptions: {
          supportedAnnotationTypes: [],
          defaultAnnotationTypes: [],
          showAnnotationsControl: true,
        },
        body: [
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [
              gmvAndQuantityTabbedChartConfigs,
              productEventsTabbedChartConfigs,
              commerceEventsTableConfig,
              {
                type: AnalyticsComponentType.NonGeneric,
                metrics: [],
                renderer: {
                  type: 'isolated',
                  render: () => <DefinitionsTableWithTranslation />,
                },
              },
            ],
          },
        ],
      },
    },
  };

  return <CreatorAnalyticsLayout config={commercePageConfig} />;
};

export default withTranslation(CommercePageContent, [
  TranslationNamespace.Navigation,
  TranslationNamespace.Analytics,
  TranslationNamespace.Commerce,
]);
