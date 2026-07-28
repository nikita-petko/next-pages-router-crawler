import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  GameServersListGameServersRequest,
  GameServer as ApiGameServer,
  ListGameServersResponse,
} from '@rbx/client-server-management-service/v1';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { serverManagementApi } from '../clients/serverManagementApi';
import { DEFAULT_VALUES } from '../constants';
import type { GameServer } from '../types/GameServer';
import type { GameServerFilters, GameServerRequestOptions } from '../types/GameServerControls';
import listGameServersWithRetry from '../utils/listGameServersWithRetry';
import {
  areAllServerStatusesSelected,
  resolveServerStatus,
  SERVER_STATUS_FILTER_KEYS,
  SERVER_STATUS_QUERY_FIELDS,
} from '../utils/serverStatus';

function parseSearch(search: string) {
  const tryUserId = parseInt(search, 10);
  return {
    isUser: /^\d+$/.test(search),
    parsedUserId: tryUserId,
  };
}

const SERVER_TYPE_ENUM = {
  vip: 1,
  reserved: 2,
  public: 3,
  teamCreate: 4,
  teamTest: 5,
} as const;

const SERVER_TYPE_KEYS = ['vip', 'reserved', 'public', 'teamCreate', 'teamTest'] as const;

type ApiGameServerFields = ApiGameServer & {
  status?: string;
  terminationTime?: Date | string | null;
};

function filterToQuery(filter: GameServerFilters) {
  const parts: string[] = [];

  const addIn = (field: string, values: (string | number)[]) => {
    if (values.length > 0) {
      parts.push(`${field} in [${values.join(', ')}]`);
    }
  };

  const addEq = (field: string, value: boolean) => {
    parts.push(`${field} == ${value}`);
  };

  const addRange = (field: string, range?: { min?: number; max?: number }) => {
    if (range?.min != null) {
      parts.push(`${field} >= ${range?.min}`);
    }
    if (range?.max != null) {
      parts.push(`${field} <= ${range?.max}`);
    }
  };

  addIn('place_version', filter.placeVersion ?? []);
  addIn('engine_version', filter.engineVersion ?? []);

  if (filter.serverType) {
    const selectedTypes = SERVER_TYPE_KEYS.filter((key) => filter.serverType[key]).map(
      (key) => SERVER_TYPE_ENUM[key],
    );

    if (selectedTypes.length !== SERVER_TYPE_KEYS.length) {
      addIn('server_type', selectedTypes.length === 0 ? [0] : selectedTypes);
    }
  }

  if (filter.serverStatus) {
    if (!areAllServerStatusesSelected(filter.serverStatus)) {
      SERVER_STATUS_FILTER_KEYS.forEach((key) => {
        addEq(SERVER_STATUS_QUERY_FIELDS[key], filter.serverStatus[key]);
      });
    }
  }

  addRange('frame_rate', filter.frameRate);
  const memoryUsedBytes = {
    min: filter.memoryUsed.min ? filter.memoryUsed.min * (1024 * 1024) : undefined,
    max: filter.memoryUsed.max ? filter.memoryUsed.max * (1024 * 1024) : undefined,
  };
  addRange('memory_usage_bytes', memoryUsedBytes);
  addRange('occupancy', filter.occupancy);

  return parts;
}

