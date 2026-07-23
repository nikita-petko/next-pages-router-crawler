import React, { FC, useMemo } from 'react';
import {
  ExperienceAnalyticsPageControl,
  NonConfigurationBasedSpecialExperienceAnalyticsPageLayout,
  useExperienceAnalyticsGameDetails,
} from '@modules/experience-analytics-shared';
import useOverviewVariant, {
  OverviewVariant,
} from '@modules/creations-overview/hooks/useOverviewVariant';

import { makeStyles, useMediaQuery } from '@rbx/ui';
import OverviewPageBanners from './banners/OverviewPageBanners';
import StaticInsightsOverviewContent from '../../components/insights/StaticInsights/StaticInsightsOverviewContent';
import InsightsOverviewContent from './InsightsOverviewContent';

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
  heroElement?: React.ReactElement;
};

const ExperienceOverviewPageContent: FC<ExperienceOverviewPageContentProps> = ({
  heroElement: givenHeroElement,
}) => {
  const {
    classes: { compactHeroElement, heroElementContainer },
    cx,
  } = useStyles();
  const { universeId } = useExperienceAnalyticsGameDetails();
  const { variant } = useOverviewVariant(universeId);
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
      <OverviewPageBanners />
      {insightsContent}
    </NonConfigurationBasedSpecialExperienceAnalyticsPageLayout>
  );
};
export default ExperienceOverviewPageContent;
