/**
 * Kingmaker module for cross-tab master election.
 * Ensures only one tab at a time acts as the "master" and owns the SignalR connection.
 * Other tabs are "slaves" that receive notifications via the master.
 */

import generateUUID from '../uuid';
import { subscribe, publish, isAvailable as pubSubIsAvailable } from './pubSub';

// This namespace is intentionally different from the www implementation
// (https://sourcegraph.rbx.com/github.rbx.com/Roblox/www-react/-/blob/packages/core-scripts/src/util/cross-tab-communication/kingmaker.js?L6)
// to ensure they run independently if ever on the same domain.
const namespaceForEvents = 'Roblox.CreatorHub.CrossTabCommunication.Kingmaker';

const keys = {
  masterId: `${namespaceForEvents}.masterId`,
  electionInProgress: `${namespaceForEvents}.electionInProgress`,
  masterIdRequest: `${namespaceForEvents}.masterIdRequest`,
  masterIdResponse: `${namespaceForEvents}.masterIdResponse`,
  masterLastResponseTime: `${namespaceForEvents}.masterLastResponseTime`,
} as const;

const masterIdRequestValue = 'q';
let masterNodeReply = '';
let masterTabId: string | null = null;
let isThisTabMaster = false;

let masterNodeMonitorTimer: number | null = null;
let masterLastResponseTime = Date.now() - 10000;
// Store unload handler reference to allow proper removal with removeEventListener
let unloadHandler: (() => void) | null = null;
const masterIdleTimeBuffer = 2500;
// Whenever the master node is polled, it sets the time it responded into a localstorage key.
// When a new tab comes up, it checks this key and if the last time a master node responded to a query was > X seconds, it declares itself as the master immediately.
const masterLastResponseTimeThreshold = 20000;

// Generate random offset (1-100ms) for each interval to prevent thundering herd
const getRandomOffset = (): number => Math.floor(Math.random() * 100 + 1);

const getMonitorMasterNodeInterval = (): number => 2000 + getRandomOffset();
const getWaitIntervalForMasterHeartBeat = (): number => 1500 + getRandomOffset();
const getElectionDuration = (): number => 400 + getRandomOffset();
const electionDetailsPurgeInterval = 500;

export type MasterChangeCallback = (isMaster: boolean) => void;

const tabId = generateUUID();
const electionListeners = new Set<MasterChangeCallback>();
const loggers: Array<(message: string) => void> = [];

// Tracks per-basePath SignalR socket health for the master tab. The master only
// advertises itself (heartbeat + ping replies) while every owned socket is
// healthy, so a master whose socket has died relinquishes the crown instead of
// holding it indefinitely and starving slave tabs of notifications.
const unhealthyConnections = new Set<string>();
const isMasterConnectionHealthy = (): boolean => unhealthyConnections.size === 0;

const log = (message: string): void => {
  loggers.forEach((logger) => {
    try {
      logger(message);
    } catch {
      // Ignore logger errors
    }
  });
};

const logMaster = (): void => {
  log(`Master is: ${masterTabId}`);
};

const timestamp = (): string => Date.now().toString();

/**
 * Callback raised so that tabs can know the final result of whether they were chosen as master or slave.
 */
const announceElectionResults = (isMaster: boolean): void => {
  log(`Announcing: Is this tab the master? ${isMaster}`);
  electionListeners.forEach((listener) => {
    try {
      listener(isMaster);
    } catch (e) {
      log(`Error running subscribed election result handler: ${JSON.stringify(e)}`);
    }
  });
};

/**
 * Give up the master role without relying on the (unreliable) `unload` event.
 * Clears the shared master keys and resets the local heartbeat so this tab and
 * its peers re-elect a master promptly via the existing monitor loop.
 */
