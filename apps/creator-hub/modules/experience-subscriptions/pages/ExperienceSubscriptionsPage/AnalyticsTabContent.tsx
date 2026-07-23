import { useMemo } from 'react';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAnalyticsCurrentDateRangeBundle as useExperienceAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { useNonRAQIAnalyticsCurrentFilterBundle } from '@modules/experience-analytics-shared/context/AnalyticsCurrentFilterBundleProvider';
import AnalyticsTabContentLayout from '@modules/experience-analytics-shared/layout/AnalyticsTabContentLayout';
import AnalyticsPageAnnotationsControl from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/AnalyticsPageAnnotationsControl';
import ExperienceAnalyticsPageDateRangeControl from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/AnalyticsPageDateRangeControl';
import { ExperienceSubscriptionsDimensions } from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterBarConfig';
import type { FilterBarConfig } from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterBarConfig';
import { Link } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ExperienceSubscriptionsChart from '../../components/ExperienceSubscriptionsChart';
import useSubscriptionFilterBarConfig from '../../context/useSubscriptionFilterBarConfig';
import { ExperienceSubscriptionsChartKey } from '../../types/ExperienceSubscriptionsChartSpec';
import useAnalyticsTabContentStyles from './AnalyticsTabContent.styles';

type AnalyticsTabContentSpec = {
  // NOTE(shumingxu, 11/30/2023): Temporarily here to provide text copy for migration
  showDataMayBeBehindLabel?: boolean;
};

const subscriptionsDocLink: AnalyticsDocLink =
  '/docs/production/monetization/subscriptions#subscription-analytics';

