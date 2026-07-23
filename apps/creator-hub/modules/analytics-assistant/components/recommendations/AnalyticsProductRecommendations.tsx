import type { FC } from 'react';
import { useState, useCallback, useMemo } from 'react';
import type { TTheme } from '@rbx/ui';
import { makeStyles } from '@rbx/ui';
import type { TAnalyticsProductRecommendation } from '@modules/experience-analytics-shared/types/assistant/AnalyticsAssistantRecommendations';
import type { TAssistantSummaryInsight } from '../../types/AssistantSummaryInsightType';
import AnalyticsProductRecommendationTile from './AnalyticsProductRecommendationTile';
import SeeMoreTile from './SeeMoreTile';

type Breakpoint = keyof TTheme['breakpoints']['values'];

type AnalyticsProductRecommendationsProps = {
  insightId: string;
  insightType: TAssistantSummaryInsight;
  recommendations: TAnalyticsProductRecommendation[];
  isPreviewMode?: boolean;
};

const MAX_RECOMMENDATIONS = 2;

const useStyles = makeStyles()((theme) => ({
  // Container is horizontally scrollable on mobile and wraps content on desktop (sm breakpoint and above)
  container: {
    display: 'flex',
    gap: theme.spacing(2),
    overflowX: 'auto',
    flexWrap: 'nowrap',
    [theme.breakpoints.up('sm' as Breakpoint)]: {
      flexWrap: 'wrap',
      overflowX: 'visible',
    },
  },
}));

const AnalyticsProductRecommendations: FC<AnalyticsProductRecommendationsProps> = ({
  insightId,
  insightType,
  recommendations,
  isPreviewMode = false,
}) => {
  const {
    classes: { container },
  } = useStyles();

  const numRecommendationsToShow = useMemo(() => {
    return isPreviewMode ? MAX_RECOMMENDATIONS - 1 : MAX_RECOMMENDATIONS;
  }, [isPreviewMode]);

  const [activeRecommendations, setActiveRecommendations] = useState<
    TAnalyticsProductRecommendation[]
  >(recommendations.slice(0, numRecommendationsToShow));

  const seeMoreTile = useMemo(() => {
    if (isPreviewMode) {
      // The number of actions shown in the report is min(MAX_RECOMMENDATIONS, recommendations.length)
      // If we're including the see more tile, we need to subtract the number of actions that are already shown
      const numActions =
        Math.min(recommendations.length, MAX_RECOMMENDATIONS) - numRecommendationsToShow;
      return <SeeMoreTile insightId={insightId} numActions={numActions} />;
    }

    return null;
  }, [isPreviewMode, insightId, numRecommendationsToShow, recommendations.length]);

  const handleDismiss = useCallback((dismissedRecommendation: TAnalyticsProductRecommendation) => {
    setActiveRecommendations((prev) =>
      prev.filter(
        (recommendation) =>
          recommendation.recommendationType !== dismissedRecommendation.recommendationType,
      ),
    );
  }, []);

  return (
    <div className={container}>
      {activeRecommendations.map((recommendation) => (
        <AnalyticsProductRecommendationTile
          key={recommendation.recommendationType}
          insightType={insightType}
          recommendation={recommendation}
          onDismiss={handleDismiss}
        />
      ))}
      {seeMoreTile}
    </div>
  );
};

export default AnalyticsProductRecommendations;