function mapResponseServers(response: ListGameServersResponse): GameServer[] {
  return (response.gameServers ?? [])
    .filter(
      (server: ApiGameServerFields): server is ApiGameServerFields & { jobId: string } =>
        !!server.jobId,
    )
    .map((server) => {
      let serverType = '';
      if (server.type !== undefined && server.type !== null) {
        switch (server.type as number) {
          case SERVER_TYPE_ENUM.public:
            serverType = 'ServerType.Public';
            break;
          case SERVER_TYPE_ENUM.reserved:
            serverType = 'ServerType.Reserved';
            break;
          case SERVER_TYPE_ENUM.vip:
            serverType = 'ServerType.Vip';
            break;
          case SERVER_TYPE_ENUM.teamCreate:
            serverType = 'ServerType.TeamCreate';
            break;
          case SERVER_TYPE_ENUM.teamTest:
            serverType = 'ServerType.TeamTest';
            break;
          default:
            serverType = '';
        }
      }

      const isShutdown = server.shutDown ?? false;
      const status = resolveServerStatus(server.status ?? (isShutdown ? 'shut_down' : 'active'));
      const playerIds = server.playerIds ?? [];
      // terminated occupancy is often 0 at shutdown; playerIds is the shared last-known count
      const occupancyCurrent = isShutdown
        ? playerIds.length
        : (server.occupancy ?? DEFAULT_VALUES.OCCUPANCY.CURRENT);

      return {
        jobId: server.jobId,
        placeVersion: server.placeVersion ?? DEFAULT_VALUES.PUBLISHED_VERSION.toString(),
        engineVersion: server.engineVersion ?? DEFAULT_VALUES.ENGINE_VERSION,
        serverType,
        createTime: server.createTime ?? DEFAULT_VALUES.CREATE_TIME,
        uptime: server.uptime ?? DEFAULT_VALUES.UPTIME,
        occupancy: {
          current: occupancyCurrent,
          max: server.maxOccupancy ?? DEFAULT_VALUES.OCCUPANCY.MAX,
        },
        frameRate: server.frameRate,
        memoryUsedMB: server.memoryUsageBytes ? server.memoryUsageBytes / (1024 * 1024) : 0,
        playerIds,
        status,
        isShutdown,
        terminateTime: server.terminationTime ? new Date(server.terminationTime) : null,
      };
    });
}

type BaseRequest = Omit<GameServersListGameServersRequest, 'pageToken'>;

type InFlightRequest = {
  controller: AbortController;
  isRootRequest: boolean;
  key: string;
  promise: Promise<GameServer[] | null>;
};

