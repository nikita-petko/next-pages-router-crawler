import type {
  V2UniversesUniverseIdInsightsGetRequest,
  V2UniversesUniverseIdInsightsBenchmarkScorecardGetRequest,
  GetBenchmarkScorecardResponse,
  Insight as InsightRaw,
  V2UniversesUniverseIdInsightsIdDetailGetRequest,
  V2UniversesUniverseIdInsightsMostRecentGetRequest,
  BenchmarkType,
  BenchmarkTypeData,
} from '@rbx/client-universe-analytics-insights/v1';
import {
  UniverseAnalyticsInsightsAPIApi,
  BenchmarkTypeFromJSON,
} from '@rbx/client-universe-analytics-insights/v1';
import { getBEDEV2ServiceBasePath } from '../utils';
import { createClientConfiguration } from '../utils/createClientConfiguration';

type AvailableBenchmarkTypesData = {
  availableTypes: BenchmarkType[];
  recommendedType: BenchmarkType;
};

type InsightRequiredField = 'id' | 'universeId' | 'insightType' | 'createdUtcTime' | 'snoozeKey';

type Insight = Required<Pick<InsightRaw, InsightRequiredField>> &
  Exclude<InsightRaw, InsightRequiredField>;

type BenchmarkScorecardData = Required<
  Pick<
    GetBenchmarkScorecardResponse,
    | 'metricTime'
    | 'currentPercentile'
    | 'currentValue'
    | 'percentChange'
    | 'availableBenchmarks'
    | 'benchmarkTime'
    | 'metricCurrentValue'
    | 'metricPercentChange'
    | 'recommendedType'
  >
> & {
  P50Value: number;
  P90Value: number;
  // Mapping of benchmark types to their data for efficient switching
  benchmarkDataByType: Map<BenchmarkType, BenchmarkTypeData>;
  // Available benchmark types for dropdown
  availableBenchmarkTypes: Set<BenchmarkType>;
};

export type { Insight, BenchmarkScorecardData, AvailableBenchmarkTypesData };

const basePath = getBEDEV2ServiceBasePath('universe-analytics-insights');

const configuration = createClientConfiguration('universe-analytics-insights', 'bedev2');

const universeAnalyticsInsightsApi = new UniverseAnalyticsInsightsAPIApi(configuration);

export type UniverseAnalyticsInsightsClient = {
  getUniverseAnalyticsInsights(
    universeInsightGetRequest: V2UniversesUniverseIdInsightsGetRequest,
  ): Promise<Insight[]>;
  getUniverseAnalyticsInsightByInsightId(
    universeInsightGetByInsightIdRequest: V2UniversesUniverseIdInsightsIdDetailGetRequest,
  ): Promise<Insight | undefined>;
  getUniverseAnalyticsMostRecentInsights(
    universeInsightMostRecentGetRequest: V2UniversesUniverseIdInsightsMostRecentGetRequest,
  ): Promise<Insight[]>;
  getUniverseBenchmarkScorecard(
    universeBenchmarkScorecardGetRequest: V2UniversesUniverseIdInsightsBenchmarkScorecardGetRequest,
  ): Promise<BenchmarkScorecardData>;
  getAvailableBenchmarkTypes(params: {
    universeId: number;
    metric: string;
  }): Promise<AvailableBenchmarkTypesData>;
};

export const isValidInsight = (insight: InsightRaw): insight is Insight => {
  return (
    typeof insight !== 'undefined' &&
    typeof insight.id !== 'undefined' &&
    typeof insight.universeId !== 'undefined' &&
    typeof insight.createdUtcTime !== 'undefined'
  );
};

