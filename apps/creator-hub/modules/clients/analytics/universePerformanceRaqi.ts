import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  ErrorLoggingApi,
  ErrorLoggingDetailApi,
  QueryGranularity,
  ErrorLoggingQueryOperationRequest,
  ErrorLoggingQueryRequest,
  ErrorLoggingDimension,
  QueryResponse as clientQueryResponse,
  ErrorLoggingMetric,
  ErrorLoggingDetailGetTopLogsOperationRequest,
  ErrorLoggingDetailResponse,
  ErrorLoggingMetricFilter,
  LiveStatsApi,
  LiveStatsMetric,
  LiveStatsMetricFilter,
  LiveStatsQueryRequest,
  LiveStatsDimension,
  MetricsPageType,
} from '@rbx/clients/universePerformanceRaqi';
import { getBEDEV2ServiceBasePath } from '../utils';

// Proxy export types from client
export { ErrorLoggingDimension, ErrorLoggingMetric, LiveStatsMetric, MetricsPageType };

export type {
  DataPoint as RAQIDataPoint,
  ErrorLoggingDetail,
  PlaceMetadata,
} from '@rbx/clients/universePerformanceRaqi';

export type QueryResponse = clientQueryResponse;

export type UniversePerformanceDimension = ErrorLoggingDimension;

export enum PerformanceAPIGranularity {
  Daily = 'Daily',
  Hourly = 'Hourly',
  Minutely = 'Minutely',
  ThirtyMinutely = 'ThirtyMinutely',
}

export type GetErrorStatsApiRequest = {
  startDate: Date;
  endDate: Date;
  universeId: number;
  placeId: number | null;
  placeVersionFilter: PlaceVersionNumber[] | null;
  granularity: PerformanceAPIGranularity;
  textFilter?: string;
  logSeverityFilter?: SupportedLogSeverities;
  logSourceFilter?: SupportedLogSources;
};

export type GetLiveStatsApiRequest = {
  universeId: number;
  metric: LiveStatsMetric;
  filters: LiveStatsMetricFilter[] | null;
};

export type GetPlacesForUniverseApiRequest = {
  universeId: number;
  metricsPageType: MetricsPageType;
};

export type GetErrorLogsRequest = {
  universeId: number;
  startTime: Date;
  endTime: Date;
  placeId: number | null;
  placeVersionFilter: PlaceVersionNumber[] | null;
  textFilter?: string;
  logSeverityFilter?: SupportedLogSeverities;
  logSourceFilter?: SupportedLogSources;
  pagination?: {
    paginationToken?: string;
    pageSize: number;
  };
};

export type PlaceVersionNumber = string;

export enum SupportedLogSeverities {
  Error = 'Error',
  Warning = 'Warning',
  All = 'all',
}

export enum SupportedLogSources {
  Client = 'Client',
  Server = 'Server',
  All = 'all',
}

const getQueryGranularityForPerformanceAPIGranularity = (
  granularity: PerformanceAPIGranularity,
): QueryGranularity => {
  switch (granularity) {
    case PerformanceAPIGranularity.Daily:
      return QueryGranularity.OneDay;
    case PerformanceAPIGranularity.Hourly:
      return QueryGranularity.OneHour;
    case PerformanceAPIGranularity.Minutely:
      return QueryGranularity.OneMinute;
    case PerformanceAPIGranularity.ThirtyMinutely:
      return QueryGranularity.ThirtyMinutes;
    default: {
      const exhaustiveCheck: never = granularity;
      throw new Error(`Unknown performance API granularity ${exhaustiveCheck}`);
    }
  }
};

const getFiltersForErrorMetrics = ({
  placeId,
  placeVersionFilter,
  textFilter,
  logSeverityFilter,
  logSourceFilter,
}: {
  placeId: number | null;
  placeVersionFilter: PlaceVersionNumber[] | null;
  textFilter?: string;
  logSeverityFilter?: SupportedLogSeverities;
  logSourceFilter?: SupportedLogSources;
}): ErrorLoggingMetricFilter[] => {
  const filters: ErrorLoggingMetricFilter[] = [];

  if (placeId) {
    filters.push({
      dimension: ErrorLoggingDimension.Place,
      values: [`${placeId}`],
    });
  }

  if (placeVersionFilter?.length) {
    filters.push({
      dimension: ErrorLoggingDimension.PlaceVersion,
      values: placeVersionFilter,
    });
  }

  if (textFilter && textFilter !== '') {
    filters.push({
      dimension: ErrorLoggingDimension.Keyword,
      values: [textFilter],
    });
  }

  if (logSeverityFilter && logSeverityFilter !== SupportedLogSeverities.All) {
    filters.push({
      dimension: ErrorLoggingDimension.LogSeverity,
      values: [logSeverityFilter],
    });
  }

  if (logSourceFilter && logSourceFilter !== SupportedLogSources.All) {
    filters.push({
      dimension: ErrorLoggingDimension.LogSource,
      values: [logSourceFilter],
    });
  }

  return filters;
};

