/**
 * Constants related to debugging, tracing, and observability
 */

/**
 * Jaeger debug ID used for distributed tracing when unified attribution is enabled.
 * This header allows filtering and analyzing unified attribution requests in the tracing system.
 */
// eslint-disable-next-line import/no-unused-modules
export const JAEGER_DEBUG_ID_UNIFIED_ATTRIBUTION_LATENCY = 'unified-attribution-latency';

/**
 * HTTP headers for Jaeger distributed tracing with unified attribution.
 * Include these headers in requests to enable trace filtering in the observability system.
 */
export const UNIFIED_ATTRIBUTION_TRACING_HEADERS = {
  'jaeger-debug-id': JAEGER_DEBUG_ID_UNIFIED_ATTRIBUTION_LATENCY,
};