const useGameServers = () => {
  const { gameDetails } = useCurrentGame();
  const universeId = gameDetails?.id;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalServers, setTotalServers] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [previousPageToken, setPreviousPageToken] = useState<string | null>(null);

  const nextPageTokenRef = useRef<string | null>(null);
  const previousPageTokenRef = useRef<string | null>(null);
  const currentPageTokenRef = useRef<string | null>(null);
  const lastRequestRef = useRef<BaseRequest | null>(null);
  const latestRootRequestRef = useRef<BaseRequest | null>(null);
  const requestSeqRef = useRef(0);
  const inFlightRequestRef = useRef<InFlightRequest | null>(null);

  const cancelInFlightRequest = useCallback(() => {
    requestSeqRef.current += 1;
    inFlightRequestRef.current?.controller.abort();
    inFlightRequestRef.current = null;
  }, []);

  useEffect(() => cancelInFlightRequest, [cancelInFlightRequest, universeId]);

  const updateTokens = useCallback(
    (response: ListGameServersResponse) => {
      nextPageTokenRef.current = response.nextPageToken ?? null;
      previousPageTokenRef.current = response.previousPageToken ?? null;
      setNextPageToken(response.nextPageToken ?? null);
      setPreviousPageToken(response.previousPageToken ?? null);
    },
    [setNextPageToken, setPreviousPageToken],
  );

  const executeRequest = useCallback(
    (
      request: GameServersListGameServersRequest,
      currentPageToken: string | null,
      rootRequest?: BaseRequest,
      silent = false,
    ) => {
      const key = JSON.stringify(request);
      const currentRequest = inFlightRequestRef.current;
      if (
        currentRequest?.key === key &&
        currentRequest.isRootRequest === (rootRequest !== undefined)
      ) {
        return currentRequest.promise;
      }

      currentRequest?.controller.abort();

      const controller = new AbortController();
      const sequence = ++requestSeqRef.current;
      if (silent) {
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      const promise = (async () => {
        try {
          const response = await listGameServersWithRetry(
            () =>
              serverManagementApi.gameServersListGameServers(request, {
                signal: controller.signal,
              }),
            controller.signal,
          );

          if (controller.signal.aborted || sequence !== requestSeqRef.current) {
            return null;
          }

          setError(null);
          setTotalServers(response.totalCount ?? 0);
          if (rootRequest) {
            lastRequestRef.current = rootRequest;
            latestRootRequestRef.current = null;
          }
          currentPageTokenRef.current = currentPageToken;
          updateTokens(response);

          return mapResponseServers(response);
        } catch (err) {
          if (controller.signal.aborted || sequence !== requestSeqRef.current) {
            return null;
          }

          console.error('Failed to fetch game servers', err);
          // keep original Error for status checks (isRetriableGatewayError); UI must not render .message
          setError(err instanceof Error ? err : new Error('Failed to fetch game servers'));
          if (rootRequest) {
            setTotalServers(0);
            return [];
          }
          return null;
        } finally {
          if (sequence === requestSeqRef.current) {
            inFlightRequestRef.current = null;
            setIsLoading(false);
          }
        }
      })();

      inFlightRequestRef.current = {
        controller,
        isRootRequest: rootRequest !== undefined,
        key,
        promise,
      };
      return promise;
    },
    [updateTokens],
  );

  const fetchPage = useCallback(
    async (pageToken?: string) => {
      const baseRequest = lastRequestRef.current;
      if (!baseRequest) {
        return null;
      }

      return executeRequest({ ...baseRequest, pageToken }, pageToken ?? null);
    },
    [executeRequest],
  );

  const fetchGameServers = useCallback(
    async (placeId: number, versionId?: string, requestOptions?: GameServerRequestOptions) => {
      if (!universeId || !placeId) {
        cancelInFlightRequest();
        setIsLoading(false);
        return null;
      }

      const filters: string[] = [];
      const search = requestOptions?.search?.trim();
      if (search) {
        const { isUser, parsedUserId } = parseSearch(search);
        filters.push(
          isUser ? `player_id == ${parsedUserId}` : `job_id == "${search.replaceAll('"', '\\"')}"`,
        );
      }
      if (requestOptions?.filter) {
        filters.push(...filterToQuery(requestOptions.filter));
      }
      const filter = filters.length > 0 ? filters.join(' && ') : undefined;

      const baseRequest: BaseRequest = {
        universeId,
        placeId,
        versionNumber: versionId ?? '*',
        filter,
        orderBy: requestOptions?.orderBy,
        maxPageSize: requestOptions?.pageSize,
      };

      latestRootRequestRef.current = baseRequest;
      return executeRequest(baseRequest, null, baseRequest, requestOptions?.silent === true);
    },
    [cancelInFlightRequest, executeRequest, universeId],
  );

  const refetchCurrentPage = useCallback(async () => {
    const pendingRequest = inFlightRequestRef.current;
    if (pendingRequest?.isRootRequest) {
      return pendingRequest.promise;
    }

    const latestRootRequest = latestRootRequestRef.current;
    if (latestRootRequest) {
      return executeRequest(latestRootRequest, null, latestRootRequest);
    }

    const token = currentPageTokenRef.current;
    return fetchPage(token ?? undefined);
  }, [executeRequest, fetchPage]);

  const fetchNextPage = useCallback(async () => {
    const token = nextPageTokenRef.current;
    if (!token) {
      return null;
    }
    return fetchPage(token);
  }, [fetchPage]);

  const fetchPreviousPage = useCallback(async () => {
    const token = previousPageTokenRef.current;
    if (!token) {
      return null;
    }
    return fetchPage(token);
  }, [fetchPage]);

  return {
    fetchGameServers,
    refetchCurrentPage,
    fetchNextPage,
    fetchPreviousPage,
    totalServers,
    isLoading,
    error,
    nextPageToken,
    previousPageToken,
  };
};

export default useGameServers;