export const relinquishMaster = (): void => {
  if (!isThisTabMaster) {
    return;
  }
  log('Relinquishing master role (connection unhealthy)');
  isThisTabMaster = false;
  masterTabId = '';
  masterLastResponseTime = 0;
  // Reset health tracking so the next elected master (possibly this tab) starts
  // with a clean slate instead of being relinquished again before its socket reconnects.
  unhealthyConnections.clear();
  if (localStorage.getItem(keys.masterId) === tabId) {
    localStorage.removeItem(keys.masterId);
    localStorage.removeItem(keys.masterLastResponseTime);
  }
  announceElectionResults(false);
};

const declareThisTabAsMaster = (): void => {
  log(`Declaring myself as the master ${tabId}`);
  masterTabId = tabId;
  isThisTabMaster = true;
  publish(keys.masterId, tabId);
  localStorage.removeItem(keys.electionInProgress);
  announceElectionResults(true);

  // Remove existing handler if any (using stored reference)
  if (unloadHandler) {
    window.removeEventListener('unload', unloadHandler);
  }

  // Create and store new handler for proper cleanup on subsequent calls
  unloadHandler = (): void => {
    const masterId = localStorage.getItem(keys.masterId);
    if (masterId && masterId === tabId) {
      localStorage.removeItem(keys.masterId);
      localStorage.removeItem(keys.masterLastResponseTime);
    }
  };

  window.addEventListener('unload', unloadHandler);
};

const initiateElection = (): void => {
  // Master did not reply. Initiate election
  const electionTime = localStorage.getItem(keys.electionInProgress);
  masterTabId = '';

  if (electionTime) {
    // There is an election in progress. Wait for results
    log('Election already in progress');
    window.setTimeout(() => {
      if (!masterTabId || masterTabId.length === 0) {
        declareThisTabAsMaster();
      } else if (masterTabId !== tabId) {
        announceElectionResults(false);
      }
      logMaster();
    }, getElectionDuration());
  } else {
    log('Election not in progress');
    localStorage.setItem(keys.electionInProgress, timestamp());
    if (!masterTabId || masterTabId.length === 0) {
      declareThisTabAsMaster();
    } else if (masterTabId !== tabId) {
      announceElectionResults(false);
    }
    logMaster();
  }
};

const pingMasterAndInitiateElectionIfNotActive = (): void => {
  log('Checking if Master still active');
  if (isThisTabMaster || Date.now() - masterLastResponseTime <= masterIdleTimeBuffer) {
    return;
  }

  masterNodeReply = '';
  publish(keys.masterIdRequest, masterIdRequestValue);

  window.setTimeout(() => {
    if (masterNodeReply.length === 0) {
      if (isThisTabMaster || Date.now() - masterLastResponseTime <= masterIdleTimeBuffer) {
        declareThisTabAsMaster();
        return;
      }
      log('Master did not respond. Initiating election');
      initiateElection();
    } else if (masterTabId !== masterNodeReply) {
      announceElectionResults(false); // Initiated as a slave
      masterTabId = masterNodeReply;
      logMaster();
    }
  }, getWaitIntervalForMasterHeartBeat());
};

const monitorMasterNode = (): void => {
  if (masterNodeMonitorTimer !== null) {
    window.clearTimeout(masterNodeMonitorTimer);
  }

  masterNodeMonitorTimer = window.setTimeout(() => {
    if (!isThisTabMaster) {
      pingMasterAndInitiateElectionIfNotActive();
    } else if (isMasterConnectionHealthy()) {
      localStorage.setItem(keys.masterLastResponseTime, timestamp());
    } else {
      // Master is alive but its socket is dead: stop advertising and hand off.
      relinquishMaster();
    }
    monitorMasterNode();
  }, getMonitorMasterNodeInterval());
};

