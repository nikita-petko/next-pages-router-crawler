import { useEffect, useMemo, useRef } from 'react';
import type { HubConnection } from '@microsoft/signalr';
import {
  HubConnectionBuilder,
  HttpTransportType,
  LogLevel,
  HubConnectionState,
} from '@microsoft/signalr';
import type { RealTimeNotificationsBasePath } from './basePaths';
import {
  publish,
  subscribe,
  unsubscribe,
  realtimeEvents,
  isPubSubAvailable,
  relinquishMaster,
  reportMasterConnectionHealth,
  isMasterTab,
  getTabId,
  attachLogger,
} from './cross-tab';
import { useMasterElectionState } from './useMasterElectionState';
import generateUUID from './uuid';

// `process.env.NODE_ENV` is inlined by the consuming app's bundler. Declared
// locally because this browser package does not depend on @types/node, and
// guarded with `typeof` so it never throws where `process` is undefined.
declare const process: { env?: { NODE_ENV?: string } } | undefined;

declare global {
  interface Window {
    __rbxSignalR?: {
      isMasterTab: typeof isMasterTab;
      getTabId: typeof getTabId;
      attachLogger: typeof attachLogger;
      getConnectionStates: () => Array<{ basePath: string; state: HubConnectionState }>;
    };
  }
}

export type TSignalRCallback = (namespace: string, detail: string) => void;

/**
 * High-level lifecycle of the underlying SignalR socket, surfaced to consumers
 * so features (e.g. resumable streams) can react to connection failures.
 *
 * - `connecting`: an initial `start()` attempt is in flight.
 * - `connected`: the socket is established (or has recovered).
 * - `reconnecting`: a previously-established socket dropped and is recovering
 *   (SignalR automatic reconnect, or a server-driven `ConnectionLost` restart).
 * - `disconnected`: the socket is down. When `meta.definitive` is true the
 *   recovery path was exhausted (automatic reconnect gave up, or a restart
 *   failed), so callers should treat it as a hard failure rather than a blip.
 */
export type SignalRConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface SignalRConnectionStateMeta {
  basePath: string;
  error?: Error;
  /** True when the disconnect is terminal (no automatic recovery pending). */
  definitive?: boolean;
}

export type SignalRConnectionStateCallback = (
  state: SignalRConnectionState,
  meta: SignalRConnectionStateMeta,
) => void;

export interface CrossTabOptions {
  enabled?: boolean; // default: true
  isLoading?: boolean; // default: false
}

export interface UseSignalROptions {
  logLevel?: LogLevel;
  crossTab?: CrossTabOptions;
  /**
   * Optional sink for SignalR connection-state transitions. Only the tab that
   * owns the socket (the cross-tab master) emits these today; non-owning tabs
   * register but stay silent until cross-tab broadcast is added.
   */
  onConnectionStateChange?: SignalRConnectionStateCallback;
  /**
   * Whether to skip the SignalR `/negotiate` handshake and connect the
   * WebSocket directly (default: `true`, the long-standing behavior).
   *
   * INVESTIGATIVE: skipping negotiation removes the step a multi-instance farm
   * uses to pin a client to one server ("sticky sessions"), which is a
   * suspected contributor to `WebSocket failed to connect / connection ... not
   * present on the server` errors. Set to `false` (behind a flag, non-prod
   * first) to measure whether negotiation reduces connection-failure rates.
   *
   * Note: a single socket is shared per `basePath`, so the first instance to
   * establish the connection determines this value for all consumers on that
   * path. Negotiation relies on cookies (`withCredentials`, default in v8).
   */
  skipNegotiation?: boolean;
}

export type TSubscriptionStatusData = {
  ConnectionId?: string;
  MillisecondsBeforeHandlingReconnect?: number;
};

export type TSubscriptionStatusMessage =
  | { status: 'ConnectionLost' }
  | { status: 'Connected'; data: TSubscriptionStatusData };

function isSubscriptionStatusData(value: unknown): value is TSubscriptionStatusData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  if ('ConnectionId' in value && typeof value.ConnectionId !== 'string') {
    return false;
  }
  if (
    'MillisecondsBeforeHandlingReconnect' in value &&
    typeof value.MillisecondsBeforeHandlingReconnect !== 'number'
  ) {
    return false;
  }
  return true;
}

