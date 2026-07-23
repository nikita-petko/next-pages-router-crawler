/**
 * SignalR namespace for Analytics Assistant chat feature
 */
export const ANALYTICS_ASSISTANT_NAMESPACE = 'analytics-assistant-workflows';

/**
 * Timeout before forcing final flush if out-of-order messages arrive (in milliseconds)
 */
export const FINISH_STREAMING_TIMEOUT_MS = 3000;

/**
 * When the stream stalls waiting for a missing sequence number, replay the HTTP
 * backlog after this delay to fill the gap (milliseconds).
 */
export const STALL_RECONCILE_TIMEOUT_MS = 1500;

/**
 * Max stall-reconcile attempts before giving up and waiting for isFinal recovery.
 */
export const MAX_STALL_RECONCILE_ATTEMPTS = 5;
