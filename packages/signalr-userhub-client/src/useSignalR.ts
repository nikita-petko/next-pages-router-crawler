/* eslint-disable no-console */
import {
  HubConnection,
  HubConnectionBuilder,
  HttpTransportType,
  LogLevel,
  HubConnectionState,
} from '@microsoft/signalr';
import { useEffect, useRef } from 'react';
import { RealTimeNotificationsBasePath } from './basePaths';
import { useMasterElectionState } from './useMasterElectionState';
import { publish, subscribe, unsubscribe, realtimeEvents, isPubSubAvailable } from './cross-tab';
import generateUUID from './uuid';

export type TSignalRCallback = (namespace: string, detail: string) => void;

export interface CrossTabOptions {
  enabled?: boolean; // default: true
  isLoading?: boolean; // default: false
}

export interface UseSignalROptions {
  logLevel?: LogLevel;
  crossTab?: CrossTabOptions;
}

export type TSubscriptionStatusData = {
  ConnectionId?: string;
  MillisecondsBeforeHandlingReconnect?: number;
};

export type TSubscriptionStatusMessage =
  | { status: 'ConnectionLost' }
  | { status: 'Connected'; data: TSubscriptionStatusData };

function isSubscriptionStatusData(value: unknown): value is TSubscriptionStatusData {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if ('ConnectionId' in obj && typeof obj.ConnectionId !== 'string') return false;
  if (
    'MillisecondsBeforeHandlingReconnect' in obj &&
    typeof obj.MillisecondsBeforeHandlingReconnect !== 'number'
  )
    return false;
  return true;
}

// Module-level singletons for shared state across hook instances
const callbacks = new Map<RealTimeNotificationsBasePath, Set<TSignalRCallback>>();
const connections = new Map<RealTimeNotificationsBasePath, HubConnection>();
const connectionSetupInProgress = new Map<RealTimeNotificationsBasePath, boolean>();
const logLevels = new Map<RealTimeNotificationsBasePath, LogLevel>();
let crossTabConfig: boolean | undefined;

function setCrossTabConfig(value: boolean): void {
  if (crossTabConfig !== undefined && crossTabConfig !== value) {
    throw new Error(
      `[useSignalR] Conflicting enableCrossTab config: was ${crossTabConfig}, ` +
        `now receiving ${value}. All useSignalR instances on the page must agree ` +
        `on this setting.`,
    );
  }
  crossTabConfig = value;
}

const logWarn = (basePath: RealTimeNotificationsBasePath, ...args: unknown[]): void => {
  if (LogLevel.Warning >= (logLevels.get(basePath) ?? LogLevel.None)) {
    console.warn(...args);
  }
};

const logError = (basePath: RealTimeNotificationsBasePath, ...args: unknown[]): void => {
  if (LogLevel.Error >= (logLevels.get(basePath) ?? LogLevel.None)) {
    console.error(...args);
  }
};

export const clearSignalRStateForTests = (): void => {
  callbacks.clear();
  connections.forEach((conn) => {
    try {
      conn.stop();
    } catch {
      // Ignore errors during test cleanup
    }
  });
  connections.clear();
  connectionSetupInProgress.clear();
  logLevels.clear();
  crossTabConfig = undefined;
};

const notifySubscribers = (
  basePath: RealTimeNotificationsBasePath,
  namespace: string,
  detail: string,
): void => {
  callbacks.get(basePath)?.forEach((callback) => {
    try {
      callback(namespace, detail);
    } catch {
      logError(basePath, '[useSignalR] Error calling callback', namespace, detail);
    }
  });
};

const CONNECTION_RETRY_DELAYS = [500, 1000, 2000];