type TNotificationMessage = {
  namespace: string;
  detail: string;
  basePath: RealTimeNotificationsBasePath;
};

function isNotificationMessage(value: unknown): value is TNotificationMessage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return (
    'namespace' in value &&
    typeof value.namespace === 'string' &&
    'detail' in value &&
    typeof value.detail === 'string' &&
    'basePath' in value &&
    typeof value.basePath === 'string'
  );
}

// Module-level singletons for shared state across hook instances
const callbacks = new Map<RealTimeNotificationsBasePath, Set<TSignalRCallback>>();
const connectionStateCallbacks = new Map<
  RealTimeNotificationsBasePath,
  Set<SignalRConnectionStateCallback>
>();
const connections = new Map<RealTimeNotificationsBasePath, HubConnection>();
const connectionSetupInProgress = new Map<RealTimeNotificationsBasePath, boolean>();
const logLevels = new Map<RealTimeNotificationsBasePath, LogLevel>();
// Per-basePath promise chain that serializes start()/stop() so the overlapping
// reconnect mechanisms (effect cleanup, ConnectionLost restart, retry ladder)
// never race into "Failed to start the HttpConnection before stop() was called".
const lifecycleChains = new Map<RealTimeNotificationsBasePath, Promise<void>>();
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
  connectionStateCallbacks.clear();
  connections.forEach((conn) => {
    try {
      void conn.stop();
    } catch {
      // Ignore errors during test cleanup
    }
  });
  connections.clear();
  connectionSetupInProgress.clear();
  lifecycleChains.clear();
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

const notifyConnectionState = (
  basePath: RealTimeNotificationsBasePath,
  state: SignalRConnectionState,
  meta: Omit<SignalRConnectionStateMeta, 'basePath'> = {},
): void => {
  const fullMeta: SignalRConnectionStateMeta = { basePath, ...meta };
  connectionStateCallbacks.get(basePath)?.forEach((callback) => {
    try {
      callback(state, fullMeta);
    } catch {
      logError(basePath, '[useSignalR] Error calling connection state callback', state);
    }
  });
};

const toError = (value: unknown): Error | undefined => (value instanceof Error ? value : undefined);

/**
 * Serialize a connection lifecycle operation (start/stop) against all other
 * lifecycle operations for the same basePath. When the chain is idle the op
 * runs immediately (synchronously up to its first await) so call timing matches
 * a direct `hub.start()`/`hub.stop()`; while an op is in flight, later ops queue
 * behind it. The chain swallows rejections so one failed op never poisons the
 * next, but the returned promise still rejects so callers can react to their
 * own op's failure. The chain entry self-clears once settled to restore the
 * idle (synchronous) fast path.
 */
const runExclusive = (
  basePath: RealTimeNotificationsBasePath,
  op: () => Promise<void>,
): Promise<void> => {
  const prev = lifecycleChains.get(basePath);
  const result = prev ? prev.then(op, op) : op();
  const settled = Promise.resolve(result).then(
    () => undefined,
    () => undefined,
  );
  lifecycleChains.set(basePath, settled);
  void settled.then(() => {
    if (lifecycleChains.get(basePath) === settled) {
      lifecycleChains.delete(basePath);
    }
  });
  return result;
};

const startHubExclusive = (
  hub: HubConnection,
  basePath: RealTimeNotificationsBasePath,
): Promise<void> =>
  runExclusive(basePath, async () => {
    if (hub.state !== HubConnectionState.Disconnected) {
      return;
    }
    await hub.start();
  });

const stopHubExclusive = (
  hub: HubConnection,
  basePath: RealTimeNotificationsBasePath,
): Promise<void> =>
  runExclusive(basePath, async () => {
    if (hub.state === HubConnectionState.Disconnected) {
      return;
    }
    await hub.stop();
  });

const CONNECTION_RETRY_DELAYS = [500, 1000, 2000];

