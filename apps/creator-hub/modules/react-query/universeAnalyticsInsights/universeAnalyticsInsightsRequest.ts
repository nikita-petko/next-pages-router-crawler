import type { MetricsSummaryInput } from '@rbx/client-universe-analytics-insights/v1';
import { UniverseAnalyticsInsightsAPIApi } from '@rbx/client-universe-analytics-insights/v1';
import { isNonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import type { Insight, InsightTypeV2 } from '@modules/clients/analytics';
import { universeAnalyticsInsightsClient, isValidInsight } from '@modules/clients/analytics';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import GenerateMetricsSummaryNotDoneError from './errors/GenerateMetricsSummaryNotDoneError';
import GenerateMetricsSummaryTimeoutError from './errors/GenerateMetricsSummaryTimeoutError';

const configuration = createClientConfiguration('universe-analytics-insights', 'bedev2');
const universeAnalyticsInsightsApi = new UniverseAnalyticsInsightsAPIApi(configuration);

export const snoozeInsightRequest = (
  universeId: number,
  insightType: InsightTypeV2,
  snoozeKey: string,
  snoozeDuration?: string,
) => {
  const request = {
    universeId,
    insightType,
    snoozeKey,
    snoozeDuration,
  };

  return universeAnalyticsInsightsApi.v2UniversesUniverseIdInsightsSnoozePost(request);
};

export const getInsightsRequest = (
  universeId: number,
  insightTypes: InsightTypeV2[],
  limit?: number,
  createdBeforeUtcTime?: string,
): Promise<Insight[]> => {
  if (!isNonEmptyArray(insightTypes)) {
    return Promise.resolve([]);
  }

  const request = { universeId, insightTypes, limit, createdBeforeUtcTime };

  // NOTE: (@bxu - 2024/08/21) Move this to use the API client here instead of a wrapper inside @modules/clients
  // to centralize all insights fetch logic in this file instead.
  return universeAnalyticsInsightsClient.getUniverseAnalyticsInsights(request);
};

export const getMostRecentInsightsRequest = (
  universeId: number,
  insightTypes: InsightTypeV2[],
): Promise<Insight[]> => {
  if (!isNonEmptyArray(insightTypes)) {
    return Promise.resolve([]);
  }

  const request = { universeId, insightTypes };
  return universeAnalyticsInsightsClient.getUniverseAnalyticsMostRecentInsights(request);
};

export const getInsightByInsightIdRequest = (
  universeId: number,
  insightId?: string,
): Promise<Insight | undefined> => {
  if (!insightId) {
    return Promise.resolve(undefined);
  }

  const request = { universeId, id: insightId };
  return universeAnalyticsInsightsClient.getUniverseAnalyticsInsightByInsightId(request);
};

/**
 * Helper function to check if an error is a timeout error that should be retried
 */
async function isTimeoutError(error: unknown): Promise<boolean> {
  // Check if it's the parsed error response with code 0 and timeout message
  const parsedError = await tryParseResponseError(error);
  if (parsedError && parsedError.code === 0) {
    const message = parsedError.message.toLowerCase();
    return message.includes('timeout') || message.includes('upstream request timeout');
  }

  // Also check the error message directly
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('timeout') || message.includes('upstream request timeout');
  }

  return false;
}

export const generateMetricsSummaryRequest = async (
  universeId: number,
  metricsSummaryInput: MetricsSummaryInput,
): Promise<Insight> => {
  try {
    const response =
      await universeAnalyticsInsightsApi.v2UniversesUniverseIdInsightsMetricsSummaryPost({
        universeId,
        generateMetricsSummaryRequest: {
          input: metricsSummaryInput,
        },
      });

    if (!response.done) {
      throw new GenerateMetricsSummaryNotDoneError();
    }

    if (!response.insight) {
      throw new Error('GenerateMetricsSummary completed but insight is missing');
    }

    if (!isValidInsight(response.insight)) {
      throw new Error('GenerateMetricsSummary completed but insight is not valid');
    }

    return response.insight;
  } catch (error) {
    // Check if this is a timeout error that should be retried
    if (await isTimeoutError(error)) {
      throw new GenerateMetricsSummaryTimeoutError(
        error instanceof Error ? error.message : 'Upstream request timeout',
      );
    }

    // Re-throw other errors (including GenerateMetricsSummaryNotDoneError)
    throw error;
  }
};
