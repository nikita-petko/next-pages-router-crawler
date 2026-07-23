import type { FC } from 'react';
import React, { useMemo } from 'react';
import AssistantSummaryDisplayConfigs from '../../constants/AssistantSummaryDisplayConfigs';
import { useAssistantSurfaceContext } from '../../context/AssistantSurfaceContextProvider';
import type { AssistantSummaryInsightSpec } from '../../types/AssistantSummaryInsightSpec';
import GenericCanvasCard from './GenericCanvasCard';

const AssistantCanvasCard: FC<{ assistantSummarySpec: AssistantSummaryInsightSpec }> = ({
  assistantSummarySpec,
}) => {
  const { canvasContent } = useAssistantSurfaceContext();

  const {
    canvas: { titleKey, titleIcon },
  } = useMemo(
    () => AssistantSummaryDisplayConfigs[assistantSummarySpec.type],
    [assistantSummarySpec.type],
  );

  return (
    <GenericCanvasCard header={{ titleKey, icon: titleIcon }}>{canvasContent}</GenericCanvasCard>
  );
};

export default AssistantCanvasCard;
