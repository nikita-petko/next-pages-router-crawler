import { useCallback, useRef, useState } from 'react';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import {
  GameServersListGameServersRequest,
  GameServer as ApiGameServer,
  ListGameServersResponse,
} from '@rbx/clients/serverManagementService';
import { DEFAULT_VALUES } from '../constants';
import { serverManagementApi } from '../clients/serverManagementApi';
import { GameServer } from '../types/GameServer';
import { GameServerFilters, GameServerRequestOptions } from '../types/GameServerControls';

function parseSearch(search: string) {
  const tryUserId = parseInt(search, 10);
  return {
    isUser: /^\d+$/.test(search),
    parsedUserId: tryUserId,
  };
}

// Backend server type enum: Unspecified=0, Vip=1, Reserved=2, Public=3, Private=4
const SERVER_TYPE_ENUM = {
  vip: 1,
  reserved: 2,
  public: 3,
} as const;

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
    const entries = Object.entries(filter.serverType);
    const selectedTypes =
      entries
        .filter((entry) => entry[1])
        .map(([key]) => SERVER_TYPE_ENUM[key as keyof typeof SERVER_TYPE_ENUM]).length === 0
        ? [0] // Use 0 (Unspecified) if all are false - sending none results in no filter, so need to filter to non-existent type
        : entries
            .filter((entry) => entry[1])
            .map(([key]) => SERVER_TYPE_ENUM[key as keyof typeof SERVER_TYPE_ENUM]);

    // Only add the filter if the selected types are different from all possible types
    if (entries.length !== selectedTypes.length) {
      addIn('server_type', selectedTypes);
    }
  }

  const ss = filter.serverStatus;
  if (ss && !(ss.active && ss.terminated)) {
    if (ss.active !== undefined) addEq('server_status.active', ss.active);
    if (ss.terminated !== undefined) addEq('server_status.terminated', ss.terminated);
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
  return (response.gameServers || [])
    .filter((server: ApiGameServer): server is ApiGameServer & { jobId: string } => !!server.jobId)
    .map((server) => {
      // Map server.type to a translation key string using SERVER_TYPE_ENUM, not just the enum key
      let serverType = '';
      if (server.type !== undefined && server.type !== null) {
        // Map enum value to translation key
        switch (server.type) {
          case SERVER_TYPE_ENUM.public:
            serverType = 'ServerType.Public';
            break;
          case SERVER_TYPE_ENUM.reserved:
            serverType = 'ServerType.Reserved';
            break;
          case SERVER_TYPE_ENUM.vip:
            serverType = 'ServerType.Vip';
            break;
          default:
            serverType = '';
        }
      }

      return {
        jobId: server.jobId,
        placeVersion: server.placeVersion ?? DEFAULT_VALUES.PUBLISHED_VERSION.toString(),
        engineVersion: server.engineVersion ?? DEFAULT_VALUES.ENGINE_VERSION,
        serverType,
        createTime: server.createTime ?? DEFAULT_VALUES.CREATE_TIME,
        uptime: server.uptime ?? DEFAULT_VALUES.UPTIME,
        occupancy: {
          current: server.occupancy ?? DEFAULT_VALUES.OCCUPANCY.CURRENT,
          max: server.maxOccupancy ?? DEFAULT_VALUES.OCCUPANCY.MAX,
        },
        frameRate: server.frameRate,
        memoryUsedMB: server.memoryUsageBytes ? server.memoryUsageBytes / (1024 * 1024) : 0,
        playerIds: server.playerIds ?? [],
      };
    });
}

type BaseRequest = Omit<GameServersListGameServersRequest, 'pageToken'>;

const useGameServers = () => {
  const { gameDetails } = useCurrentGame();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalServers, setTotalServers] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [previousPageToken, setPreviousPageToken] = useState<string | null>(null);

  const nextPageTokenRef = useRef<string | null>(null);
  const previousPageTokenRef = useRef<string | null>(null);
  const currentPageTokenRef = useRef<string | null>(null);
  const lastRequestRef = useRef<BaseRequest | null>(null);

  const updateTokens = useCallback(
    (response: ListGameServersResponse) => {
      nextPageTokenRef.current = response.nextPageToken ?? null;
      previousPageTokenRef.current = response.previousPageToken ?? null;
      setNextPageToken(response.nextPageToken ?? null);
      setPreviousPageToken(response.previousPageToken ?? null);
    },
    [setNextPageToken, setPreviousPageToken],
  );

  const fetchPage = useCallback(
    async (pageToken?: string) => {
      const baseRequest = lastRequestRef.current;
      if (!baseRequest) return null;

      setIsLoading(true);
      setError(null);

      try {
        const request: GameServersListGameServersRequest = {
          ...baseRequest,
          pageToken,
        };

        const response = await serverManagementApi.gameServersListGameServers(request);

        setTotalServers(response.totalCount ?? 0);
        currentPageTokenRef.current = pageToken ?? null;
        updateTokens(response);

        return mapResponseServers(response);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch game servers'));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [updateTokens, setIsLoading, setError],
  );

  const fetchGameServers = useCallback(
    async (placeId: number, versionId?: string, requestOptions?: GameServerRequestOptions) => {
      if (!gameDetails?.id || !placeId) {
        setIsLoading(false);
        return null;
      }

      setIsLoading(true);
      setError(null);

      const filters: string[] = [];
      if (requestOptions?.search) {
        const { isUser, parsedUserId } = parseSearch(requestOptions?.search);
        filters.push(
          isUser
            ? `player_id == ${parsedUserId}`
            : `job_id == "${String(requestOptions.search).replace(/"/g, '\\"')}"`,
        );
      }
      if (requestOptions?.filter) {
        filters.push(...filterToQuery(requestOptions.filter));
      }
      const filter = filters.length > 0 ? filters.join(' && ') : undefined;

      try {
        const baseRequest: BaseRequest = {
          universeId: gameDetails.id,
          placeId,
          versionNumber: versionId ?? '*',
          filter,
          orderBy: requestOptions?.orderBy,
          maxPageSize: requestOptions?.pageSize,
        };

        lastRequestRef.current = baseRequest;

        const response = await serverManagementApi.gameServersListGameServers(baseRequest);

        setTotalServers(response.totalCount ?? 0);
        currentPageTokenRef.current = null;
        updateTokens(response);

        const mappedServers = mapResponseServers(response);

        return mappedServers;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch game servers'));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [gameDetails?.id, updateTokens],
  );

  const refetchCurrentPage = useCallback(async () => {
    const token = currentPageTokenRef.current;
    return fetchPage(token ?? undefined);
  }, [fetchPage]);

  const fetchNextPage = useCallback(async () => {
    const token = nextPageTokenRef.current;
    if (!token) return null;
    return fetchPage(token);
  }, [fetchPage]);

  const fetchPreviousPage = useCallback(async () => {
    const token = previousPageTokenRef.current;
    if (!token) return null;
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
