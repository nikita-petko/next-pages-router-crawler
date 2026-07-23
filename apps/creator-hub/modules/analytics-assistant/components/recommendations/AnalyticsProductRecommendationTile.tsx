import React, { FC, useCallback, useMemo } from 'react';
import {
  recommendationTypeToTranslationInfo,
  useExperienceAnalyticsGameDetails,
  useRAQIV2TranslationDependencies,
  useUniverseResource,
  TAnalyticsProductRecommendation,
  RecommendationsWithNonStaticLinks,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSnoozeInsight } from '@modules/react-query/universeAnalyticsInsights';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { RecommendationType } from '@modules/clients/analytics';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import { EStudioTaskType, useStudio } from '@modules/miscellaneous/hooks';
import { getAnalyticsProductRecommendationConfig } from '../../constants/AnalyticsProductRecommendationConfigs';
import {
  AssistantClickEventName,
  AssistantImpressionEventName,
  logAssistantEvent,
} from '../../utils/AssistantLogger';
import { TAssistantSummaryInsight } from '../../types/AssistantSummaryInsightType';
import GenericTile from './GenericTile';

// 1 year in seconds
const DEFAULT_RECOMMENDATION_SNOOZE_DURATION = `${365 * 24 * 60 * 60}s`;

const NON_TRACKED_RECOMMENDATION_TYPES = [
  RecommendationType.ProductPackagesMissions,
  RecommendationType.ProductPackagesStarterPack,
  RecommendationType.ProductPackagesGeneric,
  RecommendationType.ProductPackagesSeasonPass,
  RecommendationType.ProductPackagesEngagementRewards,
] as const;

const AnalyticsProductRecommendationTile: FC<{
  insightType: TAssistantSummaryInsight;
  recommendation: TAnalyticsProductRecommendation;
  onDismiss?: (recommendation: TAnalyticsProductRecommendation) => void;
}> = ({ insightType, recommendation, onDismiss }) => {
  const { id: universeId } = useUniverseResource();
  const { rootPlaceId } = useExperienceAnalyticsGameDetails();
  const { translate } = useRAQIV2TranslationDependencies();
  const { mutate: snoozeRecommendation } = useSnoozeInsight(
    universeId,
    insightType,
    recommendation.recommendationType,
    DEFAULT_RECOMMENDATION_SNOOZE_DURATION,
  );
  const { open, dialog } = useStudio();

  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { descriptionKey: titleKey, headingKey: descriptionKey } = useMemo(
    () => getAnalyticsProductRecommendationConfig(recommendation),
    [recommendation],
  );

  const url = useMemo(() => {
    if (
      isValidArrayEnumValue(RecommendationsWithNonStaticLinks, recommendation.recommendationType)
    ) {
      return null;
    }

    const [info] = recommendationTypeToTranslationInfo(
      recommendation.recommendationType,
      universeId,
      rootPlaceId,
      recommendation.attributes,
    );

    if (!info?.links?.[0]?.url) {
      throw new Error(
        `No valid link found for recommendation type: ${recommendation.recommendationType}`,
      );
    }

    return info.links[0].url;
  }, [rootPlaceId, recommendation, universeId]);

  const onImpressionEvent = useCallback(() => {
    logAssistantEvent(
      unifiedLogger,
      AssistantImpressionEventName.AssistantReportProductRecommendationImpression,
      {
        universeId,
        insightType,
        recommendationType: recommendation.recommendationType,
      },
    );
  }, [unifiedLogger, universeId, insightType, recommendation.recommendationType]);

  const onCardClick = useCallback(() => {
    if (
      isValidArrayEnumValue(RecommendationsWithNonStaticLinks, recommendation.recommendationType)
    ) {
      switch (recommendation.recommendationType) {
        case RecommendationType.ProductStudioPublish:
          open({
            task: EStudioTaskType.EditPlace,
            universeId: universeId.toString(),
            placeId: rootPlaceId.toString(),
          });
          return;
        default:
          throw new Error(`Unsupported recommendation type: ${recommendation.recommendationType}`);
      }
    }

    if (!url) {
      throw new Error(`No URL found for recommendation type: ${recommendation.recommendationType}`);
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    logAssistantEvent(
      unifiedLogger,
      AssistantClickEventName.AssistantReportProductRecommendationClick,
      {
        universeId,
        insightType,
        recommendationType: recommendation.recommendationType,
      },
    );
  }, [
    recommendation.recommendationType,
    url,
    unifiedLogger,
    universeId,
    insightType,
    open,
    rootPlaceId,
  ]);

  const onNotInterestedClick = useCallback(() => {
    snoozeRecommendation();
    logAssistantEvent(
      unifiedLogger,
      AssistantClickEventName.AssistantReportProductRecommendationDismiss,
      {
        universeId,
        insightType,
        recommendationType: recommendation.recommendationType,
      },
    );
    if (onDismiss) {
      onDismiss(recommendation);
    }
  }, [snoozeRecommendation, unifiedLogger, universeId, insightType, recommendation, onDismiss]);

  const onAlreadyImplementedClick = useCallback(() => {
    snoozeRecommendation();
    logAssistantEvent(
      unifiedLogger,
      AssistantClickEventName.AssistantReportProductRecommendationAlreadyImplemented,
      {
        universeId,
        insightType,
        recommendationType: recommendation.recommendationType,
      },
    );
    if (onDismiss) {
      onDismiss(recommendation);
    }
  }, [snoozeRecommendation, unifiedLogger, universeId, insightType, recommendation, onDismiss]);

  const actionItems = useMemo(() => {
    const notInterestedAction = {
      text: translate({
        key: 'Action.NotInterested',
        namespace: TranslationNamespace.AnalyticsAssistant,
      }),
      onClick: onNotInterestedClick,
    };

    const alreadyImplementedAction = {
      text: translate({
        key: 'Action.AlreadyImplemented',
        namespace: TranslationNamespace.AnalyticsAssistant,
      }),
      onClick: onAlreadyImplementedClick,
    };

    const showAlreadyImplemented = isValidArrayEnumValue(
      NON_TRACKED_RECOMMENDATION_TYPES,
      recommendation.recommendationType,
    );

    return [notInterestedAction, ...(showAlreadyImplemented ? [alreadyImplementedAction] : [])];
  }, [
    translate,
    onNotInterestedClick,
    onAlreadyImplementedClick,
    recommendation.recommendationType,
  ]);

  return (
    <React.Fragment>
      <GenericTile
        headerText={translate(descriptionKey)}
        subheadingText={translate(titleKey)}
        actionItems={actionItems}
        onClick={onCardClick}
        onImpression={onImpressionEvent}
      />
      {dialog}
    </React.Fragment>
  );
};

export default AnalyticsProductRecommendationTile;
