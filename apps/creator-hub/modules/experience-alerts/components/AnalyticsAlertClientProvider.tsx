import React, { type FunctionComponent, useCallback, useContext, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import type {
  AnalyticsAlertConfigState,
  AnalyticsAlertApiClient,
  AnalyticsAlertDetail,
  AnalyticsAlertIncidentDetail,
  AnalyticsAlertSeverity,
  ExperienceAlertFormValues,
  ListAnalyticsAlertIncidentsRequest,
  ListAnalyticsAlertsRequest,
} from '../constants/types';
import {
  buildCreateAnalyticsAlertRequest,
  buildUpdateAnalyticsAlertRequest,
} from '../utils/analyticsAlertFormToApiRequest';
import {
  rawAnalyticsAlertToDetail,
  rawAnalyticsAlertIncidentToDetail,
} from '../utils/analyticsAlertResponseValidation';

const ANALYTICS_ALERTS_LIST_QUERY_KEY = ['analyticsAlerts', 'list'] as const;
const ANALYTICS_ALERTS_INCIDENTS_QUERY_KEY = ['analyticsAlerts', 'incidents'] as const;
export const ANALYTICS_ALERT_LIST_STALE_TIME_MS = 60_000;

export type AnalyticsAlertsListOptions = {
  ids?: string[];
  firingStatus?: ListAnalyticsAlertsRequest['firingStatus'];
  severities?: AnalyticsAlertSeverity[];
};

export type AnalyticsAlertIncidentsListOptions = {
  alertIds?: string[];
  severities?: AnalyticsAlertSeverity[];
};

/**
 * Stable, deduped, sorted `string[]` for an optional id-collection input. Returns
 * `undefined` when there are no non-empty ids so the request omits the param
 * (server-side semantics: "no `ids` filter" rather than "match nothing").
 */
const normalizeIdsParam = (ids: string[] | undefined): string[] | undefined => {
  if (!ids?.length) {
    return undefined;
  }
  const cleaned = [...new Set(ids.filter((id) => id.length > 0))].toSorted();
  return cleaned.length > 0 ? cleaned : undefined;
};

/**
 * Stable, deduped, ascending-sorted severity collection for an optional
 * severity-collection input. Returns `undefined` when empty so the request
 * omits the param. Values are the BE wire strings (`"SEV_0"` / `"SEV_1"` /
 * `"SEV_2"`); lexicographic sort happens to match the desired Critical →
 * Medium → Low ordering because of the numeric suffix.
 */
const normalizeSeveritiesParam = (
  severities: AnalyticsAlertSeverity[] | undefined,
): AnalyticsAlertSeverity[] | undefined => {
  if (!severities?.length) {
    return undefined;
  }
  const cleaned = [...new Set(severities)].toSorted();
  return cleaned.length > 0 ? cleaned : undefined;
};

const buildListAlertsRequest = (
  universeId: number,
  options?: AnalyticsAlertsListOptions,
): ListAnalyticsAlertsRequest => ({
  resourceType: RAQIV2ChartResourceType.Universe,
  resourceId: String(universeId),
  ids: normalizeIdsParam(options?.ids),
  firingStatus: options?.firingStatus,
  severities: normalizeSeveritiesParam(options?.severities),
});

/** React Query key for {@link AnalyticsAlertClient.listAlerts}; same args as {@link AnalyticsAlertClient.listAlerts}. */
export const analyticsAlertsListQueryKey = (
  universeId: number | undefined,
  options?: AnalyticsAlertsListOptions,
) =>
  [
    ...ANALYTICS_ALERTS_LIST_QUERY_KEY,
    universeId ?? uninitializedUniverseId,
    (normalizeIdsParam(options?.ids) ?? []).join(','),
    options?.firingStatus ?? '',
    (normalizeSeveritiesParam(options?.severities) ?? []).join(','),
  ] as const;

/** JSON segment for incident list query key: resource id, time range, filters (sorted values per filter), and optional alertIds/severities filters. */
const stringifyChartContextForAlertIncidentsQueryKey = (
  chartContext: RAQIV2ChartContext,
  options: AnalyticsAlertIncidentsListOptions | undefined,
): string => {
  const { resource, timeSpec, filter } = chartContext;
  const { startTime, endTime } = timeSpec;
  return JSON.stringify([
    resource.id,
    startTime.getTime(),
    endTime.getTime(),
    (filter ?? [])
      .toSorted((a, b) => a.dimension.localeCompare(b.dimension))
      .map((f) => ({
        ...f,
        values: f.values.toSorted((a, b) => a.localeCompare(b)),
      })),
    normalizeIdsParam(options?.alertIds) ?? [],
    normalizeSeveritiesParam(options?.severities) ?? [],
  ]);
};

/** React Query key for {@link AnalyticsAlertClient.listAlertIncidents}; same args as that method. */
export const analyticsAlertIncidentsQueryKey = (
  universeId: number | undefined,
  chartContext: RAQIV2ChartContext | undefined,
  options?: AnalyticsAlertIncidentsListOptions,
) =>
  [
    ...ANALYTICS_ALERTS_INCIDENTS_QUERY_KEY,
    universeId ?? uninitializedUniverseId,
    universeId != null && Number.isFinite(universeId) && universeId > 0 && chartContext != null
      ? stringifyChartContextForAlertIncidentsQueryKey(chartContext, options)
      : '',
  ] as const;

export type AnalyticsAlertClient = {
  listAlerts: (
    universeId: number | undefined,
    options?: AnalyticsAlertsListOptions,
  ) => Promise<AnalyticsAlertDetail[]>;
  listAlertIncidents: (
    universeId: number | undefined,
    chartContext: RAQIV2ChartContext | undefined,
    options?: AnalyticsAlertIncidentsListOptions,
  ) => Promise<AnalyticsAlertIncidentDetail[]>;
  createAlert: (
    universeId: number,
    values: ExperienceAlertFormValues,
  ) => Promise<AnalyticsAlertDetail>;
  updateAlert: (
    universeId: number,
    alertId: string,
    values: ExperienceAlertFormValues,
  ) => Promise<AnalyticsAlertDetail>;
  patchAlertConfigState: (params: {
    universeId: number;
    alertId: string;
    configState: AnalyticsAlertConfigState;
  }) => Promise<AnalyticsAlertDetail>;
  deleteAlert: (universeId: number, alertId: string) => Promise<void>;
};

export const AnalyticsAlertClientContext = React.createContext<AnalyticsAlertClient | null>(null);

/**
 * Returns the alert client when called inside an `AnalyticsAlertClientProvider`,
 * otherwise `null`. Use this from query hooks that need to no-op when no real
 * client is mounted.
 */
export const useAnalyticsAlertClientOrNull = (): AnalyticsAlertClient | null =>
  useContext(AnalyticsAlertClientContext);

export const useAnalyticsAlertClient = (): AnalyticsAlertClient => {
  const client = useAnalyticsAlertClientOrNull();
  if (!client) {
    throw new Error('useAnalyticsAlertClient must be used within an AnalyticsAlertClientProvider');
  }
  return client;
};

export type AnalyticsAlertClientProviderProps = React.PropsWithChildren<{
  client: AnalyticsAlertApiClient;
}>;

const AnalyticsAlertClientProvider: FunctionComponent<AnalyticsAlertClientProviderProps> = ({
  children,
  client,
}) => {
  const queryClient = useQueryClient();

  const invalidateUniverseAlertQueries = useCallback(
    async (universeId: number): Promise<void> => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...ANALYTICS_ALERTS_LIST_QUERY_KEY, universeId],
        }),
        queryClient.invalidateQueries({
          queryKey: [...ANALYTICS_ALERTS_INCIDENTS_QUERY_KEY, universeId],
        }),
      ]);
    },
    [queryClient],
  );

  const listAlerts = useCallback(
    async (
      universeId: number | undefined,
      options?: AnalyticsAlertsListOptions,
    ): Promise<AnalyticsAlertDetail[]> => {
      if (!universeId || !Number.isFinite(universeId) || universeId <= 0) {
        return [];
      }
      const rawAlerts = await client.listAlerts(buildListAlertsRequest(universeId, options));
      return rawAlerts.flatMap((raw) => {
        try {
          return [rawAnalyticsAlertToDetail(raw)];
        } catch {
          return [];
        }
      });
    },
    [client],
  );

  const listAlertIncidents = useCallback(
    async (
      universeId: number | undefined,
      chartContext: RAQIV2ChartContext | undefined,
      options?: AnalyticsAlertIncidentsListOptions,
    ): Promise<AnalyticsAlertIncidentDetail[]> => {
      if (
        chartContext == null ||
        universeId == null ||
        !Number.isFinite(universeId) ||
        universeId <= 0
      ) {
        return [];
      }
      const request: ListAnalyticsAlertIncidentsRequest = {
        resourceType: RAQIV2ChartResourceType.Universe,
        resourceId: String(universeId),
        startTime: chartContext.timeSpec.startTime,
        endTime: chartContext.timeSpec.endTime,
        alertIds: normalizeIdsParam(options?.alertIds),
        severities: normalizeSeveritiesParam(options?.severities),
      };
      const rawIncidents = await client.listAlertIncidents(request);
      const incidents = rawIncidents.flatMap((raw) => {
        try {
          return [rawAnalyticsAlertIncidentToDetail(raw)];
        } catch {
          return [];
        }
      });
      return incidents.toSorted((a, b) => b.openedAt.getTime() - a.openedAt.getTime());
    },
    [client],
  );

  const createAlert = useCallback(
    async (
      universeId: number,
      values: ExperienceAlertFormValues,
    ): Promise<AnalyticsAlertDetail> => {
      const request = buildCreateAnalyticsAlertRequest(universeId, values);
      const raw = await client.createAlert(request);
      await invalidateUniverseAlertQueries(universeId);
      return rawAnalyticsAlertToDetail(raw);
    },
    [client, invalidateUniverseAlertQueries],
  );

  const updateAlert = useCallback(
    async (
      universeId: number,
      alertId: string,
      values: ExperienceAlertFormValues,
    ): Promise<AnalyticsAlertDetail> => {
      const request = buildUpdateAnalyticsAlertRequest(universeId, alertId, values);
      const raw = await client.updateAlert(request);
      await invalidateUniverseAlertQueries(universeId);
      return rawAnalyticsAlertToDetail(raw);
    },
    [client, invalidateUniverseAlertQueries],
  );

  const patchAlertConfigState = useCallback(
    async (params: {
      universeId: number;
      alertId: string;
      configState: AnalyticsAlertConfigState;
    }): Promise<AnalyticsAlertDetail> => {
      const raw = await client.updateAlert({
        resourceType: RAQIV2ChartResourceType.Universe,
        resourceId: String(params.universeId),
        alertId: params.alertId,
        alertsUpdateAlertConfigRequest: {
          configState: params.configState,
        },
      });
      await invalidateUniverseAlertQueries(params.universeId);
      return rawAnalyticsAlertToDetail(raw);
    },
    [client, invalidateUniverseAlertQueries],
  );

  const deleteAlert = useCallback(
    async (universeId: number, alertId: string): Promise<void> => {
      if (universeId == null || !Number.isFinite(universeId) || universeId <= 0) {
        return;
      }
      await client.deleteAlert({
        resourceType: RAQIV2ChartResourceType.Universe,
        resourceId: String(universeId),
        alertId,
      });
      await invalidateUniverseAlertQueries(universeId);
    },
    [client, invalidateUniverseAlertQueries],
  );

  const context = useMemo<AnalyticsAlertClient>(
    () => ({
      listAlerts,
      listAlertIncidents,
      createAlert,
      updateAlert,
      patchAlertConfigState,
      deleteAlert,
    }),
    [listAlerts, listAlertIncidents, createAlert, updateAlert, patchAlertConfigState, deleteAlert],
  );

  return (
    <AnalyticsAlertClientContext.Provider value={context}>
      {children}
    </AnalyticsAlertClientContext.Provider>
  );
};

export default AnalyticsAlertClientProvider;