function startHubWithRetry(
  hub: HubConnection,
  basePath: RealTimeNotificationsBasePath,
  retryTimeouts: Set<ReturnType<typeof setTimeout>>,
  attempt = 0,
): void {
  if (attempt === 0) {
    notifyConnectionState(basePath, 'connecting');
  }
  startHubExclusive(hub, basePath)
    .then(() => {
      connectionSetupInProgress.set(basePath, false);
      reportMasterConnectionHealth(basePath, true);
      notifyConnectionState(basePath, 'connected');
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
        reportMasterConnectionHealth(basePath, false);
        connections.delete(basePath);
        connectionSetupInProgress.set(basePath, false);
        logError(
          basePath,
          `[useSignalR] Connection failed after ${CONNECTION_RETRY_DELAYS.length + 1} attempts, giving up`,
          err,
        );
        notifyConnectionState(basePath, 'disconnected', { error: toError(err), definitive: true });
        relinquishMaster();
      }
    });
}

// Dev-only debug surface so live incidents can inspect kingmaker/connection
// state from the console without shipping a custom build.
if (
  typeof window !== 'undefined' &&
  typeof process !== 'undefined' &&
  process?.env?.NODE_ENV !== 'production'
) {
  // eslint-disable-next-line no-underscore-dangle
  window.__rbxSignalR = {
    isMasterTab,
    getTabId,
    attachLogger,
    getConnectionStates: () =>
      Array.from(connections.entries()).map(([path, conn]) => ({
        basePath: path,
        state: conn.state,
      })),
  };
}

