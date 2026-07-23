import type React from 'react';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import { renderSignalChartElement } from '../../hooks/useGetSignalCharts';
import {
  AnalyticsChatDataPartType,
  type AnalyticsChatMessage,
  type SignalDataPart,
} from '../../types/AnalyticsChatTypes';
import { toValidatedSignal } from '../../validation/makeValidatedInsightsV2API';
import adaptSignalToChartElement from '../adaptSignalToChartElement';
import { adaptValidatedSignal } from '../adaptSummaryReportInsight';
import { formatUnknownError } from './formatUnknownValue';

type AnalyticsChatMessagePart = AnalyticsChatMessage['parts'][number];

type AdaptSignalDataPartOptions = {
  universeId: number;
  signalDedupKeys: Set<string>;
};

export function adaptSignalDataPart(
  part: SignalDataPart,
  { universeId, signalDedupKeys }: AdaptSignalDataPartOptions,
): React.ReactNode[] {
  try {
    const validatedSignal = toValidatedSignal(part.data);
    const signal = adaptValidatedSignal(validatedSignal);
    if (!signal) {
      return [];
    }

    const chartElements = adaptSignalToChartElement(signal, universeId);
    return chartElements.flatMap((element) => {
      if (signalDedupKeys.has(element.dedupKey)) {
        return [];
      }
      signalDedupKeys.add(element.dedupKey);
      return [renderSignalChartElement(element)];
    });
  } catch (err) {
    logAnalyticsError(`Error validating signal: ${formatUnknownError(err)}`);
    return [];
  }
}

export function isSignalDataPart(part: AnalyticsChatMessagePart): part is SignalDataPart {
  return part.type === AnalyticsChatDataPartType.Signal;
}
