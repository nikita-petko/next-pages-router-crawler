import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { Chip } from '@rbx/foundation-ui';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import {
  translationKey,
  translationKeyWithoutNamespace,
} from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import ExperimentsNUXBanner from '@modules/experience-analytics-shared/components/Banners/ExperimentsNUXBanner';
import GenericAnalyticsDataLastUpdatedOnDisclaimer from '@modules/experience-analytics-shared/components/RAQIV2/GenericAnalyticsLatestDataPointDisclaimer';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import RecommendedEventsZeroState from '@modules/experience-analytics-shared/components/RecommendedEventsZeroState/RecommendedEventsZeroState';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type {
  CreatorAnalyticsPageSurfaceViewSelectorConfig,
  CreatorAnalyticsPageSurfaceViewSelectorRenderProps,
  RAQIV2PreControlComponent,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const recommendedEventsFunnelsDocLink: AnalyticsDocLink =
  '/docs/production/analytics/funnel-events';

export const FunnelProgressionViewKey = {
  User: 'User',
  Session: 'Session',
} as const;

const funnelProgressionViewOptions = [
  {
    key: FunnelProgressionViewKey.User,
    labelKey: translationKeyWithoutNamespace('Label.TableTab.FunnelsProgressionByUser'),
  },
  {
    key: FunnelProgressionViewKey.Session,
    labelKey: translationKeyWithoutNamespace('Label.TableTab.FunnelsProgressionBySession'),
  },
] as const;

const FunnelProgressionViewSelector = ({
  selectedViewKey,
  onSelectViewKey,
}: CreatorAnalyticsPageSurfaceViewSelectorRenderProps) => {
  const { translate } = useRAQIV2TranslationDependencies();
  return (
    <div
      className='flex gap-medium [margin-bottom:16px]'
      data-testid='funnel-progression-view-tabs'>
      {funnelProgressionViewOptions.map(({ key, labelKey }) => (
        <Chip
          key={key}
          text={translate(labelKey)}
          size='Large'
          isChecked={selectedViewKey === key}
          onCheckedChange={() => onSelectViewKey(key)}
          data-testid={`funnel-progression-view-tab-${key}`}
        />
      ))}
    </div>
  );
};

export const funnelProgressionViewSelectorConfig = {
  defaultViewKey: FunnelProgressionViewKey.User,
  renderViewSelector: (props) => <FunnelProgressionViewSelector {...props} />,
} satisfies Omit<CreatorAnalyticsPageSurfaceViewSelectorConfig, 'getBodyForView'>;

export const arbitraryComponentConfigRecommendedEventsFunnelsZeroState = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => {
      return (
        <RecommendedEventsZeroState
          headingKey={translationKey('Heading.FunnelsZeroState', TranslationNamespace.Analytics)}
          descriptionKey={translationKey(
            'Description.FunnelsZeroStateOnboarding',
            TranslationNamespace.Analytics,
          )}
          primaryHref={recommendedEventsFunnelsDocLink}
          image={{
            src: `${process.env.assetPathPrefix}/analytics/funnels_zero_state_full.webp`,
            altKey: translationKey('Heading.Funnels', TranslationNamespace.Analytics),
            absolute: false,
          }}
        />
      );
    },
  },
} as const satisfies ArbitraryComponentConfig;

export const arbitraryComponentConfigFunnelLatestDataPointDisclaimer = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [RAQIV2Metric.FunnelStepTotalCount],
  renderer: {
    type: 'isolated',
    render: () => {
      return (
        <GenericAnalyticsDataLastUpdatedOnDisclaimer metric={RAQIV2Metric.FunnelStepTotalCount} />
      );
    },
  },
} as const satisfies ArbitraryComponentConfig;

export const configuredExperimentsNUXBanner = {
  type: RAQIV2SpecialLayoutType.FullWidthLayout,
  items: [
    {
      type: AnalyticsComponentType.NonGeneric,
      metrics: [],
      renderer: {
        type: 'isolated',
        render: () => {
          return (
            <ExperimentsNUXBanner
              titleKey={translationKey(
                'Title.ExperimentsNUXBanner.Funnels',
                TranslationNamespace.Analytics,
              )}
              descriptionKey={translationKey(
                'Description.ExperimentsNUXBanner.Funnels',
                TranslationNamespace.Analytics,
              )}
              checkForInGameExperiment
            />
          );
        },
      },
    },
  ],
  stylingOverride: {
    style: {
      marginBottom: 16,
    },
  },
} as const satisfies RAQIV2PreControlComponent;
