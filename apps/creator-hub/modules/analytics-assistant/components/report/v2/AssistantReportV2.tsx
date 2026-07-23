import type { FC } from 'react';
import React, { useMemo, useCallback } from 'react';
import type {
  AssistantSummaryInsightSpec,
  GenericAssistantReportSection,
} from '../../../types/AssistantSummaryInsightSpec';
import { ReportSectionType } from '../../../types/AssistantSummaryInsightSpec';
import type { TAssistantSummaryInsight } from '../../../types/AssistantSummaryInsightType';
import MDX from '../../markdown/MDX';
import AnalyticsProductRecommendations from '../../recommendations/AnalyticsProductRecommendations';
import sectionTypeToComponent from './sections/sectionTypeToComponent';

type AssistantReportV2Props = {
  assistantSummarySpec: AssistantSummaryInsightSpec;
};

const AssistantReportV2: FC<AssistantReportV2Props> = ({ assistantSummarySpec }) => {
  const { insightId, type, report, hideCanvas } = assistantSummarySpec;

  const renderSection = useCallback(
    (section: GenericAssistantReportSection<TAssistantSummaryInsight>, index: number) => {
      const sectionKey = `section-${index}-${section.type}`;
      const content = <MDX content={section.content} />;
      const recommendationType =
        section.type === ReportSectionType.Link ? section.linkData.recommendationType : undefined;
      const recommendations =
        section.type === ReportSectionType.Text ? section.recommendations : undefined;

      // Determine the appropriate section component based on section type
      const SectionComponent = sectionTypeToComponent(section.type, recommendationType, hideCanvas);

      return (
        <React.Fragment key={sectionKey}>
          <SectionComponent section={section}>{content}</SectionComponent>
          {recommendations ? (
            <AnalyticsProductRecommendations
              key={`recommendations-${sectionKey}`}
              insightId={insightId}
              insightType={type}
              recommendations={recommendations}
            />
          ) : null}
        </React.Fragment>
      );
    },
    [insightId, type, hideCanvas],
  );

  const sections = useMemo(() => {
    const sectionsToRender = report?.sections || [];
    return sectionsToRender.length > 0 ? sectionsToRender.map(renderSection) : null;
  }, [report, renderSection]);

  return <>{sections}</>;
};

export default AssistantReportV2;
