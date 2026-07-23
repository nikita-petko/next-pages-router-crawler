import React, { FC, useMemo, useCallback } from 'react';
import {
  useUniverseResource,
  useGetInsightsV2Specs,
  InsightTypeV2,
} from '@modules/experience-analytics-shared';
import {
  analyticsAssistantNavigationItem,
  buildExperienceAnalyticsUrlWithParams,
} from '@modules/charts-generic';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { OpenInNewIcon } from '@rbx/ui';
import { RecommendationType } from '@modules/clients/analytics';
import {
  TAssistantSummaryInsight,
  isSummaryReport,
} from '../../../../types/AssistantSummaryInsightType';
import { ReportSectionType } from '../../../../types/AssistantSummaryInsightSpec';
import { logAssistantEvent, AssistantClickEventName } from '../../../../utils/AssistantLogger';
import { useAssistantSurfaceContext } from '../../../../context/AssistantSurfaceContextProvider';
import GenericReportSectionV2 from './GenericReportSectionV2';
import { SectionComponentProps } from './types';

const SummaryReportInsightTypeToPlayerFeedbackType: Record<
  InsightTypeV2.SummaryReport | InsightTypeV2.SummaryReport7Days,
  InsightTypeV2
> = {
  [InsightTypeV2.SummaryReport7Days]: InsightTypeV2.PlayerFeedbackReport7Days,
  [InsightTypeV2.SummaryReport]: InsightTypeV2.PlayerFeedbackReport28Days,
};

const PlayerFeedbackLinkSection: FC<SectionComponentProps<TAssistantSummaryInsight>> = ({
  section,
  children,
}) => {
  if (section.type !== ReportSectionType.Link) {
    throw new Error('PlayerFeedbackLinkSection can only render Link type sections');
  }

  if (section.linkData.recommendationType !== RecommendationType.ViewPlayerFeedback) {
    throw new Error('PlayerFeedbackLinkSection can only handle ViewPlayerFeedback recommendations');
  }

  const { id: universeId } = useUniverseResource();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { assistantSummarySpec } = useAssistantSurfaceContext();

  const { data, isDataLoading } = useGetInsightsV2Specs(
    universeId,
    assistantSummarySpec && isSummaryReport(assistantSummarySpec.type)
      ? [SummaryReportInsightTypeToPlayerFeedbackType[assistantSummarySpec.type]]
      : [],
    1,
    assistantSummarySpec?.endDate.toISOString() || '',
  );

  const playerFeedbackReportInsightId = useMemo(() => {
    if (isDataLoading) {
      return null;
    }

    const specs = data?.insightCardSpecs;
    if (!specs || specs.length === 0) {
      return null;
    }

    return specs[0].insightId;
  }, [data, isDataLoading]);

  const href = useMemo(() => {
    if (playerFeedbackReportInsightId) {
      return buildExperienceAnalyticsUrlWithParams(
        analyticsAssistantNavigationItem,
        {
          insightId: playerFeedbackReportInsightId,
        },
        universeId,
      );
    }
    return null;
  }, [playerFeedbackReportInsightId, universeId]);

  const handleClick = useCallback(() => {
    if (playerFeedbackReportInsightId && assistantSummarySpec) {
      logAssistantEvent(unifiedLogger, AssistantClickEventName.ViewPlayerFeedbackClick, {
        universeId,
        insightId: playerFeedbackReportInsightId,
        insightType: assistantSummarySpec.type,
      });

      // Open in new tab
      if (href) {
        window.open(href, '_blank');
      }
    }
  }, [unifiedLogger, universeId, playerFeedbackReportInsightId, assistantSummarySpec, href]);

  return (
    <GenericReportSectionV2 iconComponent={href ? OpenInNewIcon : undefined} onClick={handleClick}>
      {children}
    </GenericReportSectionV2>
  );
};

export default PlayerFeedbackLinkSection;