function AnalyticsTabContent({ showDataMayBeBehindLabel }: AnalyticsTabContentSpec) {
  const { translateHTML } = useTranslationWrapper(useTranslation());
  const { startDate, endDate } = useExperienceAnalyticsCurrentDateRangeBundle();
  const { filters, onFiltersChange } = useNonRAQIAnalyticsCurrentFilterBundle(
    ExperienceSubscriptionsDimensions,
  );
  const subscriptionFilterBarConfig = useSubscriptionFilterBarConfig();
  const filterBarConfig: FilterBarConfig = useMemo(
    () => [subscriptionFilterBarConfig],
    [subscriptionFilterBarConfig],
  );
  const subscriptionFilter = useMemo(() => filters?.[0]?.values?.[0] ?? '', [filters]);

  const {
    classes: { description },
  } = useAnalyticsTabContentStyles();

  const charts = [
    subscriptionFilter ? (
      <ExperienceSubscriptionsChart
        titleKey={translationKey(
          'Heading.Subscriptions',
          TranslationNamespace.ExperienceSubscriptions,
        )}
        definitionTooltipKey={translationKey(
          'Description.Sales',
          TranslationNamespace.ExperienceSubscriptions,
        )}
        key={ExperienceSubscriptionsChartKey.Sales}
        spec={{
          startDate,
          endDate,
          chartKey: ExperienceSubscriptionsChartKey.Sales,
          productFilter: subscriptionFilter,
        }}
      />
    ) : (
      <ExperienceSubscriptionsChart
        titleKey={translationKey(
          'Heading.Subscriptions',
          TranslationNamespace.ExperienceSubscriptions,
        )}
        definitionTooltipKey={translationKey(
          'Description.Sales',
          TranslationNamespace.ExperienceSubscriptions,
        )}
        key={ExperienceSubscriptionsChartKey.SalesByProduct}
        spec={{
          startDate,
          endDate,
          chartKey: ExperienceSubscriptionsChartKey.SalesByProduct,
          productFilter: subscriptionFilter,
        }}
      />
    ),
    subscriptionFilter ? (
      <ExperienceSubscriptionsChart
        titleKey={translationKey('Title.Revenue', TranslationNamespace.ExperienceSubscriptions)}
        definitionTooltipKey={translationKey(
          'Description.Revenue',
          TranslationNamespace.ExperienceSubscriptions,
        )}
        key={ExperienceSubscriptionsChartKey.Revenue}
        spec={{
          startDate,
          endDate,
          chartKey: ExperienceSubscriptionsChartKey.Revenue,
          productFilter: subscriptionFilter,
        }}
      />
    ) : (
      <ExperienceSubscriptionsChart
        titleKey={translationKey('Title.Revenue', TranslationNamespace.ExperienceSubscriptions)}
        definitionTooltipKey={translationKey(
          'Description.Revenue',
          TranslationNamespace.ExperienceSubscriptions,
        )}
        key={ExperienceSubscriptionsChartKey.RevenueByProduct}
        spec={{
          startDate,
          endDate,
          chartKey: ExperienceSubscriptionsChartKey.RevenueByProduct,
          productFilter: subscriptionFilter,
        }}
      />
    ),
    <ExperienceSubscriptionsChart
      titleKey={translationKey(
        'Title.SalesBySubscriptionType',
        TranslationNamespace.ExperienceSubscriptions,
      )}
      definitionTooltipKey={translationKey(
        'Description.SalesBySubscriptionType',
        TranslationNamespace.ExperienceSubscriptions,
      )}
      key={ExperienceSubscriptionsChartKey.SalesBySubscriptionType}
      spec={{
        startDate,
        endDate,
        chartKey: ExperienceSubscriptionsChartKey.SalesBySubscriptionType,
        productFilter: subscriptionFilter,
      }}
    />,
    <ExperienceSubscriptionsChart
      titleKey={translationKey(
        'Title.CancellationsBySubscriptionType',
        TranslationNamespace.ExperienceSubscriptions,
      )}
      definitionTooltipKey={translationKey(
        'Description.CancellationsBySubscriptionType',
        TranslationNamespace.ExperienceSubscriptions,
      )}
      key={ExperienceSubscriptionsChartKey.CancellationsBySubscriptionType}
      spec={{
        startDate,
        endDate,
        chartKey: ExperienceSubscriptionsChartKey.CancellationsBySubscriptionType,
        productFilter: subscriptionFilter,
      }}
    />,
    <ExperienceSubscriptionsChart
      titleKey={translationKey(
        'Title.SalesByPlatform',
        TranslationNamespace.ExperienceSubscriptions,
      )}
      definitionTooltipKey={translationKey(
        'Description.SalesByPlatform',
        TranslationNamespace.ExperienceSubscriptions,
      )}
      key={ExperienceSubscriptionsChartKey.SalesByPlatform}
      spec={{
        startDate,
        endDate,
        chartKey: ExperienceSubscriptionsChartKey.SalesByPlatform,
        productFilter: subscriptionFilter,
      }}
    />,
    <ExperienceSubscriptionsChart
      titleKey={translationKey(
        'Title.RevenueByPlatform',
        TranslationNamespace.ExperienceSubscriptions,
      )}
      definitionTooltipKey={translationKey(
        'Description.RevenueByPlatform',
        TranslationNamespace.ExperienceSubscriptions,
      )}
      key={ExperienceSubscriptionsChartKey.RevenueByPlatform}
      spec={{
        startDate,
        endDate,
        chartKey: ExperienceSubscriptionsChartKey.RevenueByPlatform,
        productFilter: subscriptionFilter,
      }}
    />,
  ];

  const dataMayBeBehindLabel = useMemo(
    () => (
      <Typography className={description}>
        {translateHTML(
          translationKey(
            'Description.DataMayBeBehind',
            TranslationNamespace.ExperienceSubscriptions,
          ),
          [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content(chunks) {
                return (
                  <Link href={subscriptionsDocLink} target='_blank' underline='none'>
                    {chunks}
                  </Link>
                );
              },
            },
          ],
        )}
      </Typography>
    ),
    [description, translateHTML],
  );

  const controls = [
    <ExperienceAnalyticsPageDateRangeControl
      key='date'
      dateRangeOptions={[
        RAQIV2DateRangeType.Last7Days,
        RAQIV2DateRangeType.Last28Days,
        RAQIV2DateRangeType.Last56Days,
        RAQIV2DateRangeType.Last90Days,
        RAQIV2DateRangeType.Custom,
      ]}
    />,
    <AnalyticsPageAnnotationsControl key='annotations' resourceType={ChartResourceType.Universe} />,
  ];

  return (
    <AnalyticsTabContentLayout
      controls={controls}
      filterBar={{
        config: filterBarConfig,
        filters,
        onFiltersChange,
      }}>
      {showDataMayBeBehindLabel && dataMayBeBehindLabel}
      <Grid container spacing={5}>
        {charts}
      </Grid>
    </AnalyticsTabContentLayout>
  );
}

export default withNamespaceSwitchedTranslation(AnalyticsTabContent, [
  TranslationNamespace.ExperienceSubscriptions,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Analytics,
]);