const subscribeToEvents = (): void => {
  log('Binding to events');

  subscribe(keys.masterIdRequest, namespaceForEvents, (message) => {
    if (isThisTabMaster && isMasterConnectionHealthy() && message === masterIdRequestValue) {
      log('Query Received - Confirming Still Master');
      publish(keys.masterIdResponse, tabId);
      localStorage.setItem(keys.masterLastResponseTime, timestamp());
    }
  });

  subscribe(keys.masterId, namespaceForEvents, (message) => {
    if (message) {
      log('Received Notice Of Master');
      masterLastResponseTime = Date.now();
      masterTabId = message;
      const wasCurrentlyMaster = isThisTabMaster;
      isThisTabMaster = masterTabId === tabId;

      if (!isThisTabMaster && wasCurrentlyMaster) {
        announceElectionResults(false);
        monitorMasterNode(); // Master just responded. Move the monitoring to later
      }
      if (isThisTabMaster && !wasCurrentlyMaster) {
        declareThisTabAsMaster();
      }

      localStorage.removeItem(keys.electionInProgress);
      logMaster();
    }
  });

  subscribe(keys.masterIdResponse, namespaceForEvents, (message) => {
    if (message) {
      log('Master Responded to Query');
      masterLastResponseTime = Date.now();
      masterNodeReply = message;
      monitorMasterNode(); // Master just responded. Move the monitoring to later
    } else {
      log('Master Responded to Query - no message');
    }
  });
};

const purgeElectionDetails = (): void => {
  const electionTime = localStorage.getItem(keys.electionInProgress);
  if (electionTime) {
    const lastElectionTimeInMs = parseInt(electionTime, 10);
    if (Date.now() - lastElectionTimeInMs > electionDetailsPurgeInterval) {
      localStorage.removeItem(keys.electionInProgress);
    }
  }
  window.setTimeout(purgeElectionDetails, electionDetailsPurgeInterval);
};

const nominateAsEligible = (): void => {
  // Role assignment
  const masterId = localStorage.getItem(keys.masterId);
  subscribeToEvents();

  const masterLastResponseTimeString = localStorage.getItem(keys.masterLastResponseTime);
  if (!masterLastResponseTimeString || masterLastResponseTimeString.length === 0) {
    masterLastResponseTime = 0;
  } else {
    masterLastResponseTime = parseInt(masterLastResponseTimeString, 10);
  }

  if (masterId) {
    if (masterId === tabId) {
      isThisTabMaster = true;
    } else if (
      masterLastResponseTime > 0 &&
      Date.now() - masterLastResponseTime > masterLastResponseTimeThreshold
    ) {
      // The master node has not responded to pings in a long time. Time to declare this tab as the master!
      initiateElection();
    } else {
      pingMasterAndInitiateElectionIfNotActive();
    }
  } else {
    initiateElection();
  }

  window.setTimeout(() => {
    purgeElectionDetails();
  }, electionDetailsPurgeInterval);

  monitorMasterNode();
};

// Auto-initialize when module loads (if available)
if (typeof window !== 'undefined' && pubSubIsAvailable()) {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', nominateAsEligible);
  } else {
    // DOM already loaded
    nominateAsEligible();
  }
}

// Public API
export const isAvailable = (): boolean => pubSubIsAvailable();

export const isMasterTab = (): boolean => isThisTabMaster;

/**
 * Report the health of a SignalR socket owned by the master tab. When any owned
 * socket is unhealthy the master stops advertising itself so a healthy tab takes
 * over. `basePath` scopes the health so multiple hubs are tracked independently.
 */
export const reportMasterConnectionHealth = (basePath: string, healthy: boolean): void => {
  if (healthy) {
    unhealthyConnections.delete(basePath);
  } else {
    unhealthyConnections.add(basePath);
  }
};

export const subscribeToMasterChange = (callback: MasterChangeCallback): void => {
  electionListeners.add(callback);
};

export const unsubscribeFromMasterChange = (callback: MasterChangeCallback): void => {
  electionListeners.delete(callback);
};

export const attachLogger = (loggerCallback: (message: string) => void): void => {
  loggers.push(loggerCallback);
};

// For testing
export const getTabId = (): string => tabId;
