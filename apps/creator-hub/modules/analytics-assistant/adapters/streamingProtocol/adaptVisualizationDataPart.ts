import React from 'react';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import AssistantVisualizationCard from '../../components/visualizations/AssistantVisualizationCard';
import {
  AnalyticsChatDataPartType,
  type AnalyticsChatMessage,
  type VisualizationDataPart,
} from '../../types/AnalyticsChatTypes';
import { toValidatedVisualizationEnvelope } from '../../validation/makeValidatedVisualizationArtifact';
import { adaptVisualizationToChartElement } from '../adaptVisualizationToChartElement';
import { formatUnknownError } from './formatUnknownValue';

type AnalyticsChatMessagePart = AnalyticsChatMessage['parts'][number];

type AdaptVisualizationDataPartOptions = {
  conversationId?: string;
};

export function adaptVisualizationDataPart(
  part: VisualizationDataPart,
  partIndex: number,
  { conversationId }: AdaptVisualizationDataPartOptions = {},
): React.ReactNode[] {
  try {
    return toValidatedVisualizationEnvelope(part.data).artifacts.map((artifact, artifactIndex) => {
      const element = adaptVisualizationToChartElement(artifact, artifactIndex);
      return React.createElement(AssistantVisualizationCard, {
        key: `visualization-${partIndex}-${element.key}`,
        element,
        conversationId,
      });
    });
  } catch (err) {
    logAnalyticsError(`Error validating visualization: ${formatUnknownError(err)}`);
    return [];
  }
}

export function isVisualizationDataPart(
  part: AnalyticsChatMessagePart,
): part is VisualizationDataPart {
  return part.type === AnalyticsChatDataPartType.Visualization;
}