function startHubWithRetry(
  hub: HubConnection,
  basePath: RealTimeNotificationsBasePath,
  retryTimeouts: Set<ReturnType<typeof setTimeout>>,
  attempt = 0,
): void {
  hub
    .start()
    .then(() => {
      connectionSetupInProgress.set(basePath, false);
    })
    .catch((err) => {
      if (attempt < CONNECTION_RETRY_DELAYS.length) {
        logError(
          basePath,
          `[useSignalR] Connection failed (attempt ${attempt + 1}/${CONNECTION_RETRY_DELAYS.length + 1}), retrying in ${CONNECTION_RETRY_DELAYS[attempt]}ms`,
          err,
        );
        const timeout = setTimeout(() => {
          retryTimeouts.delete(timeout);
          startHubWithRetry(hub, basePath, retryTimeouts, attempt + 1);
        }, CONNECTION_RETRY_DELAYS[attempt]);
        retryTimeouts.add(timeout);
      } else {
        connections.delete(basePath);
        connectionSetupInProgress.set(basePath, false);
        logError(
          basePath,
          `[useSignalR] Connection failed after ${CONNECTION_RETRY_DELAYS.length + 1} attempts, giving up`,
          err,
        );
      }
    });
}

const useSignalR = (
  givenCallback: TSignalRCallback,
  basePath: RealTimeNotificationsBasePath,
  options: UseSignalROptions = {},
): void => {
  const { logLevel = LogLevel.None, crossTab: crossTabOptions } = options;
  const { enabled: enableCrossTab = true, isLoading = false } = crossTabOptions ?? {};

  // While loading, bypass cross-tab entirely (treat as master) to avoid
  // starting the kingmaker election before the flag value is resolved.
  const effectiveCrossTab = isLoading ? false : enableCrossTab;
  const isMaster = useMasterElectionState(effectiveCrossTab);
  logLevels.set(basePath, logLevel);
  const callbackRef = useRef(givenCallback);
  callbackRef.current = givenCallback;

  // Assert cross-tab config consistency once the flag value is resolved.
  // Runs in an effect (not during render) to avoid side effects in the render phase.
  useEffect(() => {
    if (!isLoading) {
      setCrossTabConfig(enableCrossTab);
    }
  }, [isLoading, enableCrossTab]);

  // Generate a unique namespace for this hook instance (for pubSub cleanup)
  const subscriberNamespace = useRef(`useSignalR.${basePath}.${generateUUID()}`).current;

  // Register callback in the shared callbacks set
  useEffect(() => {
    const existingCallbacks = callbacks.get(basePath) ?? new Set();
    existingCallbacks.add(givenCallback);
    callbacks.set(basePath, existingCallbacks);

    return () => {
      const priorCallbacks = callbacks.get(basePath) ?? new Set();
      priorCallbacks.delete(givenCallback);
      callbacks.set(basePath, priorCallbacks);
    };
  }, [givenCallback, basePath]);

  // MASTER PATH: Create and manage WebSocket connection
  useEffect(() => {
    if (isLoading || !isMaster) {
      return undefined;
    }

    if (connections.has(basePath)) {
      return undefined;
    }

    if (connectionSetupInProgress.get(basePath)) {
      return undefined;
    }

    connectionSetupInProgress.set(basePath, true);

    let hub: HubConnection;
    try {
      hub = new HubConnectionBuilder()
        .withUrl(basePath, {
          transport: HttpTransportType.WebSockets,
          skipNegotiation: true,
        })
        .withAutomaticReconnect()
        .configureLogging(logLevel)
        .build();
    } catch (err) {
      logError(basePath, '[useSignalR] SignalR Hub constructor failed to initialize', err);
      connectionSetupInProgress.set(basePath, false);
      return undefined;
    }

    connections.set(basePath, hub);

    hub.on('notification', (namespace: string, detail: string) => {
      notifySubscribers(basePath, namespace, detail);

      if (crossTabConfig && isPubSubAvailable()) {
        publish(realtimeEvents.Notification, JSON.stringify({ namespace, detail, basePath }));
      }
    });

    hub.on('subscriptionStatus', (status: string, rawData: string) => {
      try {
        if (status === 'ConnectionLost') {
          hub.stop().then(() => hub.start());
          return;
        }

        const parsed: unknown = JSON.parse(rawData);
        if (!isSubscriptionStatusData(parsed)) {
          logWarn(basePath, '[useSignalR] Unexpected subscription status data shape', rawData);
        }
      } catch {
        logError(basePath, '[useSignalR] Error parsing subscription status data', rawData);
      }
    });

    const retryTimeouts = new Set<ReturnType<typeof setTimeout>>();
    startHubWithRetry(hub, basePath, retryTimeouts);

    // Cleanup: stop connection when this becomes a slave (isMaster changes) or unmounts
    return () => {
      retryTimeouts.forEach(clearTimeout);
      const existingConn = connections.get(basePath);
      if (existingConn) {
        existingConn.stop().catch(() => {
          logError(basePath, '[useSignalR] Error stopping connection', basePath);
        });
        connections.delete(basePath);
        connectionSetupInProgress.set(basePath, false);
      }
    };
  }, [isLoading, isMaster, basePath, logLevel]);

  // SLAVE PATH: Listen to localStorage events from master tab
  useEffect(() => {
    if (isLoading || isMaster || !enableCrossTab || !isPubSubAvailable()) {
      return undefined;
    }

    subscribe(realtimeEvents.Notification, subscriberNamespace, (message) => {
      if (message) {
        try {
          const { namespace, detail, basePath: messageBasePath } = JSON.parse(message);
          // Only handle notifications for this hook's basePath
          if (messageBasePath !== basePath) return;
          callbackRef.current(namespace, detail);
        } catch {
          logError(basePath, '[useSignalR] Error parsing notification message', message);
        }
      }
    });

    return () => {
      unsubscribe(realtimeEvents.Notification, subscriberNamespace);
    };
  }, [isLoading, isMaster, basePath, subscriberNamespace, enableCrossTab]);

  // NOTE (@mbae, 07/24/24): This useEffect handles page lifecycle for bfcache
  // (back/forward cache) compatibility.
  // Note that certain browser extensions break back/forward cache compat
  // such as React Devtools and Requestly
  useEffect(() => {
    // Only attach lifecycle handlers if we're master (have a connection)
    if (isLoading || !isMaster) {
      return undefined;
    }

    const getConnection = () => connections.get(basePath);

    const handlePageHide = async () => {
      try {
        const connection = getConnection();
        if (connection?.state === HubConnectionState.Connected) {
          await connection.stop();
        }
      } catch (err) {
        logWarn(basePath, '[useSignalR] Connection failed to stop on page hide', err);
      }
    };

    const handleFreeze = async () => {
      try {
        const connection = getConnection();
        if (connection?.state === HubConnectionState.Connected) {
          await connection.stop();
        }
      } catch (err) {
        logWarn(basePath, '[useSignalR] Connection failed to stop on freeze', err);
      }
    };

    const handleBeforeUnload = async () => {
      try {
        const connection = getConnection();
        if (connection?.state === HubConnectionState.Connected) {
          await connection.stop();
        }
      } catch (err) {
        logWarn(basePath, '[useSignalR] Connection failed to stop on unload', err);
      }
    };

    const handlePageShow = async () => {
      try {
        const connection = getConnection();
        if (connection?.state === HubConnectionState.Disconnected) {
          await connection.start();
        }
      } catch (err) {
        logWarn(basePath, '[useSignalR] Connection failed to start on page show', err);
      }
    };

    const handleResume = async () => {
      try {
        const connection = getConnection();
        if (connection?.state === HubConnectionState.Disconnected) {
          await connection.start();
        }
      } catch (err) {
        logWarn(basePath, '[useSignalR] Connection failed to start on resume', err);
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('freeze', handleFreeze);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('resume', handleResume);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('freeze', handleFreeze);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('resume', handleResume);
    };
  }, [isLoading, isMaster, basePath]);
};

export default useSignalR;