export class UniversePerformanceRaqiClient {
  private errorLoggingApi: ErrorLoggingApi;

  private errorLoggingDetailApi: ErrorLoggingDetailApi;

  private liveStatsApi: LiveStatsApi;

  constructor(basePath: string = getBEDEV2ServiceBasePath('universe-performance-raqi')) {
    const configuration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

    this.errorLoggingApi = new ErrorLoggingApi(configuration);
    this.errorLoggingDetailApi = new ErrorLoggingDetailApi(configuration);
    this.liveStatsApi = new LiveStatsApi(configuration);
  }

  async getErrorMetricsTotal({
    startDate,
    endDate,
    universeId,
    placeId,
    placeVersionFilter,
    granularity,
    textFilter,
    logSeverityFilter,
    logSourceFilter,
  }: GetErrorStatsApiRequest): Promise<clientQueryResponse> {
    const errorLoggingQueryRequest: ErrorLoggingQueryRequest = {
      metric: ErrorLoggingMetric.TotalLogCount,
      granularity: getQueryGranularityForPerformanceAPIGranularity(granularity),
      startTime: startDate,
      endTime: endDate,
      breakdown: [],
      filters: getFiltersForErrorMetrics({
        placeId,
        placeVersionFilter,
        textFilter,
        logSeverityFilter,
        logSourceFilter,
      }),
    };
    const queryOperationRequest: ErrorLoggingQueryOperationRequest = {
      universeId,
      errorLoggingQueryRequest,
    };
    return this.errorLoggingApi.errorLoggingQuery(queryOperationRequest);
  }

  async getErrorMetricsBySource({
    startDate,
    endDate,
    universeId,
    placeId,
    placeVersionFilter,
    granularity,
    textFilter,
    logSeverityFilter,
    logSourceFilter,
  }: GetErrorStatsApiRequest): Promise<clientQueryResponse> {
    const errorLoggingQueryRequest: ErrorLoggingQueryRequest = {
      metric: ErrorLoggingMetric.TotalLogCount,
      granularity: getQueryGranularityForPerformanceAPIGranularity(granularity),
      startTime: startDate,
      endTime: endDate,
      breakdown: [ErrorLoggingDimension.LogSource],
      filters: getFiltersForErrorMetrics({
        placeId,
        placeVersionFilter,
        textFilter,
        logSeverityFilter,
        logSourceFilter,
      }),
    };
    const queryOperationRequest: ErrorLoggingQueryOperationRequest = {
      universeId,
      errorLoggingQueryRequest,
    };
    return this.errorLoggingApi.errorLoggingQuery(queryOperationRequest);
  }

  async getErrorLogs({
    universeId,
    startTime,
    endTime,
    placeId,
    placeVersionFilter,
    textFilter,
    logSeverityFilter,
    logSourceFilter,
    pagination,
  }: GetErrorLogsRequest): Promise<ErrorLoggingDetailResponse> {
    const getTopLogsRequest: ErrorLoggingDetailGetTopLogsOperationRequest = {
      universeId,
      errorLoggingDetailGetTopLogsRequest: {
        startTime,
        endTime,
        filters: getFiltersForErrorMetrics({
          placeId,
          placeVersionFilter,
          textFilter,
          logSeverityFilter,
          logSourceFilter,
        }),
        pagination,
      },
    };

    return this.errorLoggingDetailApi.errorLoggingDetailGetTopLogs(getTopLogsRequest);
  }

  async getLiveStatsTotal({
    universeId,
    metric,
    filters,
  }: GetLiveStatsApiRequest): Promise<clientQueryResponse> {
    const liveStatsQueryRequest: LiveStatsQueryRequest = {
      metric,
      filters,
    };
    return this.liveStatsApi.liveStatsQuery({ universeId, liveStatsQueryRequest });
  }

  async getLiveStatsByPlatform({
    universeId,
    metric,
    filters,
  }: GetLiveStatsApiRequest): Promise<clientQueryResponse> {
    const liveStatsQueryRequest: LiveStatsQueryRequest = {
      metric,
      filters,
      breakdown: [LiveStatsDimension.Platform],
    };
    return this.liveStatsApi.liveStatsQuery({ universeId, liveStatsQueryRequest });
  }
}

const universePerformanceRaqiClient = new UniversePerformanceRaqiClient();
export default universePerformanceRaqiClient;
