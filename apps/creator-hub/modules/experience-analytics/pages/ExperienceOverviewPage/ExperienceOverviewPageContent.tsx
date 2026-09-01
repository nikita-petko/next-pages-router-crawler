import type { FC } from 'react';
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { makeStyles, useMediaQuery } from '@rbx/ui';
import AudienceReachGrowthOpportunitiesBanner from '@modules/audience-reach/components/AudienceReachGrowthOpportunitiesBanner';
import { OverviewVariant } from '@modules/creations-overview/hooks/useOverviewVariant';
import type { ExperienceAnalyticsPageControl } from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageControlBar';
import NonConfigurationBasedSpecialExperienceAnalyticsPageLayout from '@modules/experience-analytics-shared/layout/NonConfigurationBasedSpecialExperienceAnalyticsPageLayout';
import OverviewPageBanners from './banners/OverviewPageBanners';

const InsightsOverviewContent = dynamic(() => import('./InsightsOverviewContent'), {
  ssr: false,
});
const StaticInsightsOverviewContent = dynamic(
  () => import('../../components/insights/StaticInsights/StaticInsightsOverviewContent'),
  { ssr: false },
);

const emptyControls: ExperienceAnalyticsPageControl[] = [];

const useStyles = makeStyles()(() => ({
  heroElementContainer: {
    marginBottom: '16px',
  },
  compactHeroElement: {
    margin: '24px 0 -36px 0',
  },
}));

type ExperienceOverviewPageContentProps = {
  variant: OverviewVariant;
  heroElement?: React.ReactElement;
};

const ExperienceOverviewPageContent: FC<ExperienceOverviewPageContentProps> = ({
  variant,
  heroElement: givenHeroElement,
}) => {
  const {
    classes: { compactHeroElement, heroElementContainer },
    cx,
  } = useStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const insightsContent = useMemo(() => {
    switch (variant) {
      case OverviewVariant.HeaderOnly:
        return null;
      case OverviewVariant.StaticInsights:
        return <StaticInsightsOverviewContent />;
      case OverviewVariant.Insights:
        return <InsightsOverviewContent />;
      default: {
        const exhaustiveCheck: never = variant;
        // oxlint-disable-next-line typescript/restrict-template-expressions -- compile-time exhaustive check; include runtime value for debugging if a new variant is added
        throw new Error(`Unhandled variant ${exhaustiveCheck}`);
      }
    }
  }, [variant]);

  const heroElement = useMemo(() => {
    return (
      <div
        className={cx(heroElementContainer, {
          [compactHeroElement]: isCompactView,
        })}>
        {givenHeroElement}
      </div>
    );
  }, [compactHeroElement, cx, givenHeroElement, heroElementContainer, isCompactView]);

  return (
    <NonConfigurationBasedSpecialExperienceAnalyticsPageLayout
      controls={emptyControls}
      addHeroDivider={isCompactView}
      heroElement={heroElement}>
      <AudienceReachGrowthOpportunitiesBanner />
      <OverviewPageBanners />
      {insightsContent}
    </NonConfigurationBasedSpecialExperienceAnalyticsPageLayout>
  );
};
export default ExperienceOverviewPageContent;
