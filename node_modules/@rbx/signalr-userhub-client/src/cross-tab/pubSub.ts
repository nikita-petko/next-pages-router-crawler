/**
 * PubSub module for cross-tab communication using localStorage events.
 * Enables tabs to communicate by publishing/subscribing to named events.
 */

const isLocalStorageEnabled = (): boolean => {
  const key = 'roblox-test';
  try {
    localStorage.setItem(key, key);
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export const isAvailable = (): boolean => isLocalStorageEnabled();

const buildStorageHandlerKey = (eventName: string, subscriberNamespace: string): string =>
  `storage.${eventName}_${subscriberNamespace}`;

type StorageEventHandler = (event: StorageEvent) => void;

// Store storage event handlers to properly clean them up
const storageEventHandlers = new Map<string, StorageEventHandler>();

/**
 * Subscribe to a cross-tab event.
 * @param eventName - The name of the event to subscribe to
 * @param subscriberNamespace - Unique namespace for this subscriber (for cleanup)
 * @param callback - Function to call when event is received
 */
export const subscribe = (
  eventName: string,
  subscriberNamespace: string,
  callback: (newValue: string | null) => void,
): void => {
  const handlerKey = buildStorageHandlerKey(eventName, subscriberNamespace);

  // Remove existing handler if any
  const existingHandler = storageEventHandlers.get(handlerKey);
  if (existingHandler) {
    window.removeEventListener('storage', existingHandler);
  }

  // Create new handler
  const handler: StorageEventHandler = (event: StorageEvent) => {
    if (event.key === eventName) {
      callback(event.newValue);
    }
  };

  // Store and attach handler
  storageEventHandlers.set(handlerKey, handler);
  window.addEventListener('storage', handler);
};

/**
 * Unsubscribe from a cross-tab event.
 * @param eventName - The name of the event to unsubscribe from
 * @param subscriberNamespace - The namespace used when subscribing
 */
export const unsubscribe = (eventName: string, subscriberNamespace: string): void => {
  const handlerKey = buildStorageHandlerKey(eventName, subscriberNamespace);
  const handler = storageEventHandlers.get(handlerKey);

  if (handler) {
    window.removeEventListener('storage', handler);
    storageEventHandlers.delete(handlerKey);
  }
};

/**
 * Publish a cross-tab event.
 * For some reason, storage events are only raised if we delete and set the key again.
 * @param eventName - The name of the event to publish
 * @param message - The message payload (will be stringified if needed)
 */
export const publish = (eventName: string, message: string): void => {
  localStorage.removeItem(eventName);
  localStorage.setItem(eventName, message);
};
