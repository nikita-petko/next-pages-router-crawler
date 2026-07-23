import React, { FC, useMemo } from 'react';
import { analyticsCreationOverviewNavigationItem } from '@modules/charts-generic';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useAssistantSurfaceContext } from '../../context/AssistantSurfaceContextProvider';
import AssistantCanvasCard from '../canvas/AssistantCanvasCard';
import GenericAssistantPageLayout from './GenericAssistantPageLayout';
import AssistantSummaryDisplayConfigs from '../../constants/AssistantSummaryDisplayConfigs';
import AssistantReportCardV2 from '../report/v2/AssistantReportCardV2';

const ExperienceAnalyticsAssistantPage: FC = () => {
  const { assistantSummarySpec, canvasContent } = useAssistantSurfaceContext();
  const { isAssistantInlineLayoutEnabled } = useFeatureFlagsForNamespace(
    'isAssistantInlineLayoutEnabled',
    FeatureFlagNamespace.Analytics,
  );
  const prevPage = useMemo(
    () =>
      assistantSummarySpec
        ? AssistantSummaryDisplayConfigs[assistantSummarySpec.type].prevPage
        : analyticsCreationOverviewNavigationItem,
    [assistantSummarySpec],
  );

  const assistantPanel = useMemo(() => {
    if (!assistantSummarySpec) return null;
    return <AssistantReportCardV2 assistantSummarySpec={assistantSummarySpec} />;
  }, [assistantSummarySpec]);

  const canvasPanel = useMemo(
    () =>
      canvasContent && assistantSummarySpec ? (
        <AssistantCanvasCard assistantSummarySpec={assistantSummarySpec} />
      ) : null,
    [canvasContent, assistantSummarySpec],
  );

  return (
    <GenericAssistantPageLayout
      prevPage={prevPage}
      assistantPanel={assistantPanel}
      canvasPanel={canvasPanel}
      useInlineLayout={isAssistantInlineLayoutEnabled}
    />
  );
};
export default ExperienceAnalyticsAssistantPage;