const useSignalR = (
  givenCallback: TSignalRCallback,
  basePath: RealTimeNotificationsBasePath,
  options: UseSignalROptions = {},
): void => {
  const {
    logLevel = LogLevel.None,
    crossTab: crossTabOptions,
    onConnectionStateChange,
    skipNegotiation = true,
  } = options;
  const { enabled: enableCrossTab = true, isLoading = false } = crossTabOptions ?? {};

  // While loading, bypass cross-tab entirely (treat as master) to avoid
  // starting the kingmaker election before the flag value is resolved.
  const effectiveCrossTab = isLoading ? false : enableCrossTab;
  const isMaster = useMasterElectionState(effectiveCrossTab);
  logLevels.set(basePath, logLevel);
  const callbackRef = useRef(givenCallback);

  useEffect(() => {
    callbackRef.current = givenCallback;
  }, [givenCallback]);

  // Assert cross-tab config consistency once the flag value is resolved.
  // Runs in an effect (not during render) to avoid side effects in the render phase.
  useEffect(() => {
    if (!isLoading) {
      setCrossTabConfig(enableCrossTab);
    }
  }, [isLoading, enableCrossTab]);

  // Generate a unique namespace for this hook instance (for pubSub cleanup)
  const subscriberNamespace = useMemo(() => `useSignalR.${basePath}.${generateUUID()}`, [basePath]);

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

  // Register the optional connection-state callback so the socket-owning tab can
  // surface lifecycle transitions to consumers (e.g. resumable streams). Runs
  // before the MASTER effect so the initial `connecting` emission is captured.
  useEffect(() => {
    if (!onConnectionStateChange) {
      return undefined;
    }

    const existing = connectionStateCallbacks.get(basePath) ?? new Set();
    existing.add(onConnectionStateChange);
    connectionStateCallbacks.set(basePath, existing);

    return () => {
      const prior = connectionStateCallbacks.get(basePath) ?? new Set();
      prior.delete(onConnectionStateChange);
      connectionStateCallbacks.set(basePath, prior);
    };
  }, [onConnectionStateChange, basePath]);

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
          skipNegotiation,
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
          reportMasterConnectionHealth(basePath, false);
          notifyConnectionState(basePath, 'reconnecting');
          stopHubExclusive(hub, basePath)
            .then(() => startHubExclusive(hub, basePath))
            .then(() => {
              reportMasterConnectionHealth(basePath, true);
              notifyConnectionState(basePath, 'connected');
            })
            .catch((err) => {
              logError(basePath, '[useSignalR] Failed to restart after ConnectionLost', err);
              connections.delete(basePath);
              connectionSetupInProgress.set(basePath, false);
              notifyConnectionState(basePath, 'disconnected', {
                error: toError(err),
                definitive: true,
              });
              relinquishMaster();
            });
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

    // Wire the SignalR connection lifecycle into kingmaker health so a master
    // whose socket dies relinquishes the crown instead of holding it forever.
    hub.onreconnecting(() => {
      reportMasterConnectionHealth(basePath, false);
      notifyConnectionState(basePath, 'reconnecting');
    });

    hub.onreconnected(() => {
      reportMasterConnectionHealth(basePath, true);
      notifyConnectionState(basePath, 'connected');
    });

    hub.onclose((error?: Error) => {
      // An error means automaticReconnect was exhausted (unexpected close). An
      // intentional stop() passes no error; that path is owned by its caller
      // (pagehide/freeze/cleanup), which already manages health + relinquish.
      // Re-reporting unhealthy here would re-add stale state after
      // relinquishMaster() cleared it, causing a freshly-elected master to
      // relinquish again before its new socket starts.
      if (error) {
        reportMasterConnectionHealth(basePath, false);
        logError(
          basePath,
          '[useSignalR] Connection closed unexpectedly, relinquishing master',
          error,
        );
        connections.delete(basePath);
        connectionSetupInProgress.set(basePath, false);
        notifyConnectionState(basePath, 'disconnected', { error, definitive: true });
        relinquishMaster();
      }
    });

    const retryTimeouts = new Set<ReturnType<typeof setTimeout>>();
    startHubWithRetry(hub, basePath, retryTimeouts);

    // Cleanup: stop connection when this becomes a slave (isMaster changes) or unmounts
    return () => {
      retryTimeouts.forEach(clearTimeout);
      const existingConn = connections.get(basePath);
      if (existingConn) {
        stopHubExclusive(existingConn, basePath).catch(() => {
          logError(basePath, '[useSignalR] Error stopping connection', basePath);
        });
        connections.delete(basePath);
        connectionSetupInProgress.set(basePath, false);
      }
    };
  }, [isLoading, isMaster, basePath, logLevel, skipNegotiation]);

  // SLAVE PATH: Listen to localStorage events from master tab
  useEffect(() => {
    if (isLoading || isMaster || !enableCrossTab || !isPubSubAvailable()) {
      return undefined;
    }

    subscribe(realtimeEvents.Notification, subscriberNamespace, (message) => {
      if (message) {
        try {
          const parsed: unknown = JSON.parse(message);
          if (!isNotificationMessage(parsed)) {
            return;
          }
          // Only handle notifications for this hook's basePath
          if (parsed.basePath !== basePath) {
            return;
          }
          callbackRef.current(parsed.namespace, parsed.detail);
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
      // Relinquish before awaiting stop(): bfcache/freeze can suspend the tab
      // before async cleanup completes.
      reportMasterConnectionHealth(basePath, false);
      relinquishMaster();
      try {
        const connection = getConnection();
        if (connection) {
          await stopHubExclusive(connection, basePath);
        }
      } catch (err) {
        logWarn(basePath, '[useSignalR] Connection failed to stop on page hide', err);
      }
    };

    const handleFreeze = async () => {
      reportMasterConnectionHealth(basePath, false);
      relinquishMaster();
      try {
        const connection = getConnection();
        if (connection) {
          await stopHubExclusive(connection, basePath);
        }
      } catch (err) {
        logWarn(basePath, '[useSignalR] Connection failed to stop on freeze', err);
      }
    };

    const handleBeforeUnload = async () => {
      try {
        const connection = getConnection();
        if (connection) {
          await stopHubExclusive(connection, basePath);
        }
      } catch (err) {
        logWarn(basePath, '[useSignalR] Connection failed to stop on unload', err);
      }
    };

    const handlePageShow = async () => {
      try {
        const connection = getConnection();
        if (connection) {
          await startHubExclusive(connection, basePath);
        }
      } catch (err) {
        logWarn(basePath, '[useSignalR] Connection failed to start on page show', err);
      }
    };

    const handleResume = async () => {
      try {
        const connection = getConnection();
        if (connection) {
          await startHubExclusive(connection, basePath);
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
