import type { FC } from 'react';
import { useMemo } from 'react';
import { useAssistantSurfaceContext } from '../../context/AssistantSurfaceContextProvider';
import AssistantCanvasCard from '../canvas/AssistantCanvasCard';
import AssistantReportCardV2 from '../report/v2/AssistantReportCardV2';
import GenericAssistantPageLayout from './GenericAssistantPageLayout';

const ExperienceAnalyticsAssistantPage: FC = () => {
  const { assistantSummarySpec, isAssistantSummarySpecLoading, canvasContent } =
    useAssistantSurfaceContext();

  const assistantPanel = useMemo(() => {
    if (!assistantSummarySpec) {
      return null;
    }
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
      assistantPanel={assistantPanel}
      canvasPanel={canvasPanel}
      isLoading={isAssistantSummarySpecLoading}
    />
  );
};
export default ExperienceAnalyticsAssistantPage;