const universeAnalyticsInsightsClient: UniverseAnalyticsInsightsClient = {
  getUniverseAnalyticsInsights: async (
    universeInsightGetRequest: V2UniversesUniverseIdInsightsGetRequest,
  ): Promise<Insight[]> => {
    const rawRes =
      await universeAnalyticsInsightsApi.v2UniversesUniverseIdInsightsGet(
        universeInsightGetRequest,
      );
    if (!rawRes.insights) {
      throw new Error('getUniverseAnalyticsInsights - not a valid insight response');
    }
    return rawRes.insights.filter(isValidInsight);
  },
  getUniverseAnalyticsInsightByInsightId: async (
    universeInsightGetByInsightIdRequest: V2UniversesUniverseIdInsightsIdDetailGetRequest,
  ): Promise<Insight | undefined> => {
    const rawRes = await universeAnalyticsInsightsApi.v2UniversesUniverseIdInsightsIdDetailGet(
      universeInsightGetByInsightIdRequest,
    );
    return rawRes.insight && isValidInsight(rawRes.insight) ? rawRes.insight : undefined;
  },
  getUniverseAnalyticsMostRecentInsights: async (
    universeInsightMostRecentGetRequest: V2UniversesUniverseIdInsightsMostRecentGetRequest,
  ): Promise<Insight[]> => {
    const rawRes = await universeAnalyticsInsightsApi.v2UniversesUniverseIdInsightsMostRecentGet(
      universeInsightMostRecentGetRequest,
    );
    if (!rawRes.insights) {
      throw new Error('getUniverseAnalyticsMostRecentInsights - not a valid insight response');
    }
    return rawRes.insights.filter(isValidInsight);
  },
  getUniverseBenchmarkScorecard: async (
    universeBenchmarkScorecardGetRequest: V2UniversesUniverseIdInsightsBenchmarkScorecardGetRequest,
  ): Promise<BenchmarkScorecardData> => {
    const rawRes =
      await universeAnalyticsInsightsApi.v2UniversesUniverseIdInsightsBenchmarkScorecardGet(
        universeBenchmarkScorecardGetRequest,
      );
    if (
      !rawRes ||
      !rawRes.metricTime ||
      rawRes.currentValue === undefined ||
      rawRes.currentPercentile === undefined ||
      rawRes.percentChange === undefined ||
      rawRes.percentileMap?.['50'] === undefined ||
      rawRes.percentileMap?.['90'] === undefined ||
      rawRes.availableBenchmarks === undefined ||
      rawRes.benchmarkTime === undefined ||
      rawRes.metricCurrentValue === undefined ||
      rawRes.metricPercentChange === undefined ||
      rawRes.recommendedType === undefined
    ) {
      throw new Error('getUniverseBenchmarkScorecard - not a valid benchmark score card response');
    }

    // Create mapping of benchmark types to their data for efficient switching
    const benchmarkDataByType = new Map<BenchmarkType, BenchmarkTypeData>();
    const availableBenchmarkTypes = new Set<BenchmarkType>();

    if (rawRes.availableBenchmarks) {
      rawRes.availableBenchmarks.forEach((benchmarkData) => {
        if (benchmarkData.benchmarkType) {
          benchmarkDataByType.set(benchmarkData.benchmarkType, benchmarkData);
          availableBenchmarkTypes.add(benchmarkData.benchmarkType);
        }
      });
    }

    return {
      metricTime: rawRes.metricTime,
      currentValue: rawRes.currentValue,
      currentPercentile: rawRes.currentPercentile,
      percentChange: rawRes.percentChange,
      P50Value: rawRes.percentileMap['50'],
      P90Value: rawRes.percentileMap['90'],
      availableBenchmarks: rawRes.availableBenchmarks,
      benchmarkTime: rawRes.benchmarkTime,
      metricCurrentValue: rawRes.metricCurrentValue,
      metricPercentChange: rawRes.metricPercentChange,
      recommendedType: rawRes.recommendedType,
      benchmarkDataByType,
      availableBenchmarkTypes,
    };
  },
  getAvailableBenchmarkTypes: async (params: {
    universeId: number;
    metric: string;
  }): Promise<AvailableBenchmarkTypesData> => {
    const url = `${basePath}/v2/universes/${params.universeId}/insights/available-benchmark-types?metric=${encodeURIComponent(params.metric)}`;
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`getAvailableBenchmarkTypes failed with status ${response.status}`);
    }
    // oxlint-disable-next-line no-unsafe-assignment -- response.json() returns Promise<any>
    const json: { availableTypes?: unknown[]; recommendedType?: unknown } = await response.json();
    const availableTypes: BenchmarkType[] = (json.availableTypes ?? []).map(BenchmarkTypeFromJSON);
    const recommendedType: BenchmarkType = BenchmarkTypeFromJSON(json.recommendedType);
    return { availableTypes, recommendedType };
  },
};

export default universeAnalyticsInsightsClient;
